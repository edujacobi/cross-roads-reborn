"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RobHistoryRepository = void 0;
const RobHistories_1 = require("#core/database/RobHistories");
const Language_1 = require("#core/models/Language");
const Locations_1 = require("#core/types/Locations");
const Robbery_1 = require("#core/types/Robbery");
const log_1 = require("#shared/log");
const sequelize_1 = require("sequelize");
const TimedActionRepository_1 = require("./TimedActionRepository");
class RobHistoryRepository {
    /**
     * Counts how many robberies/beat ups a user was involved in.
     */
    static async Count(userId) {
        return await RobHistories_1.RobHistories.count({
            where: {
                [sequelize_1.Op.or]: [{ attackerId: userId }, { defenderId: userId }],
            },
        });
    }
    /**
     * Gets a page of robbery/beat up history for a user.
     */
    static async GetList(userId, limit, offset) {
        return await RobHistories_1.RobHistories.findAll({
            limit,
            order: [["createdAt", "DESC"]],
            offset,
            where: {
                [sequelize_1.Op.or]: [{ attackerId: userId }, { defenderId: userId }],
            },
        });
    }
    /**
     * Creates a history record for a user-to-user robbery.
     */
    static async CreateUserRobberyHistory(robbery) {
        try {
            await RobHistories_1.RobHistories.create({
                attackerId: robbery.Attacker.Id,
                defenderId: robbery.Defender.Id,
                success: robbery.Success,
                money: robbery.MoneyRobbed,
                type: robbery.Type,
            });
            log_1.Log.Success(`Robbery History for ${robbery.Attacker.Nickname} (Id: ${robbery.Attacker.Id}) and ${robbery.Defender.Nickname} (Id: ${robbery.Defender.Id}) added successfully.`);
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong with adding Robbery History for ${robbery.Attacker.Nickname} (Id: ${robbery.Attacker.Id}) and ${robbery.Defender.Nickname} (Id: ${robbery.Defender.Id}).`);
        }
    }
    /**
     * Creates a history record for a location robbery.
     */
    static async CreateLocationHistory(robbery) {
        try {
            await RobHistories_1.RobHistories.create({
                attackerId: robbery.Attacker.Id,
                locationId: robbery.LocationId,
                success: robbery.Success,
                money: robbery.MoneyRobbed,
                type: robbery.Type,
            }, { transaction: TimedActionRepository_1.actionTransaction.getStore() });
            log_1.Log.Success(`Robbery History for ${robbery.Attacker.Nickname} (Id: ${robbery.Attacker.Id}) and ${Locations_1.LocationList[robbery.LocationId].Name[Language_1.Language.English]} (Id: ${robbery.LocationId}) added successfully.`);
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong with adding Robbery History for ${robbery.Attacker.Nickname} (Id: ${robbery.Attacker.Id}) and ${Locations_1.LocationList[robbery.LocationId].Name[Language_1.Language.English]} (Id: ${robbery.LocationId}).`);
            if (TimedActionRepository_1.actionTransaction.getStore())
                throw err;
        }
    }
    /**
     * Creates a history record for a beat up.
     */
    static async CreateUserBeatUpHistory(beatup) {
        try {
            await RobHistories_1.RobHistories.create({
                attackerId: beatup.Attacker.Id,
                defenderId: beatup.Defender.Id,
                success: beatup.Success,
                money: 0,
                type: Robbery_1.ClashType.BeatUp,
            });
            log_1.Log.Success(`Beat Up History for ${beatup.Attacker.Nickname} (Id: ${beatup.Attacker.Id}) and ${beatup.Defender.Nickname} (Id: ${beatup.Defender.Id}) added successfully.`);
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong with adding Beat Up History for ${beatup.Attacker.Nickname} (Id: ${beatup.Attacker.Id}) and ${beatup.Defender.Nickname} (Id: ${beatup.Defender.Id}).`);
        }
    }
    /**
     * Bulk creates history records for an investment robbery.
     */
    static async CreateInvestmentHistory(robbery, win, robbedAmount) {
        try {
            const histories = Array.from(robbery.Participants.values()).map(participant => ({
                attackerId: participant.Id,
                defenderId: robbery.Target.Id,
                locationId: robbery.InvestmentBase?.Id,
                success: win,
                money: Math.floor(robbedAmount / robbery.Participants.size),
                type: Robbery_1.ClashType.Investment,
            }));
            await RobHistories_1.RobHistories.bulkCreate(histories);
            log_1.Log.Success(`Investment Robbery History for Gang ${robbery.Gang.Name} and target ${robbery.Target.Nickname} (Id: ${robbery.Target.Id}) added successfully.`);
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong with adding Investment Robbery History for Gang ${robbery.Gang.Name} and target ${robbery.Target.Nickname} (Id: ${robbery.Target.Id}). ${err}`);
        }
    }
    /**
     * Count of all robbery history records.
     */
    static async CountAll() {
        return await RobHistories_1.RobHistories.count();
    }
    /**
     * Erases all robbery history records.
     */
    static async DestroyAll() {
        return await RobHistories_1.RobHistories.destroy({ where: {} });
    }
}
exports.RobHistoryRepository = RobHistoryRepository;
//# sourceMappingURL=RobHistoryRepository.js.map