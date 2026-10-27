"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeasonRepository = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("#core/database/Database");
const Seasons_1 = require("#core/database/Seasons");
const Users_1 = require("#core/database/Users");
const Gangs_1 = __importDefault(require("#core/database/Gangs"));
const GangMembers_1 = __importDefault(require("#core/database/GangMembers"));
const GangRoles_1 = __importDefault(require("#core/database/GangRoles"));
const GangHeists_1 = require("#core/database/GangHeists");
const UserItems_1 = require("#core/database/UserItems");
const RobHistories_1 = require("#core/database/RobHistories");
const Notifications_1 = require("#core/database/Notifications");
const LotteryTickets_1 = require("#core/database/LotteryTickets");
const UserInvestments_1 = require("#core/database/UserInvestments");
const HorseRaceBets_1 = require("#core/database/HorseRaceBets");
const HorseRaces_1 = require("#core/database/HorseRaces");
const VaultRepository_1 = require("#core/repositories/VaultRepository");
const Classes_1 = require("#core/types/Classes");
class SeasonRepository {
    static async FindLatest() {
        return await Seasons_1.Seasons.findOne({
            order: [["number", "DESC"]],
        });
    }
    static async FindByNumber(number) {
        return await Seasons_1.Seasons.findOne({
            where: { number },
        });
    }
    static async FindAll() {
        return await Seasons_1.Seasons.findAll({
            order: [["number", "DESC"]],
        });
    }
    static async FindAllNumbers() {
        const seasons = await Seasons_1.Seasons.findAll({
            attributes: ["number"],
            order: [["number", "DESC"]],
        });
        return seasons.map(s => ({ number: s.number }));
    }
    static async Create(data) {
        return await Seasons_1.Seasons.create(data);
    }
    static async UpdateById(id, data) {
        return await Seasons_1.Seasons.update(data, {
            where: { id },
        });
    }
    static async DeleteByNumber(number) {
        return await Seasons_1.Seasons.destroy({
            where: { number },
        });
    }
    /**
     * Gets the top rankings for end of season.
     */
    static async GetEndSeasonRankingData() {
        const defaultAttributes = ["nickname", "id", "class"];
        const getFromRanking = (orderBy, limit = 1) => {
            return Users_1.Users.findAll({
                attributes: [...defaultAttributes, orderBy],
                limit: limit,
                order: [[orderBy, "DESC"]],
                where: {
                    class: {
                        [sequelize_1.Op.not]: Classes_1.ClassId.None,
                    },
                    [sequelize_1.Op.or]: [
                        { deadUntil: null },
                        { deadUntil: { [sequelize_1.Op.lte]: new Date() } },
                    ],
                    [orderBy]: {
                        [sequelize_1.Op.gt]: 0,
                    },
                },
            });
        };
        const getTopGang = () => {
            return Gangs_1.default.findAll({
                attributes: ["id", "name", "level"],
                limit: 1,
                order: [["level", "DESC"], ["experience", "DESC"]],
                where: {
                    level: {
                        [sequelize_1.Op.gt]: 0,
                    },
                },
            });
        };
        return await Promise.all([
            getFromRanking("money", 3),
            getFromRanking("casinoWinSum"),
            getFromRanking("shopSpentSum"),
            getFromRanking("robberySuccessRobbedSum"),
            getFromRanking("robberySuccessCount"),
            getFromRanking("jobReceivedSum"),
            getFromRanking("beatUpSuccessCount"),
            getFromRanking("scavengeFoundTotal"),
            getFromRanking("hospitalTreatmentSum"),
            getFromRanking("prisonBriberySum"),
            getFromRanking("escapeCount"),
            getFromRanking("drinkHappyHour"),
            getFromRanking("investmentTotalProfit"),
            getTopGang(),
        ]);
    }
    /**
     * Gets general stats counts for end of season.
     */
    static async GetEndSeasonStats() {
        return await Promise.all([
            Users_1.Users.count({
                where: {
                    class: { [sequelize_1.Op.not]: Classes_1.ClassId.None },
                    [sequelize_1.Op.or]: [
                        { deadUntil: null },
                        { deadUntil: { [sequelize_1.Op.lte]: new Date() } },
                    ],
                },
            }),
            Gangs_1.default.count(),
            GangMembers_1.default.count(),
            GangRoles_1.default.count(),
            GangHeists_1.GangHeists.count(),
            UserItems_1.UserItems.count(),
            RobHistories_1.RobHistories.count(),
            Notifications_1.Notifications.count(),
            LotteryTickets_1.LotteryTickets.count(),
            UserInvestments_1.UserInvestments.count(),
            HorseRaceBets_1.HorseRaceBets.count(),
        ]);
    }
    /**
     * Resets all progress and erases seasonal database tables within a transaction.
     */
    static async ResetSeasonDatabase() {
        const transaction = await Database_1.sequelize.transaction();
        try {
            await Promise.all([
                GangMembers_1.default.destroy({ where: {}, transaction }),
                GangRoles_1.default.destroy({ where: {}, transaction }),
                GangHeists_1.GangHeists.destroy({ where: {}, transaction }),
            ]);
            const date = new Date();
            await Promise.all([
                Users_1.Users.update({
                    money: 0,
                    class: Classes_1.ClassId.None,
                    dailyStreak: 0,
                    maxDailyStreak: 0,
                    lastDailyReceived: null,
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
                    jobId: null,
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
                    casinoIsInGame: false,
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
                    investmentTotalProfit: 0,
                    nicknameChangeCount: 0,
                    classChangeCount: 0,
                    // actions
                    beingRobbedByUserId: null,
                    robbingUserId: null,
                    robbingLocationId: null,
                    scavengingId: null,
                    beatingUserId: null,
                    beingBeatUpByUserId: null,
                    robberyInvestmentDefending: false,
                    robberyParticipatingInGangAction: false,
                    // timers
                    almsGiveTime: date,
                    almsReceiveTime: date,
                    beatUpTime: date,
                    prisonTime: date,
                    escapeTime: date,
                    wantedTime: date,
                    hospitalTime: date,
                    jobTime: date,
                    scavengeTime: date,
                }, { where: { class: { [sequelize_1.Op.not]: Classes_1.ClassId.None } }, transaction }),
                Gangs_1.default.destroy({ where: {}, transaction }),
                UserItems_1.UserItems.destroy({ where: {}, transaction }),
                RobHistories_1.RobHistories.destroy({ where: {}, transaction }),
                Notifications_1.Notifications.destroy({ where: {}, transaction }),
                LotteryTickets_1.LotteryTickets.destroy({ where: {}, transaction }),
                UserInvestments_1.UserInvestments.destroy({ where: {}, transaction }),
                HorseRaceBets_1.HorseRaceBets.destroy({ where: {}, transaction }),
                HorseRaces_1.HorseRaces.destroy({ where: {}, transaction }),
                VaultRepository_1.VaultRepository.Reset(transaction),
            ]);
            await transaction.commit();
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}
exports.SeasonRepository = SeasonRepository;
//# sourceMappingURL=SeasonRepository.js.map