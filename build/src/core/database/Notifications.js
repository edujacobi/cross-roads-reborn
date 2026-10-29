"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notifications = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
class Notifications extends sequelize_1.Model {
}
exports.Notifications = Notifications;
Notifications.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: new sequelize_1.DataTypes.STRING(18),
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    date: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    notified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    sequelize: Database_1.sequelize,
    tableName: "notifications",
    indexes: [
        { fields: ["userId"] },
        { fields: ["notified"] },
    ],
});
//# sourceMappingURL=Notifications.js.map