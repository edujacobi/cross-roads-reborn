import { Users } from "#core/database/Users";
import { Log } from "#shared/log";
import { addDays, differenceInHours, formatDistanceToNow } from "date-fns";
import { getLocaleFromLanguage, Language, type Localization } from "./Language";
import { UserItems } from "#core/database/UserItems";
import { addHours } from "date-fns/addHours";
import { type InferAttributes, Op } from "sequelize";
import { ItemList, type Items, ItemType, type UserItem } from "#core/types/Items";
import { type JobId, JobList } from "#core/types/Jobs";
import { Notification, NotificationType } from "./Notification";
import { formatDate, formatMoney, showTime } from "#bot/utils/ui";
import { EmoteId, EmoteString } from "#bot/utils/emotes";
import { ClassId, ClassList, getJobClassModifier } from "#core/types/Classes";
import { type LocationId, LocationList } from "#core/types/Locations";
import { type ScavengeId, ScavengeList } from "#core/types/Scavenge";
import { Gang } from "./Gang";
import { GangMembers } from "#core/database/GangMembers";
import { Event, EventType } from "./Event";
import type { GangColorId } from "#bot/utils/colors";
import { AvatarDecorationId, BackgroundDecorationId, BundleId, ItemId } from "#core/types/Ids";
import { UserBundle } from "./UserBundle";
import { BundleList, type SkinBundles } from "#core/types/Skins";
import { UserAvatarDecoration } from "./UserAvatarDecoration";
import { AvatarDecorationList, type AvatarDecorations } from "#core/types/AvatarDecorations";
import { UserBackgroundDecoration } from "./UserBackgroundDecoration";
import { BackgroundDecorationList, type BackgroundDecorations } from "#core/types/BackgroundDecorations";
import { GangBases } from "#core/types/GangBases";
import type { Col, Fn, Literal } from "sequelize/lib/utils";
import { UserInvestments } from "#core/database/UserInvestments";
import { type InvestmentId } from "#core/types/Investments";

export enum SituationId {
	Idling,
	Job,
	Robbery,
	PrisonAndHospital,
	Prison,
	Hospital,
	Scavenging,
	Wanted,
	BeatUp,
	Casino,
	DefendingInvestment,
	GangAction,
}

export class User {
	static VIP_BASE_PRICE = 5_000; // special coins

	Id: string;
	CreatedAt = new Date();
	UpdatedAt = new Date();
	VipTime: Date | null = null;
	VipEternal = false;
	Language: Language;
	Nickname = "";
	Money = 0;
	Class = ClassId.None;
	GangId: number | null = null;
	SpecialCoin = 0;
	AvatarDecoration = AvatarDecorationList[AvatarDecorationId.Default];
	BackgroundDecoration = BackgroundDecorationList[BackgroundDecorationId.Default];
	NicknameChangeCount = 0;
	ClassChangeCount = 0;
	Vote = {
		LastClaim: null as Date | null,
		Count: 0,
	};
	Daily = {
		CurrentStreak: 0,
		MaxStreak: 0,
		LastReceived: null as Date | null,
	};
	Job = {
		Id: null as JobId | null,
		EndsIn: new Date(),
		ReceivedSum: 0,
		ReceivedCount: 0,
	};
	Robbery = {
		SuccessCount: 0,
		FailureCount: 0,
		BeingRobbedCount: 0,
		SuccessRobbedSum: 0,
		BeingRobbedSum: 0,
		IsRobbingId: null as string | null,
		IsBeingRobbedById: null as string | null,
		IsRobbingLocationId: null as LocationId | null,
		InvestmentIsDefending: false,
		ParticipatingInGangAction: false,
	};
	Prison = {
		Count: 0,
		BriberySum: 0,
		BriberyCount: 0,
		HasPaidBribe: false,
		Time: new Date(),
	};
	Escape = {
		Count: 0,
		Time: new Date(),
		HasTried: false,
	};
	Wanted = {
		Count: 0,
		Time: new Date(),
	};
	Hospital = {
		Count: 0,
		TreatmentCount: 0,
		TreatmentSum: 0,
		Time: new Date(),
	};
	Casino = {
		IsInGame: false,
		WinCount: 0,
		LoseCount: 0,
		WinSum: 0,
		LoseSum: 0,
	};
	Shop = {
		SpentSum: 0,
		SpentCount: 0,
	};
	BeatUp = {
		IsBeatingId: null as string | null,
		IsBeingBeatUpById: null as string | null,
		SuccessCount: 0,
		FailureCount: 0,
		BeatedUpCount: 0,
		Time: new Date(),
	};
	Attributes = {
		Attack: 0,
		Defense: 0,
		MoneyAttack: 0,
		MoneyDefense: 0,
	};
	Situation = {
		Id: 0,
		Simple: "",
		SimpleEmote: "",
		Complex: "",
		ComplexUI: "",
		EmoteId: "",
	};
	BestGun: UserItem | null = null;
	Alms = {
		GiveTime: new Date(),
		ReceiveTime: new Date(),
		GivenSum: 0,
		GivenCount: 0,
		ReceivedSum: 0,
		ReceivedCount: 0,
	};
	Scavenge = {
		IsScavengingId: null as ScavengeId | null,
		Count: 0,
		Time: new Date(),
		Found: {
			Total: 0,
			Items: 0,
			MoneyCount: 0,
			MoneySum: 0,
			Failures: 0,
			FailureWithHospital: 0,
			FailureWithPrison: 0,
		},
	};
	Drink = {
		Normal: 0,
		HappyHour: 0,
		DrunkCount: 0,
	};
	Investment = {
		Id: null as InvestmentId | null,
		AccumulatedYield: 0,
		HenchmanEndsAt: null as Date | null,
		HenchmanHospitalized: false,
		ExpiresAt: null as Date | null,
		PurchasedAt: null as Date | null,
		NotifyYield: true,
		TotalProfit: 0,
	};
	Items: UserItem[] = [];

	/**
	 * Creates a new instance of User.
	 * @param id The user's Id (usually Discord Id).
	 * @param language The user's preferred language.
	 */
	constructor(id: string, language: Language = Language.English) {
		this.Id = id;
		this.Language = language;
	}

	/**
	 * Creates the user in the database.
	 */
	async Create() {
		try {
			await Users.create({
				id: this.Id,
				nickname: this.Nickname,
				money: this.Money,
				class: this.Class,
				language: this.Language,
				dailyStreak: this.Daily.CurrentStreak,
				maxDailyStreak: this.Daily.MaxStreak,
				lastDailyReceived: this.Daily.LastReceived,
				lastVoteClaim: this.Vote.LastClaim,
				voteCount: this.Vote.Count,
				specialCoin: 0,
				avatarDecoration: AvatarDecorationId.Default,
				backgroundDecoration: BackgroundDecorationId.Default,
				casinoIsInGame: false,
				casinoLoseCount: 0,
				casinoLoseSum: 0,
				casinoWinCount: 0,
				casinoWinSum: 0,
				escapeCount: 0,
				escapeHasTried: false,
				wantedCount: 0,
				hospitalCount: 0,
				hospitalTreatmentCount: 0,
				hospitalTreatmentSum: 0,
				jobReceivedCount: 0,
				jobReceivedSum: 0,
				prisonCount: 0,
				prisonBriberyCount: 0,
				prisonBriberySum: 0,
				prisonHasPaidBribe: false,
				robberyBeingRobbedCount: 0,
				robberyBeingRobbedSum: 0,
				robberyFailureCount: 0,
				robberySuccessCount: 0,
				robberySuccessRobbedSum: 0,
				robberyInvestmentDefending: false,
				robberyParticipatingInGangAction: false,
				beatUpSuccessCount: 0,
				beatUpFailureCount: 0,
				beatUpBeatedUpCount: 0,
				shopSpentCount: 0,
				shopSpentSum: 0,
				almsGivenSum: 0,
				almsGivenCount: 0,
				almsReceivedSum: 0,
				almsReceivedCount: 0,
				scavengeCount: 0,
				scavengeFoundTotal: 0,
				scavengeFoundItems: 0,
				scavengeMoneyCount: 0,
				scavengeMoneySum: 0,
				scavengeFailures: 0,
				scavengeFailureWithHospital: 0,
				scavengeFailureWithPrison: 0,
				drinkNormal: 0,
				drinkHappyHour: 0,
				drunkCount: 0,
				notifyInvestmentYield: true,
				investmentTotalProfit: 0,
				nicknameChangeCount: 0,
				classChangeCount: 0,
			});
			Log.Success(`User ${this.Id} created.`);

		}
		catch (err) {
			//
		}
	}

	/**
	 * Loads user information from the database.
	 * @param fromUser Optional Users model instance to load from.
	 * @param language Optional language to override.
	 * @returns The User instance or null if not found.
	 */
	async GetInfo(fromUser?: Users, language?: Language) {
		let user: Users | null;

		if (fromUser) {
			user = fromUser;
		}
		else {
			user = await Users.findOne({
				where: {
					id: this.Id,
				},
			});
		}

		if (!user) {
			return null;
		}

		this.Id = user.id;
		this.CreatedAt = user.createdAt;
		this.UpdatedAt = user.updatedAt;
		this.VipTime = user.vipTime;
		this.VipEternal = user.vipEternal;
		this.Nickname = user.nickname;
		this.Money = user.money;
		this.Class = user.class;
		this.SpecialCoin = user.specialCoin;
		this.AvatarDecoration = AvatarDecorationList[user.avatarDecoration];
		this.BackgroundDecoration = BackgroundDecorationList[user.backgroundDecoration];
		this.NicknameChangeCount = user.nicknameChangeCount;
		this.ClassChangeCount = user.classChangeCount;

		// Verificar se o usuário está em uma gangue
		const gangMember = await GangMembers.findOne({
			where: { userId: this.Id },
		});

		this.GangId = gangMember ? gangMember.gangId : null;

		// Jobs
		this.Job.Id = user.jobId;
		this.Job.EndsIn = new Date(user.jobTime);
		this.Job.ReceivedCount = user.jobReceivedCount;
		this.Job.ReceivedSum = user.jobReceivedSum;

		// Vote
		this.Vote.LastClaim = user.lastVoteClaim;
		this.Vote.Count = user.voteCount;

		// Daily
		this.Daily.CurrentStreak = user.dailyStreak;
		this.Daily.MaxStreak = user.maxDailyStreak;
		this.Daily.LastReceived = user.lastDailyReceived;

		// Robberies
		this.Robbery.SuccessCount = user.robberySuccessCount;
		this.Robbery.FailureCount = user.robberyFailureCount;
		this.Robbery.SuccessRobbedSum = user.robberySuccessRobbedSum;
		this.Robbery.BeingRobbedCount = user.robberyBeingRobbedCount;
		this.Robbery.BeingRobbedSum = user.robberyBeingRobbedSum;
		if (user.robbingUserId) {
			this.Robbery.IsRobbingId = user.robbingUserId;
		}
		if (user.beingRobbedByUserId) {
			this.Robbery.IsBeingRobbedById = user.beingRobbedByUserId;
		}
		this.Robbery.IsRobbingLocationId = user.robbingLocationId;
		this.Robbery.InvestmentIsDefending = user.robberyInvestmentDefending;
		this.Robbery.ParticipatingInGangAction = user.robberyParticipatingInGangAction;

		// Beat-ups
		this.BeatUp.SuccessCount = user.beatUpSuccessCount;
		this.BeatUp.FailureCount = user.beatUpFailureCount;
		this.BeatUp.BeatedUpCount = user.beatUpBeatedUpCount;
		this.BeatUp.Time = new Date(user.beatUpTime);
		if (user.beatingUserId) {
			this.BeatUp.IsBeatingId = user.beatingUserId;
		}
		if (user.beingBeatUpByUserId) {
			this.BeatUp.IsBeingBeatUpById = user.beingBeatUpByUserId;
		}

		// Prison
		this.Prison.Count = user.prisonCount;
		this.Prison.BriberySum = user.prisonBriberySum;
		this.Prison.BriberyCount = user.prisonBriberyCount;
		this.Prison.HasPaidBribe = user.prisonHasPaidBribe;
		this.Prison.Time = new Date(user.prisonTime);

		// Escape
		this.Escape.Count = user.escapeCount;
		this.Escape.Time = new Date(user.escapeTime);
		this.Escape.HasTried = user.escapeHasTried;

		// Wanted
		this.Wanted.Count = user.wantedCount;
		this.Wanted.Time = new Date(user.wantedTime);

		// Hospital
		this.Hospital.Count = user.hospitalCount;
		this.Hospital.Time = user.hospitalTime;
		this.Hospital.TreatmentCount = user.hospitalTreatmentCount;
		this.Hospital.TreatmentSum = user.hospitalTreatmentSum;

		// Casino
		this.Casino.IsInGame = user.casinoIsInGame;
		this.Casino.WinCount = user.casinoWinCount;
		this.Casino.LoseCount = user.casinoLoseCount;
		this.Casino.WinSum = user.casinoWinSum;
		this.Casino.LoseSum = user.casinoLoseSum;

		// Shop
		this.Shop.SpentSum = user.shopSpentSum;
		this.Shop.SpentCount = user.shopSpentCount;

		// Alms
		this.Alms.GiveTime = user.almsGiveTime;
		this.Alms.ReceiveTime = user.almsReceiveTime;
		this.Alms.GivenSum = user.almsGivenSum;
		this.Alms.GivenCount = user.almsGivenCount;
		this.Alms.ReceivedSum = user.almsReceivedSum;
		this.Alms.ReceivedCount = user.almsReceivedCount;

		// Scavenge
		this.Scavenge.IsScavengingId = user.scavengingId;
		this.Scavenge.Count = user.scavengeCount;
		this.Scavenge.Time = user.scavengeTime;
		this.Scavenge.Found.Total = user.scavengeFoundTotal;
		this.Scavenge.Found.Items = user.scavengeFoundItems;
		this.Scavenge.Found.MoneyCount = user.scavengeMoneyCount;
		this.Scavenge.Found.MoneySum = user.scavengeMoneySum;
		this.Scavenge.Found.Failures = user.scavengeFailures;
		this.Scavenge.Found.FailureWithHospital = user.scavengeFailureWithHospital;
		this.Scavenge.Found.FailureWithPrison = user.scavengeFailureWithPrison;

		// Drink
		this.Drink.Normal = user.drinkNormal;
		this.Drink.HappyHour = user.drinkHappyHour;
		this.Drink.DrunkCount = user.drunkCount;

		// Investment
		const investment = await UserInvestments.findOne({
			where: { userId: this.Id },
		});
		if (investment) {
			this.Investment.Id = investment.investmentId as InvestmentId;
			this.Investment.AccumulatedYield = investment.accumulatedYield;
			this.Investment.HenchmanEndsAt = investment.henchmanEndsAt;
			this.Investment.HenchmanHospitalized = investment.henchmanHospitalized;
			this.Investment.ExpiresAt = investment.expiresAt;
			this.Investment.PurchasedAt = investment.createdAt;
		}
		else {
			this.Investment.Id = null;
			this.Investment.AccumulatedYield = 0;
			this.Investment.HenchmanEndsAt = null;
			this.Investment.HenchmanHospitalized = false;
			this.Investment.ExpiresAt = null;
			this.Investment.PurchasedAt = null;
		}
		this.Investment.NotifyYield = user.notifyInvestmentYield;
		this.Investment.TotalProfit = user.investmentTotalProfit;

		await Promise.all([
			this.GetSituation(language),
			this.GetItems(),
		]);
		// After GetItems
		await this.GetAttributes();

		this.Language = user.language;

		return this;
	}

	/**
	 * Loads basic user information from the database without expensive lookups.
	 * @param fromUser Optional Users model instance to load from.
	 * @param language Optional language to override.
	 * @returns The User instance or null if not found.
	 */
	async GetSimpleInfo(fromUser?: Users, language?: Language) {
		let user: Users | null;

		if (fromUser) {
			user = fromUser;
		}
		else {
			user = await Users.findOne({
				where: {
					id: this.Id,
				},
			});
		}

		if (!user) {
			return null;
		}

		this.Id = user.id;
		if (user.nickname !== undefined) this.Nickname = user.nickname;
		if (user.money !== undefined) this.Money = user.money;
		if (user.class !== undefined) this.Class = user.class;
		if (user.specialCoin !== undefined) this.SpecialCoin = user.specialCoin;
		if (user.avatarDecoration !== undefined) this.AvatarDecoration = AvatarDecorationList[user.avatarDecoration];
		if (user.backgroundDecoration !== undefined) this.BackgroundDecoration = BackgroundDecorationList[user.backgroundDecoration];
		if (user.language !== undefined) this.Language = user.language;
		if (user.vipTime !== undefined) this.VipTime = user.vipTime;
		if (user.vipEternal !== undefined) this.VipEternal = user.vipEternal;
		if (user.createdAt !== undefined) this.CreatedAt = user.createdAt;
		if (user.updatedAt !== undefined) this.UpdatedAt = user.updatedAt;

		// Verificar se o usuário está em uma gangue
		const gangMember = await GangMembers.findOne({
			where: { userId: this.Id },
		});
		this.GangId = gangMember ? gangMember.gangId : null;

		this.Language = language ?? this.Language;

		return this;
	}

	/**
	 * Sets the user's nickname.
	 * @param nickname The new nickname.
	 * @param cost Optional cost to change the nickname.
	 * @returns True if successful, false if not enough money.
	 */
	async SetNickname(nickname: string, cost?: number) {
		const oldNickname = this.Nickname;
		this.Nickname = nickname;
		if (cost) {
			if (this.Money < cost) {
				return false;
			}
			this.Money -= cost;
		}

		this.NicknameChangeCount += 1;
		await this.Update({
			nickname: this.Nickname,
			money: this.Money,
			nicknameChangeCount: this.NicknameChangeCount,
		});

		Log.Success(`User ${oldNickname} (Id: ${this.Id}) changed nickname to ${nickname}. ${cost ? ` for ${formatMoney(cost, Language.English)}` : ""}`);
		return true;
	}

	/**
	 * Sets the user's class.
	 * @param classId The new class Id.
	 * @param cost Optional cost to change the class.
	 * @returns True if successful, false if not enough money.
	 */
	async SetClass(classId: ClassId, cost?: number) {
		const oldClass = this.Class;
		this.Class = classId;
		if (cost) {
			if (this.Money < cost) {
				return false;
			}
			this.Money -= cost;
		}

		this.ClassChangeCount += 1;
		await this.Update({
			class: this.Class,
			money: this.Money,
			classChangeCount: this.ClassChangeCount,
		});

		Log.Success(`User ${this.Nickname} (Id: ${this.Id}) changed class from ${ClassList[oldClass].Name[Language.English]} to ${ClassList[classId].Name[Language.English]}${cost ? ` for ${formatMoney(cost, Language.English)}` : ""}.`);
		return true;
	}

	/**
	 * Gets the cost to change the nickname.
	 * @returns The cost.
	 */
	GetNicknameChangeCost() {
		if (this.Nickname === "") {
			return 0;
		}

		const base = 100_000;
		const multiplier = Math.pow(10, Math.max(0, this.NicknameChangeCount - 1));
		const discount = this.IsVip() ? 0.75 : 1;

		return Math.floor(base * multiplier * discount);
	}

	/**
	 * Gets the cost to change the class.
	 * @returns The cost.
	 */
	GetClassChangeCost() {
		if (this.Class === ClassId.None) {
			return 0;
		}

		const base = 100_000;
		const multiplier = Math.pow(10, Math.max(0, this.ClassChangeCount - 1));
		const discount = this.IsVip() ? 0.75 : 1;

		return Math.floor(base * multiplier * discount);
	}

	/**
	 * Gets the localized text of the user's class.
	 * @returns The class name.
	 */
	GetClassText() {
		return ClassList[this.Class].Name[this.Language];
	}

	/**
	 * Gets the user's name with the class image emote.
	 * @returns The formatted string.
	 */
	GetNameWithImage() {
		return `${ClassList[this.Class].Image.Emote.String} ${this.Nickname}`;
	}

	/**
	 * Checks if the user is a VIP.
	 * @returns True if VIP, false otherwise.
	 */
	IsVip() {
		if (this.VipEternal) {
			return true;
		}

		if (this.VipTime == null) {
			return false;
		}

		return this.VipTime > new Date();
	}

	/**
	 * Buys VIP time using special coins.
	 * @param months Number of months to buy.
	 */
	async BuyVip(months: number) {
		const price = months * User.VIP_BASE_PRICE;

		this.SpecialCoin -= price;
		await this.Update({
			specialCoin: this.SpecialCoin,
		});

		await this.AddVip(months * 30);
		Log.Success(`User ${this.Nickname} (Id: ${this.Id}) bought VIP for ${months} months.`);
	}

	/**
	 * Adds VIP time to the user.
	 * @param days Number of days to add.
	 */
	async AddVip(days: number) {
		if (this.VipTime == null || this.VipTime < new Date()) {
			this.VipTime = new Date();
		}
		if (this.AvatarDecoration.Id === AvatarDecorationId.Default) {
			this.AvatarDecoration = AvatarDecorationList[AvatarDecorationId.VIP];
		}

		this.VipTime = addDays(this.VipTime, days);

		await this.Update({
			vipTime: this.VipTime,
			avatarDecoration: this.AvatarDecoration.Id,
		});

		Log.Success(`User ${this.Nickname} (Id: ${this.Id}) received ${days} days of VIP.`);
	}

	/**
	 * Toggles eternal VIP status.
	 */
	async SetEternalVip() {
		this.VipEternal = !this.VipEternal;

		await this.Update({
			vipEternal: this.VipEternal,
		});
		Log.Success(`User ${this.Nickname} (Id: ${this.Id}) ${this.VipEternal ? "is now" : "is not anymore"} a eternal VIP.`);
	}

	/**
	 * Adds special coins to the user.
	 * @param coins Number of coins to add.
	 */
	async AddSpecialCoin(coins: number) {
		this.SpecialCoin += coins;

		await this.Update({
			specialCoin: this.SpecialCoin,
		});

		Log.Success(`User ${this.Nickname} (Id: ${this.Id}) received ${coins} special coins.`);
	}

	/**
	 * Checks if the user can receive the daily reward.
	 * @returns True if eligible, false otherwise.
	 */
	CanReceiveDaily() {
		const today = new Date();

		return this.Daily.LastReceived == null || differenceInHours(today, this.Daily.LastReceived) > 23;
	}

	/**
	 * Receives the daily reward.
	 * @param options Options for the daily reward.
	 * @param options.isBooster Whether the user is a server booster.
	 * @returns The money received and any bonus items.
	 */
	async ReceiveDaily({ isBooster }: { isBooster: boolean }) {
		const today = new Date();

		if (this.Daily.LastReceived != null && differenceInHours(today, this.Daily.LastReceived) > 48) {
			this.Daily.CurrentStreak = 0;
		}

		this.Daily.LastReceived = today;
		this.Daily.CurrentStreak += 1;

		if (this.Daily.CurrentStreak > this.Daily.MaxStreak) {
			this.Daily.MaxStreak = this.Daily.CurrentStreak;
		}

		const streakMultiplier = this.Daily.CurrentStreak <= 7 ? this.Daily.CurrentStreak : 7;

		let baseValue = 300;

		if (this.IsVip() || isBooster) {
			baseValue *= 1.5;
		}

		const money = baseValue * streakMultiplier;

		this.Money += money;

		const bonusItems: { item: Items; quantity?: number; days?: number }[] = [];

		if (this.Daily.CurrentStreak > 0 && this.Daily.CurrentStreak % 7 === 0) {
			const cycle = Math.floor(this.Daily.CurrentStreak / 7);

			if (cycle === 1) {
				// 7th day: 3 days of Knife, 2 days of Pistol, 1 day of Compact SMG
				bonusItems.push({ item: ItemList[ItemId.Knife], days: 3 });
				bonusItems.push({ item: ItemList[ItemId.Pistol], days: 2 });
				bonusItems.push({ item: ItemList[ItemId.CompactSMG], days: 1 });
			}
			else if (cycle === 2) {
				// 14th day: 3 days of Light Vest, 2 days of Baseball Bat, 1 day of best gun or Sawnoff
				bonusItems.push({ item: ItemList[ItemId.LightVest], days: 3 });
				bonusItems.push({ item: ItemList[ItemId.BaseballBat], days: 2 });

				const fallback = ItemList[ItemId.Sawnoff];
				const best = this.BestGun && this.BestGun.Attack > fallback.Attack ? this.BestGun : fallback;
				bonusItems.push({ item: best, days: 1 });
			}
			else if (cycle === 3) {
				// 21st day: 3 days of Advanced Scope, 2 days of Heavy Vest, 1 day of best gun or Carbine
				bonusItems.push({ item: ItemList[ItemId.AdvancedScope], days: 3 });
				bonusItems.push({ item: ItemList[ItemId.HeavyVest], days: 2 });

				const fallback = ItemList[ItemId.Carbine];
				const best = this.BestGun && this.BestGun.Attack > fallback.Attack ? this.BestGun : fallback;
				bonusItems.push({ item: best, days: 1 });
			}
			else {
				// 28th day and beyond: 7 days of Sunglasses, 2 Grenades, 1 day of best gun or Katana
				bonusItems.push({ item: ItemList[ItemId.Sunglasses], days: 7 });
				bonusItems.push({ item: ItemList[ItemId.Grenade], quantity: 2 });

				const fallback = ItemList[ItemId.Katana];
				const best = this.BestGun && this.BestGun.Attack > fallback.Attack ? this.BestGun : fallback;
				bonusItems.push({ item: best, days: 1 });
			}

			for (const bonus of bonusItems) {
				await this.GiveItem(bonus.item, bonus.quantity, bonus.days);
			}
		}

		await this.Update({
			money: this.Money,
			lastDailyReceived: this.Daily.LastReceived,
			dailyStreak: this.Daily.CurrentStreak,
			maxDailyStreak: this.Daily.MaxStreak,
		});

		Log.Success(`User ${this.Nickname} (Id: ${this.Id}) received ${formatMoney(money, Language.English)} from daily. Streak: ${this.Daily.CurrentStreak}.`);

		await Notification.Daily(this);

		return { money, bonusItems };
	}

	/**
	 * Checks if the user can claim a new vote reward.
	 * @returns True if eligible, false otherwise.
	 */
	CanClaimVote() {
		const today = new Date();
		// If last vote was over 11 hours ago, we allow them to check with top.gg again
		return this.Vote.LastClaim == null || differenceInHours(today, this.Vote.LastClaim) >= 11;
	}

	/**
	 * Claims the vote reward from Top.gg.
	 * @param votedAt Optional timestamp of the vote from Top.gg.
	 */
	async ClaimVoteReward(votedAt?: Date) {
		const reward = 10;
		this.Vote.LastClaim = votedAt || new Date();
		this.Vote.Count += 1;
		this.SpecialCoin += reward;

		await this.Update({
			lastVoteClaim: this.Vote.LastClaim,
			voteCount: this.Vote.Count,
			specialCoin: this.SpecialCoin,
		});

		await Notification.Vote(this, this.Vote.LastClaim);

		Log.Success(`User ${this.Nickname} (Id: ${this.Id}) received ${reward} Special Coins for voting! Total votes: ${this.Vote.Count}`);
	}

	/**
	 * Gives an item to the user without charging money.
	 * @param item The item to give.
	 * @param quantity Optional quantity for consumables.
	 * @param days Optional duration in days for non-consumables.
	 */
	async GiveItem(item: Items, quantity?: number, days?: number) {
		const existingItem = await UserItems.findOne({
			where: {
				userId: this.Id,
				itemId: item.Id,
			},
		});

		const now = new Date();
		const userItem = { ...ItemList[item.Id] } as UserItem;

		if (!existingItem) {
			const remaining = item.Type != ItemType.Consumable ? addDays(now, days ?? 3) : undefined;
			const qty = item.Type == ItemType.Consumable ? (quantity ?? 1) : undefined;

			await UserItems.create({
				userId: this.Id,
				itemId: item.Id,
				remainingTime: remaining,
				quantity: qty,
				skin: BundleId.Default,
			});

			userItem.RemainingTime = remaining ?? new Date();
			userItem.Quantity = qty ?? 0;
			userItem.SelectedSkin = BundleId.Default;
		}
		else {
			let remaining = addDays(existingItem.remainingTime, days ?? 3);
			if (now > existingItem.remainingTime) {
				remaining = addDays(now, days ?? 3);
			}

			await UserItems.update({
				remainingTime: item.Type != ItemType.Consumable ? remaining : undefined,
				quantity: item.Type == ItemType.Consumable ? existingItem.quantity + (quantity ?? 1) : undefined,
			}, {
				where: {
					userId: this.Id,
					itemId: item.Id,
				},
			});

			userItem.RemainingTime = remaining;
			userItem.Quantity = existingItem.quantity + (item.Type == ItemType.Consumable ? (quantity ?? 1) : 0);
			userItem.SelectedSkin = existingItem.skin;
		}

		// Update local items list
		const localIdx = this.Items.findIndex(i => i.Id === item.Id);
		if (localIdx !== -1) {
			this.Items[localIdx] = userItem;
		}
		else {
			this.Items.push(userItem);
		}

		Log.Info(`User ${this.Nickname} (Id: ${this.Id}) received ${item.Type === ItemType.Consumable ? `${quantity}x` : `${days} days`} of ${item.Description[Language.English]} (Id: ${item.Id}).`);
	}

	/**
	 * Buys an item for the user.
	 * @param item The item to buy.
	 * @returns True if successful.
	 */
	async BuyItem(item: Items) {
		this.Money -= item.Price;

		const existingItem = await UserItems.findOne({
			where: {
				userId: this.Id,
				itemId: item.Id,
			},
		});

		const now = new Date();
		const userItem = { ...ItemList[item.Id] } as UserItem;

		if (!existingItem) {
			const remaining = userItem.Type != ItemType.Consumable ? addHours(now, 72) : undefined;
			const quantity = userItem.Type == ItemType.Consumable ? 1 : undefined;
			await UserItems.create({
				userId: this.Id,
				itemId: item.Id,
				remainingTime: remaining,
				quantity: quantity,
				skin: BundleId.Default,
			});

			userItem.RemainingTime = remaining ?? new Date();
			userItem.Quantity = quantity ?? 0;
			userItem.SelectedSkin = BundleId.Default;

			Log.Info(`User ${this.Nickname} (Id: ${this.Id}) bought item ${item.Description[Language.English]} (Id: ${item.Id}) for ${formatMoney(item.Price, Language.English)} [FIRST TIME!].`);
		}
		else {
			let remaining = addHours(existingItem.remainingTime, 72);
			if (now > existingItem.remainingTime) {
				remaining = addHours(now, 72);
			}

			await UserItems.update({
				remainingTime: userItem.Type != ItemType.Consumable ? remaining : undefined,
				quantity: userItem.Type == ItemType.Consumable ? existingItem.quantity += 1 : undefined,
			}, {
				where: {
					userId: this.Id,
					itemId: item.Id,
				},
			});

			userItem.RemainingTime = remaining;
			userItem.Quantity = existingItem.quantity += 1;
			userItem.SelectedSkin = existingItem.skin;

			Log.Info(`User ${this.Nickname} (Id: ${this.Id}) bought item ${item.Description[Language.English]} (Id: ${item.Id}) for ${formatMoney(item.Price, Language.English)}. Total time: ${differenceInHours(remaining, new Date())}h.`);
		}

		this.Shop.SpentCount += 1;
		this.Shop.SpentSum += item.Price;
		this.Items.push(userItem);

		await this.Update({
			money: this.Money,
			shopSpentCount: this.Shop.SpentCount,
			shopSpentSum: this.Shop.SpentSum,
		});
		return true;
	}

	/**
	 * Consumes an item from the user's inventory.
	 * @param itemId The item Id to consume.
	 * @param quantity The quantity to consume.
	 * @returns True if successful.
	 */
	async ConsumeItem(itemId: ItemId, quantity = 1) {
		const item = await UserItems.findOne({
			where: {
				userId: this.Id,
				itemId: itemId,
			},
		});

		if (item && (item.quantity ?? 0) >= quantity) {
			await item.decrement("quantity", { by: quantity });
			const localItem = this.Items.find(i => i.Id === itemId);
			if (localItem) {
				localItem.Quantity -= quantity;
			}
			return true;
		}
		return false;
	}

	/**
	 * Get all items from user that are greater than 0 and or are not expired
	 */
	private async GetItems() {
		this.Items = [];
		const items = await UserItems.findAll({
			where: {
				userId: this.Id,
				[Op.or]: {
					remainingTime: {
						[Op.gt]: new Date(),
					},
					quantity: {
						[Op.gt]: 0,
					},
				},
			},
			order: [["remainingTime", "ASC"]],
		});

		for (const item of items) {
			const foundWeapon = { ...ItemList[item.itemId] } as UserItem;
			foundWeapon.RemainingTime = item.remainingTime;
			foundWeapon.Quantity = item.quantity ?? 0;
			foundWeapon.SelectedSkin = item.skin;

			this.Items.push(foundWeapon);
		}
	}

	/**
	 * Get all items from user, even if quantity is 0 and remaining time is less than now (expired)
	 */
	async GetAllItems() {
		const items = await UserItems.findAll({
			where: {
				userId: this.Id,
			},
		});

		const itemList: UserItem[] = [];

		for (const item of items) {
			const foundWeapon = { ...ItemList[item.itemId] } as UserItem;
			foundWeapon.RemainingTime = <Date>item?.remainingTime ?? 0;
			foundWeapon.Quantity = item?.quantity ?? 0;
			foundWeapon.SelectedSkin = item?.skin ?? BundleId.Default;

			itemList.push(foundWeapon);
		}

		return itemList;
	}

	/**
	 * Get the Item data, even if user doesnot have it in database (blank values)
	 * @param itemId
	 */
	async GetSpecificItem(itemId: number) {
		const item = await UserItems.findOne({
			where: {
				userId: this.Id,
				itemId,
			},
		});

		const foundWeapon = { ...ItemList[itemId] } as UserItem;
		foundWeapon.RemainingTime = <Date>item?.remainingTime ?? 0;
		foundWeapon.Quantity = item?.quantity ?? 0;
		foundWeapon.SelectedSkin = item?.skin ?? BundleId.Default;

		return foundWeapon;
	}

	/**
	 * Gets the skin string for a specific item.
	 * @param item The item to get the skin for.
	 * @returns The skin string.
	 */
	GetItemSkin(item: Items): string {
		const found = this.Items.find(i => i.Id === item.Id);
		if (found) {
			return item.Skin[found.SelectedSkin].String;
		}

		return item.Skin[BundleId.Default].String;
	}

	/**
	 * Sets the skin for a specific item.
	 * @param item The item to set the skin for.
	 * @param bundle The skin bundle.
	 */
	async SetItemSkin(item: Items, bundle: SkinBundles) {
		const existingItem = await UserItems.findOne({
			where: {
				userId: this.Id,
				itemId: item.Id,
			},
		});

		if (!existingItem) {
			await UserItems.create({
				userId: this.Id,
				itemId: item.Id,
				remainingTime: undefined,
				quantity: undefined,
				skin: bundle.Id,
			});
		}
		else {
			await UserItems.update({
				skin: bundle.Id,
			}, {
				where: {
					userId: this.Id,
					itemId: item.Id,
				},
			});
		}

		Log.Info(`User ${this.Nickname} (Id: ${this.Id}) has set skin ${bundle.Description[Language.English]} (Id: ${bundle.Id}) for item ${item.Description[Language.English]} (Id: ${item.Id}).`);
	}

	/**
	 * Sets the skin for all items in a bundle.
	 * @param bundle The skin bundle.
	 */
	async SetBundleSkin(bundle: SkinBundles) {
		const itemsToCreate = [];
		const itemsToUpdate = [];

		const existingItems = await UserItems.findAll({
			where: {
				userId: this.Id,
				itemId: {
					[Op.in]: bundle.Items,
				},
			},
		});

		const existingItemIds = new Set(existingItems.map(item => item.itemId));

		for (const itemId of bundle.Items) {
			if (!existingItemIds.has(itemId)) {
				itemsToCreate.push({
					userId: this.Id,
					itemId: itemId,
					skin: bundle.Id,
				});
			}
			else {
				itemsToUpdate.push(itemId);
			}
		}

		if (itemsToCreate.length > 0) {
			await UserItems.bulkCreate(itemsToCreate);
		}

		if (itemsToUpdate.length > 0) {
			await UserItems.update({ skin: bundle.Id }, {
				where: {
					userId: this.Id,
					itemId: { [Op.in]: itemsToUpdate },
				},
			});
		}

		Log.Info(`User ${this.Nickname} (Id: ${this.Id}) has set skin ${bundle.Description[Language.English]} (Id: ${bundle.Id}) for all items in bundle.`);
	}

	/**
	 * Sets the avatar decoration for the user.
	 * @param decoration The avatar decoration.
	 */
	async SetAvatarDecoration(decoration: AvatarDecorations) {
		this.AvatarDecoration = decoration;
		await this.Update({
			avatarDecoration: this.AvatarDecoration.Id,
		});

		Log.Info(`User ${this.Nickname} (Id: ${this.Id}) has set avatar decoration ${decoration.Description[Language.English]} (Id: ${decoration.Id}).`);
	}

	/**
	 * Calculates the user's attributes based on items and other factors.
	 * @param isBeatUp Whether the user is in a beat-up situation.
	 * @param usedConsumables List of consumable items used in the current action.
	 */
	async GetAttributes(isBeatUp = false, usedConsumables: ItemId[] = []) {
		this.Attributes.Attack = 0;
		this.Attributes.Defense = 0;
		this.Attributes.MoneyAttack = 0;
		this.Attributes.MoneyDefense = 0;
		this.BestGun = null;

		let moreATK = 0;
		let moreDEF = 0;
		let moreMoneyATK = 0;
		let moreMoneyDEF = 0;

		const hour = new Date().getHours();
		const isDay = hour >= 6 && hour < 18;
		const isNight = !isDay;

		for (const item of this.Items) {
			if (item.Type === ItemType.BeatUp && !isBeatUp) {
				continue;
			}

			if (item.Type === ItemType.Consumable) {
				continue;
			}

			if ((this.BestGun?.Attack ?? 0) < item.Attack) {
				this.BestGun = item;
			}

			this.Attributes.Attack = Math.max(this.Attributes.Attack, item.Attack);
			this.Attributes.Defense = Math.max(this.Attributes.Defense, item.Defense);
			this.Attributes.MoneyAttack = Math.max(this.Attributes.MoneyAttack, item.MoneyAttack);
			this.Attributes.MoneyDefense = Math.max(this.Attributes.MoneyDefense, item.MoneyDefense);

			if ((item.Special.Day && isDay) || (item.Special.Night && isNight) || (!item.Special.Night && !item.Special.Day)) {
				moreATK += item.MoreAttack;
				moreDEF += item.MoreDefense;
				moreMoneyATK += item.MoreMoneyATK;
				moreMoneyDEF += item.MoreMoneyDEF;
			}
		}

		for (const itemId of usedConsumables) {
			const item = ItemList[itemId];
			if (item) {
				if ((item.Special.Day && isDay) || (item.Special.Night && isNight) || (!item.Special.Night && !item.Special.Day)) {
					moreATK += item.MoreAttack;
					moreDEF += item.MoreDefense;
					moreMoneyATK += item.MoreMoneyATK;
					moreMoneyDEF += item.MoreMoneyDEF;
				}
			}
		}

		this.Attributes.Attack += moreATK;
		this.Attributes.Defense += moreDEF;
		this.Attributes.MoneyAttack += moreMoneyATK;
		this.Attributes.MoneyDefense += moreMoneyDEF;

		if (this.IsInHospital()) {
			this.Attributes.Defense -= 5;
		}

		// Gang Modifiers
		if (this.GangId) {
			const gang = await Gang.GetBasicById(this.GangId);

			if (gang) {
				this.Attributes.Attack += (GangBases[gang.BaseId].Modifier?.Attack?.Positive || 0) * gang.Level;
				this.Attributes.Defense += (GangBases[gang.BaseId].Modifier?.Defense?.Positive || 0) * gang.Level;
			}
		}
	}

	/**
	 * Determines the current situation of the user.
	 * @param language Optional language to override.
	 */
	async GetSituation(language?: Language) {
		const lang = language ?? this.Language;
		const s = Strings[lang];

		// Default to Idling
		this.Situation = {
			Id: SituationId.Idling,
			Simple: s.idling,
			SimpleEmote: `${EmoteString.Idle} ${s.idling}`,
			Complex: `${EmoteString.Idle} ${s.idling}`,
			ComplexUI: s.idling,
			EmoteId: EmoteId.Lazy,
		};

		// Check situations by priority (highest to lowest)
		if (this.IsScavenging()) {
			this.Situation = {
				Id: SituationId.Scavenging,
				Simple: s.scavenging,
				SimpleEmote: `${EmoteString.Scavenge} ${s.scavenging}`,
				Complex: `${EmoteString.Scavenge} ${s.scavenging} ${ScavengeList[this.Scavenge.IsScavengingId!].Emote.String} ${ScavengeList[this.Scavenge.IsScavengingId!].Description[lang]}`,
				ComplexUI: `${s.scavenging} ${ScavengeList[this.Scavenge.IsScavengingId!].Description[lang]}`,
				EmoteId: EmoteId.Scavenge,
			};
		}
		else if (this.IsInPrison() && this.IsInHospital()) {
			this.Situation = {
				Id: SituationId.PrisonAndHospital,
				Simple: s.imprisonedAndHospitalSimple,
				SimpleEmote: s.imprisonedAndHospitalSimpleEmote,
				Complex: s.imprisonedAndHospitalComplex(this.Prison.Time, this.Hospital.Time),
				ComplexUI: s.imprisonedAndHospitalComplexUI(this.Prison.Time, this.Hospital.Time),
				EmoteId: EmoteId.Prison,
			};
		}
		else if (this.IsInHospital()) {
			this.Situation = {
				Id: SituationId.Hospital,
				Simple: s.hospitalSimple,
				SimpleEmote: `${EmoteString.Hospital} ${s.hospitalSimple}`,
				Complex: `${EmoteString.Hospital} ${s.hospitalComplex} ${showTime(this.Hospital.Time.getTime())}`,
				ComplexUI: `${s.hospitalComplex} ${formatDistanceToNow(this.Hospital.Time, {
					locale: getLocaleFromLanguage(lang),
					includeSeconds: true,
				})}`,
				EmoteId: EmoteId.Hospital,
			};
		}
		else if (this.IsInPrison()) {
			this.Situation = {
				Id: SituationId.Prison,
				Simple: s.imprisonedSimple,
				SimpleEmote: `${EmoteString.Prison} ${s.imprisonedSimple}`,
				Complex: `${EmoteString.Prison} ${s.imprisonedComplex} ${showTime(this.Prison.Time.getTime())}`,
				ComplexUI: `${s.imprisonedComplex} ${formatDistanceToNow(this.Prison.Time, {
					locale: getLocaleFromLanguage(lang),
					includeSeconds: true,
				})}`,
				EmoteId: EmoteId.Prison,
			};
		}
		else if (this.BeatUp.IsBeingBeatUpById) {
			const user = await Users.findByPk(this.BeatUp.IsBeingBeatUpById, { attributes: ["id", "nickname"] });
			this.Situation = {
				Id: SituationId.BeatUp,
				Simple: s.beingBeatedUpSimple,
				SimpleEmote: `${EmoteString.Beat} ${s.beingBeatedUpSimple}`,
				Complex: `${EmoteString.Beat} ${s.beingBeatedUpComplex} ${user?.nickname ?? "Unknown"}`,
				ComplexUI: `${s.beingBeatedUpComplex} ${user?.nickname ?? "Unknown"}`,
				EmoteId: EmoteId.Beat,
			};
		}
		else if (this.BeatUp.IsBeatingId) {
			const user = await Users.findByPk(this.BeatUp.IsBeatingId, { attributes: ["id", "nickname"] });
			this.Situation = {
				Id: SituationId.BeatUp,
				Simple: s.beating,
				SimpleEmote: `${EmoteString.Beat} ${s.beating}`,
				Complex: `${EmoteString.Beat} ${s.beating} ${user?.nickname ?? "Unknown"}`,
				ComplexUI: `${s.beating} ${user?.nickname ?? "Unknown"}`,
				EmoteId: EmoteId.Beat,
			};
		}
		else if (this.IsDefendingInvestment()) {
			this.Situation = {
				Id: SituationId.DefendingInvestment,
				Simple: s.defendingInvestmentSimple,
				SimpleEmote: `${EmoteString.InvestmentActive} ${s.defendingInvestmentSimple}`,
				Complex: `${EmoteString.InvestmentActive} ${s.defendingInvestmentComplex}`,
				ComplexUI: s.defendingInvestmentComplex,
				EmoteId: EmoteId.InvestmentActive,
			};
		}
		else if (this.IsParticipatingInGangAction()) {
			this.Situation = {
				Id: SituationId.GangAction,
				Simple: s.gangActionSimple,
				SimpleEmote: `${EmoteString.Gang} ${s.gangActionSimple}`,
				Complex: `${EmoteString.Gang} ${s.gangActionComplex}`,
				ComplexUI: s.gangActionComplex,
				EmoteId: EmoteId.Gang,
			};
		}
		else if (this.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.Robbery.IsBeingRobbedById, { attributes: ["id", "nickname"] });
			this.Situation = {
				Id: SituationId.Robbery,
				Simple: s.beingRobbedSimple,
				SimpleEmote: `${EmoteString.Robbery} ${s.beingRobbedSimple}`,
				Complex: `${EmoteString.Robbery} ${s.beingRobbedComplex} ${user?.nickname ?? "Unknown"}`,
				ComplexUI: `${s.beingRobbedComplex} ${user?.nickname ?? "Unknown"}`,
				EmoteId: EmoteId.Robbery,
			};
		}
		else if (this.Robbery.IsRobbingLocationId != null) {
			const location = LocationList[this.Robbery.IsRobbingLocationId];
			this.Situation = {
				Id: SituationId.Robbery,
				Simple: s.robbing,
				SimpleEmote: `${EmoteString.Robbery} ${s.robbing}`,
				Complex: `${EmoteString.Robbery} ${s.robbing} ${location.Name[lang]}`,
				ComplexUI: `${s.robbing} ${location.Name[lang]}`,
				EmoteId: EmoteId.Robbery,
			};
		}
		else if (this.Robbery.IsRobbingId) {
			const user = await Users.findByPk(this.Robbery.IsRobbingId, { attributes: ["id", "nickname"] });
			this.Situation = {
				Id: SituationId.Robbery,
				Simple: s.robbing,
				SimpleEmote: `${EmoteString.Robbery} ${s.robbing}`,
				Complex: `${EmoteString.Robbery} ${s.robbing} ${user?.nickname ?? "Unknown"}`,
				ComplexUI: `${s.robbing} ${user?.nickname ?? "Unknown"}`,
				EmoteId: EmoteId.Robbery,
			};
		}
		else if (this.Job.Id != null) {
			this.Situation = {
				Id: SituationId.Job,
				Simple: s.workingSimple,
				SimpleEmote: `${EmoteString.Jobs} ${s.workingSimple}`,
				Complex: `${EmoteString.Jobs} ${s.workingComplex(JobList[this.Job.Id].Description[lang], this.Job.EndsIn)}`,
				ComplexUI: s.workingComplexUI(JobList[this.Job.Id].Description[lang], this.Job.EndsIn),
				EmoteId: EmoteId.Jobs,
			};
		}

		else if (this.IsInCasinoGame()) {
			this.Situation = {
				Id: SituationId.Casino,
				Simple: s.casinoSimple,
				SimpleEmote: `${EmoteString.Casino} ${s.casinoSimple}`,
				Complex: `${EmoteString.Casino} ${s.casinoSimple}`,
				ComplexUI: s.casinoSimple,
				EmoteId: EmoteId.Casino,
			};
		}

		if (this.IsWanted()) {
			this.Situation = {
				Id: SituationId.Wanted,
				Simple: this.Situation.Simple + ` ${s.wantedSimple}`,
				SimpleEmote: this.Situation.SimpleEmote + ` ${s.wantedSimpleEmote}`,
				Complex: this.Situation.Complex + ` ${s.wantedComplex} ${showTime(this.Wanted.Time.getTime())}`,
				ComplexUI: this.Situation.ComplexUI + `${s.wantedComplexUI} ${formatDistanceToNow(this.Wanted.Time, {
					locale: getLocaleFromLanguage(lang),
					includeSeconds: true,
				})}`,
				EmoteId: this.Situation.EmoteId,
			};
		}
	}

	/**
	 * Check if the user is not doing any action
	 * Note: "Wanted" does not affect Idling
	 */
	IsIdling() {
		return !this.IsWorking() &&
			!this.IsInPrison() &&
			!this.IsInHospital() &&
			!this.IsScavenging() &&
			!this.IsInCasinoGame() &&
			!this.IsInRobbery() &&
			!this.IsInBeatUp() &&
			!this.IsDefendingInvestment() &&
			!this.IsParticipatingInGangAction();
	}

	/**
	 * Checks if the user is working.
	 */
	IsWorking() {
		return this.Job.Id != null;
	}

	/**
	 * Checks if the user is in prison.
	 */
	IsInPrison() {
		return this.Prison.Time > new Date();
	}

	/**
	 * Checks if the user is wanted.
	 */
	IsWanted() {
		return this.Wanted.Time > new Date();
	}

	/**
	 * Checks if the user is escaping.
	 */
	IsEscaping() {
		return this.Escape.Time > new Date();
	}

	/**
	 * Checks if the user is in hospital.
	 */
	IsInHospital() {
		return this.Hospital.Time > new Date();
	}

	/**
	 * Checks if the user is scavenging.
	 */
	IsScavenging() {
		return this.Scavenge.IsScavengingId != null;
	}

	/**
	 * Checks if the user is in a robbery situation.
	 */
	IsInRobbery() {
		return this.Robbery.IsRobbingId != null || this.Robbery.IsRobbingLocationId != null || this.Robbery.IsBeingRobbedById != null;
	}

	/**
	 * Checks if the user is defending an investment.
	 */
	IsDefendingInvestment() {
		return this.Robbery.InvestmentIsDefending;
	}

	/**
	 * Checks if the user is participating in a gang action.
	 */
	IsParticipatingInGangAction() {
		return this.Robbery.ParticipatingInGangAction;
	}

	/**
	 * Checks if the user is in a beat-up situation.
	 */
	IsInBeatUp() {
		return this.BeatUp.IsBeatingId != null || this.BeatUp.IsBeingBeatUpById != null;
	}

	/**
	 * Checks if the user is in a Casino game
	 */
	IsInCasinoGame() {
		return this.Casino.IsInGame;
	}

	/**
	 * Starts a job for the user.
	 * @param jobId The job Id.
	 */
	async StartJob(jobId: JobId) {
		const job = JobList[jobId];
		const eventActiveValue = await Event.GetActiveFromType(EventType.JOB_TIME_MULTIPLIER);
		const jobDuration = job.Duration * eventActiveValue;
		this.Job.Id = jobId;
		this.Job.EndsIn = addHours(new Date(), jobDuration);

		await Notification.Job(this);
		await this.Update({
			jobId: this.Job.Id,
			jobTime: this.Job.EndsIn,
		});
		Log.Info(`User ${this.Nickname} (Id: ${this.Id}) started job ${job.Description[Language.English]} (Id: ${jobId}), will finish in ${formatDate(this.Job.EndsIn, Language.English)}.`);
	}

	/**
	 * Cancels the current job.
	 */
	async CancelJob() {
		if (this.Job.Id === null) {
			return;
		}
		const job = JobList[this.Job.Id];
		this.Job.Id = null;

		await Promise.all([
			Notification.Dismiss(this.Id, NotificationType.Job),
			this.Update({
				jobId: this.Job.Id,
			}),
		]);
		Log.Info(`User ${this.Nickname} (Id: ${this.Id}) canceled his job ${job.Description[this.Language]} (Id: ${job.Id}).`);
	}

	/**
	 * Ends the current job and gives the reward.
	 */
	async EndJob() {
		if (this.Job.Id === null) {
			return;
		}
		const job = JobList[this.Job.Id];
		const userClassModifier = getJobClassModifier(this.Class);
		const salary = Math.round(job.Salary * userClassModifier);
		this.Money += salary;
		this.Job.Id = null;
		this.Job.ReceivedCount += 1;
		this.Job.ReceivedSum += salary;

		await this.Update({
			money: this.Money,
			jobId: this.Job.Id,
			jobReceivedCount: this.Job.ReceivedCount,
			jobReceivedSum: this.Job.ReceivedSum,
		});
		Log.Success(`User ${this.Nickname} (Id: ${this.Id}) finished his job ${job.Description[this.Language]} (Id: ${job.Id}) and received ${formatMoney(salary, Language.English)}.`);
	}

	/**
	 * Buys a skin bundle.
	 * @param bundleId The bundle Id.
	 * @returns True if successful.
	 */
	async BuySkinBundle(bundleId: BundleId) {
		const success = await UserBundle.Create(this.Id, bundleId);

		if (success) {
			this.SpecialCoin -= BundleList[bundleId].Price;
			await this.Update({
				specialCoin: this.SpecialCoin,
			});
			Log.Success(`User ${this.Nickname} (Id: ${this.Id}) bought skin bundle ${BundleList[bundleId].Description[Language.English]} (Id: ${bundleId}) for ${formatMoney(BundleList[bundleId].Price, Language.English, "")}.`);
		}
		else {
			Log.Warning(`User ${this.Nickname} (Id: ${this.Id}) tried to buy skin bundle ${BundleList[bundleId].Description[Language.English]} (Id: ${bundleId}), but failed.`);
		}

		return success;
	}

	/**
	 * Buys an avatar decoration.
	 * @param avatarDecorationId The avatar decoration Id.
	 * @returns True if successful.
	 */
	async BuyAvatarDecoration(avatarDecorationId: AvatarDecorationId) {
		const success = await UserAvatarDecoration.Create(this.Id, avatarDecorationId);

		if (success) {
			this.SpecialCoin -= AvatarDecorationList[avatarDecorationId].Price;
			await this.Update({
				specialCoin: this.SpecialCoin,
			});
			Log.Success(`User ${this.Nickname} (Id: ${this.Id}) bought avatar decoration ${AvatarDecorationList[avatarDecorationId].Description[Language.English]} (Id: ${avatarDecorationId}) for ${formatMoney(AvatarDecorationList[avatarDecorationId].Price, Language.English, "")}.`);
		}
		else {
			Log.Warning(`User ${this.Nickname} (Id: ${this.Id}) tried to buy avatar decoration ${AvatarDecorationList[avatarDecorationId].Description[Language.English]} (Id: ${avatarDecorationId}), but failed.`);
		}

		return success;
	}

	/**
	 * Buys a background decoration.
	 * @param backgroundDecorationId The background decoration Id.
	 * @returns True if successful.
	 */
	async BuyBackgroundDecoration(backgroundDecorationId: BackgroundDecorationId) {
		const success = await UserBackgroundDecoration.Create(this.Id, backgroundDecorationId);

		if (success) {
			this.SpecialCoin -= BackgroundDecorationList[backgroundDecorationId].Price;
			await this.Update({
				specialCoin: this.SpecialCoin,
			});
			Log.Success(`User ${this.Nickname} (Id: ${this.Id}) bought background decoration ${BackgroundDecorationList[backgroundDecorationId].Description[Language.English]} (Id: ${backgroundDecorationId}) for ${formatMoney(BackgroundDecorationList[backgroundDecorationId].Price, Language.English, "")}.`);
		}
		else {
			Log.Warning(`User ${this.Nickname} (Id: ${this.Id}) tried to buy background decoration ${BackgroundDecorationList[backgroundDecorationId].Description[Language.English]} (Id: ${backgroundDecorationId}), but failed.`);
		}

		return success;
	}

	/**
	 * Sets the user's background decoration.
	 * @param decoration The background decoration.
	 */
	async SetBackgroundDecoration(decoration: BackgroundDecorations) {
		this.BackgroundDecoration = decoration;
		await this.Update({
			backgroundDecoration: decoration.Id,
		});
		Log.Success(`User ${this.Nickname} (Id: ${this.Id}) changed background decoration to ${decoration.Description[Language.English]}.`);
	}

	/**
	 * Updates the user in the database.
	 */
	async Update(values: { [key in keyof InferAttributes<Users>]?: InferAttributes<Users>[key] | Fn | Col | Literal }) {
		try {
			await Users.update(values, {
				where: { id: this.Id },
			});
		}
		catch (err) {
			Log.Warning(`Something went wrong with updating user Id: ${this.Id}.`);
		}
	}

	/**
	 * Updates the user's language.
	 * @param language The new language.
	 */
	async UpdateLanguage(language: Language) {
		try {
			await this.Update({
				language: language,
			});
			this.Language = language;
		}
		catch (err) {
			Log.Warning(`Something went wrong with updating language for user Id: ${this.Id}.`);
		}
	}

	// ==========================
	// Métodos relacionados a gangues
	// ==========================

	/**
	 * Checks if the user is in a gang.
	 */
	IsInGang() {
		return this.GangId !== null;
	}

	/**
	 * Gets the user's gang.
	 * @returns The gang or null if not in one.
	 */
	async GetGang(): Promise<Gang | null> {
		if (!this.IsInGang()) {
			return null;
		}

		return await Gang.GetById(this.GangId!);
	}

	/**
	 * Creates a new gang.
	 * @param name Gang name.
	 * @param acronym Gang acronym.
	 * @param description Gang description.
	 * @param color Gang color.
	 * @param image Gang image URL.
	 * @returns The created gang or null if failed.
	 */
	async CreateGang(name: string, acronym: string, description: string, color: GangColorId, image: string | null = null): Promise<Gang | null> {
		if (this.IsInGang()) {
			Log.Warning(`User ${this.Nickname} (Id: ${this.Id}) tried to create a gang, but already is in one.`);
			return null;
		}

		if (this.Money < Gang.CREATION_COST) {
			Log.Warning(`User ${this.Nickname} (Id: ${this.Id}) tried to create a gang, but doesn't have money (user: ${formatMoney(this.Money, Language.English)} / cost: ${formatMoney(Gang.CREATION_COST, Language.English)}).`);
			return null;
		}

		const gang = await Gang.Create(this, name, acronym, description, color, image);

		if (gang) {
			this.GangId = gang.Id;
		}

		return gang;
	}

	/**
	 * Leaves the current gang.
	 * @returns True if successful.
	 */
	async LeaveGang(): Promise<boolean> {
		if (!this.IsInGang()) {
			return false;
		}

		const gang = await Gang.GetById(this.GangId!);

		if (!gang) {
			// Situação estranha onde o usuário tem um Id de gangue, mas a gangue não existe
			// Vamos limpar o GangId para corrigir a inconsistência
			this.GangId = null;
			// No need to update Users table as GangId is not stored there
			return true;
		}

		// Se o usuário for o líder, ele não pode sair sem transferir a liderança
		if (this.Id === gang.LeaderId) {
			Log.Warning(`User ${this.Nickname} (Id: ${this.Id}) tried to leave gang ${gang.Name} (Id: ${gang.Id}), but is the leader.`);
			return false;
		}

		const success = await gang.LeaveGang(this);

		if (success) {
			this.GangId = null;
			Log.Success(`User ${this.Nickname} (Id: ${this.Id}) left gang ${gang.Name} (Id: ${gang.Id}).`);
		}

		return success;
	}

	/**
	 * Searches for a user by name or Id.
	 * @param nameOrId The name or Id to search for.
	 * @param language Optional language.
	 * @returns The User instance or null if not found.
	 */
	static async Search(nameOrId: string, language?: Language): Promise<User | null> {
		const user = await Users.findOne({
			where: {
				[Op.or]: {
					nickname: {
						[Op.like]: nameOrId,
					},
					id: nameOrId,
				},
			},
		});

		if (!user) {
			return null;
		}

		return await new User(user.id).GetInfo(user, language);
	}
}

const Strings = {
	[Language.English]: {
		idling: "Idling",
		workingSimple: "Working",
		workingComplex: (description: string, jobTime: Date) => `Working as ${description}. Will finish ${showTime(jobTime.getTime(), true)}`,
		workingComplexUI: (description: string, jobTime: Date) => `Working as ${description} until ${formatDate(jobTime, Language.English)}`,
		robbing: "Robbing",
		beingRobbedSimple: "Being robbed",
		beingRobbedComplex: "Being robbed by",
		defendingInvestmentSimple: "Defending investment",
		defendingInvestmentComplex: "Defending investment",
		beating: "Beating",
		beingBeatedUpSimple: "Being beaten up",
		beingBeatedUpComplex: "Being beaten up by",
		imprisonedSimple: "Imprisoned",
		imprisonedComplex: "Imprisoned until",
		imprisonedAndHospitalSimple: "Imprisoned and Hospitalized",
		imprisonedAndHospitalSimpleEmote: `${EmoteString.Prison} Imprisoned and ${EmoteString.Hospital} Hospitalized`,
		imprisonedAndHospitalComplex: (prisonTime: Date, hospitalTime: Date) => `${EmoteString.Prison} Imprisoned until ${showTime(prisonTime.getTime())} and ${EmoteString.Hospital} Hospitalized until ${showTime(hospitalTime.getTime())}`,
		imprisonedAndHospitalComplexUI: (prisonTime: Date, hospitalTime: Date) => `Imprisoned until ${formatDate(prisonTime, Language.English)} and Hospitalized until ${formatDate(hospitalTime, Language.English)}`,
		scavenging: `Scavenging`,
		casinoSimple: `Playing in Casino`,
		wantedSimple: "and Wanted",
		wantedSimpleEmote: `and ${EmoteString.Police} Wanted`,
		wantedComplex: `and ${EmoteString.Police} Wanted until`,
		wantedComplexUI: `and Wanted until`,
		hospitalSimple: "Hospitalized",
		hospitalComplex: `Hospitalized until`,
		gangActionSimple: "Participating in gang action",
		gangActionComplex: "Participating in gang action",
	},
	[Language.Portuguese]: {
		idling: "Vadiando",
		workingSimple: "Trabalhando",
		workingComplex: (description: string, jobTime: Date) => `Trabalhando como ${description}. Terminará ${showTime(jobTime.getTime(), true)}`,
		workingComplexUI: (description: string, jobTime: Date) => `Trabalhando como ${description} até ${formatDate(jobTime, Language.Portuguese)}`,
		robbing: "Roubando",
		beingRobbedSimple: "Sendo roubado",
		beingRobbedComplex: "Sendo roubado por",
		defendingInvestmentSimple: "Defending investimento",
		defendingInvestmentComplex: "Defendendo investimento",
		beating: "Espancando",
		beingBeatedUpSimple: "Sendo espancado",
		beingBeatedUpComplex: "Sendo espancado por",
		imprisonedSimple: "Preso",
		imprisonedComplex: "Preso até",
		imprisonedAndHospitalSimple: "Preso e Hospitalizado",
		imprisonedAndHospitalSimpleEmote: `${EmoteString.Prison} Preso e ${EmoteString.Hospital} Hospitalizado`,
		imprisonedAndHospitalComplex: (prisonTime: Date, hospitalTime: Date) => `${EmoteString.Prison} Preso até ${showTime(prisonTime.getTime())} e ${EmoteString.Hospital} Hospitalizado até ${showTime(hospitalTime.getTime())}`,
		imprisonedAndHospitalComplexUI: (prisonTime: Date, hospitalTime: Date) => `Preso até ${formatDate(prisonTime, Language.Portuguese)} e Hospitalizado até ${formatDate(hospitalTime, Language.Portuguese)}`,
		scavenging: "Vasculhando",
		casinoSimple: `Jogando no Cassino`,
		wantedSimple: "e Procurado",
		wantedSimpleEmote: `e ${EmoteString.Police} Procurado`,
		wantedComplex: `e ${EmoteString.Police} Procurado até`,
		wantedComplexUI: `e Procurado até`,
		hospitalSimple: "Hospitalizado",
		hospitalComplex: `Hospitalizado até`,
		gangActionSimple: "Participando de ação em gangue",
		gangActionComplex: "Participando de ação em gangue",
	},
	[Language.Spanish]: {
		idling: "Vagando",
		workingSimple: "",
		workingComplex: (description: string, jobTime: Date) => `Trabajando como ${description}. Terminará ${showTime(jobTime.getTime(), true)}`,
		workingComplexUI: (description: string, jobTime: Date) => `Trabajando como ${description} hasta ${formatDate(jobTime, Language.Spanish)}`,
		robbing: "Robando",
		beingRobbedSimple: "Siendo robado",
		beingRobbedComplex: "Siendo robado por",
		defendingInvestmentSimple: "Defendiendo inversión",
		defendingInvestmentComplex: "Defendiendo inversión",
		beating: "Golpeando",
		beingBeatedUpSimple: "Siendo golpeado",
		beingBeatedUpComplex: "Siendo golpeado por",
		imprisonedSimple: "Preso",
		imprisonedAndHospitalSimple: "Preso y Hospitalizado",
		imprisonedAndHospitalSimpleEmote: `${EmoteString.Prison} Preso y ${EmoteString.Hospital} Hospitalizado`,
		imprisonedAndHospitalComplex: (prisonTime: Date, hospitalTime: Date) => `${EmoteString.Prison} Preso hasta ${showTime(prisonTime.getTime())} y ${EmoteString.Hospital} Hospitalizado hasta ${showTime(hospitalTime.getTime())}`,
		imprisonedAndHospitalComplexUI: (prisonTime: Date, hospitalTime: Date) => `Preso hasta ${formatDate(prisonTime, Language.Spanish)} y Hospitalizado hasta ${formatDate(hospitalTime, Language.Spanish)}`,
		imprisonedComplex: "Preso hasta",
		scavenging: "Buscando",
		casinoSimple: `Jugando en Casino`,
		wantedSimple: "y Buscado",
		wantedSimpleEmote: `y ${EmoteString.Police} Buscado`,
		wantedComplex: `y ${EmoteString.Police} Buscado hasta`,
		wantedComplexUI: `y Buscado hasta`,
		hospitalSimple: "Hospitalizado",
		hospitalComplex: `Hospitalizado hasta`,
		gangActionSimple: "Participando en acción de pandilla",
		gangActionComplex: "Participando en acción de pandilla",
	},
} as const satisfies Localization;