"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Events = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
class Events extends sequelize_1.Model {
}
exports.Events = Events;
Events.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    type: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    value: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    periodStart: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    periodEnd: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: Database_1.sequelize,
    tableName: "events",
    indexes: [
        { fields: ["type"] },
        { fields: ["periodStart"] },
        { fields: ["periodEnd"] },
    ],
});
//# sourceMappingURL=Events.js.map