import { BadgeId } from "#core/types/Badges";
import { ClassId } from "#core/types/Classes";
import { SituationId } from "#core/models/User";
import { BundleId, ItemId } from "#core/types/Ids";

export class AssetPaths {
	static getClassImage(classId: ClassId) {
		return `ui/assets/images/classes/${classId}_${ClassId[classId] || "None"}.png`;
	}

	static getSituationImage(situationId: SituationId) {
		let name = SituationId[situationId];
		let id = situationId;
		if (!name) {
			name = SituationId[SituationId.Idling];
			id = SituationId.Idling;
		}
		return `ui/assets/images/situations/${id}_${name}.png`;
	}

	static getBadgeImage(badgeId: BadgeId): string {
		if (badgeId === BadgeId.VIP || badgeId === BadgeId.VIPEternal) {
			return "ui/assets/images/badges/vip.png";
		}
		return `ui/assets/images/badges/${BadgeId[badgeId]}.png`;
	}

	static getItemImage(itemId: ItemId, bundleId: BundleId = 0) {
		let filename = `${itemId}_${ItemId[itemId]}.png`;
		if (bundleId !== 0) filename = `${itemId}_${ItemId[itemId]}_${BundleId[bundleId]}.png`;
		return `ui/assets/images/items/${filename}`;
	}
}
