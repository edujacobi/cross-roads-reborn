import type { HorseRaceBets } from "#core/database/HorseRaceBets";
import type { HorseRaces } from "#core/database/HorseRaces";
import { type IHorse } from "#core/types/Horses";
import { User } from "./User";
export interface RaceInfo {
    race: HorseRaces;
    userBet: HorseRaceBets | null;
    maxBet: number;
    isBettingOpen: boolean;
}
export declare enum BetFailureReason {
    NotEnoughMoney = 0,
    BetTooLow = 1,
    BetTooHigh = 2,
    AlreadyBet = 3,
    RaceClosed = 4,
    RaceNotFound = 5,
    CannotPlay = 6
}
export type BetResult = {
    Success: true;
    Horse: IHorse;
    Amount: number;
    RaceTime: Date;
} | {
    Success: false;
    Reason: BetFailureReason;
    Message: string;
};
export declare class HorseRacing {
    User: User;
    static readonly RACE_INTERVAL_HOURS = 4;
    static readonly MIN_BET = 5000;
    static readonly MAX_BET_CAP = 1000000;
    constructor(user: User);
    /**
     * Maximum amount this user may bet.
     * @returns The maximum amount this user may bet.
     */
    CalculateMaxBet(): number;
    /**
     * Get the next upcoming race and the user's existing bet, if any.
     * @returns RaceInfo
     */
    GetRaceInfo(): Promise<RaceInfo | null>;
    /**
     * Validate and place a bet.
     * @param raceId The Id of the race to bet on.
     * @param horseId The Id of the horse to bet on.
     * @param amount The amount to bet.
     * @returns BetResult
     */
    PlaceBet(raceId: number, horseId: number, amount: number): Promise<BetResult>;
    /**
     * Returns the next unfinished race, or null if none exists.
     * @returns The next unfinished race.
     */
    static GetNextRace(): Promise<HorseRaces | null>;
    /**
     * Creates a new race with RACE_INTERVAL_HOURS from now.
     * @returns The scheduled race.
     */
    static ScheduleNextRace(): Promise<HorseRaces>;
    /**
     * Schedules a DM notification 30 minutes before the race for previous participants.
     * @param race The race to schedule notifications for.
     */
    static ScheduleRaceNotification(race: HorseRaces): Promise<void>;
    /**
     * Runs a race: picks a winner by weighted random, pays fixed-odds prizes,
     * notifies all participants, and schedules the next race.
     */
    static RunRace(raceId: number): Promise<void>;
    /**
     * Runs any races that are overdue.
     * Called on startup and by the interval.
     */
    static CheckPendingRaces(): Promise<void>;
    /**
     * Boot-time initialiser — call once from the ready event.
     */
    static Initialize(): Promise<void>;
}
