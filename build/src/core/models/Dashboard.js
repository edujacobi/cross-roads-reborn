"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dashboard = void 0;
const DashboardRepository_1 = require("#core/repositories/DashboardRepository");
const GangRepository_1 = require("#core/repositories/GangRepository");
const UserRepository_1 = require("#core/repositories/UserRepository");
const Language_1 = require("#core/models/Language");
const log_1 = require("#shared/log");
class Dashboard {
    static async GetCurrentStats() {
        const now = new Date();
        const totalPlayers = await UserRepository_1.UserRepository.CountActivePlayers();
        const allUsers = await UserRepository_1.UserRepository.CountAllUsers();
        const totalGangs = await GangRepository_1.GangRepository.CountAllGangs();
        const prisonCount = await UserRepository_1.UserRepository.CountPrisoners(now);
        const hospitalCount = await UserRepository_1.UserRepository.CountHospitalized(now);
        const jobCount = await UserRepository_1.UserRepository.CountWorking(now);
        const scavengeCount = await UserRepository_1.UserRepository.CountScavenging(now);
        const casinoCount = await UserRepository_1.UserRepository.CountInCasinoGame();
        const robberyCount = await UserRepository_1.UserRepository.CountInRobbery();
        const beatUpCount = await UserRepository_1.UserRepository.CountInBeatUp();
        let idleCount = totalPlayers - (prisonCount + hospitalCount + jobCount + scavengeCount + casinoCount + robberyCount + beatUpCount);
        if (idleCount < 0)
            idleCount = 0;
        const englishCount = await UserRepository_1.UserRepository.CountPlayersByLanguage(Language_1.Language.English);
        const portugueseCount = await UserRepository_1.UserRepository.CountPlayersByLanguage(Language_1.Language.Portuguese);
        const spanishCount = await UserRepository_1.UserRepository.CountPlayersByLanguage(Language_1.Language.Spanish);
        const classCounts = (await UserRepository_1.UserRepository.CountGroupedByClass()).map(({ class: classId, count }) => ({
            classId,
            count,
        }));
        return {
            date: now,
            totalPlayers,
            allUsers,
            classCounts,
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
            await DashboardRepository_1.DashboardRepository.Create({
                ...stats,
                classCounts: JSON.stringify(stats.classCounts),
            });
            log_1.Log.Success("Dashboard snapshot taken successfully.");
        }
        catch (error) {
            log_1.Log.Error(`Failed to take dashboard snapshot: ${error}`);
        }
    }
    /**
     * Retrieves the last 30 daily snapshots.
     */
    static async GetLast30Days() {
        return await DashboardRepository_1.DashboardRepository.GetLast30Days();
    }
    static async Initialize() {
        await DashboardRepository_1.DashboardRepository.EnsureDashboardStatsColumns();
    }
    /**
     * Schedules a recurring task to take a snapshot every midnight.
     */
    static ScheduleMidnightSnapshot() {
        const now = new Date();
        const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
        const timeUntilMidnight = nextMidnight.getTime() - now.getTime();
        setTimeout(() => {
            Dashboard.TakeSnapshot();
            // Then set an interval to run every 24 hours
            setInterval(Dashboard.TakeSnapshot, 24 * 60 * 60 * 1000);
        }, timeUntilMidnight);
        log_1.Log.Info(`Scheduled next dashboard snapshot for ${nextMidnight.toISOString()}`);
    }
}
exports.Dashboard = Dashboard;
//# sourceMappingURL=Dashboard.js.map