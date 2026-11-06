import { BackgroundDecorationId } from "./Ids";
import { type IDescription } from "./Interfaces";
export interface BackgroundDecorations {
    readonly Id: BackgroundDecorationId;
    readonly Description: IDescription;
    readonly Shop: boolean;
    readonly Price: number;
}
interface BackgroundDecorationListType {
    [key: number]: BackgroundDecorations;
}
export declare const BackgroundDecorationList: BackgroundDecorationListType;
export declare function getBackgroundDecorationList(): BackgroundDecorations[];
export {};
