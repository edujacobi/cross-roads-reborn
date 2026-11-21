"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vault = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
const ModelAttributes_1 = require("./ModelAttributes");
class Vault extends sequelize_1.Model {
}
exports.Vault = Vault;
Vault.init({
    ...(0, ModelAttributes_1.createIdAttribute)(),
    bankBalance: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 50_000_000,
    },
    casinoBalance: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 25_000_000,
    },
    mainHeistAllowed: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize: Database_1.sequelize,
    tableName: "vaults",
    timestamps: false,
});
exports.default = Vault;
//# sourceMappingURL=Vault.js.map