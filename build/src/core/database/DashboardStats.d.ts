import { type CreationOptional, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
export declare class DashboardStats extends Model<InferAttributes<DashboardStats>, InferCreationAttributes<DashboardStats>> {
    id: CreationOptional<number>;
    date: Date;
    totalPlayers: number;
    allUsers: number | null;
    classCounts: string | null;
    totalGangs: number;
    prisonCount: number;
    hospitalCount: number;
    jobCount: number;
    scavengeCount: number;
    casinoCount: number;
    robberyCount: number;
    beatUpCount: number;
    idleCount: number;
    englishCount: number;
    portugueseCount: number;
    spanishCount: number;
}
export default DashboardStats;
