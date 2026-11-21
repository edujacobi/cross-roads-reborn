"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GangImportTiers = void 0;
const Ids_1 = require("./Ids");
exports.GangImportTiers = [
    // Level 1–2: lower-tier
    {
        minLevel: 1,
        maxLevel: 2,
        pool: [
            { item: Ids_1.ItemId.LightVest },
            { item: Ids_1.ItemId.BrassKnuckles },
            { item: Ids_1.ItemId.Sunglasses },
            { item: Ids_1.ItemId.BaseballBat },
        ],
    },
    // Level 3–4: mid-low-tier
    {
        minLevel: 3,
        maxLevel: 4,
        pool: [
            { item: Ids_1.ItemId.LightVest },
            { item: Ids_1.ItemId.Sunglasses },
            { item: Ids_1.ItemId.BaseballBat },
            { item: Ids_1.ItemId.AdvancedScope },
        ],
    },
    // Level 5–6: mid-tier
    {
        minLevel: 5,
        maxLevel: 6,
        pool: [
            { item: Ids_1.ItemId.HeavyVest },
            { item: Ids_1.ItemId.BaseballBat },
            { item: Ids_1.ItemId.AdvancedScope },
            { item: Ids_1.ItemId.Goggles },
        ],
    },
    // Level 7–8: high-tier
    {
        minLevel: 7,
        maxLevel: 8,
        pool: [
            { item: Ids_1.ItemId.HeavyVest },
            { item: Ids_1.ItemId.RPG },
            { item: Ids_1.ItemId.AdvancedScope },
            { item: Ids_1.ItemId.BaseballBat },
            { item: Ids_1.ItemId.Grenade, quantity: 2 },
        ],
    },
    // Level 9-10: top-tier
    {
        minLevel: 9,
        maxLevel: 10,
        pool: [
            { item: Ids_1.ItemId.Minigun, time: 36 },
            { item: Ids_1.ItemId.Bazooka, time: 6 },
            { item: Ids_1.ItemId.Exoskeleton },
            { item: Ids_1.ItemId.Jetpack },
            { item: Ids_1.ItemId.Grenade, quantity: 4 },
        ],
    },
];
//# sourceMappingURL=GangImportPools.js.map