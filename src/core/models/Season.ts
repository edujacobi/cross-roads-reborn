import { sendPrivateMessage } from "#bot/utils/discordInteractions";
import { type Users } from "#core/database/Users";
import { Language, type Localization } from "#core/models/Language";
import { UserBadge } from "#core/models/UserBadge";
import { GangMemberRepository } from "#core/repositories/GangMemberRepository";
import { type ISeasonData, SeasonRepository } from "#core/repositories/SeasonRepository";
import { UserRepository } from "#core/repositories/UserRepository";
import { BadgeId } from "#core/types/Badges";
import { Log } from "#shared/log";
import { addDays, differenceInDays } from "date-fns";

export interface TopUserEntry {
	id: string;
	nickname: string;
	class: number;
	value: number;
}

export interface TopGangEntry {
	id: number;
	name: string;
	level: number;
}

export interface SeasonTopData {
	topMoney: TopUserEntry[];
	topGambler: TopUserEntry[];
	topSpender: TopUserEntry[];
	topThiefProfit: TopUserEntry[];
	topThiefQuantity: TopUserEntry[];
	topWorker: TopUserEntry[];
	topBeater: TopUserEntry[];
	topScavenger: TopUserEntry[];
	topHospital: TopUserEntry[];
	topBriber: TopUserEntry[];
	topEscaper: TopUserEntry[];
	topDrunk: TopUserEntry[];
	topInvestor: TopUserEntry[];
	topGang: TopGangEntry[];
}

export class Season {
	static readonly DEFAULT_DURATION_DAYS = 120;
	private static isTransitioning = false;

	private static readonly DefaultTopData: SeasonTopData = {
		topMoney: [],
		topGambler: [],
		topSpender: [],
		topThiefProfit: [],
		topThiefQuantity: [],
		topWorker: [],
		topBeater: [],
		topScavenger: [],
		topHospital: [],
		topBriber: [],
		topEscaper: [],
		topDrunk: [],
		topInvestor: [],
		topGang: [],
	};

	Id = 0;
	Number = 1;
	StartDate: Date = new Date();
	EndDate: Date = addDays(new Date(), Season.DEFAULT_DURATION_DAYS);
	TopData: SeasonTopData = { ...Season.DefaultTopData };
	HowManyPlayers = 0;

	// ponytail: initialize directly on model instead of separate manager singleton
	static async Initialize(): Promise<void> {
		try {
			const currentSeason = await Season.GetCurrent();
			Log.Info(`Season Initialized. Current season: ${currentSeason.Number}, Ends: ${currentSeason.EndDate.toLocaleDateString()}`);

			await Season.CheckForSeasonTransition();

			// Hourly check for season transitions (3_600_000 ms = 1 hour)
			setInterval(async () => {
				try {
					await Season.CheckForSeasonTransition();
				}
				catch (error) {
					Log.Warning(`Error checking season transition: ${error}`);
				}
			}, 3_600_000);
		}
		catch (error) {
			Log.Warning(`Error initializing Season: ${error}`);
		}
	}

	static async GetCurrent(): Promise<Season> {
		const currentSeason = await SeasonRepository.FindLatest();

		if (!currentSeason) {
			const season = new Season();
			await season.Create();
			return season;
		}

		return Season.FromDatabase(currentSeason);
	}

	static async GetByNumber(number: number): Promise<Season | null> {
		const seasonData = await SeasonRepository.FindByNumber(number);

		if (!seasonData) {
			return null;
		}

		return Season.FromDatabase(seasonData);
	}

	static async GetAll(): Promise<Season[]> {
		const seasonsData = await SeasonRepository.FindAll();
		return seasonsData.map(season => Season.FromDatabase(season));
	}

	static async GetSeasonsList(): Promise<{ number: number }[]> {
		return await SeasonRepository.FindAllNumbers();
	}

	static async GetEndSeasonRankingData() {
		return await SeasonRepository.GetEndSeasonRankingData();
	}

	static async GetEndSeasonStats() {
		return await SeasonRepository.GetEndSeasonStats();
	}

	static async GetActivePlayerCount(): Promise<number> {
		const active = await UserRepository.FindAllActive(["id"]);
		return active.length;
	}

	private static FromDatabase(seasonData: ISeasonData): Season {
		const season = new Season();
		season.Id = seasonData.id;
		season.Number = seasonData.number;
		season.StartDate = seasonData.startDate;
		season.EndDate = seasonData.endDate;
		try {
			const parsed = JSON.parse(seasonData.topData);
			season.TopData = { ...Season.DefaultTopData, ...parsed };
		}
		catch {
			season.TopData = { ...Season.DefaultTopData };
		}
		season.HowManyPlayers = seasonData.howManyPlayers;
		return season;
	}

	async Create(): Promise<void> {
		if (this.Number <= 0) {
			const lastSeason = await SeasonRepository.FindLatest();
			this.Number = lastSeason ? lastSeason.number + 1 : 1;
		}

		const season = await SeasonRepository.Create({
			number: this.Number,
			startDate: this.StartDate,
			endDate: this.EndDate,
			topData: JSON.stringify(this.TopData),
			howManyPlayers: this.HowManyPlayers,
		});

		this.Id = season.id;
		Log.Success(`Season ${this.Number} created. Starts: ${this.StartDate.toLocaleDateString()}, Ends: ${this.EndDate.toLocaleDateString()}`);
	}

	async Update(): Promise<void> {
		await SeasonRepository.UpdateById(this.Id, {
			number: this.Number,
			startDate: this.StartDate,
			endDate: this.EndDate,
			topData: JSON.stringify(this.TopData),
			howManyPlayers: this.HowManyPlayers,
		});

		Log.Info(`Season ${this.Number} updated.`);
	}

	get IsActive(): boolean {
		return new Date() < this.EndDate;
	}

	GetDaysRemaining(): number {
		return Math.max(0, differenceInDays(this.EndDate, new Date()));
	}

	async UpdateTopPlayers(): Promise<void> {
		const [
			topMoney,
			topGambler,
			topSpender,
			topThiefProfit,
			topThiefQuantity,
			topWorker,
			topBeater,
			topScavenger,
			topHospital,
			topBriber,
			topEscaper,
			topDrunk,
			topInvestor,
			topGang,
		] = await SeasonRepository.GetEndSeasonRankingData();

		const activeUsers = await UserRepository.FindAllActive(["id"]);
		this.HowManyPlayers = activeUsers.length;

		type NumericUserKey = {
			[K in keyof Users]: Users[K] extends number ? K : never;
		}[keyof Users];

		const mapUsers = (users: Users[], valueKey: NumericUserKey): TopUserEntry[] => {
			return users.map(u => ({
				id: u.id,
				nickname: u.nickname,
				class: u.class,
				value: u[valueKey] || 0,
			}));
		};

		this.TopData = {
			topMoney: mapUsers(topMoney, "money"),
			topGambler: mapUsers(topGambler, "casinoWinSum"),
			topSpender: mapUsers(topSpender, "shopSpentSum"),
			topThiefProfit: mapUsers(topThiefProfit, "robberySuccessRobbedSum"),
			topThiefQuantity: mapUsers(topThiefQuantity, "robberySuccessCount"),
			topWorker: mapUsers(topWorker, "jobReceivedSum"),
			topBeater: mapUsers(topBeater, "beatUpSuccessCount"),
			topScavenger: mapUsers(topScavenger, "scavengeFoundTotal"),
			topHospital: mapUsers(topHospital, "hospitalTreatmentSum"),
			topBriber: mapUsers(topBriber, "prisonBriberySum"),
			topEscaper: mapUsers(topEscaper, "escapeCount"),
			topDrunk: mapUsers(topDrunk, "drinkHappyHour"),
			topInvestor: mapUsers(topInvestor, "investmentTotalProfit"),
			topGang: topGang.map(g => ({
				id: g.id,
				name: g.name,
				level: g.level,
			})),
		};

		Log.Info(`Top players updated for Season ${this.Number}`);
	}

	async AwardTopPlayers(): Promise<void> {
		const awardUserBadge = async (userId: string, badgeSuffix: string) => {
			const badgeKey = `S${this.Number}${badgeSuffix}` as keyof typeof BadgeId;
			if (badgeKey in BadgeId) {
				const badgeId = BadgeId[badgeKey] as unknown as BadgeId;
				await UserBadge.Create(userId, badgeId);
			}
			else {
				Log.Warning(`Badge ${badgeKey} not found in BadgeId enum for Season ${this.Number}`);
			}
		};

		// Top Money 1st, 2nd, 3rd
		if (this.TopData.topMoney[0]) await awardUserBadge(this.TopData.topMoney[0].id, "Top1Money");
		if (this.TopData.topMoney[1]) await awardUserBadge(this.TopData.topMoney[1].id, "Top2Money");
		if (this.TopData.topMoney[2]) await awardUserBadge(this.TopData.topMoney[2].id, "Top3Money");

		// Other Top 1 Individual categories
		if (this.TopData.topGambler[0]) await awardUserBadge(this.TopData.topGambler[0].id, "Top1CasinoProfit");
		if (this.TopData.topSpender[0]) await awardUserBadge(this.TopData.topSpender[0].id, "Top1Spender");
		if (this.TopData.topThiefProfit[0]) await awardUserBadge(this.TopData.topThiefProfit[0].id, "Top1RobberyProfit");
		if (this.TopData.topWorker[0]) await awardUserBadge(this.TopData.topWorker[0].id, "Top1Jobs");
		if (this.TopData.topBeater[0]) await awardUserBadge(this.TopData.topBeater[0].id, "Top1BeatUp");
		if (this.TopData.topScavenger[0]) await awardUserBadge(this.TopData.topScavenger[0].id, "Top1Scavenge");
		if (this.TopData.topHospital[0]) await awardUserBadge(this.TopData.topHospital[0].id, "Top1Hospital");
		if (this.TopData.topBriber[0]) await awardUserBadge(this.TopData.topBriber[0].id, "Top1Bribery");
		if (this.TopData.topEscaper[0]) await awardUserBadge(this.TopData.topEscaper[0].id, "Top1Escapes");
		if (this.TopData.topInvestor[0]) await awardUserBadge(this.TopData.topInvestor[0].id, "Top1Investments");

		// Top Gang: Award badge to all active members of the #1 gang (excluding dead/banned users)
		if (this.TopData.topGang[0]) {
			const gangMembers = await GangMemberRepository.FindAllByGang(this.TopData.topGang[0].id);
			for (const member of gangMembers) {
				const user = await UserRepository.FindById(member.userId, ["deadUntil"]);
				if (user && (!user.deadUntil || new Date(user.deadUntil) <= new Date())) {
					await awardUserBadge(member.userId, "Top1Gang");
				}
			}
		}

		Log.Success(`Top players awarded for Season ${this.Number}`);
	}

	async AnnounceToPlayers(): Promise<void> {
		try {
			const activeUsers = await UserRepository.FindAllActive(["id", "language"]);
			if (activeUsers.length === 0) {
				Log.Info("No active players to announce end of season.");
				return;
			}

			// Batch message sending to avoid Discord rate limits
			const batchSize = 10;
			for (let i = 0; i < activeUsers.length; i += batchSize) {
				const batch = activeUsers.slice(i, i + batchSize);
				await Promise.all(batch.map(user => {
					const s = Strings[user.language as Language] || Strings[Language.English];
					return sendPrivateMessage(user.id, s.privateEnd(this.Number));
				}));
				await new Promise(resolve => setTimeout(resolve, 1_000));
			}

			Log.Info(`${activeUsers.length} players announced of Season ${this.Number} end.`);
		}
		catch (err) {
			Log.Warning(`Something went wrong announcing end of season to players. Error: ${err}`);
		}
	}

	static async EndCurrentSeason(isPreSeason = false): Promise<void> {
		if (Season.isTransitioning) {
			Log.Warning("Season transition is already in progress. Ignoring duplicate request.");
			return;
		}

		Season.isTransitioning = true;
		try {
			const currentSeason = await Season.GetCurrent();
			currentSeason.EndDate = new Date();

			if (!isPreSeason) {
				await currentSeason.UpdateTopPlayers();
				await currentSeason.AwardTopPlayers();
				await currentSeason.Update();
			}

			await currentSeason.AnnounceToPlayers();
			await SeasonRepository.ResetSeasonDatabase();

			if (isPreSeason) {
				await SeasonRepository.DeleteByNumber(currentSeason.Number);
			}

			const newSeason = new Season();
			newSeason.Number = isPreSeason ? currentSeason.Number : currentSeason.Number + 1;
			newSeason.StartDate = new Date();
			newSeason.EndDate = addDays(new Date(), Season.DEFAULT_DURATION_DAYS);

			await newSeason.Create();

			Log.Success(`Season ${currentSeason.Number} ended. Season ${newSeason.Number} started.`);
		}
		finally {
			Season.isTransitioning = false;
		}
	}

	static async CheckForSeasonTransition(): Promise<void> {
		const currentSeason = await Season.GetCurrent();
		const hasSeasonEnded = currentSeason.EndDate < new Date();

		if (hasSeasonEnded) {
			Log.Info(`Season ${currentSeason.Number} has reached its end date. Triggering season transition...`);
			await Season.EndCurrentSeason(false);
		}
	}
}

const Strings = {
	[Language.English]: {
		privateEnd: (seasonNumber: number) => `🏆 **Season ${seasonNumber}** has ended! All stats and items have been reset. A new season has begun. Good luck!`,
	},
	[Language.Portuguese]: {
		privateEnd: (seasonNumber: number) => `🏆 **A Temporada ${seasonNumber}** terminou! Todas as estatísticas e itens foram resetados. Uma nova temporada começou. Boa sorte!`,
	},
	[Language.Spanish]: {
		privateEnd: (seasonNumber: number) => `🏆 ¡**La Temporada ${seasonNumber}** ha terminado! Todas las estadísticas y objetos han sido reiniciados. Ha comenzado una nueva temporada. ¡Buena suerte!`,
	},
} as const satisfies Localization;
