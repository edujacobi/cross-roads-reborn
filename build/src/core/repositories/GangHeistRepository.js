"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GangHeistRepository = void 0;
const GangHeists_1 = require("#core/database/GangHeists");
class GangHeistRepository {
    /**
     * Gets the heist state for a gang. If none exists, creates it.
     */
    static async GetByGangId(gangId) {
        const [instance] = await GangHeists_1.GangHeists.findOrCreate({
            where: { gangId },
            defaults: {
                gangId,
                heistCooldownUntil: null,
                mission1Completed: false,
                mission1CooldownUntil: null,
                mission2Completed: false,
                mission2CooldownUntil: null,
                mission3Completed: false,
                mission3CooldownUntil: null,
                heistWins: 0,
                heistLosses: 0,
                totalStolen: 0,
            },
        });
        return instance;
    }
    /**
     * Updates the heist state for a gang.
     */
    static async Update(gangId, values) {
        await GangHeists_1.GangHeists.update(values, {
            where: { gangId },
        });
    }
}
exports.GangHeistRepository = GangHeistRepository;
//# sourceMappingURL=GangHeistRepository.js.map