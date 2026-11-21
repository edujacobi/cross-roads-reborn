"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBackgroundDecorations = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
const ModelAttributes_1 = require("./ModelAttributes");
class UserBackgroundDecorations extends sequelize_1.Model {
}
exports.UserBackgroundDecorations = UserBackgroundDecorations;
UserBackgroundDecorations.init({
    ...(0, ModelAttributes_1.createIdAttribute)(),
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