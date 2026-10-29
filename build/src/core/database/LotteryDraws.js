"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LotteryDraws = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
class LotteryDraws extends sequelize_1.Model {
}
exports.LotteryDraws = LotteryDraws;
LotteryDraws.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    drawTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    winningTicketId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
    totalTickets: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    totalAmount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    isFinished: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: Database_1.sequelize,
    tableName: "lottery_draws",
    indexes: [
        { fields: ["drawTime"] },
        { fields: ["isFinished"] },
    ],
});
//# sourceMappingURL=LotteryDraws.js.map