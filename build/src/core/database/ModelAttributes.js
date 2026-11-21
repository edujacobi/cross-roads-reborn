"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIdAttribute = createIdAttribute;
exports.createTimestampAttributes = createTimestampAttributes;
const sequelize_1 = require("sequelize");
function createIdAttribute() {
    return {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
    };
}
function createTimestampAttributes() {
    return {
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        updatedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    };
}
//# sourceMappingURL=ModelAttributes.js.map