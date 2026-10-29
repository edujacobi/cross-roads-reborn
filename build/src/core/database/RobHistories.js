"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RobHistories = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
class RobHistories extends sequelize_1.Model {
}
exports.RobHistories = RobHistories;
RobHistories.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    attackerId: {
        type: new sequelize_1.DataTypes.STRING(18),
        allowNull: false,
    },
    defenderId: {
        type: new sequelize_1.DataTypes.STRING(18),
    },
    locationId: {
        type: sequelize_1.DataTypes.INTEGER,
    },
    success: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    money: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    type: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: Database_1.sequelize,
    tableName: "robHistory",
    indexes: [
        { fields: ["attackerId"] },
        { fields: ["defenderId"] },
        { fields: ["createdAt"] },
    ],
});
//# sourceMappingURL=RobHistories.js.map