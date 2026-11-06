import { type IDescription } from "./Interfaces";
export interface IHorse {
    readonly Id: number;
    readonly Emote: string;
    readonly Name: IDescription;
    readonly Description: IDescription;
    readonly Multiplier: number;
    readonly Weight: number;
}
export declare const HorseList: IHorse[];
