import {
	DataTypes,
	type ForeignKey,
	type InferAttributes,
	type InferCreationAttributes,
	Model,
} from "sequelize";
import { sequelize } from "./Database";
import type { Users } from "./Users";

export class PushSubscriptions extends Model<
	InferAttributes<PushSubscriptions>,
	InferCreationAttributes<PushSubscriptions>
> {
	declare endpoint: string;
	declare userId: ForeignKey<Users["id"]>;
	declare p256dh: string;
	declare auth: string;
}

PushSubscriptions.init(
	{
		endpoint: {
			type: DataTypes.STRING(1_024),
			primaryKey: true,
		},
		userId: {
			type: new DataTypes.STRING(18),
			allowNull: false,
		},
		p256dh: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		auth: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	},
	{
		sequelize,
		tableName: "push_subscriptions",
		indexes: [{ fields: ["userId"] }],
	},
);
