"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBackgroundDecorations = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
class UserBackgroundDecorations extends sequelize_1.Model {
}
exports.UserBackgroundDecorations = UserBackgroundDecorations;
UserBackgroundDecorations.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: new sequelize_1.DataTypes.STRING(18),
        allowNull: false,
    },
    backgroundDecorationId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize: Database_1.sequelize,
    tableName: "userbackgrounddecorations",
    indexes: [
        { fields: ["userId"] },
    ],
});
exports.default = UserBackgroundDecorations;
//# sourceMappingURL=UserBackgroundDecorations.js.map