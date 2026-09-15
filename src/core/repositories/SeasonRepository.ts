import { Op, type InferAttributes } from "sequelize";
import { sequelize } from "#core/database/Database";
import { Seasons } from "#core/database/Seasons";
import { Users } from "#core/database/Users";
import Gangs from "#core/database/Gangs";
import GangMembers from "#core/database/GangMembers";
import GangRoles from "#core/database/GangRoles";
import { GangHeists } from "#core/database/GangHeists";
import { UserItems } from "#core/database/UserItems";
import { RobHistories } from "#core/database/RobHistories";
import { Notifications } from "#core/database/Notifications";
import { LotteryTickets } from "#core/database/LotteryTickets";
import { UserInvestments } from "#core/database/UserInvestments";
import { HorseRaceBets } from "#core/database/HorseRaceBets";
import { HorseRaces } from "#core/database/HorseRaces";
import { VaultRepository } from "#core/repositories/VaultRepository";
import { ClassId } from "#core/types/Classes";

export interface ISeasonData {
	id: number;
	number: number;
	startDate: Date;
	endDate: Date;
	topData: string;
	howManyPlayers: number;
}

export class SeasonRepository {
	static async FindLatest(): Promise<Seasons | null> {
		return await Seasons.findOne({
			order: [["number", "DESC"]],
		});
	}

	static async FindByNumber(number: number): Promise<Seasons | null> {
		return await Seasons.findOne({
			where: { number },
		});
	}

	static async FindAll(): Promise<Seasons[]> {
		return await Seasons.findAll({
			order: [["number", "DESC"]],
		});
	}

	static async FindAllNumbers(): Promise<{ number: number }[]> {
		const seasons = await Seasons.findAll({
			attributes: ["number"],
			order: [["number", "DESC"]],
		});
		return seasons.map(s => ({ number: s.number }));
	}

	static async Create(data: {
		number: number;
		startDate: Date;
		endDate: Date;
		topData: string;
		howManyPlayers: number;
	}): Promise<Seasons> {
		return await Seasons.create(data);
	}

	static async UpdateById(id: number, data: Partial<InferAttributes<Seasons>>): Promise<[affectedCount: number]> {
		return await Seasons.update(data, {
			where: { id },
		});
	}

	static async DeleteByNumber(number: number): Promise<number> {
		return await Seasons.destroy({
			where: { number },
		});
	}

	/**
	 * Gets the top rankings for end of season.
	 */
	static async GetEndSeasonRankingData() {
		const defaultAttributes = ["nickname", "id", "class"];
		const getFromRanking = (orderBy: string, limit = 1) => {
			return Users.findAll({
				attributes: [...defaultAttributes, orderBy],
				limit: limit,
				order: [[orderBy, "DESC"]],
				where: {
					class: {
						[Op.not]: ClassId.None,
					},
					[Op.or]: [
						{ deadUntil: null },
						{ deadUntil: { [Op.lte]: new Date() } },
					],
					[orderBy]: {
						[Op.gt]: 0,
					},
				},
			});
		};

		const getTopGang = () => {
			return Gangs.findAll({
				attributes: ["id", "name", "level"],
				limit: 1,
				order: [["level", "DESC"], ["experience", "DESC"]],
				where: {
					level: {
						[Op.gt]: 0,
					},
				},
			});
		};

		return await Promise.all([
			getFromRanking("money", 3),
			getFromRanking("casinoWinSum"),
			getFromRanking("shopSpentSum"),
			getFromRanking("robberySuccessRobbedSum"),
			getFromRanking("robberySuccessCount"),
			getFromRanking("jobReceivedSum"),
			getFromRanking("beatUpSuccessCount"),
			getFromRanking("scavengeFoundTotal"),
			getFromRanking("hospitalTreatmentSum"),
			getFromRanking("prisonBriberySum"),
			getFromRanking("escapeCount"),
			getFromRanking("drinkHappyHour"),
			getFromRanking("investmentTotalProfit"),
			getTopGang(),
		]);
	}

	/**
	 * Gets general stats counts for end of season.
	 */
	static async GetEndSeasonStats() {
		return await Promise.all([
			Users.count({
				where: {
					class: { [Op.not]: ClassId.None },
					[Op.or]: [
						{ deadUntil: null },
						{ deadUntil: { [Op.lte]: new Date() } },
					],
				},
			}),
			Gangs.count(),
			GangMembers.count(),
			GangRoles.count(),
			GangHeists.count(),
			UserItems.count(),
			RobHistories.count(),
			Notifications.count(),
			LotteryTickets.count(),
			UserInvestments.count(),
			HorseRaceBets.count(),
		]);
	}

	/**
	 * Resets all progress and erases seasonal database tables within a transaction.
	 */
	static async ResetSeasonDatabase(): Promise<void> {
		const transaction = await sequelize.transaction();
		try {
			await Promise.all([
				GangMembers.destroy({ where: {}, transaction }),
				GangRoles.destroy({ where: {}, transaction }),
				GangHeists.destroy({ where: {}, transaction }),
			]);

			const date = new Date();

			await Promise.all([
				Users.update(
					{
						money: 0,
						class: ClassId.None,
						dailyStreak: 0,
						maxDailyStreak: 0,
						lastDailyReceived: null,
						casinoLoseCount: 0,
						casinoLoseSum: 0,
						casinoWinCount: 0,
						casinoWinSum: 0,
						escapeCount: 0,
						escapeHasTried: false,
						wantedCount: 0,
						hospitalCount: 0,
						hospitalTreatmentCount: 0,
						hospitalTreatmentSum: 0,
						jobId: null,
						jobReceivedCount: 0,
						jobReceivedSum: 0,
						prisonCount: 0,
						prisonBriberyCount: 0,
						prisonBriberySum: 0,
						prisonHasPaidBribe: false,
						robberyBeingRobbedCount: 0,
						robberyBeingRobbedSum: 0,
						robberyFailureCount: 0,
						robberySuccessCount: 0,
						robberySuccessRobbedSum: 0,
						casinoIsInGame: false,
						beatUpSuccessCount: 0,
						beatUpFailureCount: 0,
						beatUpBeatedUpCount: 0,
						shopSpentCount: 0,
						shopSpentSum: 0,
						almsGivenSum: 0,
						almsGivenCount: 0,
						almsReceivedSum: 0,
						almsReceivedCount: 0,
						scavengeCount: 0,
						scavengeFoundTotal: 0,
						scavengeFoundItems: 0,
						scavengeMoneyCount: 0,
						scavengeMoneySum: 0,
						scavengeFailures: 0,
						scavengeFailureWithHospital: 0,
						scavengeFailureWithPrison: 0,
						drinkNormal: 0,
						drinkHappyHour: 0,
						drunkCount: 0,
						investmentTotalProfit: 0,
						nicknameChangeCount: 0,
						classChangeCount: 0,
						// actions
						beingRobbedByUserId: null,
						robbingUserId: null,
						robbingLocationId: null,
						scavengingId: null,
						beatingUserId: null,
						beingBeatUpByUserId: null,
						robberyInvestmentDefending: false,
						robberyParticipatingInGangAction: false,
						// timers
						almsGiveTime: date,
						almsReceiveTime: date,
						beatUpTime: date,
						prisonTime: date,
						escapeTime: date,
						wantedTime: date,
						hospitalTime: date,
						jobTime: date,
						scavengeTime: date,
					},
					{ where: { class: { [Op.not]: ClassId.None } }, transaction },
				),
				Gangs.destroy({ where: {}, transaction }),
				UserItems.destroy({ where: {}, transaction }),
				RobHistories.destroy({ where: {}, transaction }),
				Notifications.destroy({ where: {}, transaction }),
				LotteryTickets.destroy({ where: {}, transaction }),
				UserInvestments.destroy({ where: {}, transaction }),
				HorseRaceBets.destroy({ where: {}, transaction }),
				HorseRaces.destroy({ where: {}, transaction }),
				VaultRepository.Reset(transaction),
			]);

			await transaction.commit();
		}
		catch (error) {
			await transaction.rollback();
			throw error;
		}
	}
}
