import { Roosters } from "../database/Roosters";
import { EmoteString, getPathText, getRarityText, getRoosterWinrate, showTime } from "../utils/ui";
import { checkActions, sendPrivateMessage } from "../utils/logic";
import { Notification, NotificationType } from "./Notification";
import { differenceInHours } from "date-fns";
import { Log } from "../utils/log";
import { User } from "./User";
import { getRoosterColor, getRoosterEmote, getRoosterImage, RoosterImage } from "./RoosterImage";
import { sequelize } from "../database/Database";
import { Op } from "sequelize";
import { Event, EventType } from "./Event";
import { Eggs } from "../database/Eggs";
import { Egg } from "./Egg";

export enum RoosterStat {
	ATK = "ATK",
	DEF = "DEF",
	SPD = "SPD",
	STA = "STA",
	CRT = "CRT"
}

export class Rooster {
	Id = 0;
	OwnerId = "";
	BirthDate: Date = new Date();
	Name = "";
	Title = "";
	Level = 0;
	Exp = 0;
	Image: number = this.SetRandomImage();
	Race = "";
	Prizes: string[] = [];
	RaceId = 0;
	ColorId = 0;
	Rarity = Rarity.Common;
	RarityText = "";
	RarityIcon = "";
	Nationality = 0;
	Wins = 0;
	Losses = 0;
	BossWins = 0;
	IsTraining: RoosterStat | null = null;
	BattlingWith: number | null = null;
	AvailableTrainings = 1;
	Stats = {
		Attack: 0,
		Defense: 0,
		Speed: 0,
		Critical: 0,
	};
	Timers = {
		Rest: 0,
		Train: 0,
	};
	Daily: { CurrentStreak: number, MaxStreak: number, LastReceived: Date | null } = {
		CurrentStreak: 0,
		MaxStreak: 0,
		LastReceived: null,
	};
	IsDeleted = false;

	constructor(ownerId: string) {
		this.OwnerId = ownerId;
	}

	async Create() {

		this.SetRarity();
		this.SetRace();

		try {
			await Roosters.create({
				ownerId: this.OwnerId,
				name: "Rooster without name",
				birthDate: new Date(),
				title: this.Title,
				raceId: this.RaceId,
				colorId: this.ColorId,
				rarity: this.Rarity,
				nationality: this.Nationality,
				level: this.Level,
				exp: this.Exp,
				image: this.Image,
				wins: this.Wins,
				losses: this.Losses,
				bossWins: this.BossWins,
				statAttack: this.Stats.Attack,
				statDefense: this.Stats.Defense,
				statSpeed: this.Stats.Speed,
				statCritical: this.Stats.Critical,
				timerRest: this.Timers.Rest,
				timerTrain: this.Timers.Train,
				isTraining: this.IsTraining,
				availableTrainings: this.AvailableTrainings,
				battlingWith: this.BattlingWith,
				dailyStreak: this.Daily.CurrentStreak,
				maxDailyStreak: this.Daily.MaxStreak,
				lastDailyReceived: this.Daily.LastReceived,
				isDeleted: this.IsDeleted,
			});

			Log.Success(`Rooster from OwnerID: ${this.OwnerId} created.`);

		}
		catch (err) {
			Log.Warning(`Something went wrong with Rooster ${this.Id} (from OwnerID: ${this.OwnerId}).`);
		}
	}

	async Update() {
		try {
			await Roosters.update({
				name: this.Name,
				title: this.Title,
				raceId: this.RaceId,
				colorId: this.ColorId,
				rarity: this.Rarity,
				nationality: this.Nationality,
				level: this.Level,
				exp: this.Exp,
				image: this.Image,
				wins: this.Wins,
				losses: this.Losses,
				bossWins: this.BossWins,
				statAttack: this.Stats.Attack,
				statDefense: this.Stats.Defense,
				statSpeed: this.Stats.Speed,
				statCritical: this.Stats.Critical,
				timerRest: this.Timers.Rest,
				timerTrain: this.Timers.Train,
				isTraining: this.IsTraining,
				availableTrainings: this.AvailableTrainings,
				battlingWith: this.BattlingWith,
				dailyStreak: this.Daily.CurrentStreak,
				maxDailyStreak: this.Daily.MaxStreak,
				lastDailyReceived: this.Daily.LastReceived,
				isDeleted: this.IsDeleted,
			}, {
				where: { id: this.Id },
			});

			// Log.Info(`Rooster ${this.Name} (from OwnerID: ${this.OwnerId}) updated.`);

		}
		catch (err) {
			Log.Warning(`Something went wrong with updating Rooster ${this.Id} (from OwnerID: ${this.OwnerId}).`);
		}
	}

	async GetInfo(id?: number) {

		let rooster: Roosters | null;

		if (id) {
			rooster = await Roosters.findOne({
				where: {
					id: id,
				},
			});

		}
		else {
			rooster = await Roosters.findOne({
				where: {
					ownerId: this.OwnerId,
					isDeleted: false,
				},
			});
		}

		if (!rooster) {
			Log.Warning(`The Rooster from OwnerID: ${this.OwnerId} doesn't exist in database.`);
			return;
		}

		this.Id = rooster.id;
		this.Name = rooster.name;
		this.OwnerId = rooster.ownerId;
		this.BirthDate = rooster.birthDate;
		this.Title = rooster.title;
		this.Level = rooster.level;
		this.Exp = rooster.exp;
		this.Image = rooster.image;
		this.RaceId = rooster.raceId;
		this.ColorId = rooster.colorId;
		this.Rarity = rooster.rarity;
		this.Nationality = rooster.nationality;
		this.Wins = rooster.wins;
		this.Losses = rooster.losses;
		this.BossWins = rooster.bossWins;
		this.Stats.Attack = rooster.statAttack;
		this.Stats.Defense = rooster.statDefense;
		this.Stats.Speed = rooster.statSpeed;
		this.Stats.Critical = rooster.statCritical;
		this.Timers.Rest = rooster.timerRest;
		this.Timers.Train = rooster.timerTrain;
		this.IsTraining = rooster.isTraining;
		this.AvailableTrainings = rooster.availableTrainings;
		this.BattlingWith = rooster.battlingWith;
		this.Daily.CurrentStreak = rooster.dailyStreak;
		this.Daily.MaxStreak = rooster.maxDailyStreak;
		this.Daily.LastReceived = rooster.lastDailyReceived;
		this.Race = this.GetRace();
		this.RarityText = this.GetRarityText();
		this.RarityIcon = this.GetRarityIcon();
		this.IsDeleted = rooster.isDeleted;

		return this;
	}

	async Release() {
		try {
			this.IsDeleted = true;
			await this.Update();

			Log.Info(`Rooster ${this.Name} (from OwnerID: ${this.OwnerId}) was released.`);

			await new Egg(this.OwnerId).Create();

			await Notification.Hatch(this);

		}
		catch (err) {
			Log.Warning(`Something went wrong with releasing Rooster ${this.Id} (from OwnerID: ${this.OwnerId}).`);
		}
	}

	protected SetRarity() {
		const rand = Math.random(); // generate random number between 0 and 1

		if (rand < 0.5) { // 50% chance of common
			this.Rarity = Rarity.Common;

		}
		else if (rand < 0.8) { // 30% chance of uncommon
			this.Rarity = Rarity.Uncommon;

		}
		else if (rand < 0.95) { // 15% chance of rare
			this.Rarity = Rarity.Rare;

		}
		else { // 5% chance of legendary
			this.Rarity = Rarity.Legendary;
		}
	}

	protected SetRace() {
		let colors: string[];
		let races: string[];

		switch (this.Rarity) {
		case Rarity.Mythic:
			colors = LegendaryColors;
			races = RareAndLegendaryRaces;
			break;

		case Rarity.Legendary:
			colors = LegendaryColors;
			races = RareAndLegendaryRaces;
			break;

		case Rarity.Rare:
			colors = RareColors;
			races = RareAndLegendaryRaces;
			break;

		case Rarity.Uncommon:
			colors = UncommonColors;
			races = CommonAndUncommonRaces;
			break;

		default:
			colors = CommonColors;
			races = CommonAndUncommonRaces;
			break;
		}
		this.ColorId = Math.floor(Math.random() * colors.length);

		this.Nationality = Math.floor(Math.random() * Nationalities.length);

		this.RaceId = Math.floor(Math.random() * races.length);

		this.Race = `${colors[this.ColorId]} ${races[this.RaceId]}`;

	}

	protected GetRace() {
		// let colors: string[];
		// let races: string[];
		//
		// switch (this.Rarity) {
		// case Rarity.Mythic:
		// 	// colors = LegendaryColors;
		// 	races = RareAndLegendaryRaces;
		// 	break;
		// case Rarity.Legendary:
		// 	// colors = LegendaryColors;
		// 	races = RareAndLegendaryRaces;
		// 	break;
		//
		// case Rarity.Rare:
		// 	// colors = RareColors;
		// 	races = RareAndLegendaryRaces;
		// 	break;
		//
		// case Rarity.Uncommon:
		// 	// colors = UncommonColors;
		// 	races = CommonAndUncommonRaces;
		// 	break;
		//
		// default:
		// 	// colors = CommonColors;
		// 	races = CommonAndUncommonRaces;
		// 	break;
		// }

		// return `${colors[this.ColorId]} ${races[this.RaceId]}`;

		// return `${this.GetColorText()} ${races[this.RaceId]}`;
		return this.GetColorText();
	}

	protected SetRandomImage() {
		const array = [
			RoosterImage.Black.Small,
			RoosterImage.Brown.Small,
			RoosterImage.White.Small,
			RoosterImage.Gray.Small,
		];

		const random = Math.floor(Math.random() * array.length);
		return array[random].Id;
	}

	async SetImage(image: number) {
		Log.Info(`Rooster ${this.Name} (from OwnerID: ${this.OwnerId}) changed his image from ${this.Image} to ${image}.`);
		this.Image = image;
		await this.Update();
	}

	async SetNationality(nationality: number) {
		Log.Info(`Rooster ${this.Name} (from OwnerID: ${this.OwnerId}) had the nationality changed from ${Nationalities[this.Nationality].flag} ${Nationalities[this.Nationality].description} to ${Nationalities[nationality].flag} ${Nationalities[nationality].description}.`);
		this.Nationality = nationality;
		await this.Update();
	}

	GetImage() {
		return getRoosterImage(this.Image);
	}

	GetNameWithFlag() {
		return `${Nationalities[this.Nationality].flag} ${this.Name}`;
	}

	GetNameWithImage() {
		return `${getRoosterEmote(this.Image)} ${this.Name}`;
	}

	GetWinrate() {
		return getRoosterWinrate(this.Wins, this.Losses);
	}

	GetDungeonPower() {
		let base = 110;

		if (this.Rarity == Rarity.Uncommon) {
			base = 120;
		}
		else if (this.Rarity == Rarity.Rare) {
			base = 130;
		}
		else if (this.Rarity == Rarity.Legendary) {
			base = 140;
		}
		else if (this.Rarity == Rarity.Mythic) {
			base = 150;
		}

		return base * this.Level;
	}

	protected GetRarityText() {
		return getRarityText(this.Rarity);
	}

	protected GetRarityIcon() {
		switch (this.Rarity) {
		case Rarity.Mythic:
			return EmoteString.Mythic;
		case Rarity.Legendary:
			return EmoteString.Legendary;
		case Rarity.Rare:
			return EmoteString.Rare;
		case Rarity.Uncommon:
			return EmoteString.Uncommon;
		default:
			return EmoteString.Common;
		}
	}

	async StartTraining(stat: RoosterStat, isVip: boolean) {
		const vipMultiplier = isVip ? 0.75 : 1;
		this.Timers.Train = Date.now() + (60_000 * (5 + 2 * this.Level) * vipMultiplier);
		this.IsTraining = stat;

		await this.Update();

		await Notification.Train(this);

		return this.Timers.Train;
	}

	async StopTraining() {
		this.Timers.Rest = Date.now() + 60_000 * (3 + 0.5 * this.Level);
		this.IsTraining = null;

		await this.Update();

		await Notification.Dismiss(this.Id, NotificationType.Train);
		await Notification.Rest(this);

		return this.Timers.Rest;
	}

	CanCompleteTraining() {
		return !!this.IsTraining;
	}

	async CompleteTraining() {
		Log.Info(`Rooster ${this.Name} (from OwnerID: ${this.OwnerId}) has finished the training of ${this.IsTraining}.`);
		switch (this.IsTraining) {
		case RoosterStat.ATK:
			this.Stats.Attack += 1;
			break;
		case RoosterStat.DEF:
			this.Stats.Defense += 1;
			break;
		case RoosterStat.SPD:
			this.Stats.Speed += 1;
			break;
		case RoosterStat.CRT:
			this.Stats.Critical += 1;
			break;
		}

		this.Timers.Rest = Date.now() + 60_000 * (5 + this.Level);
		this.AvailableTrainings -= 1;
		this.IsTraining = null;

		const exp = await this.AddExp(100 + this.Level * 50);

		await Notification.Rest(this);

		return { exp: exp, restTime: this.Timers.Rest };
	}

	async AddTrainingSession() {
		this.AvailableTrainings += 1;
		Log.Success(`Rooster ${this.Name} (from OwnerID: ${this.OwnerId}) received a training session.`);
		await this.Update();
	}

	async AddExp(ammount: number) {
		const multiplier = await Event.GetActiveFromType(EventType.EXP_MULTIPLIER);

		const expToAdd = ammount * multiplier;
		this.Exp += expToAdd;

		Log.Info(`Rooster ${this.Name} (from OwnerID: ${this.OwnerId}) gained ${expToAdd} Exp.`);

		const expNeededToLevelUp = this.GetExpNeededToLevelUp();

		if (this.Exp < expNeededToLevelUp) {
			await this.Update();

		}
		else {
			this.Exp -= expNeededToLevelUp;
			await this.AddLevel();
		}

		return expToAdd;
	}

	GetExpNeededToLevelUp() {
		return 150 + Math.round((this.Level ** 1.5) * 500);
	}

	async AddLevel(ammount = 1) {
		this.Level += ammount;
		this.AvailableTrainings += 3;

		await this.Update();

		let aditionalText = "";
		if (this.Level == 1) {
			aditionalText = "\nHe is now ready to battle! To challenge other players, use `/battle`. To challenge NPCs, use `/wild`";
		}
		if (this.Level == 5 || this.Level == 15) {
			aditionalText = "\nHe has grown stronger and more images are available for you to choose! `/setimage`";
		}

		await sendPrivateMessage(this.OwnerId, `${EmoteString.Experience} ${this.Name} has leveled up to Level ${this.Level}!${aditionalText}`);

		Log.Info(`Rooster ${this.Name} (from OwnerID: ${this.OwnerId}) leveled up to Level ${this.Level}.`);
	}

	GetColorText() {
		return getRoosterColor(this.Image);
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

		const levelMultiplier = this.Level * 10;

		const user = await new User(this.OwnerId).GetInfo();

		const baseValue = user?.IsVip() ? 75 : 50;

		const exp = await this.AddExp(baseValue * streakMultiplier + levelMultiplier);

		await Notification.Daily(this);

		return exp;
	}

	async GenerateEmbedValues() {
		const actions = checkActions({
			training: true,
			resting: true,
			battling: true,
			finishedTraining: true,
		}, this);

		let smallTextTraining = "• Ready";
		let bigTextTraining = `${EmoteString.Ready} **Ready**`;

		if (actions.battling && this.BattlingWith != null) {

			const opponent = await Roosters.findByPk(this.BattlingWith);

			smallTextTraining = "• Battling";
			if (opponent) {
				bigTextTraining = `${EmoteString.Battling} **Battling** with ${getRoosterEmote(<number>opponent.image)} **${opponent.name}**`;
			}
			else {
				bigTextTraining = `${EmoteString.Battling} **Battling** in the Wilds`;
			}

		}
		else if (actions.finishedTraining) {
			smallTextTraining = "• Training finished";
			bigTextTraining = `${EmoteString.Training} **Training** in the ${getPathText(<string> this.IsTraining)} finished`;

		}
		else if (actions.training) {
			smallTextTraining = "• Training";
			bigTextTraining = `${EmoteString.Training} **Training** in the ${getPathText(<string> this.IsTraining)} until ${showTime(this.Timers.Train)}`;

		}
		else if (actions.resting) {
			smallTextTraining = "• Resting";
			bigTextTraining = `${EmoteString.Resting} **Resting** until ${showTime(this.Timers.Rest)}`;
		}

		const smallDescription =
			`## ${this.RarityIcon} ${this.Name}
		
**${Nationalities[this.Nationality].flag} ${this.Race}**

${EmoteString.Attack}${this.Stats.Attack} ${EmoteString.Defense}${this.Stats.Defense} ${EmoteString.Speed}${this.Stats.Speed} ${EmoteString.CritChange}${this.Stats.Critical}`;

		const bigDescription =
			`## ${this.Name}
			
**${this.RarityText}**

${this.Title != "" ? `_${this.Title}_` : ""}

**${Nationalities[this.Nationality].flag} ${Nationalities[this.Nationality].description} ${this.Race}**

${EmoteString.Attack}ATK ${this.Stats.Attack} ${EmoteString.Defense}DEF ${this.Stats.Defense} ${EmoteString.Speed}SPD  ${this.Stats.Speed} ${EmoteString.CritChange}CRT ${this.Stats.Critical}

${EmoteString.Victory}${this.Wins} ${EmoteString.Defeat}${this.Losses} ${EmoteString.Winrate}${this.GetWinrate()}

${bigTextTraining}

-# Level: ${this.Level}
${this.GetExpBar(6)}`;

		return {
			train: {
				small: smallTextTraining,
				big: bigTextTraining,
			},
			description: {
				small: smallDescription,
				big: bigDescription,
			},
		};
	}

	static async GetRandomReleasedRooster(recommendedLevel: number) {
		const randomReleased = await Roosters.findOne({
			attributes: ["id", "ownerId"],
			order: sequelize.random(),
			where: {
				isDeleted: true,
				level: {
					[Op.and]: {
						[Op.gt]: Math.max(1, recommendedLevel - 3),
						[Op.lt]: recommendedLevel + 4,
					},
				},
			},
		});

		if (!randomReleased) {
			return;
		}

		return await new Rooster(randomReleased.ownerId).GetInfo(randomReleased.id);
	}

	async SetAdminRarity(rarity: Rarity) {
		Log.Info(`Rooster ${this.Name} (from OwnerID: ${this.OwnerId}) had the rarity changed from ${getRarityText(this.Rarity)} to ${getRarityText(rarity)}.`);
		this.Rarity = rarity;
		await this.Update();
	}

	GetExpBar(emoteCount: number) {
		const ratio = this.Exp / this.GetExpNeededToLevelUp();

		const color = {
			left: EmoteString.ExpBarLeftFull,
			center: EmoteString.ExpBarMidFull,
			right: ratio >= 1 ? EmoteString.ExpBarRightFull : EmoteString.ExpBarRightEmpty,
		};

		if (ratio <= 0) {
			color.left = EmoteString.ExpBarLeftEmpty;
			color.center = EmoteString.ExpBarMidEmpty;
		}

		let emptyBars = Math.ceil((1 - ratio) * (emoteCount));
		emptyBars = Math.max(0, Math.min(emptyBars, emoteCount));

		return `-# ${color.left + color.center.repeat(emoteCount - emptyBars) + EmoteString.ExpBarMidEmpty.repeat(emptyBars) + color.right} ${this.Exp} / ${this.GetExpNeededToLevelUp()} (${Math.round(ratio * 100)}%)`;
	}
}

export enum Rarity {
	Common,
	Uncommon,
	Rare,
	Legendary,
	Mythic
}

const CommonAndUncommonRaces = [
	"Sussex",
	"Cornish",
	"Gamefowl",
	"Malay",
	"Shamo",
	"Asil",
	"Cubalaya",
	"Sumatra",
	"Indian",
	"Tomaru",
];

const RareAndLegendaryRaces = [
	"Buff Orpington",
	"Rhode Island",
	"Barred Plymouth",
	"Old English",
	"Phoenix",
	"Ko'shamo",
	"Wyandotte",
	"Leghorn",
	"Yokohama",
	"Coastal",
];

export const Nationalities = [
	{
		flag: "🇧🇷",
		description: "Brazilian",
	},
	{
		flag: "🇦🇷",
		description: "Argentine",
	},
	{
		flag: "🇵🇾",
		description: "Paraguayan",
	},
	{
		flag: "🇺🇾",
		description: "Uruguayan",
	},
	{
		flag: "🇺🇸",
		description: "American",
	},
	{
		flag: "🇨🇦",
		description: "Canadian",
	},
	{
		flag: "🇨🇺",
		description: "Cuban",
	},
	{
		flag: "🇨🇱",
		description: "Chilean",
	},
	{
		flag: "🇲🇽",
		description: "Mexican",
	},
	{
		flag: "🇧🇴",
		description: "Bolivian",
	},
	{
		flag: "🇵🇪",
		description: "Peruvian",
	},
	{
		flag: "🇮🇹",
		description: "Italian",
	},
	{
		flag: "🇯🇵",
		description: "Japanese",
	},
	{
		flag: "🇰🇷",
		description: "Korean",
	},
	{
		flag: "🇶🇦",
		description: "Qatari",
	},
	{
		flag: "🇫🇷",
		description: "French",
	},
	{
		flag: "🇪🇸",
		description: "Spanish",
	},
	{
		flag: "🇨🇳",
		description: "Chinese",
	},
	{
		flag: "🇩🇪",
		description: "German",
	},
	{
		flag: "🇦🇺",
		description: "Australian",
	},
	{
		flag: "🇬🇧",
		description: "English",
	},
	{
		flag: "🇮🇳",
		description: "Indian",
	},
	{
		flag: "🇵🇹",
		description: "Portuguese",
	},
	{
		flag: "🇯🇲",
		description: "Jamaican",
	},
];

const CommonColors = [
	"Grey",
	"White",
	"Brown",
];

const UncommonColors = [
	"Red",
	"Green",
	"Blue",
	"Yellow",
	"Black",
];

const RareColors = [
	"Metallic",
	"Silver",
	"Golden",
	"Pink",
	"Amber",
	"Cobalt",
	"Bronze",
];

const LegendaryColors = [
	"Rainbow",
	"Pearl",
	"Ruby Scarlet",
	"Obsidian",
	"Black Opal",
	"Prismatic",
	"Hematite",
	"Emerald",
	"Iridescent",
];