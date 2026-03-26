import {
	type CreationOptional,
	DataTypes,
	type ForeignKey,
	type InferAttributes,
	type InferCreationAttributes,
	Model,
} from "sequelize";
import { sequelize } from "./Database";
import { Users } from "./Users";
import { Gangs } from "./Gangs";

export class GangMembers extends Model<
	InferAttributes<GangMembers>,
	InferCreationAttributes<GangMembers>
> {
	declare id: CreationOptional<number>;
	declare gangId: ForeignKey<Gangs["id"]>;
	declare userId: ForeignKey<Users["id"]>;
	declare roleId: number;
	declare joinedAt: CreationOptional<Date>;
	declare depositTime: CreationOptional<Date>;
	declare depositAmount: CreationOptional<number>;
}

GangMembers.init(
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
		userId: {
			type: new DataTypes.STRING(18),
			references: {
				model: Users,
				key: "id",
			},
			allowNull: false,
			unique: true, // Um usuário só pode estar em uma gangue
		},
		roleId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1, // Membro comum por padrão
		},
		joinedAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		depositTime: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		depositAmount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
	},
	{
		sequelize,
		tableName: "gangmembers",
		timestamps: false,
		indexes: [
			{ fields: ["gangId"] },
		],
	},
);

// Uma gangue tem muitos membros
Gangs.hasMany(GangMembers, { foreignKey: "gangId", as: "GangMembers" });
// Um membro pertence a uma gangue
GangMembers.belongsTo(Gangs, { foreignKey: "gangId", as: "Gang" });

export default GangMembers;
