import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";
import { EventType } from "../models/Event";

export class Events extends Model<
	InferAttributes<Events>,
	InferCreationAttributes<Events>
> {
	declare id: CreationOptional<number>;
	declare type: EventType;
	declare value: number;
	declare periodStart: Date;
	declare periodEnd: Date;
}

Events.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		type: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		value: {
			type: DataTypes.FLOAT,
			allowNull: false,
		},
		periodStart: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		periodEnd: {
			type: DataTypes.DATE,
			allowNull: false,
		},
	},
	{
		sequelize,
		tableName: "events",
		indexes: [
			{ fields: ["type"] },
			{ fields: ["periodStart"] },
			{ fields: ["periodEnd"] },
		],
	},
);