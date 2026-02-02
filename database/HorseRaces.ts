import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";

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
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
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
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		updatedAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
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