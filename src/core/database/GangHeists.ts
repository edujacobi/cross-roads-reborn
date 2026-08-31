import { type CreationOptional, DataTypes, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";

export class GangHeists extends Model<
	InferAttributes<GangHeists>,
	InferCreationAttributes<GangHeists>
> {
	declare id: CreationOptional<number>;
	declare gangId: number;
	declare heistCooldownUntil: Date | null;
	declare mission1Completed: boolean;
	declare mission1CooldownUntil: Date | null;
	declare mission2Completed: boolean;
	declare mission2CooldownUntil: Date | null;
	declare mission3Completed: boolean;
	declare mission3CooldownUntil: Date | null;
	declare heistWins: number;
	declare heistLosses: number;
	declare totalStolen: number;
}

GangHeists.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		gangId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: true,
			references: {
				model: "gangs",
				key: "id",
			},
			onDelete: "CASCADE",
		},
		heistCooldownUntil: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		mission1Completed: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		mission1CooldownUntil: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		mission2Completed: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		mission2CooldownUntil: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		mission3Completed: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		mission3CooldownUntil: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		heistWins: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		heistLosses: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		totalStolen: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
	},
	{
		sequelize,
		tableName: "gang_heists",
		timestamps: false,
		indexes: [
			{ fields: ["gangId"] },
		],
	},
);

export default GangHeists;
