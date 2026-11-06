export declare class Dashboard {
    static GetCurrentStats(): Promise<{
        date: Date;
        totalPlayers: number;
        allUsers: number;
        classCounts: {
            classId: number;
            count: number;
        }[];
        totalGangs: number;
        prisonCount: number;
        hospitalCount: number;
        jobCount: number;
        scavengeCount: number;
        casinoCount: number;
        robberyCount: number;
        beatUpCount: number;
        idleCount: number;
        englishCount: number;
        portugueseCount: number;
        spanishCount: number;
    }>;
    /**
     * Takes a snapshot of the current game state and saves it to the database.
     */
    static TakeSnapshot(): Promise<void>;
    /**
     * Retrieves the last 30 daily snapshots.
     */
    static GetLast30Days(): Promise<import("../database/DashboardStats").DashboardStats[]>;
    static Initialize(): Promise<void>;
    /**
     * Schedules a recurring task to take a snapshot every midnight.
     */
    static ScheduleMidnightSnapshot(): void;
}
