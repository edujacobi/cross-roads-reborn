import { Language } from "#core/models/Language";
export declare enum HeistMissionId {
    Blueprint = 1,
    GetawayCars = 2,
    HackCameras = 3,
    MainHeist = 4
}
export interface HeistTarget {
    readonly Id: string;
    readonly Name: {
        readonly [Language.English]: string;
        readonly [Language.Portuguese]: string;
        readonly [Language.Spanish]: string;
    };
    readonly Description: {
        readonly [Language.English]: string;
        readonly [Language.Portuguese]: string;
        readonly [Language.Spanish]: string;
    };
    readonly VaultType: "bank" | "casino";
    readonly BaseChanceDivisor: number;
    readonly Thumbnail: string;
    readonly Emote: {
        readonly Id: string;
        readonly String: string;
    };
}
export declare const HeistTargets: HeistTarget[];
/**
 * Gets the current weekly heist target deterministically.
 */
export declare function getWeeklyTarget(): HeistTarget;
