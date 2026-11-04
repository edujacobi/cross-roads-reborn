import { type CreationOptional, DataTypes, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";
import { createIdAttribute, createTimestampAttributes } from "./ModelAttributes";

export class HorseRaces extends Model<
	InferAttributes<HorseRaces>,
	InferCreationAttributes<HorseRaces>
> {
	declare id: CreationOptional<number>;
	declare raceTime: Date;
	declare winningHorse: CreationOptional<number | null>;
	declare totalBets: CreationOptional<number>;
	declare totalAmount: CreationOptional<number>;
	declare isFinished: CreationOptional<boolean>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
}

HorseRaces.init(
	{
		...createIdAttribute(),
		raceTime: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		winningHorse: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: null,
		},
		totalBets: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		totalAmount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		isFinished: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		...createTimestampAttributes(),
	},
	{
		sequelize,
		tableName: "horse_races",
		indexes: [
			{ fields: ["raceTime"] },
			{ fields: ["isFinished"] },
		],
	},
);