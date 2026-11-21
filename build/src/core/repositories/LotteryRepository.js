"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LotteryRepository = void 0;
const LotteryDraws_1 = require("#core/database/LotteryDraws");
const LotteryTickets_1 = require("#core/database/LotteryTickets");
const sequelize_1 = require("sequelize");
class LotteryRepository {
    // --- Lottery Draws ---
    static async FindDrawById(id) {
        return await LotteryDraws_1.LotteryDraws.findByPk(id);
    }
    static async FindNextDraw() {
        return await LotteryDraws_1.LotteryDraws.findOne({
            where: { isFinished: false },
            order: [["drawTime", "ASC"]],
        });
    }
    static async FindLastWinnerDraw() {
        return await LotteryDraws_1.LotteryDraws.findOne({
            where: {
                isFinished: true,
                winningTicketId: { [sequelize_1.Op.ne]: null },
            },
            order: [["drawTime", "DESC"]],
        });
    }
    static async FindDrawByTime(drawTime) {
        return await LotteryDraws_1.LotteryDraws.findOne({
            where: { drawTime },
        });
    }
    static async FindPendingDraws(date) {
        return await LotteryDraws_1.LotteryDraws.findAll({
            where: {
                drawTime: {
                    [sequelize_1.Op.lt]: date,
                },
                isFinished: false,
            },
        });
    }
    static async CreateDraw(values) {
        return await LotteryDraws_1.LotteryDraws.create(values);
    }
    static async UpdateDraw(id, values) {
        return await LotteryDraws_1.LotteryDraws.update(values, {
            where: { id },
        });
    }
    static async AddTicketToDraw(id, amount) {
        await LotteryDraws_1.LotteryDraws.increment({ totalTickets: 1, totalAmount: amount }, { where: { id } });
    }
    static async DestroyAllDraws() {
        return await LotteryDraws_1.LotteryDraws.destroy({
            where: {},
        });
    }
    // --- Lottery Tickets ---
    static async FindTicketById(id) {
        return await LotteryTickets_1.LotteryTickets.findByPk(id);
    }
    static async FindTicket(userId, drawId) {
        return await LotteryTickets_1.LotteryTickets.findOne({
            where: { userId, drawId },
        });
    }
    static async FindAllTicketsForDraw(drawId) {
        return await LotteryTickets_1.LotteryTickets.findAll({
            where: { drawId },
        });
    }
    static async CreateTicket(values) {
        return await LotteryTickets_1.LotteryTickets.create(values);
    }
    static async UpdateTicket(id, values) {
        return await LotteryTickets_1.LotteryTickets.update(values, {
            where: { id },
        });
    }
    static async DestroyAllTickets() {
        return await LotteryTickets_1.LotteryTickets.destroy({
            where: {},
        });
    }
}
exports.LotteryRepository = LotteryRepository;
//# sourceMappingURL=LotteryRepository.js.map