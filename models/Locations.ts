import { IDescription, IEmote } from "./Interfaces";
import { Language } from "./Language";

export enum LocationId {
	OldLady,
	GroceryStore,
	GasStation,
	JewelryStore,
	SmallBank,
	ItalianMafia,
	ArmyDepot,
	JacobiPalace,
}

export interface Location {
	Id: LocationId,
	Description: IDescription,
	Emote: IEmote,
	ImageUrl: string,
	Reward: {
		Min: number,
		Max: number,
	},
	SuccessChance: number,
	NeedAttack: number,
	Special: boolean,
}

interface LocationListType {
	[key: number]: Location;
}

export const LocationList: LocationListType = {
	[LocationId.OldLady]: {
		Id: LocationId.OldLady,
		Description: {
			[Language.English]: "Old lady on the corner",
			[Language.Portuguese]: "Velhinha na esquina",
			[Language.Spanish]: "Vieja en la esquina",
		},
		Emote: {
			Id: "1349193564881555499",
			String: "<:OldLady:1349193564881555499>",
		},
		ImageUrl: "https://media.discordapp.net/attachments/1349187098653233184/1349193675137089576/OldLady.png",
		Reward: {
			Min: 100,
			Max: 350,
		},
		SuccessChance: 0.70,
		NeedAttack: 15,
		Special: false,
	},
	[LocationId.GroceryStore]: {
		Id: LocationId.GroceryStore,
		Description: {
			[Language.English]: "Joe's Grocery Store",
			[Language.Portuguese]: "Mercearia do Zé",
			[Language.Spanish]: "Tienda de Pepe",
		},
		Emote: {
			Id: "1349193566517198890",
			String: "<:GroceryStore:1349193566517198890>",
		},
		ImageUrl: "https://media.discordapp.net/attachments/1349187098653233184/1349193675376300072/GroceryStore.png",
		Reward: {
			Min: 625,
			Max: 1_725,
		},
		SuccessChance: 0.64,
		NeedAttack: 20,
		Special: false,
	},
	[LocationId.GasStation]: {
		Id: LocationId.GasStation,
		Description: {
			[Language.English]: "Gas station",
			[Language.Portuguese]: "Posto de gasolina",
			[Language.Spanish]: "Gasolinera",
		},
		Emote: {
			Id: "1349193568149049384",
			String: "<:GasStation:1349193568149049384>",
		},
		ImageUrl: "https://media.discordapp.net/attachments/1349187098653233184/1349193675594531017/GasStation.png",
		Reward: {
			Min: 3_125,
			Max: 8_000,
		},
		SuccessChance: 0.58,
		NeedAttack: 25,
		Special: false,
	},
	[LocationId.JewelryStore]: {
		Id: LocationId.JewelryStore,
		Description: {
			[Language.English]: "Jewelry store",
			[Language.Portuguese]: "Joalheria",
			[Language.Spanish]: "Joyería",
		},
		Emote: {
			Id: "1349193569658863666",
			String: "<:Jewelry:1349193569658863666>",
		},
		ImageUrl: "https://media.discordapp.net/attachments/1349187098653233184/1349193675854315641/Jewelry.png",
		Reward: {
			Min: 9_700,
			Max: 16_000,
		},
		SuccessChance: 0.52,
		NeedAttack: 35,
		Special: false,
	},
	[LocationId.SmallBank]: {
		Id: LocationId.SmallBank,
		Description: {
			[Language.English]: "Small bank",
			[Language.Portuguese]: "Banco pequeno",
			[Language.Spanish]: "Banco pequeño",
		},
		Emote: {
			Id: "1349193571390984202",
			String: "<:SmallBank:1349193571390984202>",
		},
		ImageUrl: "https://media.discordapp.net/attachments/1349187098653233184/1349193676106104862/SmallBank.png",
		Reward: {
			Min: 18_750,
			Max: 38_000,
		},
		SuccessChance: 0.46,
		NeedAttack: 45,
		Special: false,
	},
	[LocationId.ItalianMafia]: {
		Id: LocationId.ItalianMafia,
		Description: {
			[Language.English]: "Italian Mafia",
			[Language.Portuguese]: "Máfia Italiana",
			[Language.Spanish]: "Mafia italiana",
		},
		Emote: {
			Id: "1349193561068929144",
			String: "<:ItalianMafia:1349193561068929144>",
		},
		ImageUrl: "https://media.discordapp.net/attachments/1349187098653233184/1349193674570993775/ItalianMafia.png",
		Reward: {
			Min: 50_000,
			Max: 90_000,
		},
		SuccessChance: 0.40,
		NeedAttack: 60,
		Special: false,
	},
	[LocationId.ArmyDepot]: {
		Id: LocationId.ArmyDepot,
		Description: {
			[Language.English]: "Army Depot",
			[Language.Portuguese]: "Depósito do Exército",
			[Language.Spanish]: "Depósito del ejército",
		},
		Emote: {
			Id: "1349193559315845190",
			String: "<:ArmyDepot:1349193559315845190>",
		},
		ImageUrl: "https://media.discordapp.net/attachments/1349187098653233184/1349193674344632400/ArmyDepot.png",
		Reward: {
			Min: 250_000,
			Max: 750_000,
		},
		SuccessChance: 0.34,
		NeedAttack: 80,
		Special: false,
	},
	[LocationId.JacobiPalace]: {
		Id: LocationId.JacobiPalace,
		Description: {
			[Language.English]: "Jacobi Palace",
			[Language.Portuguese]: "Palácio do Jacobi",
			[Language.Spanish]: "Palacio de Jacobi",
		},
		Emote: {
			Id: "1349193562738130964",
			String: "<:JacobiPalace:1349193562738130964>",
		},
		ImageUrl: "https://media.discordapp.net/attachments/1349187098653233184/1349193674810195979/JacobiPalace.png",
		Reward: {
			Min: 1_000_000,
			Max: 2_500_000,
		},
		SuccessChance: 0.27,
		NeedAttack: 90,
		Special: true,
	},
};

export function getLocationList(): Location[] {
	return Object.values(LocationList);
}