import type { IDescription } from "./Interfaces";
import type { IModifier } from "./Classes";
import { GangBaseId } from "./Ids";
export { GangBaseId } from "./Ids";
export interface GangModifier {
    Attack?: IModifier;
    Defense?: IModifier;
    PrisonEscape?: IModifier;
}
export interface GangBase {
    readonly Id: GangBaseId;
    readonly ImageUrl?: string;
    readonly Name: IDescription;
    readonly Description: IDescription;
    readonly Modifier: GangModifier;
}
interface GangBaseType {
    [key: number]: GangBase;
}
export declare const GangBases: GangBaseType;
export declare function getGangBases(): GangBase[];
