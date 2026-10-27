import { DashboardStats } from "#core/database/DashboardStats";
import { type InferCreationAttributes, type Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";
export declare class DashboardRepository {
    static EnsureDashboardStatsColumns(): Promise<void>;
    static Create(values: Optional<InferCreationAttributes<DashboardStats>, NullishPropertiesOf<InferCreationAttributes<DashboardStats>>>): Promise<DashboardStats>;
    static GetLast30Days(): Promise<DashboardStats[]>;
}
