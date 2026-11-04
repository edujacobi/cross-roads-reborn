import { type CreationOptional, DataTypes, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";
import { createIdAttribute } from "./ModelAttributes";

export class UserBadges extends Model<
	InferAttributes<UserBadges>,
	InferCreationAttributes<UserBadges>
> {
	declare id: CreationOptional<number>;
	declare userId: string;
	declare badgeId: number;
}

UserBadges.init(
	{
		...createIdAttribute(),
		userId: {
			type: new DataTypes.STRING(18),
			allowNull: false,
		},
		badgeId: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	},
	{
		sequelize,
		tableName: "userbadges",
		indexes: [
			{ fields: ["userId"] },
		],
	},
);

export default UserBadges;
