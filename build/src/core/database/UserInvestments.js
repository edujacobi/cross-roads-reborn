"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserInvestments = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
const ModelAttributes_1 = require("./ModelAttributes");
class UserInvestments extends sequelize_1.Model {
}
exports.UserInvestments = UserInvestments;
UserInvestments.init({
    ...(0, ModelAttributes_1.createIdAttribute)(),
    userId: {
        type: sequelize_1.DataTypes.STRING(18),
        allowNull: false,
        unique: true, // Only 1 investment per active user
    },
    investmentId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    accumulatedYield: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    accumulatedFee: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    henchmanEndsAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: null,
    },
    henchmanHospitalized: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    expiresAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    lastYieldAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: null,
    },
    createdAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: Database_1.sequelize,
    tableName: "userInvestments",
    indexes: [
        { fields: ["userId"] },
    ],
});
//# sourceMappingURL=UserInvestments.js.map