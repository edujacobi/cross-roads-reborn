import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";
import { JobId } from "../models/Job";

export class Users extends Model<
	InferAttributes<Users>,
	InferCreationAttributes<Users>
> {
	declare id: CreationOptional<string>;
	declare nickname: CreationOptional<string>;
	declare money: number;
	declare lastDailyReceived: Date | null;
	declare dailyStreak: number;
	declare maxDailyStreak: number;
	declare vipTime: CreationOptional<Date | null>;
	declare vipEternal: CreationOptional<boolean>;
	declare jobId: CreationOptional<JobId | null>;
	declare jobTime: CreationOptional<Date>;
	declare robbingUserId: CreationOptional<string | null>;
	declare beingRobbedByUserId: CreationOptional<string | null>;
	declare prisonTime: CreationOptional<Date>;
	declare escapeTime: CreationOptional<Date>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
}

Users.init(
	{
		id: {
			type: new DataTypes.STRING(18),
			primaryKey: true,
		},
		nickname: {
			type: DataTypes.STRING(18),
			allowNull: true,
		},
		money: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		lastDailyReceived: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: null,
		},
		dailyStreak: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		maxDailyStreak: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		vipTime: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: null,
		},
		vipEternal: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		jobId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: null,
		},
		jobTime: {
			type: DataTypes.DATE,
		},
		robbingUserId: {
			type: DataTypes.STRING(18),
			allowNull: true,
			defaultValue: null,
		},
		beingRobbedByUserId: {
			type: DataTypes.STRING(18),
			allowNull: true,
			defaultValue: null,
		},
		prisonTime: {
			type: DataTypes.DATE,
		},
		escapeTime: {
			type: DataTypes.DATE,
		},
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: "users",
	},
);
