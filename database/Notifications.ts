import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";
import { Roosters } from "./Roosters";
import { NotificationType } from "../models/Notification";

export class Notifications extends Model<
	InferAttributes<Notifications>,
	InferCreationAttributes<Notifications>
> {
	declare id: CreationOptional<number>;
	declare roosterId: ForeignKey<Roosters["id"]>;
	declare type: NotificationType;
	declare date: Date;
	declare notified: CreationOptional<boolean>;
}

Notifications.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		roosterId: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		type: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		date: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		notified: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
	},
	{
		sequelize,
		tableName: "notifications",
	},
);
