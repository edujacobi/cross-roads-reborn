import { DashboardRepository } from "#core/repositories/DashboardRepository";
import { GangRepository } from "#core/repositories/GangRepository";
import { UserRepository } from "#core/repositories/UserRepository";
import { Language } from "#core/models/Language";
import { Log } from "#shared/log";

export class Dashboard {
	static async GetCurrentStats() {
		const now = new Date();

		const totalPlayers = await UserRepository.CountActivePlayers();
		const totalGangs = await GangRepository.CountAllGangs();

		const prisonCount = await UserRepository.CountPrisoners(now);
		const hospitalCount = await UserRepository.CountHospitalized(now);
		const jobCount = await UserRepository.CountWorking(now);
		const scavengeCount = await UserRepository.CountScavenging(now);
		const casinoCount = await UserRepository.CountInCasinoGame();
		const robberyCount = await UserRepository.CountInRobbery();
		const beatUpCount = await UserRepository.CountInBeatUp();

		let idleCount = totalPlayers - (prisonCount + hospitalCount + jobCount + scavengeCount + casinoCount + robberyCount + beatUpCount);
		if (idleCount < 0) idleCount = 0;

		const englishCount = await UserRepository.CountPlayersByLanguage(Language.English);
		const portugueseCount = await UserRepository.CountPlayersByLanguage(Language.Portuguese);
		const spanishCount = await UserRepository.CountPlayersByLanguage(Language.Spanish);

		return {
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
		};
	}

	/**
	 * Takes a snapshot of the current game state and saves it to the database.
	 */
	static async TakeSnapshot() {
		try {
			const stats = await Dashboard.GetCurrentStats();
			await DashboardRepository.Create(stats);

			Log.Success("Dashboard snapshot taken successfully.");
		}
		catch (error) {
			Log.Error(`Failed to take dashboard snapshot: ${error}`);
		}
	}

	/**
	 * Retrieves the last 30 daily snapshots.
	 */
	static async GetLast30Days() {
		return await DashboardRepository.GetLast30Days();
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
