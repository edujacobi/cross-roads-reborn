import {
	type CreationOptional,
	DataTypes,
	type InferAttributes,
	type InferCreationAttributes,
	Model,
} from "sequelize";
import type { GangJoinRequestStatus } from "#core/types/GangRecruitment";
import { sequelize } from "./Database";

export class GangJoinRequests extends Model<
	InferAttributes<GangJoinRequests>,
	InferCreationAttributes<GangJoinRequests>
> {
	declare id: CreationOptional<number>;
	declare gangId: number;
	declare userId: string;
	declare message: string | null;
	declare status: GangJoinRequestStatus;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
}

GangJoinRequests.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		gangId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: "gangs",
				key: "id",
			},
			onDelete: "CASCADE",
		},
		userId: {
			type: new DataTypes.STRING(18),
			allowNull: false,
			references: {
				model: "users",
				key: "id",
			},
			onDelete: "CASCADE",
		},
		message: {
			type: DataTypes.STRING(280),
			allowNull: true,
		},
		status: {
			type: DataTypes.STRING(20),
			allowNull: false,
			defaultValue: "PENDING",
		},
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: "gang_join_requests",
		indexes: [
			{ fields: ["gangId", "status"] },
			{ fields: ["userId", "status"] },
			{ fields: ["createdAt"] },
		],
	},
);

export default GangJoinRequests;
