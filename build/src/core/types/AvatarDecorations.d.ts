import { AvatarDecorationId } from "./Ids";
import { type IDescription } from "./Interfaces";
export interface AvatarDecorations {
    readonly Id: AvatarDecorationId;
    readonly Description: IDescription;
    readonly Shop: boolean;
    readonly Price: number;
}
interface AvatarDecorationListType {
    [key: number]: AvatarDecorations;
}
export declare const AvatarDecorationList: AvatarDecorationListType;
export declare function getAvatarDecorationList(): AvatarDecorations[];
export {};
