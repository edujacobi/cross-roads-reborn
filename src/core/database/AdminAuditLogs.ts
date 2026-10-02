import { type CreationOptional, DataTypes, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";

export class AdminAuditLogs extends Model<
	InferAttributes<AdminAuditLogs>,
	InferCreationAttributes<AdminAuditLogs>
> {
	declare id: CreationOptional<number>;
	declare adminId: string;
	declare adminName: string;
	declare action: string;
	declare target: string;
	declare previousValue: string;
	declare newValue: string;
	declare createdAt: CreationOptional<Date>;
}

AdminAuditLogs.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		adminId: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		adminName: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		action: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		target: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		previousValue: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		newValue: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false,
		},
	},
	{
		sequelize,
		tableName: "admin_audit_logs",
		timestamps: false,
		indexes: [
			{ fields: ["createdAt"] },
			{ fields: ["adminId"] },
		],
	},
);
