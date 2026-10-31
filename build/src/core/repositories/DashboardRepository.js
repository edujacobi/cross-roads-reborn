"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardRepository = void 0;
const DashboardStats_1 = require("#core/database/DashboardStats");
const Database_1 = require("#core/database/Database");
const sequelize_1 = require("sequelize");
class DashboardRepository {
    static async EnsureDashboardStatsColumns() {
        const columns = await Database_1.sequelize.getQueryInterface().describeTable("dashboard_stats");
        if (!("allUsers" in columns)) {
            await Database_1.sequelize.getQueryInterface().addColumn("dashboard_stats", "allUsers", {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
            });
        }
        if (!("classCounts" in columns)) {
            await Database_1.sequelize.getQueryInterface().addColumn("dashboard_stats", "classCounts", {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            });
        }
    }
    static async Create(values) {
        return await DashboardStats_1.DashboardStats.create(values);
    }
    static async GetLast30Days() {
        return await DashboardStats_1.DashboardStats.findAll({
            order: [["date", "DESC"]],
            limit: 30,
        });
    }
}
exports.DashboardRepository = DashboardRepository;
//# sourceMappingURL=DashboardRepository.js.map