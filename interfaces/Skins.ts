import { BundleId, ItemId } from "./Ids";
import { defaultSkinDescription, IDescription } from "./Interfaces";
import { Language } from "../models/Language";

export interface SkinBundles {
	Id: BundleId,
	Description: IDescription,
	Items: ItemId[],
	Shop: boolean;
	Price: number;
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
			ItemId.Colt45,
			ItemId.Tec9,
			ItemId.Rifle,
			ItemId.Shotgun,
			ItemId.MP5,
			ItemId.AK47,
			ItemId.M4,
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
			ItemId.MicroUzi,
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
			ItemId.Colt45,
			ItemId.Tec9,
			ItemId.MicroUzi,
			ItemId.Rifle,
			ItemId.Shotgun,
			ItemId.Sawnoff,
			ItemId.MP5,
			ItemId.AK47,
			ItemId.M4,
			ItemId.Sniper,
			ItemId.Katana,
			ItemId.RPG,
			ItemId.Minigun,
			ItemId.Goggles,
			ItemId.Jetpack,
			ItemId.Grenade,
			ItemId.Bazooka,
			ItemId.BrassKnuckles,
			ItemId.BaseballBat,
		],
		Shop: true,
		Price: 5000,
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
			ItemId.Tec9,
			ItemId.AK47,
			ItemId.Jetpack,
			ItemId.BrassKnuckles,
			ItemId.BaseballBat,
		],
		Shop: true,
		Price: 2500,
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
		Shop: true,
		Price: 5000,
	},
};

export function getSkinBundleList(): SkinBundles[] {
	return Object.values(BundleList);
}