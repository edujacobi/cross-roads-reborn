import {
	type CreationOptional,
	DataTypes,
	type ForeignKey,
	type InferAttributes,
	type InferCreationAttributes,
	Model,
} from "sequelize";
import { sequelize } from "./Database";
import type { NotificationType } from "#core/models/Notification";
import type { Users } from "./Users";

export class Notifications extends Model<
	InferAttributes<Notifications>,
	InferCreationAttributes<Notifications>
> {
	declare id: CreationOptional<number>;
	declare userId: ForeignKey<Users["id"]>;
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
		userId: {
			type: new DataTypes.STRING(18),
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
		indexes: [
			{ fields: ["userId"] },
			{ fields: ["notified"] },
		],
	},
);
