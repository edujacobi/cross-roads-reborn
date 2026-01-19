import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";

export class StockMarket extends Model<
	InferAttributes<StockMarket>,
	InferCreationAttributes<StockMarket>
> {
	declare ticker: string;
	declare price: number;
	declare previousPrice: number;
	declare availableShares: number;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
}

StockMarket.init(
	{
		ticker: {
			type: DataTypes.STRING,
			primaryKey: true,
			allowNull: false,
		},
		price: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		previousPrice: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		availableShares: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		updatedAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		sequelize,
		tableName: "stock_market",
	},
);
