import { DashboardStats } from "#core/database/DashboardStats";
import { sequelize } from "#core/database/Database";
import { DataTypes, type InferCreationAttributes, type Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";

export class DashboardRepository {
	static async EnsureAllUsersColumn(): Promise<void> {
		const columns = await sequelize.getQueryInterface().describeTable("dashboard_stats");
		if (!("allUsers" in columns)) {
			await sequelize.getQueryInterface().addColumn("dashboard_stats", "allUsers", {
				type: DataTypes.INTEGER,
				allowNull: true,
			});
		}
	}

	static async Create(
		values: Optional<InferCreationAttributes<DashboardStats>, NullishPropertiesOf<InferCreationAttributes<DashboardStats>>>
	): Promise<DashboardStats> {
		return await DashboardStats.create(values);
	}

	static async GetLast30Days(): Promise<DashboardStats[]> {
		return await DashboardStats.findAll({
			order: [["date", "DESC"]],
			limit: 30,
		});
	}
}
