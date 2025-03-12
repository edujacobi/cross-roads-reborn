import { IDescription } from "./Interfaces";
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
	Emote: string,
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
		Emote: "👵",
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
		Emote: "🏪",
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
		Emote: "⛽",
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
		Emote: "💎",
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
		Emote: "🏦",
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
		Emote: "🎩",
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
		Emote: "🪖",
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
		Emote: "🏰",
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