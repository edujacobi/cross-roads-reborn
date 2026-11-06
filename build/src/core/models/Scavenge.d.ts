import type { User } from "./User";
import { type ItemRewardScavenge, ScavengeFailureReason, type ScavengeId, ScavengeRewardType } from "#core/types/Scavenge";
import { type Items } from "#core/types/Items";
export declare class Scavenge {
    private attemptId?;
    User: User;
    PlaceId: ScavengeId;
    RewardMoneyMin: number;
    RewardMoneyMax: number;
    RewardItems: ItemRewardScavenge[];
    SuccessChance: number;
    Timer: {
        Prison: number;
        Hospital: number;
    };
    constructor(user: User, placeId: ScavengeId, attemptId?: string | undefined);
    CanScavenge(): Promise<{
        attacker?: undefined;
        canScavenge: boolean;
        reason: ScavengeFailureReason;
        location?: undefined;
    } | {
        canScavenge: boolean;
        reason: ScavengeFailureReason;
        attacker: import("../database/Users").Users | null;
        location?: undefined;
    } | {
        attacker?: undefined;
        canScavenge: boolean;
        reason: ScavengeFailureReason;
        location: import("#core/types/Locations").Location;
    } | {
        reason?: undefined;
        attacker?: undefined;
        location?: undefined;
        canScavenge: boolean;
    }>;
    StartScavenge(): Promise<void>;
    EndScavenge(): Promise<{
        completed: boolean;
        success: boolean;
        rewardType?: ScavengeRewardType;
        rewardValue?: number;
        rewardDescription?: string;
        item?: Items;
        quantity?: number;
        duration?: number;
        cooldownEndsAt?: Date;
        hospitalized?: boolean;
        hospitalTime?: Date;
        inprisoned?: boolean;
        prisonTime?: Date;
    }>;
    private ResolveScavenge;
}
