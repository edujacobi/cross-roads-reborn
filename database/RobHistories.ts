import {
	CreationOptional,
	DataTypes,
	ForeignKey,
	InferAttributes,
	InferCreationAttributes,
	Model,
	Op,
} from "sequelize";
import { sequelize } from "./Database";
import { User } from "../models/User";
import { Users } from "./Users";
import { Robbery } from "../models/Robbery";
import { Log } from "../utils/log";

export class RobHistories extends Model<
	InferAttributes<RobHistories>,
	InferCreationAttributes<RobHistories>
> {
	declare id: CreationOptional<number>;
	declare attackerId: ForeignKey<User["Id"]>;
	declare defenderId: CreationOptional<ForeignKey<Users["id"]>>;
	declare locationId: CreationOptional<number>;
	declare success: boolean;
	declare money: number;
	declare type: number;

	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	static async Count(userId: string) {
		return await this.count({
			where: {
				[Op.or]: [{ attackerId: userId }, { defenderId: userId }],
			},
		});
	}

	static async GetList(userId: string, limit: number, offset: number) {
		return await this.findAll({
			limit,
			order: [["createdAt", "DESC"]],
			offset,
			where: {
				[Op.or]: [{ attackerId: userId }, { defenderId: userId }],
			},
		});
	}

	static async CreateHistory(robbery: Robbery) {
		try {
			await RobHistories.create({
				attackerId: robbery.Attacker.Id,
				defenderId: robbery.Defender.Id,
				// locationId: robbery.Location.Id,
				success: robbery.Success,
				money: robbery.MoneyRobbed,
				type: robbery.Type,
			});

			Log.Success(`Robbery History for ${robbery.Attacker.Nickname} (ID: ${robbery.Attacker.Id}) and ${robbery.Defender.Nickname} (ID: ${robbery.Defender.Id}) added successfully.`);
		}
		catch (err) {
			Log.Warning(`Something went wrong with adding Robbery History for ${robbery.Attacker.Nickname} (ID: ${robbery.Attacker.Id}) and ${robbery.Defender.Nickname} (ID: ${robbery.Defender.Id}).`);
		}
	}
}

RobHistories.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		attackerId: {
			type: new DataTypes.STRING(18),
			allowNull: false,
		},
		defenderId: {
			type: new DataTypes.STRING(18),
		},
		locationId: {
			type: DataTypes.INTEGER,
		},
		success: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		money: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		type: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1,
		},
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: "robHistory",
	},
);