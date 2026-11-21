import type { IDescription, IEmote } from "./Interfaces";
import { BundleId, ItemId } from "./Ids";
import { ItemType } from "./ItemType";
export { ItemType } from "./ItemType";
export interface Items {
    readonly Id: ItemId;
    readonly Type: ItemType;
    readonly Description: IDescription;
    readonly Skin: {
        readonly [bundleId: number]: IEmote;
    };
    readonly Price: number;
    readonly Shop: boolean;
    readonly BlackMarket: boolean;
    readonly Attack: number;
    readonly Defense: number;
    readonly MoneyAttack: number;
    readonly MoneyDefense: number;
    readonly MoreAttack: number;
    readonly MoreDefense: number;
    readonly MoreMoneyATK: number;
    readonly MoreMoneyDEF: number;
    readonly Extra?: IDescription;
    readonly Special: {
        readonly Day: boolean;
        readonly Night: boolean;
    };
}
export interface UserItem extends Items {
    RemainingTime: Date;
    Quantity: number;
    SelectedSkin: BundleId;
}
interface ItemListType {
    [key: number]: Items;
}
export declare const ItemList: ItemListType;
export declare function getItemList(): Items[];
