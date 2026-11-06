"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimedActions = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
class TimedActions extends sequelize_1.Model {
}
exports.TimedActions = TimedActions;
TimedActions.init({
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    userId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    kind: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    referenceId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    dueAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    result: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
}, {
    sequelize: Database_1.sequelize,
    tableName: "timedActions",
    timestamps: false,
    indexes: [{ fields: ["userId", "kind"], unique: true }, { fields: ["dueAt"], where: { result: null } }],
});
//# sourceMappingURL=TimedActions.js.map