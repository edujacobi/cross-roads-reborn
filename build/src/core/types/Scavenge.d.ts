import type { IDescription, IEmote } from "./Interfaces";
import { ItemId, ScavengeId } from "./Ids";
export { ScavengeId } from "./Ids";
export declare enum ScavengeRewardType {
    Money = 0,
    ItemConsumable = 1,
    ItemDuration = 2
}
export declare enum ScavengeResultType {
    Success = 0,
    Failure = 1
}
export declare enum ScavengeFailureReason {
    UserScavengeTime = 0,
    UserScavenging = 1,
    UserWorking = 2,
    UserPrison = 3,
    UserHospital = 4,
    UserCasino = 5,
    AttackerIsBeatingId = 6,
    AttackerIsBeingBeatedById = 7,
    AttackerIsRobbingId = 8,
    AttackerIsBeingRobbedById = 9,
    AttackerIsRobbingLocationId = 10,
    UserDefendingInvestment = 11,
    UserParticipatingInGangAction = 12
}
export interface ItemRewardScavenge {
    readonly Id: ItemId;
    readonly Duration: {
        Min: number;
        Max: number;
    };
}
export interface IScavenge {
    readonly Id: ScavengeId;
    readonly Description: IDescription;
    readonly Subtitle: IDescription;
    readonly Emote: IEmote;
    readonly Reward: {
        readonly Items: ItemRewardScavenge[];
        readonly Money: {
            readonly Min: number;
            readonly Max: number;
        };
    };
    readonly SuccessChance: number;
    readonly NeedAttack: number;
    readonly Special: boolean;
    readonly Prison: {
        readonly Chance: number;
        readonly Text: IDescription;
    };
    readonly Hospital: {
        readonly Chance: number;
        readonly Text: IDescription;
    };
}
interface ScavengeListType {
    [key: number]: IScavenge;
}
export declare const ScavengeList: ScavengeListType;
