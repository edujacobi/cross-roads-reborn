import { Users } from "../database/Users";
import { Log } from "../utils/log";
import { addDays, differenceInHours } from "date-fns";
import { Language } from "./Language";
import { UserItems } from "../database/UserItems";
import { addHours } from "date-fns/addHours";
import { Op } from "sequelize";
import { Item, ItemList, ItemType, UserItem } from "./Item";
import { JobId, JobList } from "./Job";
import { Notification, NotificationType } from "./Notification";
import { formatDate, formatMoney, showTime } from "../utils/ui";
import { EmoteString } from "../utils/emotes";
import { ClassId, ClassList } from "./Class";
import { LocationId } from "./Locations";

export class User {
	Id = "";
	CreatedAt: Date;
	UpdatedAt: Date;
	VipTime: Date | null = null;
	VipEternal = false;
	Language: Language;
	Nickname: string = "";
	Money = 0;
	Class = ClassId.None;
	Daily: {
		CurrentStreak: number,
		MaxStreak: number,
		LastReceived: Date | null,
	};
	Job: {
		Id: JobId | null,
		EndsIn: Date,
		ReceivedSum: number,
		ReceivedCount: number,
	};
	Robbery: {
		SuccessCount: number,
		FailureCount: number,
		BeingRobbedCount: number,
		SuccessRobbedSum: number,
		BeingRobbedSum: number,
		IsRobbingId: string | null,
		IsBeingRobbedById: string | null,
		IsRobbingLocationId: LocationId | null,
	};
	Prison: {
		BriberySum: number,
		BriberyCount: number,
		HasPaidBribe: boolean,
		Time: Date,
	};
	Escape: {
		Count: number,
		Time: Date,
		HasTried: boolean,
	};
	Wanted: {
		Count: number,
		Time: Date,
	};
	Hospital: {
		Count: number,
		TreatmentCount: number,
		TreatmentSum: number,
		Time: Date,
	};
	Casino: {
		WinCount: number,
		LoseCount: number,
		WinSum: number,
		LoseSum: number,
	};
	Shop: {
		SpentSum: number,
		SpentCount: number,
	};
	BeatUp: {
		IsBeatingId: string | null,
		IsBeingBeatUpById: string | null,
		SuccessCount: number,
		FailureCount: number,
		BeatedUpCount: number,
		Time: Date,
	};
	Attributes: {
		Attack: number,
		Defense: number,
		MoneyAttack: number,
		MoneyDefense: number,
	};
	Situation: {
		Simple: string,
		Complex: string,
	};
	BestGun: Item | null = null;
	Alms = {
		GiveTime: new Date(),
		ReceiveTime: new Date(),
		GivenSum: 0,
		GivenCount: 0,
		ReceivedSum: 0,
		ReceivedCount: 0,
	};

	constructor(id: string, language: Language = Language.English) {
		const now = new Date();
		this.Id = id;
		this.CreatedAt = now;
		this.UpdatedAt = now;
		this.Language = language;
		this.Daily = {
			CurrentStreak: 0,
			MaxStreak: 0,
			LastReceived: null,
		};
		this.Job = {
			Id: null,
			EndsIn: now,
			ReceivedSum: 0,
			ReceivedCount: 0,
		};
		this.Robbery = {
			SuccessCount: 0,
			FailureCount: 0,
			SuccessRobbedSum: 0,
			BeingRobbedCount: 0,
			BeingRobbedSum: 0,
			IsRobbingId: null,
			IsBeingRobbedById: null,
			IsRobbingLocationId: null,
		};
		this.BeatUp = {
			IsBeatingId: null,
			IsBeingBeatUpById: null,
			SuccessCount: 0,
			FailureCount: 0,
			BeatedUpCount: 0,
			Time: now,
		};
		this.Prison = {
			BriberySum: 0,
			BriberyCount: 0,
			HasPaidBribe: false,
			Time: now,
		};
		this.Escape = {
			Count: 0,
			Time: now,
			HasTried: false,
		};
		this.Wanted = {
			Count: 0,
			Time: now,
		};
		this.Casino = {
			WinCount: 0,
			LoseCount: 0,
			WinSum: 0,
			LoseSum: 0,
		};
		this.Hospital = {
			Count: 0,
			TreatmentCount: 0,
			TreatmentSum: 0,
			Time: now,
		};
		this.Shop = {
			SpentSum: 0,
			SpentCount: 0,
		};
		this.Attributes = {
			Attack: 0,
			Defense: 0,
			MoneyAttack: 0,
			MoneyDefense: 0,
		};
		this.Situation = {
			Simple: "",
			Complex: "",
		};
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

		// Job
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

	async BuyItem(item: Item) {
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
		this.Situation.Complex = `${EmoteString.Idle} ${s.idling}`;

		if (this.Job.Id !== null) {
			this.Situation.Simple = s.workingSimple;
			this.Situation.Complex = `${EmoteString.Working} ${s.workingComplex(JobList[this.Job.Id].Description[this.Language], this.Job.EndsIn)}`;
		}
		if (this.Robbery.IsRobbingId) {
			this.Situation.Simple = s.robbing;
			const user = await Users.findOne({
				where: {
					id: this.Robbery.IsRobbingId,
				},
			});
			if (!user) {
				return;
			}
			this.Situation.Complex = `${EmoteString.Robbery} ${s.robbing} ${user.nickname}`;
		}
		if (this.Robbery.IsBeingRobbedById) {
			this.Situation.Simple = s.beingRobbedSimple;
			const user = await Users.findOne({
				where: {
					id: this.Robbery.IsBeingRobbedById,
				},
			});
			if (!user) {
				return;
			}
			this.Situation.Complex = `${EmoteString.Robbery} ${s.beingRobbedComplex} ${user.nickname}`;
		}
		if (this.IsInPrison() && this.IsInHospital()) {
			this.Situation.Simple = s.imprisonedAndHospitalSimple;
			this.Situation.Complex = s.imprisonedAndHospitalComplex(this.Prison.Time, this.Hospital.Time);
		}
		if (this.IsInPrison()) {
			this.Situation.Simple = s.imprisonedSimple;
			this.Situation.Complex = `${EmoteString.Prison} ${s.imprisonedComplex} ${showTime(this.Prison.Time.getTime())}`;
		}
		if (this.IsInHospital()) {
			this.Situation.Simple = s.hospitalSimple;
			this.Situation.Complex = `${EmoteString.Hospital} ${s.hospitalComplex} ${showTime(this.Hospital.Time.getTime())}`;
		}
		if (this.IsWanted()) {
			this.Situation.Simple += ` ${s.wantedSimple}`;
			this.Situation.Complex += ` ${s.wantedComplex} ${showTime(this.Wanted.Time.getTime())}`;
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

	async StartJob(jobId: JobId) {
		const job = JobList[jobId];
		this.Job.Id = jobId;
		this.Job.EndsIn = addHours(new Date(), job.Duration);

		await Notification.Job(this);
		await this.Update();
		Log.Info(`User ${this.Nickname} (ID: ${this.Id}) started job ${job.Description[this.Language]} (ID: ${jobId}), will finish in ${formatDate(this.Job.EndsIn)}.`);
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
		robbing: "Robbing",
		beingRobbedSimple: "Being robbed",
		beingRobbedComplex: "Being robbed by",
		imprisonedSimple: "Imprisoned",
		imprisonedComplex: "Imprisoned until",
		imprisonedAndHospitalSimple: "Imprisoned and Hospitalized",
		imprisonedAndHospitalComplex: (prisonTime: Date, hospitalTime: Date) => `${EmoteString.Prison} Imprisoned until ${showTime(prisonTime.getTime())} and ${EmoteString.Hospital} Hospitalized until ${showTime(hospitalTime.getTime())}`,
		wantedSimple: "and Wanted",
		wantedComplex: `and ${EmoteString.Police} Wanted until`,
		hospitalSimple: "Hospitalized",
		hospitalComplex: `Hospitalized until`,
	},
	[Language.Portuguese]: {
		idling: "Vadiando",
		workingSimple: "Trabalhando",
		workingComplex: (description: string, jobTime: Date) => `Trabalhando como ${description}. Terminará ${showTime(jobTime.getTime(), true)}`,
		robbing: "Roubando",
		beingRobbedSimple: "Sendo roubado",
		beingRobbedComplex: "Sendo roubado por",
		imprisonedSimple: "Preso",
		imprisonedComplex: "Preso até",
		imprisonedAndHospitalSimple: "Preso e Hospitalizado",
		imprisonedAndHospitalComplex: (prisonTime: Date, hospitalTime: Date) => `${EmoteString.Prison} Preso até ${showTime(prisonTime.getTime())} e ${EmoteString.Hospital} Hospitalizado até ${showTime(hospitalTime.getTime())}`,
		wantedSimple: "e Procurado",
		wantedComplex: `e ${EmoteString.Police} Procurado até`,
		hospitalSimple: "Hospitalizado",
		hospitalComplex: `Hospitalizado até`,
	},
	[Language.Spanish]: {
		idling: "Vagando",
		workingSimple: "",
		workingComplex: (description: string, jobTime: Date) => `Trabajando como ${description}. Terminará ${showTime(jobTime.getTime(), true)}`,
		robbing: "Robando",
		beingRobbedSimple: "Siendo robado",
		beingRobbedComplex: "Siendo robado por",
		imprisonedSimple: "Preso",
		imprisonedAndHospitalSimple: "Preso y Hospitalizado",
		imprisonedAndHospitalComplex: (prisonTime: Date, hospitalTime: Date) => `${EmoteString.Prison} Preso hasta ${showTime(prisonTime.getTime())} y ${EmoteString.Hospital} Hospitalizado hasta ${showTime(hospitalTime.getTime())}`,
		imprisonedComplex: "Preso hasta",
		wantedSimple: "y Buscado",
		wantedComplex: `y ${EmoteString.Police} Buscado hasta`,
		hospitalSimple: "Hospitalizado",
		hospitalComplex: `Hospitalizado hasta`,
	},
} as const;