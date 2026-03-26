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
import type { BundleId, ItemId } from "@core/types/Ids";

export class UserItems extends Model<
	InferAttributes<UserItems>,
	InferCreationAttributes<UserItems>
> {
	declare id: CreationOptional<number>;
	declare userId: ForeignKey<Users["id"]>;
	declare itemId: ForeignKey<ItemId>;
	declare remainingTime: CreationOptional<Date>;
	declare quantity: CreationOptional<number>;
	declare skin: BundleId;
}

UserItems.init(
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
		itemId: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		remainingTime: {
			type: DataTypes.DATE,
			defaultValue: null,
		},
		quantity: {
			type: DataTypes.INTEGER,
			defaultValue: null,
		},
		skin: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	},
	{
		sequelize,
		tableName: "userItems",
		indexes: [
			{ fields: ["userId"] },
			{ fields: ["itemId"] },
		],
	},
);
