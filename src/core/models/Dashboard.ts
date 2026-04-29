import { Op } from "sequelize";
import { Users } from "#core/database/Users";
import { Gangs } from "#core/database/Gangs";
import { DashboardStats } from "#core/database/DashboardStats";
import { Log } from "#shared/log";
import { ClassId } from "#core/types/Classes";
import { Language } from "#core/models/Language";

export class Dashboard {
	static async GetCurrentStats() {
		const now = new Date();

		const totalPlayers = await Users.count({
			where: { class: { [Op.not]: ClassId.None } }
		});
		const totalGangs = await Gangs.count();

		const prisonCount = await Users.count({
			where: { prisonTime: { [Op.gt]: now } }
		});

		const hospitalCount = await Users.count({
			where: { hospitalTime: { [Op.gt]: now } }
		});

		const jobCount = await Users.count({
			where: {
				jobTime: { [Op.gt]: now },
				jobId: { [Op.ne]: null }
			}
		});

		const scavengeCount = await Users.count({
			where: {
				scavengeTime: { [Op.gt]: now },
				scavengingId: { [Op.ne]: null }
			}
		});

		const casinoCount = await Users.count({
			where: { casinoIsInGame: true }
		});

		const robberyCount = await Users.count({
			where: {
				[Op.or]: [
					{ robbingUserId: { [Op.ne]: null } },
					{ robbingLocationId: { [Op.ne]: null } }
				]
			}
		});

		const beatUpCount = await Users.count({
			where: { beatingUserId: { [Op.ne]: null } }
		});

		let idleCount = totalPlayers - (prisonCount + hospitalCount + jobCount + scavengeCount + casinoCount + robberyCount + beatUpCount);
		if (idleCount < 0) idleCount = 0;

		const englishCount = await Users.count({
			where: { language: Language.English, class: { [Op.not]: ClassId.None } }
		});

		const portugueseCount = await Users.count({
			where: { language: Language.Portuguese, class: { [Op.not]: ClassId.None } }
		});

		const spanishCount = await Users.count({
			where: { language: Language.Spanish, class: { [Op.not]: ClassId.None } }
		});

		return DashboardStats.build({
			date: now,
			totalPlayers,
			totalGangs,
			prisonCount,
			hospitalCount,
			jobCount,
			scavengeCount,
			casinoCount,
			robberyCount,
			beatUpCount,
			idleCount,
			englishCount,
			portugueseCount,
			spanishCount,
		});
	}

	/**
	 * Takes a snapshot of the current game state and saves it to the database.
	 */
	static async TakeSnapshot() {
		try {
			const stats = await this.GetCurrentStats();
			await stats.save();

			Log.Info("Dashboard snapshot taken successfully.");
		}
		catch (error) {
			Log.Error(`Failed to take dashboard snapshot: ${error}`);
		}
	}

	/**
	 * Retrieves the last 30 daily snapshots.
	 */
	static async GetLast30Days() {
		return await DashboardStats.findAll({
			order: [["date", "DESC"]],
			limit: 30,
		});
	}

	/**
	 * Schedules a recurring task to take a snapshot every midnight.
	 */
	static ScheduleMidnightSnapshot() {
		const now = new Date();
		const nextMidnight = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate() + 1,
			0, 0, 0
		);
		const timeUntilMidnight = nextMidnight.getTime() - now.getTime();

		setTimeout(() => {
			Dashboard.TakeSnapshot();
			// Then set an interval to run every 24 hours
			setInterval(Dashboard.TakeSnapshot, 24 * 60 * 60 * 1000);
		}, timeUntilMidnight);

		Log.Info(`Scheduled next dashboard snapshot for ${nextMidnight.toISOString()}`);
	}
}
