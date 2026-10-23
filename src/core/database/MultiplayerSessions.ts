import { type CreationOptional, DataTypes, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";

export class MultiplayerSessions extends Model<
	InferAttributes<MultiplayerSessions>,
	InferCreationAttributes<MultiplayerSessions>
> {
	declare id: string;
	declare kind: string;
	declare ownerId: string;
	declare targetId: string | null;
	declare gangId: number | null;
	declare participantIds: string;
	declare phase: string;
	declare status: "active" | "completed" | "aborted";
	declare expiresAt: Date | null;
	declare result: string | null;
	declare createdAt: CreationOptional<Date>;
}

MultiplayerSessions.init(
	{
		id: { type: DataTypes.STRING, primaryKey: true },
		kind: { type: DataTypes.STRING, allowNull: false },
		ownerId: { type: DataTypes.STRING, allowNull: false },
		targetId: { type: DataTypes.STRING, allowNull: true },
		gangId: { type: DataTypes.INTEGER, allowNull: true },
		participantIds: { type: DataTypes.TEXT, allowNull: false },
		phase: { type: DataTypes.STRING, allowNull: false },
		status: { type: DataTypes.STRING, allowNull: false },
		expiresAt: { type: DataTypes.DATE, allowNull: true },
		result: { type: DataTypes.TEXT, allowNull: true },
		createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
	},
	{
		sequelize,
		tableName: "multiplayerSessions",
		timestamps: false,
		indexes: [
			{ fields: ["status", "expiresAt"] },
			{ fields: ["targetId", "status"] },
		],
	},
);

export default MultiplayerSessions;
