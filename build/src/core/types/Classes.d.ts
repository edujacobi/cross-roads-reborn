import type { IDescription, IEmote } from "./Interfaces";
import { ClassId } from "./Ids";
export { ClassId } from "./Ids";
export interface IModifier {
    Positive?: number;
    Negative?: number;
}
export interface ClassModifier {
    Casino?: IModifier;
    Job?: IModifier;
    InvestmentYield?: IModifier;
    PrisonBribe?: IModifier;
    PrisonEscape?: IModifier;
    Robbery?: IModifier;
    ScavengeChance?: IModifier;
    ScavengeDuration?: IModifier;
}
export interface Class {
    readonly Id: ClassId;
    readonly Name: IDescription;
    readonly Description: IDescription;
    readonly Image: {
        readonly Url: string;
        readonly Emote: IEmote;
    };
    readonly Modifier?: ClassModifier;
}
export interface ClassListType {
    [key: number]: Class;
}
export declare const ClassList: ClassListType;
export declare function getCasinoClassModifier(classId: ClassId): number;
export declare function getJobClassModifier(classId: ClassId): number;
export declare function getPrisonBribeClassModifier(classId: ClassId): number;
export declare function getPrisonEscapeClassModifier(classId: ClassId): number;
export declare function getRobberyClassModifier(classId: ClassId): number;
export declare function getScavengeChanceClassModifier(classId: ClassId): number;
export declare function getScavengeDurationClassModifier(classId: ClassId): number;
export declare function getInvestmentYieldClassModifier(classId: ClassId): number;
