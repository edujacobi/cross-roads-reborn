"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Season = void 0;
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const Language_1 = require("#core/models/Language");
const UserBadge_1 = require("#core/models/UserBadge");
const GangMemberRepository_1 = require("#core/repositories/GangMemberRepository");
const SeasonRepository_1 = require("#core/repositories/SeasonRepository");
const UserRepository_1 = require("#core/repositories/UserRepository");
const Badges_1 = require("#core/types/Badges");
const log_1 = require("#shared/log");
const date_fns_1 = require("date-fns");
class Season {
    static DEFAULT_DURATION_DAYS = 120;
    static isTransitioning = false;
    static DefaultTopData = {
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
    StartDate = new Date();
    EndDate = (0, date_fns_1.addDays)(new Date(), Season.DEFAULT_DURATION_DAYS);
    TopData = { ...Season.DefaultTopData };
    HowManyPlayers = 0;
    // ponytail: initialize directly on model instead of separate manager singleton
    static async Initialize() {
        try {
            const currentSeason = await Season.GetCurrent();
            log_1.Log.Info(`Season Initialized. Current season: ${currentSeason.Number}, Ends: ${currentSeason.EndDate.toLocaleDateString()}`);
            await Season.CheckForSeasonTransition();
            // Hourly check for season transitions (3_600_000 ms = 1 hour)
            setInterval(async () => {
                try {
                    await Season.CheckForSeasonTransition();
                }
                catch (error) {
                    log_1.Log.Warning(`Error checking season transition: ${error}`);
                }
            }, 3_600_000);
        }
        catch (error) {
            log_1.Log.Warning(`Error initializing Season: ${error}`);
        }
    }
    static async GetCurrent() {
        const currentSeason = await SeasonRepository_1.SeasonRepository.FindLatest();
        if (!currentSeason) {
            const season = new Season();
            await season.Create();
            return season;
        }
        return Season.FromDatabase(currentSeason);
    }
    static async GetByNumber(number) {
        const seasonData = await SeasonRepository_1.SeasonRepository.FindByNumber(number);
        if (!seasonData) {
            return null;
        }
        return Season.FromDatabase(seasonData);
    }
    static async GetAll() {
        const seasonsData = await SeasonRepository_1.SeasonRepository.FindAll();
        return seasonsData.map(season => Season.FromDatabase(season));
    }
    static async GetSeasonsList() {
        return await SeasonRepository_1.SeasonRepository.FindAllNumbers();
    }
    static async GetEndSeasonRankingData() {
        return await SeasonRepository_1.SeasonRepository.GetEndSeasonRankingData();
    }
    static async GetEndSeasonStats() {
        return await SeasonRepository_1.SeasonRepository.GetEndSeasonStats();
    }
    static async GetActivePlayerCount() {
        const active = await UserRepository_1.UserRepository.FindAllActive(["id"]);
        return active.length;
    }
    static FromDatabase(seasonData) {
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
    async Create() {
        if (this.Number <= 0) {
            const lastSeason = await SeasonRepository_1.SeasonRepository.FindLatest();
            this.Number = lastSeason ? lastSeason.number + 1 : 1;
        }
        const season = await SeasonRepository_1.SeasonRepository.Create({
            number: this.Number,
            startDate: this.StartDate,
            endDate: this.EndDate,
            topData: JSON.stringify(this.TopData),
            howManyPlayers: this.HowManyPlayers,
        });
        this.Id = season.id;
        log_1.Log.Success(`Season ${this.Number} created. Starts: ${this.StartDate.toLocaleDateString()}, Ends: ${this.EndDate.toLocaleDateString()}`);
    }
    async Update() {
        await SeasonRepository_1.SeasonRepository.UpdateById(this.Id, {
            number: this.Number,
            startDate: this.StartDate,
            endDate: this.EndDate,
            topData: JSON.stringify(this.TopData),
            howManyPlayers: this.HowManyPlayers,
        });
        log_1.Log.Info(`Season ${this.Number} updated.`);
    }
    get IsActive() {
        return new Date() < this.EndDate;
    }
    GetDaysRemaining() {
        return Math.max(0, (0, date_fns_1.differenceInDays)(this.EndDate, new Date()));
    }
    async UpdateTopPlayers() {
        const [topMoney, topGambler, topSpender, topThiefProfit, topThiefQuantity, topWorker, topBeater, topScavenger, topHospital, topBriber, topEscaper, topDrunk, topInvestor, topGang,] = await SeasonRepository_1.SeasonRepository.GetEndSeasonRankingData();
        const activeUsers = await UserRepository_1.UserRepository.FindAllActive(["id"]);
        this.HowManyPlayers = activeUsers.length;
        const mapUsers = (users, valueKey) => {
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
        log_1.Log.Info(`Top players updated for Season ${this.Number}`);
    }
    async AwardTopPlayers() {
        const awardUserBadge = async (userId, badgeSuffix) => {
            const badgeKey = `S${this.Number}${badgeSuffix}`;
            if (badgeKey in Badges_1.BadgeId) {
                const badgeId = Badges_1.BadgeId[badgeKey];
                await UserBadge_1.UserBadge.Create(userId, badgeId);
            }
            else {
                log_1.Log.Warning(`Badge ${badgeKey} not found in BadgeId enum for Season ${this.Number}`);
            }
        };
        // Top Money 1st, 2nd, 3rd
        if (this.TopData.topMoney[0])
            await awardUserBadge(this.TopData.topMoney[0].id, "Top1Money");
        if (this.TopData.topMoney[1])
            await awardUserBadge(this.TopData.topMoney[1].id, "Top2Money");
        if (this.TopData.topMoney[2])
            await awardUserBadge(this.TopData.topMoney[2].id, "Top3Money");
        // Other Top 1 Individual categories
        if (this.TopData.topGambler[0])
            await awardUserBadge(this.TopData.topGambler[0].id, "Top1CasinoProfit");
        if (this.TopData.topSpender[0])
            await awardUserBadge(this.TopData.topSpender[0].id, "Top1Spender");
        if (this.TopData.topThiefProfit[0])
            await awardUserBadge(this.TopData.topThiefProfit[0].id, "Top1RobberyProfit");
        if (this.TopData.topWorker[0])
            await awardUserBadge(this.TopData.topWorker[0].id, "Top1Jobs");
        if (this.TopData.topBeater[0])
            await awardUserBadge(this.TopData.topBeater[0].id, "Top1BeatUp");
        if (this.TopData.topScavenger[0])
            await awardUserBadge(this.TopData.topScavenger[0].id, "Top1Scavenge");
        if (this.TopData.topHospital[0])
            await awardUserBadge(this.TopData.topHospital[0].id, "Top1Hospital");
        if (this.TopData.topBriber[0])
            await awardUserBadge(this.TopData.topBriber[0].id, "Top1Bribery");
        if (this.TopData.topEscaper[0])
            await awardUserBadge(this.TopData.topEscaper[0].id, "Top1Escapes");
        if (this.TopData.topInvestor[0])
            await awardUserBadge(this.TopData.topInvestor[0].id, "Top1Investments");
        // Top Gang: Award badge to all active members of the #1 gang (excluding dead/banned users)
        if (this.TopData.topGang[0]) {
            const gangMembers = await GangMemberRepository_1.GangMemberRepository.FindAllByGang(this.TopData.topGang[0].id);
            for (const member of gangMembers) {
                const user = await UserRepository_1.UserRepository.FindById(member.userId, ["deadUntil"]);
                if (user && (!user.deadUntil || new Date(user.deadUntil) <= new Date())) {
                    await awardUserBadge(member.userId, "Top1Gang");
                }
            }
        }
        log_1.Log.Success(`Top players awarded for Season ${this.Number}`);
    }
    async AnnounceToPlayers() {
        try {
            const activeUsers = await UserRepository_1.UserRepository.FindAllActive(["id", "language"]);
            if (activeUsers.length === 0) {
                log_1.Log.Info("No active players to announce end of season.");
                return;
            }
            // Batch message sending to avoid Discord rate limits
            const batchSize = 10;
            for (let i = 0; i < activeUsers.length; i += batchSize) {
                const batch = activeUsers.slice(i, i + batchSize);
                await Promise.all(batch.map(user => {
                    const s = Strings[user.language] || Strings[Language_1.Language.English];
                    return (0, discordInteractions_1.sendPrivateMessage)(user.id, s.privateEnd(this.Number));
                }));
                await new Promise(resolve => setTimeout(resolve, 1_000));
            }
            log_1.Log.Info(`${activeUsers.length} players announced of Season ${this.Number} end.`);
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong announcing end of season to players. Error: ${err}`);
        }
    }
    static async EndCurrentSeason(isPreSeason = false) {
        if (Season.isTransitioning) {
            log_1.Log.Warning("Season transition is already in progress. Ignoring duplicate request.");
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
            await SeasonRepository_1.SeasonRepository.ResetSeasonDatabase();
            if (isPreSeason) {
                await SeasonRepository_1.SeasonRepository.DeleteByNumber(currentSeason.Number);
            }
            const newSeason = new Season();
            newSeason.Number = isPreSeason ? currentSeason.Number : currentSeason.Number + 1;
            newSeason.StartDate = new Date();
            newSeason.EndDate = (0, date_fns_1.addDays)(new Date(), Season.DEFAULT_DURATION_DAYS);
            await newSeason.Create();
            log_1.Log.Success(`Season ${currentSeason.Number} ended. Season ${newSeason.Number} started.`);
        }
        finally {
            Season.isTransitioning = false;
        }
    }
    static async CheckForSeasonTransition() {
        const currentSeason = await Season.GetCurrent();
        const hasSeasonEnded = currentSeason.EndDate < new Date();
        if (hasSeasonEnded) {
            log_1.Log.Info(`Season ${currentSeason.Number} has reached its end date. Triggering season transition...`);
            await Season.EndCurrentSeason(false);
        }
    }
}
exports.Season = Season;
const Strings = {
    [Language_1.Language.English]: {
        privateEnd: (seasonNumber) => `🏆 **Season ${seasonNumber}** has ended! All stats and items have been reset. A new season has begun. Good luck!`,
    },
    [Language_1.Language.Portuguese]: {
        privateEnd: (seasonNumber) => `🏆 **A Temporada ${seasonNumber}** terminou! Todas as estatísticas e itens foram resetados. Uma nova temporada começou. Boa sorte!`,
    },
    [Language_1.Language.Spanish]: {
        privateEnd: (seasonNumber) => `🏆 ¡**La Temporada ${seasonNumber}** ha terminado! Todas las estadísticas y objetos han sido reiniciados. Ha comenzado una nueva temporada. ¡Buena suerte!`,
    },
};
//# sourceMappingURL=Season.js.map