import { type CreationOptional, DataTypes, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";
import type { AvatarDecorationId } from "#core/types/Ids";

export class UserAvatarDecorations extends Model<
	InferAttributes<UserAvatarDecorations>,
	InferCreationAttributes<UserAvatarDecorations>
> {
	declare id: CreationOptional<number>;
	declare userId: string;
	declare avatarDecorationId: AvatarDecorationId;
}

UserAvatarDecorations.init(
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
		avatarDecorationId: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	},
	{
		sequelize,
		tableName: "useravatardecorations",
		indexes: [
			{ fields: ["userId"] },
		],
	},
);

export default UserAvatarDecorations;
