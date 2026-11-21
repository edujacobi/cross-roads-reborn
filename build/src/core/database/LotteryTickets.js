"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LotteryTickets = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
const LotteryDraws_1 = require("./LotteryDraws");
const ModelAttributes_1 = require("./ModelAttributes");
class LotteryTickets extends sequelize_1.Model {
}
exports.LotteryTickets = LotteryTickets;
LotteryTickets.init({
    ...(0, ModelAttributes_1.createIdAttribute)(),
    userId: {
        type: new sequelize_1.DataTypes.STRING(18),
        allowNull: false,
        references: {
            model: "users",
            key: "id",
        },
    },
    drawId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "lottery_draws",
            key: "id",
        },
    },
    amount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    hasWon: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
    },
    winnings: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    ...(0, ModelAttributes_1.createTimestampAttributes)(),
}, {
    sequelize: Database_1.sequelize,
    tableName: "lottery_tickets",
    indexes: [
        { fields: ["userId"] },
        { fields: ["drawId"] },
    ],
});
// Define associations
LotteryTickets.belongsTo(LotteryDraws_1.LotteryDraws, { foreignKey: "drawId" });
LotteryDraws_1.LotteryDraws.hasMany(LotteryTickets, { foreignKey: "drawId" });
//# sourceMappingURL=LotteryTickets.js.map