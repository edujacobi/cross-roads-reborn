import { DashboardStats } from "#core/database/DashboardStats";
import type { InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";

export class DashboardRepository {
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
