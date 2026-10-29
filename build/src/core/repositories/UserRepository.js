"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const Database_1 = require("#core/database/Database");
const GangHeists_1 = require("#core/database/GangHeists");
const GangMembers_1 = __importDefault(require("#core/database/GangMembers"));
const GangRoles_1 = __importDefault(require("#core/database/GangRoles"));
const Gangs_1 = __importDefault(require("#core/database/Gangs"));
const HorseRaceBets_1 = require("#core/database/HorseRaceBets");
const LotteryTickets_1 = require("#core/database/LotteryTickets");
const Notifications_1 = require("#core/database/Notifications");
const RobHistories_1 = require("#core/database/RobHistories");
const UserAvatarDecorations_1 = __importDefault(require("#core/database/UserAvatarDecorations"));
const UserBackgroundDecorations_1 = __importDefault(require("#core/database/UserBackgroundDecorations"));
const UserBadges_1 = __importDefault(require("#core/database/UserBadges"));
const UserBundles_1 = __importDefault(require("#core/database/UserBundles"));
const UserInvestments_1 = require("#core/database/UserInvestments");
const UserItems_1 = require("#core/database/UserItems");
const Users_1 = require("#core/database/Users");
const sequelize_1 = require("sequelize");
const date_fns_1 = require("date-fns");
const TimedActionRepository_1 = require("./TimedActionRepository");
const Classes_1 = require("#core/types/Classes");
const Ids_1 = require("#core/types/Ids");
class UserRepository {
    /**
     * Finds a user by their primary key (ID).
     * @param id The user's Discord ID.
     * @param attributes Optional list of attributes to select.
     */
    static async FindById(id, attributes) {
        return await Users_1.Users.findByPk(id, { attributes, transaction: TimedActionRepository_1.actionTransaction.getStore() });
    }
    /**
     * Creates a new user record in the database.
     * @param values Initial field values.
     */
    static async Create(values) {
        return await Users_1.Users.create(values);
    }
    /**
     * Updates a user record matching the ID.
     * @param id The user's Discord ID.
     * @param values Updated field values.
     */
    static async Update(id, values) {
        const result = await Users_1.Users.update(values, {
            where: { id },
            transaction: TimedActionRepository_1.actionTransaction.getStore(),
        });
        if (TimedActionRepository_1.actionTransaction.getStore() && result[0] !== 1)
            throw new Error(`User ${id} was not updated.`);
        return result;
    }
    static IsResolvingAction() {
        return TimedActionRepository_1.actionTransaction.getStore() !== undefined;
    }
    static async GiftVipForDays(giverId, receiverId, days, price) {
        return await Database_1.sequelize.transaction(async (transaction) => {
            const receiver = await Users_1.Users.findByPk(receiverId, { transaction });
            if (!receiver || receiver.vipEternal) {
                return false;
            }
            const [charged] = await Users_1.Users.update({ specialCoin: (0, sequelize_1.literal)(`specialCoin - ${price}`) }, { where: { id: giverId, specialCoin: { [sequelize_1.Op.gte]: price } }, transaction });
            if (!charged) {
                return false;
            }
            const now = new Date();
            await receiver.update({
                vipTime: (0, date_fns_1.addDays)(receiver.vipTime && receiver.vipTime > now ? receiver.vipTime : now, days),
                avatarDecoration: receiver.avatarDecoration === Ids_1.AvatarDecorationId.Default
                    ? Ids_1.AvatarDecorationId.VIP
                    : receiver.avatarDecoration,
            }, { transaction });
            return true;
        });
    }
    /**
     * Atomically clear scavengingId only if it's not already null.
     * Returns true if this call was the one that cleared it (first caller).
     * Returns false if scavengingId was already null (another caller already ended it).
     */
    static async ClearScavengingId(id) {
        const [affected] = await Users_1.Users.update({ scavengingId: null }, {
            where: {
                id,
                scavengingId: { [sequelize_1.Op.ne]: null },
            },
        });
        return affected > 0;
    }
    static async TryStartCasinoGame(id) {
        const [affected] = await Users_1.Users.update({ casinoIsInGame: true }, {
            where: { id, casinoIsInGame: false },
        });
        return affected > 0;
    }
    static async TryStartEscape(id, escapeTime) {
        const [affected] = await Users_1.Users.update({ escapeHasTried: true, escapeTime }, {
            where: {
                id,
                escapeHasTried: false,
                prisonTime: { [sequelize_1.Op.gt]: new Date() },
            },
        });
        return affected > 0;
    }
    static async FindOverdueEscapes() {
        return await Users_1.Users.findAll({
            attributes: ["id"],
            where: {
                escapeHasTried: true,
                escapeTime: { [sequelize_1.Op.gt]: new Date(0), [sequelize_1.Op.lte]: new Date() },
            },
        });
    }
    static async TryEndEscape(id, escapeTime, prisonTime, values) {
        const [affected] = await Users_1.Users.update(values, {
            where: { id, escapeHasTried: true, escapeTime, prisonTime },
        });
        return affected > 0;
    }
    /**
     * Deletes a user and all data that references their ID in one transaction.
     */
    static async DeleteUser(id) {
        return await Database_1.sequelize.transaction(async (transaction) => {
            const user = await Users_1.Users.findByPk(id, { attributes: ["id"], transaction });
            if (!user) {
                return false;
            }
            const gangIds = (await Gangs_1.default.findAll({
                attributes: ["id"],
                where: { leaderId: id },
                transaction,
            })).map(gang => gang.id);
            await GangMembers_1.default.destroy({
                where: gangIds.length
                    ? { [sequelize_1.Op.or]: [{ userId: id }, { gangId: { [sequelize_1.Op.in]: gangIds } }] }
                    : { userId: id },
                transaction,
            });
            if (gangIds.length) {
                await GangHeists_1.GangHeists.destroy({ where: { gangId: { [sequelize_1.Op.in]: gangIds } }, transaction });
                await GangRoles_1.default.destroy({ where: { gangId: { [sequelize_1.Op.in]: gangIds } }, transaction });
                await Gangs_1.default.destroy({ where: { id: { [sequelize_1.Op.in]: gangIds } }, transaction });
            }
            await UserItems_1.UserItems.destroy({ where: { userId: id }, transaction });
            await UserBadges_1.default.destroy({ where: { userId: id }, transaction });
            await UserInvestments_1.UserInvestments.destroy({ where: { userId: id }, transaction });
            await UserBundles_1.default.destroy({ where: { userId: id }, transaction });
            await UserAvatarDecorations_1.default.destroy({ where: { userId: id }, transaction });
            await UserBackgroundDecorations_1.default.destroy({ where: { userId: id }, transaction });
            await Notifications_1.Notifications.destroy({ where: { userId: id }, transaction });
            await HorseRaceBets_1.HorseRaceBets.destroy({ where: { userId: id }, transaction });
            await LotteryTickets_1.LotteryTickets.destroy({ where: { userId: id }, transaction });
            await RobHistories_1.RobHistories.destroy({
                where: { [sequelize_1.Op.or]: [{ attackerId: id }, { defenderId: id }] },
                transaction,
            });
            await Users_1.Users.update({
                robbingUserId: null,
                beingRobbedByUserId: null,
                beatingUserId: null,
                beingBeatUpByUserId: null,
            }, {
                where: {
                    [sequelize_1.Op.or]: [
                        { robbingUserId: id },
                        { beingRobbedByUserId: id },
                        { beatingUserId: id },
                        { beingBeatUpByUserId: id },
                    ],
                },
                transaction,
            });
            return (await Users_1.Users.destroy({ where: { id }, transaction })) > 0;
        });
    }
    /**
     * Searches for a user by nickname (case-insensitive/like match) or exact ID.
     * @param nameOrId The nickname search query or Discord ID.
     */
    static async SearchByNameOrId(nameOrId) {
        return await Users_1.Users.findOne({
            where: {
                [sequelize_1.Op.or]: {
                    nickname: {
                        [sequelize_1.Op.like]: nameOrId,
                    },
                    id: nameOrId,
                },
            },
        });
    }
    /**
     * Increments the user's money and total investment profit columns.
     * @param id The user's Discord ID.
     * @param amount The profit/money amount to increment.
     */
    static async IncrementMoneyAndProfit(id, amount) {
        await Users_1.Users.increment({ money: amount, investmentTotalProfit: amount }, { where: { id } });
    }
    /**
     * Finds all users who are currently hospitalized.
     */
    static async FindAllHospitalized() {
        return await Users_1.Users.findAll({
            attributes: ["nickname", "class", "hospitalTime", "hospitalCount"],
            order: [["hospitalTime", "DESC"]],
            where: { hospitalTime: { [sequelize_1.Op.gt]: new Date() } },
        });
    }
    /**
     * Finds hospitalized users with pagination, search, and sorting.
     */
    static async FindHospitalized(options) {
        const limit = Math.min(options.limit || 20, 100);
        const offset = options.offset || 0;
        const conditions = [{ hospitalTime: { [sequelize_1.Op.gt]: new Date() } }];
        if (options.search) {
            conditions.push({
                [sequelize_1.Op.or]: [
                    { id: { [sequelize_1.Op.like]: `%${options.search}%` } },
                    { nickname: { [sequelize_1.Op.like]: `%${options.search}%` } },
                ],
            });
        }
        const allowedSortFields = ["nickname", "id", "hospitalTime", "hospitalCount"];
        const sortByField = allowedSortFields.includes((options.sortBy ?? ""))
            ? options.sortBy
            : "hospitalTime";
        const sortOrder = (options.sortOrder === "ASC" || options.sortOrder === "DESC") ? options.sortOrder : "DESC";
        const { rows, count } = await Users_1.Users.findAndCountAll({
            attributes: ["id", "nickname", "avatarDecoration", "class", "hospitalTime", "hospitalCount"],
            where: { [sequelize_1.Op.and]: conditions },
            limit,
            offset,
            order: [[sortByField, sortOrder]],
        });
        return { users: rows, total: count };
    }
    /**
     * Finds all users who are currently in prison.
     */
    static async FindAllPrisoners() {
        return await Users_1.Users.findAll({
            attributes: ["nickname", "class", "prisonTime", "robberyFailureCount", "escapeCount"],
            order: [["prisonTime", "DESC"]],
            where: { prisonTime: { [sequelize_1.Op.gt]: new Date() } },
        });
    }
    /**
     * Finds prisoners with pagination, search, and sorting.
     */
    static async FindPrisoners(options) {
        const limit = Math.min(options.limit || 20, 100);
        const offset = options.offset || 0;
        const conditions = [{ prisonTime: { [sequelize_1.Op.gt]: new Date() } }];
        if (options.search) {
            conditions.push({
                [sequelize_1.Op.or]: [
                    { id: { [sequelize_1.Op.like]: `%${options.search}%` } },
                    { nickname: { [sequelize_1.Op.like]: `%${options.search}%` } },
                ],
            });
        }
        const allowedSortFields = ["nickname", "id", "prisonTime", "robberyFailureCount", "escapeCount"];
        const sortByField = allowedSortFields.includes((options.sortBy ?? ""))
            ? options.sortBy
            : "prisonTime";
        const sortOrder = (options.sortOrder === "ASC" || options.sortOrder === "DESC") ? options.sortOrder : "DESC";
        const { rows, count } = await Users_1.Users.findAndCountAll({
            attributes: ["id", "nickname", "avatarDecoration", "class", "prisonTime", "robberyFailureCount", "escapeCount"],
            where: { [sequelize_1.Op.and]: conditions },
            limit,
            offset,
            order: [[sortByField, sortOrder]],
        });
        return { users: rows, total: count };
    }
    /**
     * Finds all users who are currently dead.
     */
    static async FindAllDead() {
        return await Users_1.Users.findAll({
            attributes: ["id", "nickname", "avatarDecoration", "class", "deadUntil"],
            order: [["deadUntil", "DESC"]],
            where: { deadUntil: { [sequelize_1.Op.gt]: new Date() } },
        });
    }
    /**
     * Finds all VIP users with pagination.
     */
    static async FindAllVips(limit, offset) {
        return await Users_1.Users.findAll({
            where: {
                [sequelize_1.Op.or]: {
                    vipTime: { [sequelize_1.Op.gt]: new Date() },
                    vipEternal: { [sequelize_1.Op.not]: false },
                },
            },
            limit,
            offset,
            order: [["vipTime", "DESC"]],
        });
    }
    /**
     * Counts all VIP users.
     */
    static async CountVips() {
        return await Users_1.Users.count({
            where: {
                [sequelize_1.Op.or]: {
                    vipTime: { [sequelize_1.Op.gt]: new Date() },
                    vipEternal: { [sequelize_1.Op.not]: false },
                },
            },
        });
    }
    /**
     * Finds top users for a specific column.
     */
    static async FindTopUsers(topType, limit, offset) {
        return await Users_1.Users.findAll({
            limit,
            offset,
            order: [[topType, "DESC"]],
            where: {
                class: { [sequelize_1.Op.not]: Classes_1.ClassId.None },
                [topType]: { [sequelize_1.Op.gt]: 0 },
            },
        });
    }
    /**
     * Counts top users for a specific column.
     */
    static async CountTopUsers(topType) {
        return await Users_1.Users.count({
            where: {
                class: { [sequelize_1.Op.not]: Classes_1.ClassId.None },
                [topType]: { [sequelize_1.Op.gt]: 0 },
            },
        });
    }
    /**
     * Counts active players (with a class chosen).
     */
    static async CountActivePlayers() {
        return await Users_1.Users.count({
            where: { class: { [sequelize_1.Op.not]: Classes_1.ClassId.None } },
        });
    }
    /**
     * Counts all registered users.
     */
    static async CountAllUsers() {
        return await Users_1.Users.count();
    }
    /**
     * Counts prisoners.
     */
    static async CountPrisoners(date) {
        return await Users_1.Users.count({
            where: { prisonTime: { [sequelize_1.Op.gt]: date } },
        });
    }
    /**
     * Counts hospitalized users.
     */
    static async CountHospitalized(date) {
        return await Users_1.Users.count({
            where: { hospitalTime: { [sequelize_1.Op.gt]: date } },
        });
    }
    /**
     * Counts working users.
     */
    static async CountWorking(date) {
        return await Users_1.Users.count({
            where: {
                jobTime: { [sequelize_1.Op.gt]: date },
                jobId: { [sequelize_1.Op.ne]: null },
            },
        });
    }
    /**
     * Counts scavenging users.
     */
    static async CountScavenging(date) {
        return await Users_1.Users.count({
            where: {
                scavengeTime: { [sequelize_1.Op.gt]: date },
                scavengingId: { [sequelize_1.Op.ne]: null },
            },
        });
    }
    /**
     * Counts users currently in a casino game.
     */
    static async CountInCasinoGame() {
        return await Users_1.Users.count({
            where: { casinoIsInGame: true },
        });
    }
    /**
     * Counts users currently in a robbery.
     */
    static async CountInRobbery() {
        return await Users_1.Users.count({
            where: {
                [sequelize_1.Op.or]: [
                    { robbingUserId: { [sequelize_1.Op.ne]: null } },
                    { robbingLocationId: { [sequelize_1.Op.ne]: null } },
                ],
            },
        });
    }
    /**
     * Counts users in a beatup.
     */
    static async CountInBeatUp() {
        return await Users_1.Users.count({
            where: { beatingUserId: { [sequelize_1.Op.ne]: null } },
        });
    }
    /**
     * Counts all users by language.
     */
    static async CountPlayersByLanguage(language) {
        return await Users_1.Users.count({
            where: { language },
        });
    }
    /**
     * Counts users grouped by class.
     */
    static async CountGroupedByClass() {
        return await Users_1.Users.count({
            attributes: ["class"],
            group: ["class"],
            where: {
                class: {
                    [sequelize_1.Op.not]: Classes_1.ClassId.None,
                },
            },
        });
    }
    /**
     * Swaps two users across all database tables using a transaction.
     */
    static async SwapUsers(oldId, newId, tempId) {
        const transaction = await Database_1.sequelize.transaction();
        try {
            await Database_1.sequelize.query("PRAGMA defer_foreign_keys = ON", { transaction });
            const updates = [
                { tableName: Users_1.Users.tableName, column: "id" },
                { tableName: Users_1.Users.tableName, column: "robbingUserId" },
                { tableName: Users_1.Users.tableName, column: "beingRobbedByUserId" },
                { tableName: Users_1.Users.tableName, column: "beatingUserId" },
                { tableName: Users_1.Users.tableName, column: "beingBeatUpByUserId" },
                { tableName: UserItems_1.UserItems.tableName, column: "userId" },
                { tableName: UserBadges_1.default.tableName, column: "userId" },
                { tableName: UserInvestments_1.UserInvestments.tableName, column: "userId" },
                { tableName: UserBundles_1.default.tableName, column: "userId" },
                { tableName: UserAvatarDecorations_1.default.tableName, column: "userId" },
                { tableName: UserBackgroundDecorations_1.default.tableName, column: "userId" },
                { tableName: Notifications_1.Notifications.tableName, column: "userId" },
                { tableName: GangMembers_1.default.tableName, column: "userId" },
                { tableName: Gangs_1.default.tableName, column: "leaderId" },
                { tableName: HorseRaceBets_1.HorseRaceBets.tableName, column: "userId" },
                { tableName: LotteryTickets_1.LotteryTickets.tableName, column: "userId" },
                { tableName: RobHistories_1.RobHistories.tableName, column: "attackerId" },
                { tableName: RobHistories_1.RobHistories.tableName, column: "defenderId" },
            ];
            const details = [];
            for (const { tableName, column } of updates) {
                await Database_1.sequelize.query(`UPDATE ${tableName}
                     SET ${column} = :tempId
                     WHERE ${column} = :oldId`, { replacements: { oldId, tempId }, type: sequelize_1.QueryTypes.UPDATE, transaction });
                await Database_1.sequelize.query(`UPDATE ${tableName}
                     SET ${column} = :oldId
                     WHERE ${column} = :newId`, { replacements: { oldId, newId }, type: sequelize_1.QueryTypes.UPDATE, transaction });
                await Database_1.sequelize.query(`UPDATE ${tableName}
                     SET ${column} = :newId
                     WHERE ${column} = :tempId`, { replacements: { newId, tempId }, type: sequelize_1.QueryTypes.UPDATE, transaction });
                details.push(`- **${tableName}**: Swapped ${column}`);
            }
            await transaction.commit();
            return details;
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    /**
     * Finds all active users (who have chosen a class and are not dead/banned).
     */
    static async FindAllActive(attributes) {
        return await Users_1.Users.findAll({
            where: {
                class: {
                    [sequelize_1.Op.not]: Classes_1.ClassId.None,
                },
                [sequelize_1.Op.or]: [
                    { deadUntil: null },
                    { deadUntil: { [sequelize_1.Op.lte]: new Date() } },
                ],
            },
            attributes,
        });
    }
    /**
     * Searches and paginates users for admin panel.
     */
    static async SearchUsers(options) {
        const limit = Math.min(options.limit || 20, 100);
        const offset = options.offset || 0;
        const conditions = [];
        if (options.search) {
            conditions.push({
                [sequelize_1.Op.or]: [
                    { id: { [sequelize_1.Op.like]: `%${options.search}%` } },
                    { nickname: { [sequelize_1.Op.like]: `%${options.search}%` } },
                ],
            });
        }
        if (options.vipOnly) {
            conditions.push({
                [sequelize_1.Op.or]: {
                    vipTime: { [sequelize_1.Op.gt]: new Date() },
                    vipEternal: { [sequelize_1.Op.not]: false },
                },
            });
        }
        const allowedSortFields = ["nickname", "id", "createdAt", "updatedAt", "class", "situationId"];
        const sortByField = allowedSortFields.includes((options.sortBy ?? ""))
            ? options.sortBy
            : "updatedAt";
        const sortOrder = (options.sortOrder === "ASC" || options.sortOrder === "DESC") ? options.sortOrder : "DESC";
        const { rows, count } = await Users_1.Users.findAndCountAll({
            where: conditions.length ? { [sequelize_1.Op.and]: conditions } : {},
            limit,
            offset,
            order: [[sortByField, sortOrder]],
        });
        return { users: rows, total: count };
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=UserRepository.js.map