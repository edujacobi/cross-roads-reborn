import { type CreationOptional, DataTypes, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";
import type { BackgroundDecorationId } from "@core/types/Ids";

export class UserBackgroundDecorations extends Model<
	InferAttributes<UserBackgroundDecorations>,
	InferCreationAttributes<UserBackgroundDecorations>
> {
	declare id: CreationOptional<number>;
	declare userId: string;
	declare backgroundDecorationId: BackgroundDecorationId;
}

UserBackgroundDecorations.init(
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
		backgroundDecorationId: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	},
	{
		sequelize,
		tableName: "userbackgrounddecorations",
		indexes: [
			{ fields: ["userId"] },
		],
	},
);

export default UserBackgroundDecorations;
