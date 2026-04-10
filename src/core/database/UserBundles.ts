import { type CreationOptional, DataTypes, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";
import type { BundleId } from "#core/types/Ids";

export class UserBundles extends Model<
	InferAttributes<UserBundles>,
	InferCreationAttributes<UserBundles>
> {
	declare id: CreationOptional<number>;
	declare userId: string;
	declare bundleId: BundleId;
}

UserBundles.init(
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
		bundleId: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	},
	{
		sequelize,
		tableName: "userbundles",
		indexes: [
			{ fields: ["userId"] },
		],
	},
);

export default UserBundles;
