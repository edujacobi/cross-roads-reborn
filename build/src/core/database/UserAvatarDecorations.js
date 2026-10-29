"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAvatarDecorations = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
class UserAvatarDecorations extends sequelize_1.Model {
}
exports.UserAvatarDecorations = UserAvatarDecorations;
UserAvatarDecorations.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: new sequelize_1.DataTypes.STRING(18),
        allowNull: false,
    },
    avatarDecorationId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize: Database_1.sequelize,
    tableName: "useravatardecorations",
    indexes: [
        { fields: ["userId"] },
    ],
});
exports.default = UserAvatarDecorations;
//# sourceMappingURL=UserAvatarDecorations.js.map