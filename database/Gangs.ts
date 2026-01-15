import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";
import { GangColorId } from "../utils/colors";

export class Gangs extends Model<
	InferAttributes<Gangs>,
	InferCreationAttributes<Gangs>
> {
	declare id: CreationOptional<number>;
	declare name: string;
	declare acronym: string;
	declare money: number;
	declare baseId: CreationOptional<number>;
	declare color: GangColorId;
	declare image: string | null;
	declare description: string;
	declare experience: number;
	declare level: number;
	declare leaderId: string;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
}

Gangs.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING(50),
			allowNull: false,
			unique: true,
		},
		acronym: {
			type: DataTypes.STRING(4),
			allowNull: false,
			unique: true,
		},
		money: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		baseId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		color: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		image: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		experience: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		level: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1,
		},
		leaderId: {
			type: new DataTypes.STRING(18),
			allowNull: false,
			references: {
				model: "users",
				key: "id",
			},
		},
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: "gangs",
	},
);

export default Gangs;
