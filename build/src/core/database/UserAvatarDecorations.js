"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAvatarDecorations = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
const ModelAttributes_1 = require("./ModelAttributes");
class UserAvatarDecorations extends sequelize_1.Model {
}
exports.UserAvatarDecorations = UserAvatarDecorations;
UserAvatarDecorations.init({
    ...(0, ModelAttributes_1.createIdAttribute)(),
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