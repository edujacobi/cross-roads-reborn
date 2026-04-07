import {
	type CreationOptional,
	DataTypes,
	type ForeignKey,
	type InferAttributes,
	type InferCreationAttributes,
	Model,
} from "sequelize";
import { sequelize } from "./Database";
import type { Users } from "./Users";

export class UserInvestments extends Model<
	InferAttributes<UserInvestments>,
	InferCreationAttributes<UserInvestments>
> {
	declare id: CreationOptional<number>;
	declare userId: ForeignKey<Users["id"]>;
	declare investmentId: number;
	declare accumulatedYield: CreationOptional<number>;
	declare accumulatedFee: CreationOptional<number>;
	declare henchmanEndsAt: CreationOptional<Date | null>;
	declare henchmanHospitalized: CreationOptional<boolean>;
	declare expiresAt: Date;
	declare lastYieldAt: CreationOptional<Date | null>;
	declare createdAt: CreationOptional<Date>;
}

UserInvestments.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		userId: {
			type: DataTypes.STRING(18),
			allowNull: false,
			unique: true, // Only 1 investment per active user
		},
		investmentId: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		accumulatedYield: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		accumulatedFee: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		henchmanEndsAt: {
			type: DataTypes.DATE,
			defaultValue: null,
		},
		henchmanHospitalized: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		expiresAt: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		lastYieldAt: {
			type: DataTypes.DATE,
			defaultValue: null,
		},
		createdAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: "userInvestments",
		indexes: [
			{ fields: ["userId"] },
		],
	},
);
