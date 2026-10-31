"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scavenge = void 0;
const Event_1 = require("./Event");
const Language_1 = require("./Language");
const Scavenge_1 = require("#core/types/Scavenge");
const Items_1 = require("#core/types/Items");
const Locations_1 = require("#core/types/Locations");
const UserRepository_1 = require("#core/repositories/UserRepository");
const Classes_1 = require("#core/types/Classes");
const date_fns_1 = require("date-fns");
const log_1 = require("#shared/log");
const Notification_1 = require("./Notification");
const UserItemRepository_1 = require("#core/repositories/UserItemRepository");
const Ids_1 = require("#core/types/Ids");
const ui_1 = require("#bot/utils/ui");
const Prison_1 = require("./Prison");
const TimedActionRepository_1 = require("#core/repositories/TimedActionRepository");
class Scavenge {
    attemptId;
    User;
    PlaceId;
    RewardMoneyMin = 0;
    RewardMoneyMax = 0;
    RewardItems = [];
    SuccessChance = 0;
    Timer = {
        Prison: 0,
        Hospital: 0,
    };
    constructor(user, placeId, attemptId) {
        this.attemptId = attemptId;
        this.User = user;
        this.PlaceId = placeId;
    }
    async CanScavenge() {
        if (this.User.Scavenge.Time > new Date()) {
            return { canScavenge: false, reason: Scavenge_1.ScavengeFailureReason.UserScavengeTime };
        }
        const availability = this.User.CheckAvailability(["wanted", "escaping"]);
        if (!availability.available) {
            switch (availability.reason) {
                case "scavenging":
                    return { canScavenge: false, reason: Scavenge_1.ScavengeFailureReason.UserScavenging };
                case "working":
                    return { canScavenge: false, reason: Scavenge_1.ScavengeFailureReason.UserWorking };
                case "prison":
                    return { canScavenge: false, reason: Scavenge_1.ScavengeFailureReason.UserPrison };
                case "hospital":
                    return { canScavenge: false, reason: Scavenge_1.ScavengeFailureReason.UserHospital };
                case "defendingInvestment":
                    return { canScavenge: false, reason: Scavenge_1.ScavengeFailureReason.UserDefendingInvestment };
                case "gangAction":
                    return { canScavenge: false, reason: Scavenge_1.ScavengeFailureReason.UserParticipatingInGangAction };
                case "casino":
                    return { canScavenge: false, reason: Scavenge_1.ScavengeFailureReason.UserCasino };
                case "beating": {
                    const user = await UserRepository_1.UserRepository.FindById(availability.targetId, ["class", "nickname"]);
                    return { canScavenge: false, reason: Scavenge_1.ScavengeFailureReason.AttackerIsBeatingId, attacker: user };
                }
                case "beingBeatUp": {
                    const user = await UserRepository_1.UserRepository.FindById(availability.targetId, ["class", "nickname"]);
                    return { canScavenge: false, reason: Scavenge_1.ScavengeFailureReason.AttackerIsBeingBeatedById, attacker: user };
                }
                case "robbing": {
                    const user = await UserRepository_1.UserRepository.FindById(availability.targetId, ["nickname", "class"]);
                    return { canScavenge: false, reason: Scavenge_1.ScavengeFailureReason.AttackerIsRobbingId, attacker: user };
                }
                case "beingRobbed": {
                    const user = await UserRepository_1.UserRepository.FindById(availability.targetId, ["nickname", "class"]);
                    return { canScavenge: false, reason: Scavenge_1.ScavengeFailureReason.AttackerIsBeingRobbedById, attacker: user };
                }
                case "robbingLocation": {
                    const location = Locations_1.LocationList[availability.referenceId];
                    return {
                        canScavenge: false,
                        reason: Scavenge_1.ScavengeFailureReason.AttackerIsRobbingLocationId,
                        location: location,
                    };
                }
            }
        }
        return { canScavenge: true };
    }
    async StartScavenge() {
        // Recovery must keep the original attempt and deadline.
        if (!this.attemptId) {
            this.attemptId = await TimedActionRepository_1.TimedActionRepository.Start(this.User.Id, "scavenge", this.PlaceId, 10_000 + 2_000 * this.PlaceId);
            this.User.Scavenge.IsScavengingId = this.PlaceId;
        }
        // Skip re-initializing if already done
        if (this.SuccessChance !== 0) {
            return;
        }
        const place = Scavenge_1.ScavengeList[this.PlaceId];
        this.RewardItems = place.Reward.Items.map(item => ({
            ...item,
            Duration: {
                ...item.Duration,
            },
        }));
        this.Timer.Prison = 4 * (this.PlaceId + 1);
        this.Timer.Hospital = 2 * (this.PlaceId + 1);
        // Check here and not in constructor, because user can change class between openning the command and executing the action
        const userClassChanceModifier = (0, Classes_1.getScavengeChanceClassModifier)(this.User.Class);
        const scavengeChanceBonus = await Event_1.Event.GetActiveBonusFromType(Event_1.EventType.SCAVENGE_CHANCE_BONUS);
        this.SuccessChance = place.SuccessChance + userClassChanceModifier + scavengeChanceBonus;
        const userClassDurationModifier = (0, Classes_1.getScavengeDurationClassModifier)(this.User.Class);
        this.RewardMoneyMin = Math.floor(place.Reward.Money.Min * userClassDurationModifier);
        this.RewardMoneyMax = Math.floor(place.Reward.Money.Max * userClassDurationModifier);
        this.RewardItems.forEach(item => {
            const data = Items_1.ItemList[item.Id];
            item.Duration.Min = data.Type === Items_1.ItemType.Consumable ? item.Duration.Min + 1 : (item.Duration.Min * userClassDurationModifier);
            item.Duration.Max = data.Type === Items_1.ItemType.Consumable ? item.Duration.Max + 1 : (item.Duration.Max * userClassDurationModifier);
        });
        log_1.Log.Info(`User ${this.User.Nickname} (Id: ${this.User.Id}) started a scavenge at ${place.Description[Language_1.Language.English]} (Id: ${place.Id}).`);
    }
    async EndScavenge() {
        const result = await TimedActionRepository_1.TimedActionRepository.Run(this.User.Id, "scavenge", this.PlaceId, () => this.ResolveScavenge(), this.attemptId);
        if (!await this.User.GetInfo())
            throw new Error(`Scavenging user ${this.User.Id} was not found.`);
        return result;
    }
    async ResolveScavenge() {
        const place = Scavenge_1.ScavengeList[this.PlaceId];
        if (!await this.User.GetInfo())
            throw new Error(`Scavenging user ${this.User.Id} was not found.`);
        const success = Math.random() * 100 < this.SuccessChance;
        const result = { completed: true, success };
        if (success) {
            const rewardMoney = Math.random() < 0.25;
            let rewardDescription;
            let rewardDescriptionLog;
            this.User.Scavenge.Found.Total += 1;
            if (rewardMoney) {
                const reward = this.RewardMoneyMin + Math.floor(Math.random() * (this.RewardMoneyMax - this.RewardMoneyMin));
                this.User.Money += reward;
                this.User.Scavenge.Found.MoneyCount += 1;
                this.User.Scavenge.Found.MoneySum += reward;
                rewardDescription = (0, ui_1.formatMoney)(reward, this.User.Language);
                rewardDescriptionLog = (0, ui_1.formatMoney)(reward, Language_1.Language.English);
                result.rewardType = Scavenge_1.ScavengeRewardType.Money;
                result.rewardValue = reward;
            }
            else {
                const item = this.RewardItems[Math.floor(Math.random() * this.RewardItems.length)];
                const data = Items_1.ItemList[item.Id];
                const existingItem = await UserItemRepository_1.UserItemRepository.FindByUserAndItem(this.User.Id, item.Id);
                const now = new Date();
                this.User.Scavenge.Found.Items += 1;
                if (data.Type === Items_1.ItemType.Consumable) {
                    const howMany = Math.floor(item.Duration.Min + Math.random() * (item.Duration.Max - item.Duration.Min));
                    rewardDescription = `${howMany} ${this.User.GetItemSkin(data)} ${data.Description[this.User.Language]}`;
                    rewardDescriptionLog = `${howMany} ${data.Description[Language_1.Language.English]}`;
                    await UserItemRepository_1.UserItemRepository.Upsert({
                        id: existingItem?.id ?? undefined,
                        userId: this.User.Id,
                        itemId: item.Id,
                        quantity: (existingItem?.quantity ?? 0) + howMany,
                        skin: existingItem?.skin ?? Ids_1.BundleId.Default,
                    });
                    result.rewardType = Scavenge_1.ScavengeRewardType.ItemConsumable;
                    result.item = data;
                    result.quantity = howMany;
                }
                else {
                    const duration = item.Duration.Min + Math.random() * (item.Duration.Max - item.Duration.Min);
                    rewardDescription = `${this.User.GetItemSkin(data)} ${data.Description[this.User.Language]} (${duration.toFixed(1)}h)`;
                    rewardDescriptionLog = `${duration.toFixed(1)}h ${data.Description[Language_1.Language.English]}`;
                    const remaining = existingItem?.remainingTime ?? new Date(0);
                    const remainingTime = now > remaining ?
                        (0, date_fns_1.addHours)(now, duration) :
                        (0, date_fns_1.addHours)(remaining, duration);
                    await UserItemRepository_1.UserItemRepository.Upsert({
                        id: existingItem?.id ?? undefined,
                        userId: this.User.Id,
                        itemId: item.Id,
                        remainingTime,
                        skin: existingItem?.skin ?? Ids_1.BundleId.Default,
                    });
                    result.rewardType = Scavenge_1.ScavengeRewardType.ItemDuration;
                    result.item = data;
                    result.duration = duration;
                }
            }
            result.rewardDescription = rewardDescription;
            log_1.Log.Success(`User ${this.User.Nickname} (Id: ${this.User.Id}) found ${rewardDescriptionLog} while scavenging at ${place.Description[Language_1.Language.English]} (Id: ${place.Id})`);
        }
        else {
            const hospitalized = Math.random() * 100 < place.Hospital.Chance;
            const inprisoned = Math.random() * 100 < place.Prison.Chance;
            this.User.Scavenge.Found.Failures += 1;
            result.hospitalized = hospitalized;
            result.inprisoned = inprisoned;
            if (hospitalized) {
                const hospitalTimeMultiplier = await Event_1.Event.GetActiveFromType(Event_1.EventType.HOSPITAL_TIME_MULTIPLIER);
                this.User.Hospital.Time = (0, date_fns_1.addMinutes)(new Date(), this.Timer.Hospital * hospitalTimeMultiplier);
                this.User.Hospital.Count += 1;
                this.User.Scavenge.Found.FailureWithHospital += 1;
                await Notification_1.Notification.Hospital(this.User);
                result.hospitalTime = this.User.Hospital.Time;
            }
            else if (inprisoned) {
                await Prison_1.Prison.Arrest(this.User, this.Timer.Prison, { isFromRobbery: false });
                this.User.Scavenge.Found.FailureWithPrison += 1;
                await Notification_1.Notification.Free(this.User);
                result.prisonTime = this.User.Prison.Time;
            }
            log_1.Log.Info(`User ${this.User.Nickname} (Id: ${this.User.Id}) failed to scavenge at ${place.Description[Language_1.Language.English]} (Id: ${place.Id}). Hospitalized: ${hospitalized} (${this.Timer.Hospital}min) Inprisoned: ${inprisoned} (${this.Timer.Prison}min)`);
        }
        this.User.Scavenge.Count += 1;
        const scavengeTimeMultiplier = await Event_1.Event.GetActiveFromType(Event_1.EventType.SCAVENGE_TIME_MULTIPLIER);
        this.User.Scavenge.Time = (0, date_fns_1.addMinutes)(new Date(), 60 * scavengeTimeMultiplier); // 1 hour cooldown * multiplier
        await Notification_1.Notification.Scavenge(this.User);
        await this.User.Update({
            money: this.User.Money,
            scavengeMoneyCount: this.User.Scavenge.Found.MoneyCount,
            scavengeMoneySum: this.User.Scavenge.Found.MoneySum,
            scavengeFoundItems: this.User.Scavenge.Found.Items,
            scavengeFoundTotal: this.User.Scavenge.Found.Total,
            scavengeFailures: this.User.Scavenge.Found.Failures,
            scavengeFailureWithPrison: this.User.Scavenge.Found.FailureWithPrison,
            hospitalTime: this.User.Hospital.Time,
            hospitalCount: this.User.Hospital.Count,
            scavengeFailureWithHospital: this.User.Scavenge.Found.FailureWithHospital,
            scavengeCount: this.User.Scavenge.Count,
            scavengeTime: this.User.Scavenge.Time,
        });
        result.cooldownEndsAt = this.User.Scavenge.Time;
        return result;
    }
}
exports.Scavenge = Scavenge;
//# sourceMappingURL=Scavenge.js.map