import { type IDescription, type IEmote } from "./Interfaces";
export declare enum GangColorId {
    Grey = 0,
    Purple = 1,
    Blue = 2,
    Green = 3,
    Yellow = 4,
    Orange = 5,
    Red = 6,
    Pink = 7,
    Gold = 8
}
export interface IGangColor {
    Id: GangColorId;
    Color: number;
    Description: IDescription;
    Emote: IEmote;
    Special: boolean;
}
interface IGangColorList {
    [key: number]: IGangColor;
}
export declare const GangColor: IGangColorList;
export {};
