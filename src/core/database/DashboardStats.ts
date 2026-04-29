import { type CreationOptional, DataTypes, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";

export class DashboardStats extends Model<
	InferAttributes<DashboardStats>,
	InferCreationAttributes<DashboardStats>
> {
	declare id: CreationOptional<number>;
	declare date: Date;
	declare totalPlayers: number;
	declare totalGangs: number;
	declare prisonCount: number;
	declare hospitalCount: number;
	declare jobCount: number;
	declare scavengeCount: number;
	declare casinoCount: number;
	declare robberyCount: number;
	declare beatUpCount: number;
	declare idleCount: number;

	declare englishCount: number;
	declare portugueseCount: number;
	declare spanishCount: number;
}

DashboardStats.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		date: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		totalPlayers: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		totalGangs: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		prisonCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		hospitalCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		jobCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		scavengeCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		casinoCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		robberyCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		beatUpCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		idleCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		englishCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		portugueseCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		spanishCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	},
	{
		sequelize,
		tableName: "dashboard_stats",
		timestamps: false,
	},
);

export default DashboardStats;
