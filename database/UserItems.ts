import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";
import { Users } from "./Users";
import { ItemId } from "../interfaces/Items";

export class UserItems extends Model<
	InferAttributes<UserItems>,
	InferCreationAttributes<UserItems>
> {
	declare id: CreationOptional<number>;
	declare userId: ForeignKey<Users["id"]>;
	declare itemId: ForeignKey<ItemId>;
	declare remainingTime: CreationOptional<Date>;
	declare quantity: CreationOptional<number>;
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
	},
	{
		sequelize,
		tableName: "userItems",
	},
);
