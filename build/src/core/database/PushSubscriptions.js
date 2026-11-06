"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushSubscriptions = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
class PushSubscriptions extends sequelize_1.Model {
}
exports.PushSubscriptions = PushSubscriptions;
PushSubscriptions.init({
    endpoint: {
        type: sequelize_1.DataTypes.STRING(1_024),
        primaryKey: true,
    },
    userId: {
        type: new sequelize_1.DataTypes.STRING(18),
        allowNull: false,
    },
    p256dh: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    auth: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize: Database_1.sequelize,
    tableName: "push_subscriptions",
    indexes: [{ fields: ["userId"] }],
});
//# sourceMappingURL=PushSubscriptions.js.map