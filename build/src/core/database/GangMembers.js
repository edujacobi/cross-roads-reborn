"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GangMembers = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
const Users_1 = require("./Users");
const Gangs_1 = require("./Gangs");
class GangMembers extends sequelize_1.Model {
}
exports.GangMembers = GangMembers;
GangMembers.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    gangId: {
        type: sequelize_1.DataTypes.INTEGER,
        references: {
            model: Gangs_1.Gangs,
            key: "id",
        },
        allowNull: false,
    },
    userId: {
        type: new sequelize_1.DataTypes.STRING(18),
        references: {
            model: Users_1.Users,
            key: "id",
        },
        allowNull: false,
        unique: true, // Um usuário só pode estar em uma gangue
    },
    roleId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1, // Membro comum por padrão
    },
    joinedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    depositTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    depositAmount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    sequelize: Database_1.sequelize,
    tableName: "gangmembers",
    timestamps: false,
    indexes: [
        { fields: ["gangId"] },
    ],
});
// Uma gangue tem muitos membros
Gangs_1.Gangs.hasMany(GangMembers, { foreignKey: "gangId", as: "GangMembers" });
// Um membro pertence a uma gangue
GangMembers.belongsTo(Gangs_1.Gangs, { foreignKey: "gangId", as: "Gang" });
exports.default = GangMembers;
//# sourceMappingURL=GangMembers.js.map