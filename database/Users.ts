import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";
import { JobId } from "../models/Job";

import { ClassId } from "../models/Class";
import { Language } from "../models/Language";

export class Users extends Model<
	InferAttributes<Users>,
	InferCreationAttributes<Users>
> {
	declare id: CreationOptional<string>;
	declare nickname: CreationOptional<string>;
	declare money: number;
	declare class: ClassId;
	declare language: Language;

	declare lastDailyReceived: Date | null;
	declare dailyStreak: number;
	declare maxDailyStreak: number;

	declare vipTime: CreationOptional<Date | null>;
	declare vipEternal: CreationOptional<boolean>;

	declare jobId: CreationOptional<JobId | null>;
	declare jobTime: CreationOptional<Date>;
	declare jobReceivedSum: number;
	declare jobReceivedCount: number;

	declare robberySuccessCount: number;
	declare robberyFailureCount: number;
	declare robberySuccessRobbedSum: number;
	declare robberyBeingRobbedCount: number;
	declare robberyBeingRobbedSum: number;
	declare robbingUserId: CreationOptional<string | null>;
	declare beingRobbedByUserId: CreationOptional<string | null>;

	declare prisonBriberySum: number;
	declare prisonBriberyCount: number;
	declare prisonTime: CreationOptional<Date>;

	declare escapeCount: number;
	declare escapeTime: CreationOptional<Date>;

	declare casinoWinCount: number;
	declare casinoLoseCount: number;
	declare casinoWinSum: number;
	declare casinoLoseSum: number;

	declare shopSpentSum: number;
	declare shopSpentCount: number;

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
		class: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		language: {
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
		jobReceivedSum: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		jobReceivedCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		robberySuccessCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		robberyFailureCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		robberyBeingRobbedCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		robberyBeingRobbedSum: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		robberySuccessRobbedSum: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
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
		prisonBriberySum: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		prisonBriberyCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		prisonTime: {
			type: DataTypes.DATE,
		},
		escapeCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		escapeTime: {
			type: DataTypes.DATE,
		},
		casinoWinCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		casinoLoseCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		casinoWinSum: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		casinoLoseSum: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		shopSpentSum: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		shopSpentCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: "users",
	},
);
