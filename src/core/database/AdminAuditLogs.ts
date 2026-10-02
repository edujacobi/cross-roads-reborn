import { type CreationOptional, DataTypes, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";
import type { AdminAuditActionId, AdminAuditSettingId } from "#core/types/AdminAuditLog";

export class AdminAuditLogs extends Model<
	InferAttributes<AdminAuditLogs>,
	InferCreationAttributes<AdminAuditLogs>
> {
	declare id: CreationOptional<number>;
	declare adminId: string;
	declare adminIpAddress: string | null;
	declare adminDeviceType: string | null;
	declare adminOperatingSystem: string | null;
	declare actionId: AdminAuditActionId;
	declare targetUserId: string | null;
	declare targetSettingId: AdminAuditSettingId | null;
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
		adminIpAddress: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		adminDeviceType: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		adminOperatingSystem: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		actionId: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		targetUserId: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		targetSettingId: {
			type: DataTypes.INTEGER,
			allowNull: true,
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
	},
);
