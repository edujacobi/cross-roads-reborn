"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Strings = exports.LocationRobberyStrategy = void 0;
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const RobHistoryRepository_1 = require("#core/repositories/RobHistoryRepository");
const UserRepository_1 = require("#core/repositories/UserRepository");
const Event_1 = require("#core/models/Event");
const Language_1 = require("#core/models/Language");
const Notification_1 = require("#core/models/Notification");
const Classes_1 = require("#core/types/Classes");
const Jobs_1 = require("#core/types/Jobs");
const Locations_1 = require("#core/types/Locations");
const Robbery_1 = require("#core/types/Robbery");
const Scavenge_1 = require("#core/types/Scavenge");
const log_1 = require("#shared/log");
const date_fns_1 = require("date-fns");
const discord_js_1 = require("discord.js");
const Prison_1 = require("#core/models/Prison");
const TimedActionRepository_1 = require("#core/repositories/TimedActionRepository");
class LocationRobberyStrategy {
    attemptId;
    Attacker;
    LocationId;
    Date;
    Type = Robbery_1.ClashType.Location;
    Success = false;
    MoneyRobbed = 0;
    Chance = 0;
    RewardMin;
    RewardMax;
    AttackerTimeInPrison;
    constructor(attacker, locationId, attemptId) {
        this.attemptId = attemptId;
        this.Attacker = attacker;
        this.LocationId = locationId;
        this.Date = new Date();
        this.AttackerTimeInPrison = 20 * (locationId + 1);
        const userClassModifier = (0, Classes_1.getRobberyClassModifier)(this.Attacker.Class);
        const location = Locations_1.LocationList[this.LocationId];
        this.RewardMin = Math.floor(location.Reward.Min * userClassModifier);
        this.RewardMax = Math.floor(location.Reward.Max * userClassModifier);
    }
    async CanRob() {
        const s = exports.Strings[this.Attacker.Language];
        let canRob = true;
        let message = "";
        const location = Locations_1.LocationList[this.LocationId];
        if (this.Attacker.Attributes.Attack < location.NeedAttack) {
            message = `${s.needMoreAttack} ${emotes_1.EmoteString.Robbery}`;
            canRob = false;
        }
        const attackerCheck = this.Attacker.CheckAvailability();
        if (!attackerCheck.available) {
            canRob = false;
            switch (attackerCheck.reason) {
                case "scavenging":
                    message = s.scavenging(attackerCheck.referenceId);
                    break;
                case "working":
                    message = s.inJob(attackerCheck.time, attackerCheck.referenceId);
                    break;
                case "prison":
                    message = s.inPrison(attackerCheck.time);
                    break;
                case "wanted":
                    message = s.isWanted(attackerCheck.time);
                    break;
                case "hospital":
                    message = s.isInHospital(attackerCheck.time);
                    break;
                case "casino":
                    message = s.isInCasino;
                    break;
                case "defendingInvestment":
                    message = Language_1.globalStrings[this.Attacker.Language].attackerIsDefendingInvestment;
                    break;
                case "gangAction":
                    message = Language_1.globalStrings[this.Attacker.Language].attackerIsParticipatingInGangAction;
                    break;
                case "beating": {
                    const user = await UserRepository_1.UserRepository.FindById(attackerCheck.targetId, ["class", "nickname"]);
                    message = Language_1.globalStrings[this.Attacker.Language].attackerIsBeatingId(`${Classes_1.ClassList[user.class].Image.Emote.String} ${user.nickname}`);
                    break;
                }
                case "beingBeatUp": {
                    const user = await UserRepository_1.UserRepository.FindById(attackerCheck.targetId, ["class", "nickname"]);
                    message = Language_1.globalStrings[this.Attacker.Language].attackerIsBeingBeatedById(`${Classes_1.ClassList[user.class].Image.Emote.String} ${user.nickname}`);
                    break;
                }
                case "robbing": {
                    const user = await UserRepository_1.UserRepository.FindById(attackerCheck.targetId, ["class", "nickname"]);
                    message = Language_1.globalStrings[this.Attacker.Language].attackerIsRobbingId(`${Classes_1.ClassList[user.class].Image.Emote.String} ${user.nickname}`);
                    break;
                }
                case "beingRobbed": {
                    const user = await UserRepository_1.UserRepository.FindById(attackerCheck.targetId, ["class", "nickname"]);
                    message = Language_1.globalStrings[this.Attacker.Language].attackerIsBeingRobbedById(`${Classes_1.ClassList[user.class].Image.Emote.String} ${user.nickname}`);
                    break;
                }
                case "robbingLocation": {
                    const location = Locations_1.LocationList[attackerCheck.referenceId];
                    message = Language_1.globalStrings[this.Attacker.Language].attackerIsRobbingId(location.Name[this.Attacker.Language]);
                    break;
                }
            }
        }
        return { canRob, message };
    }
    async LockStates(useGrenade) {
        void useGrenade;
        this.attemptId = await TimedActionRepository_1.TimedActionRepository.Start(this.Attacker.Id, "robbery", this.LocationId, 10_000 + 5_000 * this.LocationId);
        this.Attacker.Robbery.IsRobbingLocationId = this.LocationId;
        log_1.Log.Info(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) locked states for robbing location ${Locations_1.LocationList[this.LocationId].Name[Language_1.Language.English]} (Id: ${Locations_1.LocationList[this.LocationId].Id}).`);
        const usedGunSkin = this.Attacker.GetItemSkin(this.Attacker.BestGun);
        const usedGunName = this.Attacker.BestGun?.Description[this.Attacker.Language] || "";
        return {
            attackerTimeInPrison: this.AttackerTimeInPrison,
            attackerAditionalTimeCallPolice: 0,
            defenderTimeInHospital: 0,
            cannotReact: true,
            cannotCallPolice: true,
            usedGunSkin,
            usedGunName,
            usedGrenade: false,
        };
    }
    async Resolve(defenderReaction) {
        void defenderReaction;
        const result = await TimedActionRepository_1.TimedActionRepository.Run(this.Attacker.Id, "robbery", this.LocationId, () => this.ResolveLocation(), this.attemptId);
        if (!await this.Attacker.GetInfo())
            throw new Error(`Robbing user ${this.Attacker.Id} was not found.`);
        return result;
    }
    async ResolveLocation() {
        try {
            if (!await this.Attacker.GetInfo())
                throw new Error(`Robbing user ${this.Attacker.Id} was not found.`);
            this.Chance = Math.random() * 100;
            const robLocationChanceBonus = await Event_1.Event.GetActiveBonusFromType(Event_1.EventType.ROB_LOCATION_CHANCE_BONUS);
            this.Success = this.Chance < (Locations_1.LocationList[this.LocationId].SuccessChance + robLocationChanceBonus);
            if (this.Success) {
                this.MoneyRobbed = Math.floor(Math.random() * (this.RewardMax - this.RewardMin + 1)) + this.RewardMin;
                this.Attacker.Money += this.MoneyRobbed;
                this.Attacker.Robbery.SuccessCount += 1;
                this.Attacker.Robbery.SuccessRobbedSum += this.MoneyRobbed;
                const wantedTimeMultiplier = await Event_1.Event.GetActiveFromType(Event_1.EventType.WANTED_TIME_MULTIPLIER);
                this.Attacker.Wanted.Time = (0, date_fns_1.addMinutes)(new Date(), 60 * wantedTimeMultiplier);
                await Notification_1.Notification.RobAgain(this.Attacker);
                log_1.Log.Success(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) successfully robbed location ${Locations_1.LocationList[this.LocationId].Name[Language_1.Language.English]} (Id: ${Locations_1.LocationList[this.LocationId].Id}) and got ${(0, ui_1.formatMoney)(this.MoneyRobbed, Language_1.Language.English)}.`);
                return {
                    success: true,
                    moneyRobbed: this.MoneyRobbed,
                    attackerWantedTime: this.Attacker.Wanted.Time,
                };
            }
            else {
                await Prison_1.Prison.Arrest(this.Attacker, this.AttackerTimeInPrison);
                await Notification_1.Notification.Free(this.Attacker);
                log_1.Log.Success(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) failed to rob location ${Locations_1.LocationList[this.LocationId].Name[Language_1.Language.English]} (Id: ${Locations_1.LocationList[this.LocationId].Id}).`);
                return {
                    success: false,
                    moneyRobbed: 0,
                    attackerPrisonTime: this.Attacker.Prison.Time,
                };
            }
        }
        catch (error) {
            log_1.Log.Error(`Error during ResolveLocation: ${error}`);
            throw error;
        }
        finally {
            await this.Attacker.Update({
                money: this.Attacker.Money,
                robberySuccessCount: this.Attacker.Robbery.SuccessCount,
                robberySuccessRobbedSum: this.Attacker.Robbery.SuccessRobbedSum,
                wantedTime: this.Attacker.Wanted.Time,
            });
            await RobHistoryRepository_1.RobHistoryRepository.CreateLocationHistory(this);
        }
    }
    async ReleaseLocks() {
        // Pending attempts belong to the recovery worker, even if the interaction fails.
        await this.Attacker.GetInfo();
    }
}
exports.LocationRobberyStrategy = LocationRobberyStrategy;
exports.Strings = {
    [Language_1.Language.English]: {
        needMoreAttack: `You need more ${emotes_1.EmoteString.Attack}ATK to rob this location!`,
        scavenging: (placeId) => `You can't rob while scavenging ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.English]}** ${emotes_1.EmoteString.Scavenge}`,
        inJob: (jobTime, jobId) => `You can't rob while working! ${emotes_1.EmoteString.Jobs}\n-# Will finish your **${Jobs_1.JobList[jobId].Description[Language_1.Language.English]}** job ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inPrison: (prisonTime) => `You can't rob while you're in prison! ${emotes_1.EmoteString.Prison}\n-# Will be released ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isWanted: (wantedTime) => `You can't rob while you're wanted by the police! ${emotes_1.EmoteString.Police}\n-# Will be able to rob again ${(0, discord_js_1.time)(wantedTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isInHospital: (hospitalTime) => `You can't rob while you're hospitalized! ${emotes_1.EmoteString.Hospital}\n-# Will be healed ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isInCasino: `You can't rob while you're in a casino game! ${emotes_1.EmoteString.Casino}`,
        robberyInProgress: `Robbery in progress`,
        tryingToRob: "Trying to rob",
        youRobbed: (formattedMoney, placeName) => `You robbed ${formattedMoney} from **${placeName}**!`,
        youFailed: (placeName) => `You failed in your attempt to rob **${placeName}**`,
        prisonTime: (date) => `Will be in prison until ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)}`,
        finishedRobberyAttacker: (success) => `Robbery ${success ? "successful" : "unsuccessful"}`,
        willBeAbleAgain: "Will be able to rob again",
        success: "Success",
        failure: "Failure",
    },
    [Language_1.Language.Portuguese]: {
        needMoreAttack: `Você precisa mais ${emotes_1.EmoteString.Attack}ATK para roubar este local!`,
        scavenging: (placeId) => `Você não pode roubar enquanto está vasculhando ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.Portuguese]}** ${emotes_1.EmoteString.Scavenge}`,
        inJob: (jobTime, jobId) => `Você não pode roubar enquanto está trabalhando! ${emotes_1.EmoteString.Jobs}\n-# Terminará seu trabalho de **${Jobs_1.JobList[jobId].Description[Language_1.Language.Portuguese]}** ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inPrison: (prisonTime) => `Você não pode roubar enquanto está preso! ${emotes_1.EmoteString.Prison}\n-# Será solto ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isWanted: (wantedTime) => `Você não pode roubar enquanto está sendo procurado pela polícia! ${emotes_1.EmoteString.Police}\n-# Poderá roubar novamente ${(0, discord_js_1.time)(wantedTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isInHospital: (hospitalTime) => `Você não pode roubar enquanto está hospitalizado! ${emotes_1.EmoteString.Hospital}\n-# Será curado ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isInCasino: `Você não pode roubar enquanto está em um jogo de cassino! ${emotes_1.EmoteString.Casino}`,
        robberyInProgress: `Roubo em andamento`,
        tryingToRob: "Tentando roubar",
        youRobbed: (formattedMoney, placeName) => `Você roubou ${formattedMoney} de **${placeName}**!`,
        youFailed: (placeName) => `Você falhou na sua tentativa de roubar **${placeName}**`,
        prisonTime: (date) => `Ficará preso até ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)}`,
        finishedRobberyAttacker: (success) => `Roubo ${success ? "bem" : "mal"}-sucedido`,
        willBeAbleAgain: "Poderá roubar novamente",
        success: "Sucesso",
        failure: "Falha",
    },
    [Language_1.Language.Spanish]: {
        needMoreAttack: `¡Necesitas más ${emotes_1.EmoteString.Attack}ATK para robar este lugar!`,
        scavenging: (placeId) => `¡No puedes robar mientras estás buscando en ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.Spanish]}** ${emotes_1.EmoteString.Scavenge}`,
        inJob: (jobTime, jobId) => `¡No puedes robar mientras trabajas! ${emotes_1.EmoteString.Jobs}\n-# ¡Terminará tu trabajo de **${Jobs_1.JobList[jobId].Description[Language_1.Language.Spanish]}** ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        inPrison: (prisonTime) => `¡No puedes robar mientras estás en prisión! ${emotes_1.EmoteString.Prison}\n-# Será liberado ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isWanted: (wantedTime) => `¡No puedes robar mientras estás siendo buscado por la policía! ${emotes_1.EmoteString.Police}\n-# Podrá robar nuevamente ${(0, discord_js_1.time)(wantedTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isInHospital: (hospitalTime) => `¡No puedes robar mientras estás hospitalizado! ${emotes_1.EmoteString.Hospital}\n-# ¡Será curado ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isInCasino: `¡No puedes robar mientras estás en un juego de casino! ${emotes_1.EmoteString.Casino}`,
        robberyInProgress: `Robo en progreso`,
        tryingToRob: "Intentando robar",
        youRobbed: (formattedMoney, placeName) => `¡Robaste ${formattedMoney} de **${placeName}**!`,
        youFailed: (placeName) => `Fallaste en tu intento de robar **${placeName}**`,
        prisonTime: (date) => `Estará en prisión hasta ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.ShortDateTime)}`,
        finishedRobberyAttacker: (success) => `Robo ${success ? "exitoso" : "fallido"}`,
        willBeAbleAgain: "Podrás robar de nuevo",
        success: "Éxito",
        failure: "Fracaso",
    },
};
//# sourceMappingURL=LocationRobberyStrategy.js.map