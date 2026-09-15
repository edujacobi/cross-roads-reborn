import { type CreationOptional, DataTypes, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";

export class Seasons extends Model<
	InferAttributes<Seasons>,
	InferCreationAttributes<Seasons>
> {
	declare id: CreationOptional<number>;
	declare number: number;
	declare startDate: Date;
	declare endDate: Date;
	declare topData: CreationOptional<string>; // JSON string of snapshot leaderboards
	declare howManyPlayers: CreationOptional<number>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
}

Seasons.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		number: {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: true,
		},
		startDate: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		endDate: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		// ponytail: single consolidated JSON column for all 14 seasonal ranking snapshots
		topData: {
			type: DataTypes.TEXT,
			allowNull: false,
			defaultValue: "{}",
		},
		howManyPlayers: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: "seasons",
		indexes: [
			{ fields: ["number"] },
		],
	},
);
