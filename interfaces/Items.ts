import { defaultSkinDescription, IDescription, ISkin } from "./Interfaces";
import { Language } from "../models/Language";
import { EmoteId, EmoteString } from "../utils/emotes";

export enum ItemId {
	Knife,
	Colt45,
	Tec9,
	Rifle,
	Shotgun,
	MP5,
	AK47,
	M4,
	Sniper,
	Katana,
	RPG,
	Minigun,
	Bazooka,
	LightVest,
	HeavyVest,
	Goggles,
	Exoskeleton,
	Jetpack,
	Grenade,
	MicroUzi,
	Sawnoff,
	AdvancedScope,
	Sunglasses,
	BrassKnuckles,
	BaseballBat,
}

export enum ItemType {
	Weapon,
	Wearable,
	Accessory,
	Consumable,
}

export interface Items {
	Id: ItemId,
	Type: ItemType,
	Description: IDescription;
	Skin: {
		Default: ISkin,
		[skin: string]: ISkin;
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
	Quantity: number
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
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.Knife,
					String: EmoteString.Knife,
				},
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
	[ItemId.Colt45]: {
		Id: ItemId.Colt45,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "Glock 17",
			[Language.Portuguese]: "Glock 17",
			[Language.Spanish]: "Glock 17",
		},
		Skin: {
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.Colt45,
					String: EmoteString.Colt45,
				},
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
	[ItemId.Tec9]: {
		Id: ItemId.Tec9,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "Tec 9",
			[Language.Portuguese]: "Tec 9",
			[Language.Spanish]: "Tec 9",
		},
		Skin: {
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.Tec9,
					String: EmoteString.Tec9,
				},
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
	[ItemId.MicroUzi]: {
		Id: ItemId.MicroUzi,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "Micro Uzi",
			[Language.Portuguese]: "Micro Uzi",
			[Language.Spanish]: "Micro Uzi",
		},
		Skin: {
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.MicroUzi,
					String: EmoteString.MicroUzi,
				},
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
	[ItemId.Rifle]: {
		Id: ItemId.Rifle,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "Rifle",
			[Language.Portuguese]: "Rifle",
			[Language.Spanish]: "Rifle",
		},
		Skin: {
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.Rifle,
					String: EmoteString.Rifle,
				},
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
			[Language.English]: "Remington 870",
			[Language.Portuguese]: "Remington 870",
			[Language.Spanish]: "Remington 870",
		},
		Skin: {
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.Shotgun,
					String: EmoteString.Shotgun,
				},
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
			[Language.English]: "Sawnoff Uplander",
			[Language.Portuguese]: "Uplander Serrada",
			[Language.Spanish]: "Uplander Serrada",
		},
		Skin: {
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.SawnOff,
					String: EmoteString.SawnOff,
				},
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
	[ItemId.MP5]: {
		Id: ItemId.MP5,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "MP5",
			[Language.Portuguese]: "MP5",
			[Language.Spanish]: "MP5",
		},
		Skin: {
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.MP5,
					String: EmoteString.MP5,
				},
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
	[ItemId.AK47]: {
		Id: ItemId.AK47,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "AK47",
			[Language.Portuguese]: "AK47",
			[Language.Spanish]: "AK47",
		},
		Skin: {
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.AK47,
					String: EmoteString.AK47,
				},
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
	[ItemId.M4]: {
		Id: ItemId.M4,
		Type: ItemType.Weapon,
		Description: {
			[Language.English]: "M4A1",
			[Language.Portuguese]: "M4A1",
			[Language.Spanish]: "M4A1",
		},
		Skin: {
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.M4,
					String: EmoteString.M4,
				},
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
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.Sniper,
					String: EmoteString.Sniper,
				},
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
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.Katana,
					String: EmoteString.Katana,
				},
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
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.RPG,
					String: EmoteString.RPG,
				},
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
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.Minigun,
					String: EmoteString.Minigun,
				},
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
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.Bazooka,
					String: EmoteString.Bazooka,
				},
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
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.LightVest,
					String: EmoteString.LightVest,
				},
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
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.HeavyVest,
					String: EmoteString.HeavyVest,
				},
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
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.Nightvision,
					String: EmoteString.Nightvision,
				},
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
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.Exoskeleton,
					String: EmoteString.Exoskeleton,
				},
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
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.Jetpack,
					String: EmoteString.Jetpack,
				},
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
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.Granade,
					String: EmoteString.Granade,
				},
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
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.Sunglasses,
					String: EmoteString.Sunglasses,
				},
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
		Type: ItemType.Wearable,
		Description: {
			[Language.English]: "Brass Knucles",
			[Language.Portuguese]: "Soco inglês",
			[Language.Spanish]: "Puño de latón",
		},
		Skin: {
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.BrassKnuckles,
					String: EmoteString.BrassKnuckles,
				},
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
		Type: ItemType.Wearable,
		Description: {
			[Language.English]: "Baseball bat",
			[Language.Portuguese]: "Taco de beisebol",
			[Language.Spanish]: "Bate de béisbol",
		},
		Skin: {
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.BaseballBat,
					String: EmoteString.BaseballBat,
				},
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
			Default: {
				Description: defaultSkinDescription,
				Emote: {
					Id: EmoteId.AdvancedScope,
					String: EmoteString.AdvancedScope,
				},
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