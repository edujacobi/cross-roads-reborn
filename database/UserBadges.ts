import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";
import { Users } from "./Users";

export class UserBadges extends Model<
	InferAttributes<UserBadges>,
	InferCreationAttributes<UserBadges>
> {
	declare id: CreationOptional<number>;
	declare userId: ForeignKey<Users["id"]>;
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
			references: {
				model: Users,
				key: "id",
			},
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
