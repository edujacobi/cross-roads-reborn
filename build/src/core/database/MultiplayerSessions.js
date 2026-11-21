"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiplayerSessions = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
class MultiplayerSessions extends sequelize_1.Model {
}
exports.MultiplayerSessions = MultiplayerSessions;
MultiplayerSessions.init({
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    kind: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    ownerId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    targetId: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    gangId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    participantIds: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    phase: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    status: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    expiresAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    result: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    sequelize: Database_1.sequelize,
    tableName: "multiplayerSessions",
    timestamps: false,
    indexes: [
        { fields: ["status", "expiresAt"] },
        { fields: ["targetId", "status"] },
    ],
});
exports.default = MultiplayerSessions;
//# sourceMappingURL=MultiplayerSessions.js.map