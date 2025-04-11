import { Users } from "../database/Users";
import { Log } from "../utils/log";
import { addDays, differenceInHours, formatDistanceToNow } from "date-fns";
import { getLocaleFromLanguage, Language } from "./Language";
import { UserItems } from "../database/UserItems";
import { addHours } from "date-fns/addHours";
import { Op } from "sequelize";
import { Items, ItemList, ItemType, UserItem } from "../interfaces/Items";
import { JobId, JobList } from "../interfaces/Jobs";
import { Notification, NotificationType } from "./Notification";
import { formatDate, formatMoney, showTime } from "../utils/ui";
import { EmoteString } from "../utils/emotes";
import { ClassId, ClassList } from "../interfaces/Classes";
import { LocationId, LocationList } from "../interfaces/Locations";
import { ScavengeId, ScavengeList } from "../interfaces/Scavenge";

export enum SituationId {
	Idling,
	Job,
	Robbery,
	PrisonAndHospital,
	Prison,
	Hospital,
	Scavenging,
	Wanted,
}

export class User {
	Id: string;
	CreatedAt = new Date();
	UpdatedAt = new Date();
	VipTime: Date | null = null;
	VipEternal = false;
	Language: Language;
	Nickname = "";
	Money = 0;
	Class = ClassId.None;
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
	};
	BestGun: Items | null = null;
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
			Items: 0,
			MoneyCount: 0,
			MoneySum: 0,
			Failures: 0,
			FailureWithHospital: 0,
			FailureWithPrison: 0,
		},
	};

	constructor(id: string, language: Language = Language.English) {
		this.Id = id;
		this.Language = language;
	}

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
				scavengeFoundItems: 0,
				scavengeMoneyCount: 0,
				scavengeMoneySum: 0,
				scavengeFailures: 0,
				scavengeFailureWithHospital: 0,
				scavengeFailureWithPrison: 0,
			});
			Log.Success(`User ${this.Id} created.`);

		}
		catch (err) {
			//
		}
	}

	async GetInfo() {

		const user = await Users.findOne({
			where: {
				id: this.Id,
			},
		});

		if (!user) {
			return;
		}

		this.Id = user.id;
		this.CreatedAt = user.createdAt;
		this.UpdatedAt = user.updatedAt;
		this.VipTime = user.vipTime;
		this.VipEternal = user.vipEternal;
		this.Nickname = user.nickname;
		this.Money = user.money;
		this.Class = user.class;
		this.Language = user.language;

		// Jobs
		this.Job.Id = user.jobId;
		this.Job.EndsIn = new Date(user.jobTime);
		this.Job.ReceivedCount = user.jobReceivedCount;
		this.Job.ReceivedSum = user.jobReceivedSum;

		// Daily
		this.Daily.CurrentStreak = user.dailyStreak;
		this.Daily.MaxStreak = user.maxDailyStreak;
		this.Daily.LastReceived = user.lastDailyReceived;
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
		this.Scavenge.Found.Items = user.scavengeFoundItems;
		this.Scavenge.Found.MoneyCount = user.scavengeMoneyCount;
		this.Scavenge.Found.MoneySum = user.scavengeMoneySum;
		this.Scavenge.Found.Failures = user.scavengeFailures;
		this.Scavenge.Found.FailureWithHospital = user.scavengeFailureWithHospital;
		this.Scavenge.Found.FailureWithPrison = user.scavengeFailureWithPrison;

		await this.GetAttributes();
		await this.GetSituation();

		return this;
	}

	async SetNickname(nickname: string) {
		const oldNickname = this.Nickname;
		this.Nickname = nickname;
		await this.Update();
		Log.Success(`User ${oldNickname} (ID: ${this.Id}) changed nickname to ${nickname}.`);
	}

	async SetClass(classId: ClassId) {
		const oldClass = this.Class;
		this.Class = classId;
		await this.Update();
		Log.Success(`User ${this.Nickname} (ID: ${this.Id}) changed class from ${ClassList[oldClass].Description[Language.English]} to ${ClassList[classId].Description[Language.English]}.`);
	}

	GetClassText() {
		return ClassList[this.Class].Description[this.Language];
	}

	GetNameWithImage() {
		return `${ClassList[this.Class].Image.Emote.String} ${this.Nickname}`;
	}

	IsVip() {
		if (this.VipEternal) {
			return true;
		}

		if (this.VipTime == null) {
			return false;
		}

		return this.VipTime > new Date();
	}

	async AddVip(days: number) {
		if (this.VipTime == null || this.VipTime < new Date()) {
			this.VipTime = new Date();
		}

		this.VipTime = addDays(this.VipTime, days);

		await this.Update();
		Log.Success(`User ${this.Nickname} (ID: ${this.Id}) received ${days} days of VIP.`);
	}

	async SetEternalVip() {
		this.VipEternal = !this.VipEternal;

		await this.Update();
		Log.Success(`User ${this.Nickname} (ID: ${this.Id}) ${this.VipEternal ? "is now" : "is not anymore"} a eternal VIP.`);
	}

	CanReceiveDaily() {
		const today = new Date();

		return this.Daily.LastReceived == null || differenceInHours(today, this.Daily.LastReceived) > 23;
	}

	async ReceiveDaily() {
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

		if (this.IsVip()) {
			baseValue *= 1.5;
		}

		const money = baseValue * streakMultiplier;

		this.Money += money;

		await this.Update();
		Log.Success(`User ${this.Nickname} (ID: ${this.Id}) received ${formatMoney(money, Language.English)} from daily. Streak: ${this.Daily.CurrentStreak}.`);

		await Notification.Daily(this);

		return money;
	}

	async BuyItem(item: Items) {
		this.Money -= item.Price;

		const existingItem = await UserItems.findOne({
			where: {
				userId: this.Id,
				itemId: item.Id,
			},
		});

		const now = new Date();
		const userItem = ItemList[item.Id] as UserItem;

		if (!existingItem) {
			await UserItems.create({
				userId: this.Id,
				itemId: item.Id,
				remainingTime: userItem.Type != ItemType.Consumable ? addHours(now, 72) : undefined,
				quantity: userItem.Type == ItemType.Consumable ? 1 : undefined,
			});

			Log.Info(`User ${this.Nickname} (ID: ${this.Id}) bought item ${item.Description[Language.English]} (ID: ${item.Id}) for ${formatMoney(item.Price, Language.English)} [FIRST TIME!].`);
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

			Log.Info(`User ${this.Nickname} (ID: ${this.Id}) bought item ${item.Description[Language.English]} (ID: ${item.Id}) for ${formatMoney(item.Price, Language.English)}. Total time: ${differenceInHours(remaining, new Date())}h.`);
		}

		this.Shop.SpentCount += 1;
		this.Shop.SpentSum += item.Price;

		await this.Update();
		return true;
	}

	async GetItems() {
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

		const itemList: UserItem[] = [];

		for (const item of items) {
			const foundWeapon = ItemList[item.itemId] as UserItem;
			foundWeapon.RemainingTime = item.remainingTime;
			foundWeapon.Quantity = item.quantity;

			itemList.push(foundWeapon);
		}

		return itemList;
	}

	async GetAttributes() {
		const items = await UserItems.findAll({
			where: {
				userId: this.Id,
				remainingTime: {
					[Op.gt]: new Date(),
				},
			},
		});

		this.Attributes.Attack = 0;
		this.Attributes.Defense = 0;
		this.Attributes.MoneyAttack = 0;
		this.Attributes.MoneyDefense = 0;

		let moreATK = 0;
		let moreDEF = 0;
		let moreMoneyATK = 0;
		let moreMoneyDEF = 0;

		const hour = new Date().getHours();
		const isDay = hour >= 6 && hour < 18;
		const isNight = !isDay;

		for (const item of items) {
			const foundItem = ItemList[item.itemId];

			this.BestGun = (this.BestGun?.Attack ?? 0) > foundItem.Attack ? this.BestGun : foundItem;

			this.Attributes.Attack = Math.max(this.Attributes.Attack, foundItem.Attack);
			this.Attributes.Defense = Math.max(this.Attributes.Defense, foundItem.Defense);
			this.Attributes.MoneyAttack = Math.max(this.Attributes.MoneyAttack, foundItem.MoneyAttack);
			this.Attributes.MoneyDefense = Math.max(this.Attributes.MoneyDefense, foundItem.MoneyDefense);

			if ((foundItem.Special.Day && isDay) || (foundItem.Special.Night && isNight) || (!foundItem.Special.Night && !foundItem.Special.Day)) {
				moreATK += foundItem.MoreAttack;
				moreDEF += foundItem.MoreDefense;
				moreMoneyATK += foundItem.MoreMoneyATK;
				moreMoneyDEF += foundItem.MoreMoneyDEF;
			}
		}

		this.Attributes.Attack += moreATK;
		this.Attributes.Defense += moreDEF;
		this.Attributes.MoneyAttack += moreMoneyATK;
		this.Attributes.MoneyDefense += moreMoneyDEF;

		if (this.IsInHospital()) {
			this.Attributes.Defense -= 5;
		}
	}

	async GetSituation() {
		const s = Strings[this.Language];
		this.Situation.Simple = s.idling;
		this.Situation.SimpleEmote = `${EmoteString.Idle} ${this.Situation.Simple}`;
		this.Situation.Complex = `${EmoteString.Idle} ${s.idling}`;
		this.Situation.ComplexUI = this.Situation.Simple;

		if (this.Job.Id !== null) {
			this.Situation = {
				Id: SituationId.Job,
				Simple: s.workingSimple,
				SimpleEmote: `${EmoteString.Jobs} ${this.Situation.Simple}`,
				Complex: `${EmoteString.Jobs} ${s.workingComplex(JobList[this.Job.Id].Description[this.Language], this.Job.EndsIn)}`,
				ComplexUI: s.workingComplexUI(JobList[this.Job.Id].Description[this.Language], this.Job.EndsIn),
			};
		}
		if (this.Robbery.IsRobbingId) {
			const user = await Users.findByPk(this.Robbery.IsRobbingId, { attributes: ["id", "nickname"] });
			this.Situation = {
				Id: SituationId.Robbery,
				Simple: s.robbing,
				SimpleEmote: `${EmoteString.Robbery} ${this.Situation.Simple}`,
				Complex: `${EmoteString.Robbery} ${s.robbing} ${user!.nickname}`,
				ComplexUI: `${s.robbing} ${user!.nickname}`,
			};
		}
		if (this.Robbery.IsRobbingLocationId) {
			const location = LocationList[this.Robbery.IsRobbingLocationId];
			this.Situation = {
				Id: SituationId.Robbery,
				Simple: s.robbing,
				SimpleEmote: `${EmoteString.Robbery} ${this.Situation.Simple}`,
				Complex: `${EmoteString.Robbery} ${s.robbing} ${location.Description[this.Language]}`,
				ComplexUI: `${s.robbing} ${location.Description[this.Language]}`,
			};
		}
		if (this.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.Robbery.IsBeingRobbedById, { attributes: ["id", "nickname"] });
			this.Situation = {
				Id: SituationId.Robbery,
				Simple: s.beingRobbedSimple,
				SimpleEmote: `${EmoteString.Robbery} ${this.Situation.Simple}`,
				Complex: `${EmoteString.Robbery} ${s.beingRobbedComplex} ${user!.nickname}`,
				ComplexUI: `${s.beingRobbedComplex} ${user!.nickname}`,
			};
		}
		if (this.IsInPrison()) {
			this.Situation = {
				Id: SituationId.Prison,
				Simple: s.imprisonedSimple,
				SimpleEmote: `${EmoteString.Prison} ${s.imprisonedSimple}`,
				Complex: `${EmoteString.Prison} ${s.imprisonedComplex} ${showTime(this.Prison.Time.getTime())}`,
				ComplexUI: `${s.imprisonedComplex} ${formatDistanceToNow(this.Prison.Time, { locale: getLocaleFromLanguage(this.Language), includeSeconds: true })}`,
			};
		}
		if (this.IsInHospital()) {
			this.Situation = {
				Id: SituationId.Hospital,
				Simple: s.hospitalSimple,
				SimpleEmote: `${EmoteString.Hospital} ${s.hospitalSimple}`,
				Complex: `${EmoteString.Hospital} ${s.hospitalComplex} ${showTime(this.Hospital.Time.getTime())}`,
				ComplexUI: `${s.hospitalComplex} ${formatDistanceToNow(this.Hospital.Time, { locale: getLocaleFromLanguage(this.Language), includeSeconds: true })}`,
			};
		}
		if (this.IsInPrison() && this.IsInHospital()) {
			this.Situation = {
				Id: SituationId.PrisonAndHospital,
				Simple: s.imprisonedAndHospitalSimple,
				SimpleEmote: s.imprisonedAndHospitalSimpleEmote,
				Complex: s.imprisonedAndHospitalComplex(this.Prison.Time, this.Hospital.Time),
				ComplexUI: s.imprisonedAndHospitalComplexUI(this.Prison.Time, this.Hospital.Time),
			};
		}
		if (this.IsScavenging()) {
			this.Situation = {
				Id: SituationId.Scavenging,
				Simple: s.scavenging,
				SimpleEmote: `${EmoteString.Scavenge} ${s.scavenging}`,
				Complex: `${EmoteString.Scavenge} ${s.scavenging} ${ScavengeList[this.Scavenge.IsScavengingId!].Emote.String} ${ScavengeList[this.Scavenge.IsScavengingId!].Description[this.Language]}`,
				ComplexUI: `${s.scavenging} ${ScavengeList[this.Scavenge.IsScavengingId!].Description[this.Language]}`,
			};
		}
		if (this.IsWanted()) {
			this.Situation = {
				Id: SituationId.Wanted,
				Simple: this.Situation.Simple + ` ${s.wantedSimple}`,
				SimpleEmote: this.Situation.SimpleEmote + ` ${s.wantedSimpleEmote}`,
				Complex: this.Situation.Complex + ` ${s.wantedComplex} ${showTime(this.Wanted.Time.getTime())}`,
				ComplexUI: this.Situation.ComplexUI + `${s.wantedComplexUI} ${formatDistanceToNow(this.Wanted.Time, { locale: getLocaleFromLanguage(this.Language), includeSeconds: true })}`,
			};
		}
	}

	IsWorking() {
		return this.Job.Id != null;
	}

	IsInPrison() {
		return this.Prison.Time > new Date();
	}

	IsWanted() {
		return this.Wanted.Time > new Date();
	}

	IsEscaping() {
		return this.Escape.Time > new Date();
	}

	IsInHospital() {
		return this.Hospital.Time > new Date();
	}

	IsScavenging() {
		return this.Scavenge.IsScavengingId != null;
	}

	async StartJob(jobId: JobId) {
		const job = JobList[jobId];
		this.Job.Id = jobId;
		this.Job.EndsIn = addHours(new Date(), job.Duration);

		await Notification.Job(this);
		await this.Update();
		Log.Info(`User ${this.Nickname} (ID: ${this.Id}) started job ${job.Description[this.Language]} (ID: ${jobId}), will finish in ${formatDate(this.Job.EndsIn, Language.English)}.`);
	}

	async CancelJob() {
		if (this.Job.Id === null) {
			return;
		}
		const job = JobList[this.Job.Id];
		this.Job.Id = null;

		await Notification.Dismiss(this.Id, NotificationType.Job);
		await this.Update();
		Log.Info(`User ${this.Nickname} (ID: ${this.Id}) canceled his job ${job.Description[this.Language]}.`);
	}

	async EndJob() {
		if (this.Job.Id === null) {
			return;
		}
		const job = JobList[this.Job.Id];
		this.Money += job.Salary;
		this.Job.Id = null;
		this.Job.ReceivedCount += 1;
		this.Job.ReceivedSum += job.Salary;

		await this.Update();
		Log.Success(`User ${this.Nickname} (ID: ${this.Id}) finished his job ${job.Description[this.Language]} and received ${formatMoney(job.Salary, Language.English)}.`);
	}

	async Update() {
		try {
			await Users.update({
				nickname: this.Nickname,
				money: this.Money,
				class: this.Class,

				lastDailyReceived: this.Daily.LastReceived,
				dailyStreak: this.Daily.CurrentStreak,
				maxDailyStreak: this.Daily.MaxStreak,

				vipTime: this.VipTime,
				vipEternal: this.VipEternal,

				jobId: this.Job.Id,
				jobTime: this.Job.EndsIn,
				jobReceivedSum: this.Job.ReceivedSum,
				jobReceivedCount: this.Job.ReceivedCount,

				robberySuccessCount: this.Robbery.SuccessCount,
				robberyFailureCount: this.Robbery.FailureCount,
				robberySuccessRobbedSum: this.Robbery.SuccessRobbedSum,
				robberyBeingRobbedCount: this.Robbery.BeingRobbedCount,
				robberyBeingRobbedSum: this.Robbery.BeingRobbedSum,
				robbingUserId: this.Robbery.IsRobbingId,
				beingRobbedByUserId: this.Robbery.IsBeingRobbedById,
				robbingLocationId: this.Robbery.IsRobbingLocationId,

				beatUpSuccessCount: this.BeatUp.SuccessCount,
				beatUpFailureCount: this.BeatUp.FailureCount,
				beatUpBeatedUpCount: this.BeatUp.BeatedUpCount,
				beatingUserId: this.BeatUp.IsBeatingId,
				beingBeatUpByUserId: this.BeatUp.IsBeingBeatUpById,
				beatUpTime: this.BeatUp.Time,

				prisonCount: this.Prison.Count,
				prisonBriberySum: this.Prison.BriberySum,
				prisonBriberyCount: this.Prison.BriberyCount,
				prisonHasPaidBribe: this.Prison.HasPaidBribe,
				prisonTime: this.Prison.Time,

				escapeCount: this.Escape.Count,
				escapeTime: this.Escape.Time,
				escapeHasTried: this.Escape.HasTried,

				wantedCount: this.Wanted.Count,
				wantedTime: this.Wanted.Time,

				hospitalCount: this.Hospital.Count,
				hospitalTime: this.Hospital.Time,
				hospitalTreatmentCount: this.Hospital.TreatmentCount,
				hospitalTreatmentSum: this.Hospital.TreatmentSum,

				casinoWinCount: this.Casino.WinCount,
				casinoLoseCount: this.Casino.LoseCount,
				casinoWinSum: this.Casino.WinSum,
				casinoLoseSum: this.Casino.LoseSum,

				shopSpentSum: this.Shop.SpentSum,
				shopSpentCount: this.Shop.SpentCount,

				almsGiveTime: this.Alms.GiveTime,
				almsReceiveTime: this.Alms.ReceiveTime,
				almsGivenSum: this.Alms.GivenSum,
				almsGivenCount: this.Alms.GivenCount,
				almsReceivedSum: this.Alms.ReceivedSum,
				almsReceivedCount: this.Alms.ReceivedCount,

				scavengingId: this.Scavenge.IsScavengingId,
				scavengeCount: this.Scavenge.Count,
				scavengeTime: this.Scavenge.Time,
				scavengeFoundItems: this.Scavenge.Found.Items,
				scavengeMoneyCount: this.Scavenge.Found.MoneyCount,
				scavengeMoneySum: this.Scavenge.Found.MoneySum,
				scavengeFailures: this.Scavenge.Found.Failures,
				scavengeFailureWithHospital: this.Scavenge.Found.FailureWithHospital,
				scavengeFailureWithPrison: this.Scavenge.Found.FailureWithPrison,

				updatedAt: this.UpdatedAt,
			}, {
				where: { id: this.Id },
			});
		}
		catch (err) {
			Log.Warning(`Something went wrong with updating user Id: ${this.Id}.`);
		}
	}

	async UpdateLanguage(language: Language) {
		try {
			await Users.update({
				language: language,
				updatedAt: this.UpdatedAt,
			}, {
				where: { id: this.Id },
			});
			this.Language = language;
		}
		catch (err) {
			Log.Warning(`Something went wrong with updating language for user Id: ${this.Id}.`);
		}
	}
}

const Strings = {
	[Language.English]: {
		idling: "Idling",
		workingSimple: "Working",
		workingComplex: (description: string, jobTime: Date) => `Working as ${description}. Will finish ${showTime(jobTime.getTime(), true)}`,
		workingComplexUI: (description: string, jobTime: Date) => `Working as ${description}. Will finish in ${formatDistanceToNow(jobTime, { locale: getLocaleFromLanguage(Language.English), includeSeconds: true })}`,
		robbing: "Robbing",
		beingRobbedSimple: "Being robbed",
		beingRobbedComplex: "Being robbed by",
		imprisonedSimple: "Imprisoned",
		imprisonedComplex: "Imprisoned until",
		imprisonedAndHospitalSimple: "Imprisoned and Hospitalized",
		imprisonedAndHospitalSimpleEmote: `${EmoteString.Prison} Imprisoned and ${EmoteString.Hospital} Hospitalized`,
		imprisonedAndHospitalComplex: (prisonTime: Date, hospitalTime: Date) => `${EmoteString.Prison} Imprisoned until ${showTime(prisonTime.getTime())} and ${EmoteString.Hospital} Hospitalized until ${showTime(hospitalTime.getTime())}`,
		imprisonedAndHospitalComplexUI: (prisonTime: Date, hospitalTime: Date) => `Imprisoned until ${formatDate(prisonTime, Language.English)} and Hospitalized until ${formatDate(hospitalTime, Language.English)}`,
		scavenging: `Scavenging`,
		wantedSimple: "and Wanted",
		wantedSimpleEmote: `and ${EmoteString.Police} Wanted`,
		wantedComplex: `and ${EmoteString.Police} Wanted until`,
		wantedComplexUI: `and Wanted until`,
		hospitalSimple: "Hospitalized",
		hospitalComplex: `Hospitalized until`,
	},
	[Language.Portuguese]: {
		idling: "Vadiando",
		workingSimple: "Trabalhando",
		workingComplex: (description: string, jobTime: Date) => `Trabalhando como ${description}. Terminará ${showTime(jobTime.getTime(), true)}`,
		workingComplexUI: (description: string, jobTime: Date) => `Trabalhando como ${description}. Terminará em ${formatDistanceToNow(jobTime, { locale: getLocaleFromLanguage(Language.Portuguese), includeSeconds: true })}`,
		robbing: "Roubando",
		beingRobbedSimple: "Sendo roubado",
		beingRobbedComplex: "Sendo roubado por",
		imprisonedSimple: "Preso",
		imprisonedComplex: "Preso até",
		imprisonedAndHospitalSimple: "Preso e Hospitalizado",
		imprisonedAndHospitalSimpleEmote: `${EmoteString.Prison} Preso e ${EmoteString.Hospital} Hospitalizado`,
		imprisonedAndHospitalComplex: (prisonTime: Date, hospitalTime: Date) => `${EmoteString.Prison} Preso até ${showTime(prisonTime.getTime())} e ${EmoteString.Hospital} Hospitalizado até ${showTime(hospitalTime.getTime())}`,
		imprisonedAndHospitalComplexUI: (prisonTime: Date, hospitalTime: Date) => `Preso até ${formatDate(prisonTime, Language.Portuguese)} e Hospitalizado até ${formatDate(hospitalTime, Language.Portuguese)}`,
		scavenging: "Vasculhando",
		wantedSimple: "e Procurado",
		wantedSimpleEmote: `e ${EmoteString.Police} Procurado`,
		wantedComplex: `e ${EmoteString.Police} Procurado até`,
		wantedComplexUI: `e Procurado até`,
		hospitalSimple: "Hospitalizado",
		hospitalComplex: `Hospitalizado até`,
	},
	[Language.Spanish]: {
		idling: "Vagando",
		workingSimple: "",
		workingComplex: (description: string, jobTime: Date) => `Trabajando como ${description}. Terminará ${showTime(jobTime.getTime(), true)}`,
		workingComplexUI: (description: string, jobTime: Date) => `Trabajando como ${description}. Terminará en ${formatDistanceToNow(jobTime, { locale: getLocaleFromLanguage(Language.Spanish), includeSeconds: true })}`,
		robbing: "Robando",
		beingRobbedSimple: "Siendo robado",
		beingRobbedComplex: "Siendo robado por",
		imprisonedSimple: "Preso",
		imprisonedAndHospitalSimple: "Preso y Hospitalizado",
		imprisonedAndHospitalSimpleEmote: `${EmoteString.Prison} Preso y ${EmoteString.Hospital} Hospitalizado`,
		imprisonedAndHospitalComplex: (prisonTime: Date, hospitalTime: Date) => `${EmoteString.Prison} Preso hasta ${showTime(prisonTime.getTime())} y ${EmoteString.Hospital} Hospitalizado hasta ${showTime(hospitalTime.getTime())}`,
		imprisonedAndHospitalComplexUI: (prisonTime: Date, hospitalTime: Date) => `Preso hasta ${formatDate(prisonTime, Language.Spanish)} y Hospitalizado hasta ${formatDate(hospitalTime, Language.Spanish)}`,
		imprisonedComplex: "Preso hasta",
		scavenging: "Buscando",
		wantedSimple: "y Buscado",
		wantedSimpleEmote: `y ${EmoteString.Police} Buscado`,
		wantedComplex: `y ${EmoteString.Police} Buscado hasta`,
		wantedComplexUI: `y Buscado hasta`,
		hospitalSimple: "Hospitalizado",
		hospitalComplex: `Hospitalizado hasta`,
	},
} as const;