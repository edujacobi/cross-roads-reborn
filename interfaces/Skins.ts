import { BundleId, ItemId } from "./Ids";
import { defaultSkinDescription, IDescription } from "./Interfaces";
import { Language } from "../models/Language";

export interface SkinBundles {
	readonly Id: BundleId,
	readonly Description: IDescription,
	readonly Items: ItemId[],
	readonly Shop: boolean;
	readonly Price: number;
}

interface SkinBundleListType {
	[key: number]: SkinBundles,
}

export const BundleList: SkinBundleListType = {
	[BundleId.Default]: {
		Id: BundleId.Default,
		Description: defaultSkinDescription,
		Items: [
			ItemId.Knife,
			ItemId.Pistol,
			ItemId.MachinePistol,
			ItemId.HuntRifle,
			ItemId.Shotgun,
			ItemId.SMG,
			ItemId.AssaultRifle,
			ItemId.Carbine,
			ItemId.Sniper,
			ItemId.Katana,
			ItemId.RPG,
			ItemId.Minigun,
			ItemId.Bazooka,
			ItemId.LightVest,
			ItemId.HeavyVest,
			ItemId.Goggles,
			ItemId.Exoskeleton,
			ItemId.Jetpack,
			ItemId.Grenade,
			ItemId.CompactSMG,
			ItemId.Sawnoff,
			ItemId.AdvancedScope,
			ItemId.Sunglasses,
			ItemId.BrassKnuckles,
			ItemId.BaseballBat,
		],
		Shop: false,
		Price: 0,
	},
	[BundleId.Traditional]: {
		Id: BundleId.Traditional,
		Description: {
			[Language.English]: "Traditional",
			[Language.Portuguese]: "Tradicional",
			[Language.Spanish]: "Tradicional",
		},
		Items: [
			ItemId.Knife,
			ItemId.Pistol,
			ItemId.MachinePistol,
			ItemId.CompactSMG,
			ItemId.HuntRifle,
			ItemId.Shotgun,
			ItemId.Sawnoff,
			ItemId.SMG,
			ItemId.AssaultRifle,
			ItemId.Carbine,
			ItemId.Sniper,
			ItemId.Katana,
			ItemId.RPG,
			ItemId.Minigun,
			ItemId.LightVest,
			ItemId.HeavyVest,
			ItemId.Goggles,
			ItemId.Jetpack,
			ItemId.Grenade,
			ItemId.Bazooka,
			ItemId.BrassKnuckles,
			ItemId.BaseballBat,
		],
		Shop: true,
		Price: 3000,
	},
	[BundleId.Brazilian]: {
		Id: BundleId.Brazilian,
		Description: {
			[Language.English]: "Brazilian",
			[Language.Portuguese]: "Brasileiro",
			[Language.Spanish]: "Brasileño",
		},
		Items: [
			ItemId.Knife,
			ItemId.Pistol,
			ItemId.MachinePistol,
			ItemId.SMG,
			ItemId.AssaultRifle,
			ItemId.Carbine,
			ItemId.Jetpack,
			ItemId.BrassKnuckles,
			ItemId.BaseballBat,
		],
		Shop: true,
		Price: 2000,
	},
	[BundleId.Flaming]: {
		Id: BundleId.Flaming,
		Description: {
			[Language.English]: "Flaming",
			[Language.Portuguese]: "Flamejante",
			[Language.Spanish]: "Flameante",
		},
		Items: [
			ItemId.Katana,
		],
		Shop: false,
		Price: 5000,
	},
} as const;

export function getSkinBundleList(): SkinBundles[] {
	return Object.values(BundleList);
}