import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";
import { StockId } from "../interfaces/Stocks";

export class StockMarket extends Model<
	InferAttributes<StockMarket>,
	InferCreationAttributes<StockMarket>
> {
	declare companyId: StockId;
	declare price: number;
	declare previousPrice: number;
	declare availableShares: number;
	declare history: CreationOptional<string>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
}

StockMarket.init(
	{
		companyId: {
			type: DataTypes.INTEGER,
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
		history: {
			type: DataTypes.TEXT,
			allowNull: false,
			defaultValue: "[]",
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
