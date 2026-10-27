"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BundleList = void 0;
exports.getSkinBundleList = getSkinBundleList;
const Ids_1 = require("./Ids");
const Interfaces_1 = require("./Interfaces");
const Language_1 = require("#core/models/Language");
exports.BundleList = {
    [Ids_1.BundleId.Default]: {
        Id: Ids_1.BundleId.Default,
        Description: Interfaces_1.defaultSkinDescription,
        Items: [
            Ids_1.ItemId.Knife,
            Ids_1.ItemId.Pistol,
            Ids_1.ItemId.MachinePistol,
            Ids_1.ItemId.HuntRifle,
            Ids_1.ItemId.Shotgun,
            Ids_1.ItemId.SMG,
            Ids_1.ItemId.AssaultRifle,
            Ids_1.ItemId.Carbine,
            Ids_1.ItemId.Sniper,
            Ids_1.ItemId.Katana,
            Ids_1.ItemId.RPG,
            Ids_1.ItemId.Minigun,
            Ids_1.ItemId.Bazooka,
            Ids_1.ItemId.LightVest,
            Ids_1.ItemId.HeavyVest,
            Ids_1.ItemId.Goggles,
            Ids_1.ItemId.Exoskeleton,
            Ids_1.ItemId.Jetpack,
            Ids_1.ItemId.Grenade,
            Ids_1.ItemId.CompactSMG,
            Ids_1.ItemId.Sawnoff,
            Ids_1.ItemId.AdvancedScope,
            Ids_1.ItemId.Sunglasses,
            Ids_1.ItemId.BrassKnuckles,
            Ids_1.ItemId.BaseballBat,
        ],
        Shop: false,
        Price: 0,
    },
    [Ids_1.BundleId.Traditional]: {
        Id: Ids_1.BundleId.Traditional,
        Description: {
            [Language_1.Language.English]: "Traditional",
            [Language_1.Language.Portuguese]: "Tradicional",
            [Language_1.Language.Spanish]: "Tradicional",
        },
        Items: [
            Ids_1.ItemId.Knife,
            Ids_1.ItemId.Pistol,
            Ids_1.ItemId.MachinePistol,
            Ids_1.ItemId.CompactSMG,
            Ids_1.ItemId.HuntRifle,
            Ids_1.ItemId.Shotgun,
            Ids_1.ItemId.Sawnoff,
            Ids_1.ItemId.SMG,
            Ids_1.ItemId.AssaultRifle,
            Ids_1.ItemId.Carbine,
            Ids_1.ItemId.Sniper,
            Ids_1.ItemId.Katana,
            Ids_1.ItemId.RPG,
            Ids_1.ItemId.Minigun,
            Ids_1.ItemId.LightVest,
            Ids_1.ItemId.HeavyVest,
            Ids_1.ItemId.Goggles,
            Ids_1.ItemId.Exoskeleton,
            Ids_1.ItemId.Jetpack,
            Ids_1.ItemId.Grenade,
            Ids_1.ItemId.Bazooka,
            Ids_1.ItemId.AdvancedScope,
            Ids_1.ItemId.Sunglasses,
            Ids_1.ItemId.BrassKnuckles,
            Ids_1.ItemId.BaseballBat,
        ],
        Shop: false,
        Price: 3_000,
    },
    [Ids_1.BundleId.Brazilian]: {
        Id: Ids_1.BundleId.Brazilian,
        Description: {
            [Language_1.Language.English]: "Brazilian",
            [Language_1.Language.Portuguese]: "Brasileiro",
            [Language_1.Language.Spanish]: "Brasileño",
        },
        Items: [
            Ids_1.ItemId.Knife,
            Ids_1.ItemId.Pistol,
            Ids_1.ItemId.MachinePistol,
            Ids_1.ItemId.SMG,
            Ids_1.ItemId.AssaultRifle,
            Ids_1.ItemId.Carbine,
            Ids_1.ItemId.Jetpack,
            Ids_1.ItemId.BrassKnuckles,
            Ids_1.ItemId.BaseballBat,
        ],
        Shop: true,
        Price: 2_000,
    },
    [Ids_1.BundleId.Flaming]: {
        Id: Ids_1.BundleId.Flaming,
        Description: {
            [Language_1.Language.English]: "Flaming",
            [Language_1.Language.Portuguese]: "Flamejante",
            [Language_1.Language.Spanish]: "Flameante",
        },
        Items: [
            Ids_1.ItemId.Katana,
        ],
        Shop: false,
        Price: 5_000,
    },
    [Ids_1.BundleId.Oxidated]: {
        Id: Ids_1.BundleId.Oxidated,
        Description: {
            [Language_1.Language.English]: "Oxidated",
            [Language_1.Language.Portuguese]: "Oxidado",
            [Language_1.Language.Spanish]: "Oxidado",
        },
        Items: [
            Ids_1.ItemId.Knife,
            Ids_1.ItemId.Pistol,
            Ids_1.ItemId.MachinePistol,
            Ids_1.ItemId.CompactSMG,
            Ids_1.ItemId.HuntRifle,
            Ids_1.ItemId.Shotgun,
            Ids_1.ItemId.Sawnoff,
        ],
        Shop: true,
        Price: 2_000,
    },
};
function getSkinBundleList() {
    return Object.values(exports.BundleList);
}
//# sourceMappingURL=Skins.js.map