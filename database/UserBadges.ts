import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";

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
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
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
	},
);

export default UserBadges;
