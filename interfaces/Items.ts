import { IDescription, IEmote } from "./Interfaces";
import { Language } from "../models/Language";
import { EmoteId, EmoteString } from "../utils/emotes";
import { BundleId, ItemId } from "./Ids";

export enum ItemType {
	Weapon,
	Wearable,
	Accessory,
	Consumable,
	BeatUp
}

export interface Items {
	Id: ItemId,
	Type: ItemType,
	Description: IDescription;
	Skin: {
		[bundleId: number]: IEmote;
	};
	Price: number;
	Shop: boolean;
	BlackMarket: boolean;
	Attack: number;
	Defense: number;
	MoneyAttack: number;
	MoneyDefense: number;
	MoreAttack: number,
	MoreDefense: number,
	MoreMoneyATK: number,
	MoreMoneyDEF: number,
	Special: {
		Day: boolean,
		Night: boolean,
	}
}

export interface UserItem extends Items {
	RemainingTime: Date,
	Quantity: number,
	SelectedSkin: BundleId,
}

interface ItemListType {
	[key: number]: Items,
}

export const ItemList: ItemListType = {
	[ItemId.Knife]: {
		Id: ItemId.Knife,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "Knife",
			[Language.Portuguese]: "Faca",
			[Language.Spanish]: "Cuchillo",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.Knife,
				String: EmoteString.Knife,
			},
			[BundleId.Traditional]: {
				Id: "937170775063023636",
				String: "<:faca:937170775063023636>",
			},
			[BundleId.Brazilian]: {
				Id: "1455275871563677780",
				String: "<:Canivete:1455275871563677780>",
			},
		},
		Price: 2_000,
		Attack: 15,
		Defense: 0,
		MoneyAttack: 6,
		MoneyDefense: 8,
		MoreAttack: 0,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
		Shop: true,
		BlackMarket: false,
	},
	[ItemId.Pistol]: {
		Id: ItemId.Pistol,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "Pistol",
			[Language.Portuguese]: "Pistola",
			[Language.Spanish]: "Pistola",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.Pistol,
				String: EmoteString.Pistol,
			},
			[BundleId.Traditional]: {
				Id: "937170775117553704",
				String: "<:colt45:937170775117553704>",
			},
			[BundleId.Brazilian]: {
				Id: "1455561434619711508",
				String: "<:Taurus_24_7:1455561434619711508>",
			},
		},
		Price: 5_900,
		Attack: 20,
		Defense: 5,
		MoneyAttack: 8,
		MoneyDefense: 12,
		MoreAttack: 0,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
		Shop: true,
		BlackMarket: false,
	},
	[ItemId.MachinePistol]: {
		Id: ItemId.MachinePistol,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "Machine Pistol",
			[Language.Portuguese]: "Pistola-Metralhadora",
			[Language.Spanish]: "Pistola Ametralladora",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.MachinePistol,
				String: EmoteString.MachinePistol,
			},
			[BundleId.Traditional]: {
				Id: "937170775281119262",
				String: "<:tec9:937170775281119262>",
			},
			[BundleId.Brazilian]: {
				Id: "1454163361402065017",
				String: "<:tec9BR:1454163361402065017>",
			},
		},
		Price: 15_000,
		Attack: 25,
		Defense: 10,
		MoneyAttack: 10,
		MoneyDefense: 16,
		MoreAttack: 0,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
		Shop: true,
		BlackMarket: false,
	},
	[ItemId.CompactSMG]: {
		Id: ItemId.CompactSMG,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "Compact Submachine Gun",
			[Language.Portuguese]: "Submetralhadora Compacta",
			[Language.Spanish]: "Subfusil Compacto",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.CompactSMG,
				String: EmoteString.CompactSMG,
			},
			[BundleId.Traditional]: {
				Id: "1454922924518670418",
				String: "<:micro_uzi:1454922924518670418>",
			},
		},
		Price: 0,
		Attack: 25,
		Defense: 10,
		MoneyAttack: 10,
		MoneyDefense: 16,
		MoreAttack: 0,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
		Shop: false,
		BlackMarket: false,
	},
	[ItemId.HuntRifle]: {
		Id: ItemId.HuntRifle,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "Hunt Rifle",
			[Language.Portuguese]: "Espingarda de Caça",
			[Language.Spanish]: "Rifle de caza",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.Rifle,
				String: EmoteString.Rifle,
			},
			[BundleId.Traditional]: {
				Id: "937170774727475242",
				String: "<:rifle:937170774727475242>",
			},
		},
		Price: 27_000,
		Attack: 30,
		Defense: 15,
		MoneyAttack: 12,
		MoneyDefense: 20,
		MoreAttack: 0,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
		Shop: true,
		BlackMarket: false,
	},
	[ItemId.Shotgun]: {
		Id: ItemId.Shotgun,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "Shotgun",
			[Language.Portuguese]: "Escopeta",
			[Language.Spanish]: "Escopeta",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.Shotgun,
				String: EmoteString.Shotgun,
			},
			[BundleId.Traditional]: {
				Id: "937170774983319552",
				String: "<:escopeta:937170774983319552>",
			},
		},
		Price: 40_000,
		Attack: 35,
		Defense: 20,
		MoneyAttack: 14,
		MoneyDefense: 24,
		MoreAttack: 0,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
		Shop: true,
		BlackMarket: false,
	},
	[ItemId.Sawnoff]: {
		Id: ItemId.Sawnoff,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "Sawed-Off Shotgun",
			[Language.Portuguese]: "Escopeta de Cano Serrado",
			[Language.Spanish]: "Escopeta Recortada",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.SawnOff,
				String: EmoteString.SawnOff,
			},
			[BundleId.Traditional]: {
				Id: "1454922962947014770",
				String: "<:sawnoff:1454922962947014770>",
			},
		},
		Price: 40000,
		Attack: 35,
		Defense: 20,
		MoneyAttack: 14,
		MoneyDefense: 24,
		MoreAttack: 0,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
		Shop: false,
		BlackMarket: false,
	},
	[ItemId.SMG]: {
		Id: ItemId.SMG,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "Submachine Gun",
			[Language.Portuguese]: "Submetralhadora",
			[Language.Spanish]: "Subfusil",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.SMG,
				String: EmoteString.SMG,
			},
			[BundleId.Traditional]: {
				Id: "937170775050436619",
				String: "<:mp5:937170775050436619>",
			},
			[BundleId.Brazilian]: {
				Id: "1455284475058716925",
				String: "<:Taurus_M972:1455284475058716925>",
			},
		},
		Price: 65000,
		Attack: 40,
		Defense: 25,
		MoneyAttack: 16,
		MoneyDefense: 28,
		MoreAttack: 0,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
		Shop: true,
		BlackMarket: false,
	},
	[ItemId.AssaultRifle]: {
		Id: ItemId.AssaultRifle,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "Assault Rifle",
			[Language.Portuguese]: "Fuzil de Assalto",
			[Language.Spanish]: "Fusil de Asalto",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.AssaultRifle,
				String: EmoteString.AssaultRifle,
			},
			[BundleId.Traditional]: {
				Id: "937170774920400957",
				String: "<:ak47:937170774920400957>",
			},
			[BundleId.Brazilian]: {
				Id: "1455275951457042463",
				String: "<:FN_FAL:1455275951457042463>",
			},
		},
		Price: 100_000,
		Attack: 45,
		Defense: 30,
		MoneyAttack: 18,
		MoneyDefense: 32,
		MoreAttack: 0,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
		Shop: true,
		BlackMarket: false,
	},
	[ItemId.Carbine]: {
		Id: ItemId.Carbine,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "Carbine",
			[Language.Portuguese]: "Carabina",
			[Language.Spanish]: "Carabina",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.Carbine,
				String: EmoteString.Carbine,
			},
			[BundleId.Traditional]: {
				Id: "937170775100760114",
				String: "<:m4:937170775100760114>",
			},
			[BundleId.Brazilian]: {
				Id: "1455562151396642826",
				String: "<:IMBEL_IA2:1455562151396642826>",
			},
		},
		Price: 135_000,
		Attack: 50,
		Defense: 35,
		MoneyAttack: 20,
		MoneyDefense: 36,
		MoreAttack: 0,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
		Shop: true,
		BlackMarket: false,
	},
	[ItemId.Sniper]: {
		Id: ItemId.Sniper,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "Sniper",
			[Language.Portuguese]: "Sniper",
			[Language.Spanish]: "Sniper",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.Sniper,
				String: EmoteString.Sniper,
			},
			[BundleId.Traditional]: {
				Id: "937170775138508830",
				String: "<:sniper:937170775138508830>",
			},
		},
		Price: 210_000,
		Attack: 55,
		Defense: 40,
		MoneyAttack: 22,
		MoneyDefense: 40,
		MoreAttack: 0,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
		Shop: true,
		BlackMarket: false,
	},
	[ItemId.Katana]: {
		Id: ItemId.Katana,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "Katana",
			[Language.Portuguese]: "Katana",
			[Language.Spanish]: "Katana",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.Katana,
				String: EmoteString.Katana,
			},
			[BundleId.Traditional]: {
				Id: "937170775021068378",
				String: "<:katanaicon:937170775021068378>",
			},
			[BundleId.Flaming]: {
				Id: "1454163271333580895",
				String: "<:katanaflames:1454163271333580895>",
			},
		},
		Price: 330_000,
		Attack: 60,
		Defense: 45,
		MoneyAttack: 24,
		MoneyDefense: 44,
		MoreAttack: 0,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
		Shop: true,
		BlackMarket: false,
	},
	[ItemId.RPG]: {
		Id: ItemId.RPG,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "RPG",
			[Language.Portuguese]: "RPG",
			[Language.Spanish]: "RPG",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.RPG,
				String: EmoteString.RPG,
			},
			[BundleId.Traditional]: {
				Id: "937170775096557588",
				String: "<:rpg:937170775096557588>",
			},
		},
		Price: 666_000,
		Attack: 70,
		Defense: 35,
		MoneyAttack: 26,
		MoneyDefense: 48,
		MoreAttack: 0,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
		Shop: true,
		BlackMarket: false,
	},
	[ItemId.Minigun]: {
		Id: ItemId.Minigun,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "Minigun",
			[Language.Portuguese]: "Minigun",
			[Language.Spanish]: "Minigun",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.Minigun,
				String: EmoteString.Minigun,
			},
			[BundleId.Traditional]: {
				Id: "937170775121731604",
				String: "<:minigun:937170775121731604>",
			},
		},
		Price: 10_000_000,
		Attack: 80,
		Defense: 45,
		MoneyAttack: 28,
		MoneyDefense: 52,
		MoreAttack: 0,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
		Shop: false,
		BlackMarket: true,
	},
	[ItemId.Bazooka]: {
		Id: ItemId.Bazooka,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "Bazooka",
			[Language.Portuguese]: "Bazuca",
			[Language.Spanish]: "Bazuca",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.Bazooka,
				String: EmoteString.Bazooka,
			},
			[BundleId.Traditional]: {
				Id: "937170775201439774",
				String: "<:bazuca:937170775201439774>",
			},
		},
		Price: 0,
		Attack: 90,
		Defense: 50,
		MoneyAttack: 30,
		MoneyDefense: 56,
		MoreAttack: 0,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
		Shop: false,
		BlackMarket: false,
	},
	[ItemId.LightVest]: {
		Id: ItemId.LightVest,
		Type: ItemType.Wearable,
		Description: {
			[Language.English]: "Light vest",
			[Language.Portuguese]: "Colete leve",
			[Language.Spanish]: "Chaleco ligero",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.LightVest,
				String: EmoteString.LightVest,
			},
		},
		Price: 175_000,
		Shop: true,
		BlackMarket: false,
		Attack: 0,
		Defense: 0,
		MoneyAttack: 0,
		MoneyDefense: 0,
		MoreAttack: 0,
		MoreDefense: 2,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
	},
	[ItemId.HeavyVest]: {
		Id: ItemId.HeavyVest,
		Type: ItemType.Wearable,
		Description: {
			[Language.English]: "Heavy vest",
			[Language.Portuguese]: "Colete pesado",
			[Language.Spanish]: "Chaleco pesado",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.HeavyVest,
				String: EmoteString.HeavyVest,
			},
		},
		Price: 1_000_000,
		Shop: true,
		BlackMarket: false,
		Attack: 0,
		Defense: 0,
		MoneyAttack: 0,
		MoneyDefense: 0,
		MoreAttack: 0,
		MoreDefense: 5,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
	},
	[ItemId.Goggles]: {
		Id: ItemId.Goggles,
		Type: ItemType.Wearable,
		Description: {
			[Language.English]: "Night goggles",
			[Language.Portuguese]: "Óculos noturno",
			[Language.Spanish]: "Gafas nocturnas",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.Nightvision,
				String: EmoteString.Nightvision,
			},
			[BundleId.Traditional]: {
				Id: "937170774446461008",
				String: "<:goggles:937170774446461008>",
			},
		},
		Price: 300_000,
		Shop: true,
		BlackMarket: false,
		Attack: 0,
		Defense: 0,
		MoneyAttack: 0,
		MoneyDefense: 0,
		MoreAttack: 3,
		MoreDefense: 3,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: true,
		},
	},
	[ItemId.Exoskeleton]: {
		Id: ItemId.Exoskeleton,
		Type: ItemType.Wearable,
		Description: {
			[Language.English]: "Exoskeleton",
			[Language.Portuguese]: "Exoesqueleto",
			[Language.Spanish]: "Exoesqueleto",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.Exoskeleton,
				String: EmoteString.Exoskeleton,
			},
		},
		Price: 20_000_000,
		Shop: false,
		BlackMarket: true,
		Attack: 0,
		Defense: 0,
		MoneyAttack: 0,
		MoneyDefense: 0,
		MoreAttack: 0,
		MoreDefense: 5,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 5,
		Special: {
			Day: false,
			Night: false,
		},
	},
	[ItemId.Jetpack]: {
		Id: ItemId.Jetpack,
		Type: ItemType.Accessory,
		Description: {
			[Language.English]: "Jetpack",
			[Language.Portuguese]: "Jetpack",
			[Language.Spanish]: "Jetpack",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.Jetpack,
				String: EmoteString.Jetpack,
			},
			[BundleId.Traditional]: {
				Id: "937170775079792690",
				String: "<:jetpack:937170775079792690>",
			},
			[BundleId.Brazilian]: {
				Id: "937411620198563910",
				String: "<:jetpackbr:937411620198563910>",
			},
		},
		Price: 5_000_000,
		Shop: false,
		BlackMarket: true,
		Attack: 0,
		Defense: 0,
		MoneyAttack: 0,
		MoneyDefense: 0,
		MoreAttack: 0,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
	},
	[ItemId.Grenade]: {
		Id: ItemId.Grenade,
		Type: ItemType.Consumable,
		Description: {
			[Language.English]: "Granade",
			[Language.Portuguese]: "Granada",
			[Language.Spanish]: "Granada",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.Granade,
				String: EmoteString.Granade,
			},
			[BundleId.Traditional]: {
				Id: "937170774152859670",
				String: "<:granada:937170774152859670>",
			},
		},
		Price: 350_000,
		Shop: false,
		BlackMarket: true,
		Attack: 0,
		Defense: 0,
		MoneyAttack: 0,
		MoneyDefense: 0,
		MoreAttack: 5,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
	},
	[ItemId.Sunglasses]: {
		Id: ItemId.Sunglasses,
		Type: ItemType.Wearable,
		Description: {
			[Language.English]: "Sun Glasses",
			[Language.Portuguese]: "Óculos de Sol",
			[Language.Spanish]: "Gafas de Sol",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.Sunglasses,
				String: EmoteString.Sunglasses,
			},
		},
		Price: 0,
		Shop: false,
		BlackMarket: false,
		Attack: 0,
		Defense: 0,
		MoneyAttack: 0,
		MoneyDefense: 0,
		MoreAttack: 0,
		MoreDefense: 1,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: true,
			Night: false,
		},
	},
	[ItemId.BrassKnuckles]: {
		Id: ItemId.BrassKnuckles,
		Type: ItemType.BeatUp,
		Description: {
			[Language.English]: "Brass Knucles",
			[Language.Portuguese]: "Soco inglês",
			[Language.Spanish]: "Puño de latón",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.BrassKnuckles,
				String: EmoteString.BrassKnuckles,
			},
			[BundleId.Traditional]: {
				Id: "1454923590087479515",
				String: "<:brassknucles:1454923590087479515>",
			},
			[BundleId.Brazilian]: {
				Id: "1455226259175903516",
				String: "<:Havaiana:1455226259175903516>",
			},
		},
		Price: 0,
		Shop: false,
		BlackMarket: false,
		Attack: 0,
		Defense: 0,
		MoneyAttack: 0,
		MoneyDefense: 0,
		MoreAttack: 1,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
	},
	[ItemId.BaseballBat]: {
		Id: ItemId.BaseballBat,
		Type: ItemType.BeatUp,
		Description: {
			[Language.English]: "Baseball bat",
			[Language.Portuguese]: "Taco de beisebol",
			[Language.Spanish]: "Bate de béisbol",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.BaseballBat,
				String: EmoteString.BaseballBat,
			},
			[BundleId.Traditional]: {
				Id: "1454922867568279665",
				String: "<:bati:1454922867568279665>",
			},
			[BundleId.Brazilian]: {
				Id: "1455276013922816260",
				String: "<:Pau_com_pregos:1455276013922816260>",
			},
		},
		Price: 0,
		Shop: false,
		BlackMarket: false,
		Attack: 0,
		Defense: 0,
		MoneyAttack: 0,
		MoneyDefense: 0,
		MoreAttack: 2,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: false,
			Night: false,
		},
	},
	[ItemId.AdvancedScope]: {
		Id: ItemId.AdvancedScope,
		Type: ItemType.Wearable,
		Description: {
			[Language.English]: "Advanced scope",
			[Language.Portuguese]: "Mira avançada",
			[Language.Spanish]: "Mira avanzada",
		},
		Skin: {
			[BundleId.Default]: {
				Id: EmoteId.AdvancedScope,
				String: EmoteString.AdvancedScope,
			},
		},
		Price: 1_000_000,
		Shop: false,
		BlackMarket: true,
		Attack: 0,
		Defense: 0,
		MoneyAttack: 0,
		MoneyDefense: 0,
		MoreAttack: 2,
		MoreDefense: 0,
		MoreMoneyATK: 0,
		MoreMoneyDEF: 0,
		Special: {
			Day: true,
			Night: false,
		},
	},
};

export function getItemList(): Items[] {
	return Object.values(ItemList);
}