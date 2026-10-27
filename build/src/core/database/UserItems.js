"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserItems = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
class UserItems extends sequelize_1.Model {
}
exports.UserItems = UserItems;
UserItems.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: new sequelize_1.DataTypes.STRING(18),
        allowNull: false,
    },
    itemId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    remainingTime: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: null,
    },
    quantity: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: null,
    },
    skin: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize: Database_1.sequelize,
    tableName: "userItems",
    indexes: [
        { fields: ["userId"] },
        { fields: ["itemId"] },
    ],
});
//# sourceMappingURL=UserItems.js.map