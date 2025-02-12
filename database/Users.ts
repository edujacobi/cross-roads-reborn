import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";

export class Users extends Model<
	InferAttributes<Users>,
	InferCreationAttributes<Users>
> {
	declare id: CreationOptional<string>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
	declare vipTime: CreationOptional<Date | null>;
	declare vipEternal: CreationOptional<boolean>;
	declare language: number;
<<<<<<< Updated upstream
=======
	declare nickname: CreationOptional<string>;
	declare money: number;
	declare chip: number;
	declare jobId: CreationOptional<JobId | null>;
	declare jobTime: CreationOptional<Date>;
	declare robbingUserId: CreationOptional<string | null>;
	declare beingRobbedByUserId: CreationOptional<string | null>;
	declare prisonTime: CreationOptional<Date>;
	declare escapeTime: CreationOptional<Date>;

>>>>>>> Stashed changes
}

Users.init(
	{
		id: {
			type: new DataTypes.STRING(18),
			primaryKey: true,
		},
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
		vipTime: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: null,
		},
		vipEternal: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		language: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
<<<<<<< Updated upstream
=======
		nickname: {
			type: DataTypes.STRING(18),
			allowNull: true,
		},
		money: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		chip: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		jobId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: null,
		},
		jobTime: {
			type: DataTypes.DATE,
		},
		robbingUserId: {
			type: DataTypes.STRING(18),
			allowNull: true,
			defaultValue: null,
		},
		beingRobbedByUserId: {
			type: DataTypes.STRING(18),
			allowNull: true,
			defaultValue: null,
		},
		prisonTime: {
			type: DataTypes.DATE,
		},
		escapeTime: {
			type: DataTypes.DATE,
		}
>>>>>>> Stashed changes
	},
	{
		sequelize,
		tableName: "users",
	},
);
