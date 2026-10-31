"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GangJoinRequests = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
class GangJoinRequests extends sequelize_1.Model {
}
exports.GangJoinRequests = GangJoinRequests;
GangJoinRequests.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    gangId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "gangs",
            key: "id",
        },
        onDelete: "CASCADE",
    },
    userId: {
        type: new sequelize_1.DataTypes.STRING(18),
        allowNull: false,
        references: {
            model: "users",
            key: "id",
        },
        onDelete: "CASCADE",
    },
    message: {
        type: sequelize_1.DataTypes.STRING(280),
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "PENDING",
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: Database_1.sequelize,
    tableName: "gang_join_requests",
    indexes: [
        { fields: ["gangId", "status"] },
        { fields: ["userId", "status"] },
        { fields: ["createdAt"] },
    ],
});
exports.default = GangJoinRequests;
//# sourceMappingURL=GangJoinRequests.js.map