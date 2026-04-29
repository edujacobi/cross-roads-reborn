import { ItemId } from "./Ids";

export interface ImportReward {
	item: ItemId;
	quantity?: number; // for consumables
	time?: number; // hours for non-consumables (24–72h random if omitted)
}

export interface ImportTier {
	minLevel: number;
	maxLevel: number;
	pool: ImportReward[];
}

export const GangImportTiers: ImportTier[] = [
	// Level 1–2: lower-tier
	{
		minLevel: 1,
		maxLevel: 2,
		pool: [
			{ item: ItemId.LightVest },
			{ item: ItemId.BrassKnuckles },
			{ item: ItemId.Sunglasses },
			{ item: ItemId.BaseballBat },
		],
	},
	// Level 3–4: mid-low-tier
	{
		minLevel: 3,
		maxLevel: 4,
		pool: [
			{ item: ItemId.LightVest },
			{ item: ItemId.Sunglasses },
			{ item: ItemId.BaseballBat },
			{ item: ItemId.AdvancedScope },
		],
	},
	// Level 5–6: mid-tier
	{
		minLevel: 5,
		maxLevel: 6,
		pool: [
			{ item: ItemId.HeavyVest },
			{ item: ItemId.BaseballBat },
			{ item: ItemId.AdvancedScope },
			{ item: ItemId.Goggles },
		],
	},
	// Level 7–8: high-tier
	{
		minLevel: 7,
		maxLevel: 8,
		pool: [
			{ item: ItemId.HeavyVest },
			{ item: ItemId.RPG },
			{ item: ItemId.AdvancedScope },
			{ item: ItemId.BaseballBat },
			{ item: ItemId.Grenade, quantity: 2 },
		],
	},
	// Level 9-10: top-tier
	{
		minLevel: 9,
		maxLevel: 10,
		pool: [
			{ item: ItemId.Minigun, time: 36 },
			{ item: ItemId.Bazooka, time: 6 },
			{ item: ItemId.Exoskeleton },
			{ item: ItemId.Jetpack },
			{ item: ItemId.Grenade, quantity: 4 },
		],
	},
];
