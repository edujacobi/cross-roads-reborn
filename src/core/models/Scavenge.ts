import type { User } from "./User";
import { Language } from "./Language";
import {
	type ItemRewardScavenge,
	ScavengeFailureReason,
	type ScavengeId,
	ScavengeList,
	ScavengeRewardType,
} from "@core/types/Scavenge";
import { ItemList, type Items, ItemType } from "@core/types/Items";
import { LocationList } from "@core/types/Locations";
import { Users } from "@core/database/Users";
import { getScavengeChanceClassModifier, getScavengeDurationClassModifier } from "@core/types/Classes";
import { addHours, addMinutes } from "date-fns";
import { Log } from "@shared/log";
import { Notification } from "./Notification";
import { UserItems } from "@core/database/UserItems";
import { BundleId } from "@core/types/Ids";
import { formatMoney } from "@bot/utils/ui";

export class Scavenge {
	User: User;
	PlaceId: ScavengeId;
	RewardMoneyMin = 0;
	RewardMoneyMax = 0;
	RewardItems: ItemRewardScavenge[] = [];
	SuccessChance = 0;
	Timer = {
		Prison: 0,
		Hospital: 0,
	};

	constructor(user: User, placeId: ScavengeId) {
		this.User = user;
		this.PlaceId = placeId;
	}

	async CanScavenge() {
		if (this.User.Scavenge.Time > new Date()) {
			return { canScavenge: false, reason: ScavengeFailureReason.UserScavengeTime };
		}

		if (this.User.IsScavenging()) {
			return { canScavenge: false, reason: ScavengeFailureReason.UserScavenging };
		}

		if (this.User.IsWorking()) {
			return { canScavenge: false, reason: ScavengeFailureReason.UserWorking };
		}

		if (this.User.IsInPrison()) {
			return { canScavenge: false, reason: ScavengeFailureReason.UserPrison };
		}

		if (this.User.IsInHospital()) {
			return { canScavenge: false, reason: ScavengeFailureReason.UserHospital };
		}

		if (this.User.IsInCasinoGame()) {
			return { canScavenge: false, reason: ScavengeFailureReason.UserCasino };
		}

		if (this.User.BeatUp.IsBeatingId) {
			const user = await Users.findByPk(this.User.BeatUp.IsBeatingId, { attributes: ["class", "nickname"] });
			return { canScavenge: false, reason: ScavengeFailureReason.AttackerIsBeatingId, attacker: user };
		}

		if (this.User.BeatUp.IsBeingBeatUpById) {
			const user = await Users.findByPk(this.User.BeatUp.IsBeingBeatUpById, { attributes: ["class", "nickname"] });
			return { canScavenge: false, reason: ScavengeFailureReason.AttackerIsBeingBeatedById, attacker: user };
		}

		if (this.User.Robbery.IsRobbingId) {
			const user = await Users.findByPk(this.User.Robbery.IsRobbingId, { attributes: ["nickname", "class"] });
			return { canScavenge: false, reason: ScavengeFailureReason.AttackerIsRobbingId, attacker: user };
		}

		if (this.User.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.User.Robbery.IsBeingRobbedById, { attributes: ["nickname", "class"] });
			return { canScavenge: false, reason: ScavengeFailureReason.AttackerIsBeingRobbedById, attacker: user };
		}

		if (this.User.Robbery.IsRobbingLocationId !== null) {
			const location = LocationList[this.User.Robbery.IsRobbingLocationId];
			return {
				canScavenge: false,
				reason: ScavengeFailureReason.AttackerIsRobbingLocationId,
				location: location,
			};
		}

		return { canScavenge: true };
	}

	async StartScavenge() {
		this.User.Scavenge.IsScavengingId = this.PlaceId;
		await this.User.Update({
			scavengingId: this.User.Scavenge.IsScavengingId,
		});

		const place = ScavengeList[this.PlaceId];
		this.RewardItems = place.Reward.Items.map(item => ({
			...item,
			Duration: {
				...item.Duration,
			},
		}));

		this.Timer.Prison = 4 * (this.PlaceId + 1);
		this.Timer.Hospital = 2 * (this.PlaceId + 1);

		// Check here and not in constructor, because user can change class between openning the command and executing the action
		const userClassChanceModifier = getScavengeChanceClassModifier(this.User.Class);
		this.SuccessChance = place.SuccessChance + userClassChanceModifier;

		const userClassDurationModifier = getScavengeDurationClassModifier(this.User.Class);
		this.RewardMoneyMin = Math.floor(place.Reward.Money.Min * userClassDurationModifier);
		this.RewardMoneyMax = Math.floor(place.Reward.Money.Max * userClassDurationModifier);
		this.RewardItems.forEach(item => {
			const data = ItemList[item.Id];
			item.Duration.Min = data.Type === ItemType.Consumable ? item.Duration.Min + 1 : (item.Duration.Min * userClassDurationModifier);
			item.Duration.Max = data.Type === ItemType.Consumable ? item.Duration.Max + 1 : (item.Duration.Max * userClassDurationModifier);
		});
	}

	async EndScavenge() {
		const place = ScavengeList[this.PlaceId];

		await this.User.GetInfo();

		const success = Math.random() * 100 < this.SuccessChance;
		const result: {
			success: boolean;
			rewardType?: ScavengeRewardType;
			rewardValue?: number;
			rewardDescription?: string;
			item?: Items;
			quantity?: number;
			duration?: number;
			hospitalized?: boolean;
			hospitalTime?: Date;
			inprisoned?: boolean;
			prisonTime?: Date;
		} = { success };

		if (success) {
			const rewardMoney = Math.random() < 0.25;
			let rewardDescription: string;
			let rewardDescriptionLog: string;

			this.User.Scavenge.Found.Total += 1;

			if (rewardMoney) {
				const reward = this.RewardMoneyMin + Math.floor(Math.random() * (this.RewardMoneyMax - this.RewardMoneyMin));

				this.User.Money += reward;
				this.User.Scavenge.Found.MoneyCount += 1;
				this.User.Scavenge.Found.MoneySum += reward;

				rewardDescription = formatMoney(reward, this.User.Language);
				rewardDescriptionLog = formatMoney(reward, Language.English);
				result.rewardType = ScavengeRewardType.Money;
				result.rewardValue = reward;
			}
			else {
				const item = this.RewardItems[Math.floor(Math.random() * this.RewardItems.length)];
				const data = ItemList[item.Id];

				const existingItem = await UserItems.findOne({
					where: {
						userId: this.User.Id,
						itemId: item.Id,
					},
				});

				const now = new Date();

				this.User.Scavenge.Found.Items += 1;

				if (data.Type === ItemType.Consumable) {
					const howMany = Math.floor(item.Duration.Min + Math.random() * (item.Duration.Max - item.Duration.Min));
					rewardDescription = `${howMany} ${this.User.GetItemSkin(data)} ${data.Description[this.User.Language]}`;
					rewardDescriptionLog = `${howMany} ${data.Description[Language.English]}`;

					await UserItems.upsert({
						id: existingItem?.id ?? undefined,
						userId: this.User.Id,
						itemId: item.Id,
						quantity: (existingItem?.quantity ?? 0) + howMany,
						skin: existingItem?.skin ?? BundleId.Default,
					});
					result.rewardType = ScavengeRewardType.ItemConsumable;
					result.item = data;
					result.quantity = howMany;
				}
				else {
					const duration = item.Duration.Min + Math.random() * (item.Duration.Max - item.Duration.Min);
					rewardDescription = `${this.User.GetItemSkin(data)} ${data.Description[this.User.Language]} (${duration.toFixed(1)}h)`;
					rewardDescriptionLog = `${duration.toFixed(1)}h ${data.Description[Language.English]}`;

					const remaining = existingItem?.remainingTime ?? new Date(0);

					const remainingTime = now > remaining ?
						addHours(now, duration) :
						addHours(remaining, duration);

					await UserItems.upsert({
						id: existingItem?.id ?? undefined,
						userId: this.User.Id,
						itemId: item.Id,
						remainingTime,
						skin: existingItem?.skin ?? BundleId.Default,
					});
					result.rewardType = ScavengeRewardType.ItemDuration;
					result.item = data;
					result.duration = duration;
				}
			}
			result.rewardDescription = rewardDescription;

			Log.Info(`User ${this.User.Nickname} (Id: ${this.User.Id}) found ${rewardDescriptionLog} while scavenging at ${place.Description[Language.English]} (Id: ${place.Id})`);
		}
		else {
			const hospitalized = Math.random() * 100 < place.Hospital.Chance;
			const inprisoned = Math.random() * 100 < place.Prison.Chance;

			this.User.Scavenge.Found.Failures += 1;

			result.hospitalized = hospitalized;
			result.inprisoned = inprisoned;

			if (hospitalized) {
				this.User.Hospital.Time = addMinutes(new Date(), this.Timer.Hospital);
				this.User.Hospital.Count += 1;
				this.User.Scavenge.Found.FailureWithHospital += 1;
				await Notification.Hospital(this.User);
				result.hospitalTime = this.User.Hospital.Time;
			}
			else if (inprisoned) {
				this.User.Prison.Time = addMinutes(new Date(), this.Timer.Prison);
				this.User.Prison.Count += 1;
				this.User.Prison.HasPaidBribe = false;
				this.User.Escape.HasTried = false;
				this.User.Scavenge.Found.FailureWithPrison += 1;
				await Notification.Free(this.User);
				result.prisonTime = this.User.Prison.Time;
			}

			Log.Info(`User ${this.User.Nickname} (Id: ${this.User.Id}) failed to scavenge at ${place.Description[Language.English]} (Id: ${place.Id}). Hospitalized: ${hospitalized} (${this.Timer.Hospital}min) Inprisoned: ${inprisoned} (${this.Timer.Prison}min)`);
		}

		this.User.Scavenge.Count += 1;
		this.User.Scavenge.Time = addHours(new Date(), 1);
		this.User.Scavenge.IsScavengingId = null;

		await Notification.Scavenge(this.User);

		await this.User.Update({
			money: this.User.Money,
			scavengeMoneyCount: this.User.Scavenge.Found.MoneyCount,
			scavengeMoneySum: this.User.Scavenge.Found.MoneySum,
			scavengeFoundItems: this.User.Scavenge.Found.Items,
			scavengeFoundTotal: this.User.Scavenge.Found.Total,
			scavengeFailures: this.User.Scavenge.Found.Failures,

			prisonTime: this.User.Prison.Time,
			prisonCount: this.User.Prison.Count,
			prisonHasPaidBribe: this.User.Prison.HasPaidBribe,
			escapeHasTried: this.User.Escape.HasTried,

			scavengeFailureWithPrison: this.User.Scavenge.Found.FailureWithPrison,
			hospitalTime: this.User.Hospital.Time,
			hospitalCount: this.User.Hospital.Count,
			scavengeFailureWithHospital: this.User.Scavenge.Found.FailureWithHospital,

			scavengeCount: this.User.Scavenge.Count,
			scavengeTime: this.User.Scavenge.Time,
			scavengingId: this.User.Scavenge.IsScavengingId,
		});

		return result;
	}
}
