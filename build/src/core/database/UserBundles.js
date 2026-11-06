"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBundles = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
const ModelAttributes_1 = require("./ModelAttributes");
class UserBundles extends sequelize_1.Model {
}
exports.UserBundles = UserBundles;
UserBundles.init({
    ...(0, ModelAttributes_1.createIdAttribute)(),
    userId: {
        type: new sequelize_1.DataTypes.STRING(18),
        allowNull: false,
    },
    bundleId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize: Database_1.sequelize,
    tableName: "userbundles",
    indexes: [
        { fields: ["userId"] },
    ],
});
exports.default = UserBundles;
//# sourceMappingURL=UserBundles.js.map