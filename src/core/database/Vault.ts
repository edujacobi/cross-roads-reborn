import { type CreationOptional, DataTypes, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";

export class Vault extends Model<
	InferAttributes<Vault>,
	InferCreationAttributes<Vault>
> {
	declare id: CreationOptional<number>;
	declare bankBalance: number;
	declare casinoBalance: number;
	declare mainHeistAllowed: boolean;
}

Vault.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		bankBalance: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 50_000_000,
		},
		casinoBalance: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 25_000_000,
		},
		mainHeistAllowed: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		},
	},
	{
		sequelize,
		tableName: "vaults",
		timestamps: false,
	},
);

export default Vault;
