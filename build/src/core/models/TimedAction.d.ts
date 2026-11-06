import { type TimedActionKind } from "#core/repositories/TimedActionRepository";
export declare class TimedAction {
    static Initialize(): Promise<void>;
    static Stop(): void;
    static ProcessPending(): Promise<void>;
    static GetStatus(userId: string, kind: TimedActionKind): Promise<{
        id: string;
        referenceId: number;
        dueAt: Date;
        result: string | null;
    } | null>;
    static DecodeScavengeResult(json: string): {
        completed: boolean;
        success: boolean;
        rewardType?: import("../types/Scavenge").ScavengeRewardType;
        rewardValue?: number;
        rewardDescription?: string;
        item?: import("../types/Items").Items;
        quantity?: number;
        duration?: number;
        cooldownEndsAt?: Date;
        hospitalized?: boolean;
        hospitalTime?: Date;
        inprisoned?: boolean;
        prisonTime?: Date;
    };
    static DecodeRobberyResult(json: string): import("../types/Robbery").RobberyLocationOutcomeData;
}
