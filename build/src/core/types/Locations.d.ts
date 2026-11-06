import type { IDescription, IEmote } from "./Interfaces";
import { LocationId } from "#core/types/Ids";
export { LocationId } from "#core/types/Ids";
export interface Location {
    readonly Id: LocationId;
    readonly Name: IDescription;
    readonly Description: IDescription;
    readonly Emote: IEmote;
    readonly ImageUrl: string;
    readonly Reward: {
        readonly Min: number;
        readonly Max: number;
    };
    readonly SuccessChance: number;
    readonly NeedAttack: number;
    readonly Special: boolean;
    readonly Prison: {
        readonly Text: IDescription[];
    };
}
interface LocationListType {
    [key: number]: Location;
}
export declare const LocationList: LocationListType;
export declare function getLocationList(): Location[];
