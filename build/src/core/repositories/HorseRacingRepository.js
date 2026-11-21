"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HorseRacingRepository = void 0;
const HorseRaces_1 = require("#core/database/HorseRaces");
const HorseRaceBets_1 = require("#core/database/HorseRaceBets");
const sequelize_1 = require("sequelize");
class HorseRacingRepository {
    // --- Horse Races ---
    static async FindRaceById(id) {
        return await HorseRaces_1.HorseRaces.findByPk(id);
    }
    static async FindNextRace() {
        return await HorseRaces_1.HorseRaces.findOne({
            where: { isFinished: false },
            order: [["raceTime", "ASC"]],
        });
    }
    static async FindPreviousRace(currentRaceId) {
        return await HorseRaces_1.HorseRaces.findOne({
            where: { id: { [sequelize_1.Op.lt]: currentRaceId }, isFinished: true },
            order: [["id", "DESC"]],
        });
    }
    static async FindPendingRaces(date) {
        return await HorseRaces_1.HorseRaces.findAll({
            where: { raceTime: { [sequelize_1.Op.lt]: date }, isFinished: false },
        });
    }
    static async CreateRace(values) {
        return await HorseRaces_1.HorseRaces.create(values);
    }
    static async UpdateRace(id, values) {
        return await HorseRaces_1.HorseRaces.update(values, {
            where: { id },
        });
    }
    static async AddBetToRace(id, amount) {
        await HorseRaces_1.HorseRaces.increment({ totalBets: 1, totalAmount: amount }, { where: { id } });
    }
    static async DestroyAllRaces() {
        return await HorseRaces_1.HorseRaces.destroy({
            where: {},
        });
    }
    // --- Horse Race Bets ---
    static async FindBetById(id) {
        return await HorseRaceBets_1.HorseRaceBets.findByPk(id);
    }
    static async FindBet(userId, raceId) {
        return await HorseRaceBets_1.HorseRaceBets.findOne({
            where: { userId, raceId },
        });
    }
    static async FindBetsForRace(raceId) {
        return await HorseRaceBets_1.HorseRaceBets.findAll({
            where: { raceId },
        });
    }
    static async CreateBet(values) {
        return await HorseRaceBets_1.HorseRaceBets.create(values);
    }
    static async UpdateBet(id, values) {
        return await HorseRaceBets_1.HorseRaceBets.update(values, {
            where: { id },
        });
    }
    static async DestroyAllBets() {
        return await HorseRaceBets_1.HorseRaceBets.destroy({
            where: {},
        });
    }
}
exports.HorseRacingRepository = HorseRacingRepository;
//# sourceMappingURL=HorseRacingRepository.js.map