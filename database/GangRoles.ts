import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";
import { Gangs } from "./Gangs";

export class GangRoles extends Model<
	InferAttributes<GangRoles>,
	InferCreationAttributes<GangRoles>
> {
	declare id: CreationOptional<number>;
	declare gangId: ForeignKey<Gangs["id"]>;
	declare name: string;
	declare canInvite: boolean;
	declare canKick: boolean;
	declare canPromote: boolean;
	declare canEditGang: boolean;
}

GangRoles.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		gangId: {
			type: DataTypes.INTEGER,
			references: {
				model: Gangs,
				key: "id",
			},
			allowNull: false,
		},
		name: {
			type: DataTypes.STRING(50),
			allowNull: false,
		},
		canInvite: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		canKick: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		canPromote: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		canEditGang: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
	},
	{
		sequelize,
		tableName: "gangroles",
		timestamps: false,
	},
);

export default GangRoles;
