"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBadges = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
const ModelAttributes_1 = require("./ModelAttributes");
class UserBadges extends sequelize_1.Model {
}
exports.UserBadges = UserBadges;
UserBadges.init({
    ...(0, ModelAttributes_1.createIdAttribute)(),
    userId: {
        type: new sequelize_1.DataTypes.STRING(18),
        allowNull: false,
    },
    badgeId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize: Database_1.sequelize,
    tableName: "userbadges",
    indexes: [
        { fields: ["userId"] },
    ],
});
exports.default = UserBadges;
//# sourceMappingURL=UserBadges.js.map