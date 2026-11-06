"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetPaths = void 0;
const Badges_1 = require("#core/types/Badges");
const Classes_1 = require("#core/types/Classes");
const User_1 = require("#core/models/User");
const Ids_1 = require("#core/types/Ids");
class AssetPaths {
    static getClassImage(classId) {
        return `ui/assets/images/classes/${classId}_${Classes_1.ClassId[classId] || "None"}.png`;
    }
    static getSituationImage(situationId) {
        let id = situationId;
        if (situationId === User_1.SituationId.PrisonAndHospital) {
            id = User_1.SituationId.Prison;
        }
        let name = User_1.SituationId[id];
        if (!name) {
            name = User_1.SituationId[User_1.SituationId.Idling];
            id = User_1.SituationId.Idling;
        }
        return `ui/assets/images/situations/${id}_${name}.png`;
    }
    static getBadgeImage(badgeId) {
        if (badgeId === Badges_1.BadgeId.VIP || badgeId === Badges_1.BadgeId.VIPEternal) {
            return "ui/assets/images/badges/vip.png";
        }
        return `ui/assets/images/badges/${Badges_1.BadgeId[badgeId]}.png`;
    }
    static getItemImage(itemId, bundleId = 0) {
        let filename = `${itemId}_${Ids_1.ItemId[itemId]}.png`;
        if (bundleId !== 0)
            filename = `${itemId}_${Ids_1.ItemId[itemId]}_${Ids_1.BundleId[bundleId]}.png`;
        return `ui/assets/images/items/${filename}`;
    }
}
exports.AssetPaths = AssetPaths;
//# sourceMappingURL=assetPaths.js.map