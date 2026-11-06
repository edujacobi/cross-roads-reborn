import type { IDescription } from "./Interfaces";
import { BadgeId } from "./Ids";
export { BadgeId } from "./Ids";
export interface IBadge {
    readonly Id: BadgeId;
    readonly Name: IDescription;
    readonly Description: IDescription;
    readonly Emoji: {
        readonly Id: string;
        readonly String: string;
    };
}
interface BadgeListType {
    [key: number]: IBadge;
}
export declare const BadgeList: BadgeListType;
export declare function getBadgeList(): IBadge[];
export declare function getCommandBadgeGroups(): {
    special: IBadge[];
    seasonal: IBadge[];
};
