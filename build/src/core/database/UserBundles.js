"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBundles = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
class UserBundles extends sequelize_1.Model {
}
exports.UserBundles = UserBundles;
UserBundles.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
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