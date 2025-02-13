import { DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";
import { Users } from "./Users";

export class Badges extends Model<
	InferAttributes<Badges>,
	InferCreationAttributes<Badges>
> {
	declare userId: ForeignKey<Users["id"]>;
	declare description: string;
	declare descriptionLong: string;
	declare emoji: string;
}

// TODO REFAZER SISTEMA DE BADGES
Badges.init(
	{
		userId: {
			type: new DataTypes.STRING(18),
			allowNull: false,
		},
		description: {
			type: new DataTypes.STRING(32),
			allowNull: false,
		},
		descriptionLong: {
			type: new DataTypes.STRING(255),
			allowNull: false,
		},
		emoji: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
	},
	{
		sequelize,
		tableName: "badges",
	},
);
