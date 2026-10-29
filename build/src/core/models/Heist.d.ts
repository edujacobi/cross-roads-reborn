import type { Gang } from "./Gang.js";
import type { User } from "./User.js";
import { HeistMissionId } from "#core/types/Heist";
export interface HeistValidationResult {
    success: boolean;
    reason?: string;
    time?: Date;
}
export declare class Heist {
    static readonly GETAWAY_CARS_COST = 8000000;
    /**
     * Gets the heist state for a gang.
     */
    static GetHeistState(gangId: number): Promise<import("../database/GangHeists.js").GangHeists>;
    /**
     * Validates if the leader can start a heist or mission.
     */
    static ValidateStart(user: User, gang: Gang, missionId: HeistMissionId): Promise<HeistValidationResult>;
    /**
     * Validates if a member can join a heist or mission lobby.
     */
    static ValidateJoin(user: User, gang: Gang): Promise<HeistValidationResult>;
    /**
     * Bulk locks states for participants.
     */
    static LockStates(users: User[]): Promise<void>;
    /**
     * Bulk releases states for participants.
     */
    static ReleaseLocks(users: User[]): Promise<void>;
    /**
     * Resolves Mission 1 (Rob Bank Blueprint).
     */
    static ResolveMission1(gang: Gang, players: User[]): Promise<{
        success: boolean;
        chance: number;
        isArrested: boolean;
        time: number;
    }>;
    /**
     * Resolves Mission 2 (Buy Getaway Cars).
     */
    static ResolveMission2(gang: Gang): Promise<boolean>;
    /**
     * Resolves Mission 3 (Hack Security Cameras).
     */
    static ResolveMission3(gang: Gang, players: User[]): Promise<{
        success: boolean;
        chance: number;
        isArrested: boolean;
        time: number;
    }>;
    /**
     * Resolves the Main Heist.
     */
    static ResolveMainHeist(gang: Gang, players: User[]): Promise<{
        success: boolean;
        chance: number;
        stolenAmount: number;
        shareAmount: number;
        jailHours: number;
    }>;
}
