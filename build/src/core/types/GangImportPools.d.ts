import { ItemId } from "./Ids";
export interface ImportReward {
    item: ItemId;
    quantity?: number;
    time?: number;
}
export interface ImportTier {
    minLevel: number;
    maxLevel: number;
    pool: ImportReward[];
}
export declare const GangImportTiers: ImportTier[];
