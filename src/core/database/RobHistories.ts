import {
	type CreationOptional,
	DataTypes,
	type ForeignKey,
	type InferAttributes,
	type InferCreationAttributes,
	Model,
	Op,
} from "sequelize";
import { sequelize } from "./Database";
import type { User } from "#core/models/User";
import type { Users } from "./Users";
import { ClashType, type Robbery } from "#core/models/Robbery";
import { Log } from "#shared/log";
import type { RobberyLocation } from "#core/models/RobberyLocation";
import { Language } from "#core/models/Language";
import type { BeatUp } from "#core/models/BeatUp";
import { LocationList } from "#core/types/Locations";

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
		return await RobHistories.count({
			where: {
				[Op.or]: [{ attackerId: userId }, { defenderId: userId }],
			},
		});
	}

	static async GetList(userId: string, limit: number, offset: number) {
		return await RobHistories.findAll({
			limit,
			order: [["createdAt", "DESC"]],
			offset,
			where: {
				[Op.or]: [{ attackerId: userId }, { defenderId: userId }],
			},
		});
	}

	static async CreateUserRobberyHistory(robbery: Robbery) {
		try {
			await RobHistories.create({
				attackerId: robbery.Attacker.Id,
				defenderId: robbery.Defender.Id,
				success: robbery.Success,
				money: robbery.MoneyRobbed,
				type: robbery.Type,
			});

			Log.Success(`Robbery History for ${robbery.Attacker.Nickname} (Id: ${robbery.Attacker.Id}) and ${robbery.Defender.Nickname} (Id: ${robbery.Defender.Id}) added successfully.`);
		}
		catch (err) {
			Log.Warning(`Something went wrong with adding Robbery History for ${robbery.Attacker.Nickname} (Id: ${robbery.Attacker.Id}) and ${robbery.Defender.Nickname} (Id: ${robbery.Defender.Id}).`);
		}
	}

	static async CreateLocationHistory(robbery: RobberyLocation) {
		try {
			await RobHistories.create({
				attackerId: robbery.Attacker.Id,
				locationId: robbery.LocationId,
				success: robbery.Success,
				money: robbery.MoneyRobbed,
				type: robbery.Type,
			});

			Log.Success(`Robbery History for ${robbery.Attacker.Nickname} (Id: ${robbery.Attacker.Id}) and ${LocationList[robbery.LocationId].Name[Language.English]} (Id: ${robbery.LocationId}) added successfully.`);
		}
		catch (err) {
			Log.Warning(`Something went wrong with adding Robbery History for ${robbery.Attacker.Nickname} (Id: ${robbery.Attacker.Id}) and ${LocationList[robbery.LocationId].Name[Language.English]} (Id: ${robbery.LocationId}).`);
		}
	}

	static async CreateUserBeatUpHistory(beatup: BeatUp) {
		try {
			await RobHistories.create({
				attackerId: beatup.Attacker.Id,
				defenderId: beatup.Defender.Id,
				success: beatup.Success,
				money: 0,
				type: ClashType.BeatUp,
			});

			Log.Success(`Beat Up History for ${beatup.Attacker.Nickname} (Id: ${beatup.Attacker.Id}) and ${beatup.Defender.Nickname} (Id: ${beatup.Defender.Id}) added successfully.`);
		}
		catch (err) {
			Log.Warning(`Something went wrong with adding Beat Up History for ${beatup.Attacker.Nickname} (Id: ${beatup.Attacker.Id}) and ${beatup.Defender.Nickname} (Id: ${beatup.Defender.Id}).`);
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
		indexes: [
			{ fields: ["attackerId"] },
			{ fields: ["defenderId"] },
			{ fields: ["createdAt"] },
		],
	},
);