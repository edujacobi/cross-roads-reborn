import { BadgeId } from "#core/types/Badges";
import { ClassId } from "#core/types/Classes";
import { SituationId } from "#core/models/User";
import { BundleId, ItemId } from "#core/types/Ids";
export declare class AssetPaths {
    static getClassImage(classId: ClassId): string;
    static getSituationImage(situationId: SituationId): string;
    static getBadgeImage(badgeId: BadgeId): string;
    static getItemImage(itemId: ItemId, bundleId?: BundleId): string;
}
