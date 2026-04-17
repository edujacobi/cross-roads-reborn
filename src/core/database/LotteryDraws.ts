import { type CreationOptional, DataTypes, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";

export class LotteryDraws extends Model<
	InferAttributes<LotteryDraws>,
	InferCreationAttributes<LotteryDraws>
> {
	declare id: CreationOptional<number>;
	declare drawTime: Date;
	declare winningTicketId: CreationOptional<number | null>;
	declare totalTickets: CreationOptional<number>;
	declare totalAmount: CreationOptional<number>;
	declare isFinished: CreationOptional<boolean>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
}

LotteryDraws.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		drawTime: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		winningTicketId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: null,
		},
		totalTickets: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		totalAmount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		isFinished: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
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
		tableName: "lottery_draws",
		indexes: [
			{ fields: ["drawTime"] },
			{ fields: ["isFinished"] },
		],
	},
);
