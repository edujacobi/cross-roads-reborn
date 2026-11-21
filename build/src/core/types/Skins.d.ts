import { BundleId, ItemId } from "./Ids";
import { type IDescription } from "./Interfaces";
export interface SkinBundles {
    readonly Id: BundleId;
    readonly Description: IDescription;
    readonly Items: ItemId[];
    readonly Shop: boolean;
    readonly Price: number;
}
interface SkinBundleListType {
    [key: number]: SkinBundles;
}
export declare const BundleList: SkinBundleListType;
export declare function getSkinBundleList(): SkinBundles[];
export {};
