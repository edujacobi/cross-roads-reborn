import { type CreationOptional, DataTypes, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "./Database";
import { LotteryDraws } from "./LotteryDraws";

export class LotteryTickets extends Model<
	InferAttributes<LotteryTickets>,
	InferCreationAttributes<LotteryTickets>
> {
	declare id: CreationOptional<number>;
	declare userId: string;
	declare drawId: number;
	declare amount: number;
	declare hasWon: CreationOptional<boolean | null>;
	declare winnings: CreationOptional<number>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
}

LotteryTickets.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		userId: {
			type: new DataTypes.STRING(18),
			allowNull: false,
			references: {
				model: "users",
				key: "id",
			},
		},
		drawId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: "lottery_draws",
				key: "id",
			},
		},
		amount: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		hasWon: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
			defaultValue: null,
		},
		winnings: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
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
		tableName: "lottery_tickets",
		indexes: [
			{ fields: ["userId"] },
			{ fields: ["drawId"] },
		],
	},
);

// Define associations
LotteryTickets.belongsTo(LotteryDraws, { foreignKey: "drawId" });
LotteryDraws.hasMany(LotteryTickets, { foreignKey: "drawId" });
