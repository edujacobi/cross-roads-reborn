import { type CreationOptional, DataTypes, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";
import { HorseRaces } from "./HorseRaces";

export class HorseRaceBets extends Model<
	InferAttributes<HorseRaceBets>,
	InferCreationAttributes<HorseRaceBets>
> {
	declare id: CreationOptional<number>;
	declare userId: string;
	declare raceId: number;
	declare horseNumber: number;
	declare amount: number;
	declare hasWon: CreationOptional<boolean | null>;
	declare winnings: CreationOptional<number>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
}

HorseRaceBets.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		userId: {
			type: new DataTypes.STRING(18),
			allowNull: false,
			references: {
				model: "users",
				key: "id",
			},
		},
		raceId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: "horse_races",
				key: "id",
			},
		},
		horseNumber: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		amount: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		hasWon: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
			defaultValue: null,
		},
		winnings: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
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
		tableName: "horse_race_bets",
		indexes: [
			{ fields: ["userId"] },
			{ fields: ["raceId"] },
		],
	},
);

// Define associations
HorseRaceBets.belongsTo(HorseRaces, { foreignKey: "raceId" });
HorseRaces.hasMany(HorseRaceBets, { foreignKey: "raceId" });