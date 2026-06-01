import { type CreationOptional, DataTypes, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";
import type { JobId } from "#core/types/Jobs";

import type { ClassId } from "#core/types/Classes";
import type { Language } from "#core/models/Language";
import type { LocationId } from "#core/types/Locations";
import type { ScavengeId } from "#core/types/Scavenge";
import type { AvatarDecorationId, BackgroundDecorationId } from "#core/types/Ids";

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
	declare nicknameChangeCount: number;
	declare classChangeCount: number;

	declare vipTime: CreationOptional<Date | null>;
	declare vipEternal: CreationOptional<boolean>;

	declare specialCoin: number;
	declare avatarDecoration: AvatarDecorationId;
	declare backgroundDecoration: BackgroundDecorationId;

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
	declare robbingLocationId: CreationOptional<LocationId | null>;
	declare robberyInvestmentDefending: boolean;
	declare robberyParticipatingInGangAction: boolean;

	declare beatUpSuccessCount: number;
	declare beatUpFailureCount: number;
	declare beatUpBeatedUpCount: number;
	declare beatingUserId: CreationOptional<string | null>;
	declare beingBeatUpByUserId: CreationOptional<string | null>;
	declare beatUpTime: CreationOptional<Date>;

	declare prisonCount: number;
	declare prisonBriberySum: number;
	declare prisonBriberyCount: number;
	declare prisonHasPaidBribe: boolean;
	declare prisonTime: CreationOptional<Date>;

	declare escapeCount: number;
	declare escapeTime: CreationOptional<Date>;
	declare escapeHasTried: boolean;

	declare wantedCount: number;
	declare wantedTime: CreationOptional<Date>;

	declare hospitalCount: number;
	declare hospitalTime: CreationOptional<Date>;
	declare hospitalTreatmentCount: number;
	declare hospitalTreatmentSum: number;

	declare casinoIsInGame: boolean;
	declare casinoWinCount: number;
	declare casinoLoseCount: number;
	declare casinoWinSum: number;
	declare casinoLoseSum: number;

	declare shopSpentSum: number;
	declare shopSpentCount: number;

	declare almsGiveTime: CreationOptional<Date>;
	declare almsReceiveTime: CreationOptional<Date>;
	declare almsGivenSum: number;
	declare almsGivenCount: number;
	declare almsReceivedSum: number;
	declare almsReceivedCount: number;

	declare scavengingId: CreationOptional<ScavengeId | null>;
	declare scavengeCount: number;
	declare scavengeTime: CreationOptional<Date>;
	declare scavengeFoundTotal: number;
	declare scavengeFoundItems: number;
	declare scavengeMoneyCount: number;
	declare scavengeMoneySum: number;
	declare scavengeFailures: number;
	declare scavengeFailureWithHospital: number;
	declare scavengeFailureWithPrison: number;

	declare drinkNormal: number;
	declare drinkHappyHour: number;
	declare drunkCount: number;

	declare notifyInvestmentYield: boolean;
	declare investmentTotalProfit: number;

	declare lastVoteClaim: CreationOptional<Date | null>;
	declare voteCount: number;

	declare automaticGrenade: boolean;

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
		nicknameChangeCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		classChangeCount: {
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
		specialCoin: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		avatarDecoration: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		backgroundDecoration: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
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
		robbingLocationId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: null,
		},
		robberyInvestmentDefending: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		robberyParticipatingInGangAction: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		beatUpSuccessCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		beatUpFailureCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		beatUpBeatedUpCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		beatingUserId: {
			type: DataTypes.STRING(18),
			allowNull: true,
			defaultValue: null,
		},
		beingBeatUpByUserId: {
			type: DataTypes.STRING(18),
			allowNull: true,
			defaultValue: null,
		},
		beatUpTime: {
			type: DataTypes.DATE,
		},
		prisonCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
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
		prisonHasPaidBribe: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
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
		escapeHasTried: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		wantedCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		wantedTime: {
			type: DataTypes.DATE,
		},
		hospitalCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		hospitalTime: {
			type: DataTypes.DATE,
		},
		hospitalTreatmentCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		hospitalTreatmentSum: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		casinoIsInGame: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
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
		almsGiveTime: {
			type: DataTypes.DATE,
		},
		almsReceiveTime: {
			type: DataTypes.DATE,
		},
		almsGivenSum: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		almsGivenCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		almsReceivedSum: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		almsReceivedCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		scavengingId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: null,
		},
		scavengeCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		scavengeTime: {
			type: DataTypes.DATE,
		},
		scavengeFoundTotal: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		scavengeFoundItems: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		scavengeMoneyCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		scavengeMoneySum: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		scavengeFailures: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		scavengeFailureWithHospital: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		scavengeFailureWithPrison: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		drinkNormal: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		drinkHappyHour: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		drunkCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		notifyInvestmentYield: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		},
		investmentTotalProfit: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		lastVoteClaim: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: null,
		},
		voteCount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		automaticGrenade: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: "users",
		indexes: [
			{ fields: ["money"] },
			{ fields: ["casinoWinSum"] },
			{ fields: ["shopSpentSum"] },
			{ fields: ["robberySuccessRobbedSum"] },
			{ fields: ["jobReceivedSum"] },
			{ fields: ["drinkHappyHour"] },
			{ fields: ["beatUpSuccessCount"] },
			{ fields: ["scavengeFoundTotal"] },
			{ fields: ["hospitalTreatmentSum"] },
			{ fields: ["prisonBriberySum"] },
			{ fields: ["escapeCount"] },
			{ fields: ["investmentTotalProfit"] },
		],
	},
);
