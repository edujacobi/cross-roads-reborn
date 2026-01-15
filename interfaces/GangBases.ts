import { IDescription } from "./Interfaces";
import { Language } from "../models/Language";
import { IModifier } from "./Classes";

export enum GangBaseId {
	None,
	Airport,
	Bunker,
	BikeClub
}

export interface GangModifier {
	Attack?: IModifier,
	Defense?: IModifier,
	PrisonEscape?: IModifier,
}

export interface GangBase {
	readonly Id: GangBaseId,
	readonly ImageUrl?: string,
	readonly Name: IDescription,
	readonly Description: IDescription,
	readonly Modifier: GangModifier,
}

interface GangBaseType {
	[key: number]: GangBase,
}

export const GangBases: GangBaseType = {
	[GangBaseId.None]: {
		Id: GangBaseId.None,
		Name: {
			[Language.English]: "Without base",
			[Language.Portuguese]: "Sem base",
			[Language.Spanish]: "Sin base",
		},
		Description: {
			[Language.English]: "-",
			[Language.Portuguese]: "-",
			[Language.Spanish]: "-",
		},
		Modifier: {},
	},
	[GangBaseId.Airport]: {
		Id: GangBaseId.Airport,
		ImageUrl: "https://media.discordapp.net/attachments/531174573463306240/757330414342766676/unknown.png",
		Name: {
			[Language.English]: "Abandoned Airport",
			[Language.Portuguese]: "Aeroporto Abandonado",
			[Language.Spanish]: "Aeropuerto Abandonado",
		},
		Description: {
			[Language.English]: "An old abandoned airport, a perfect place for illicit activities and to expand your influence.",
			[Language.Portuguese]: "Um antigo aeroporto abandonado, um lugar perfeito para atividades ilícitas e para expandir sua influência.",
			[Language.Spanish]: "Un antiguo aeropuerto abandonado, un lugar perfecto para actividades ilícitas y para expandir tu influencia.",
		},
		Modifier: {
			PrisonEscape: {
				Positive: 1,
			},
		},
	},
	[GangBaseId.Bunker]: {
		Id: GangBaseId.Bunker,
		ImageUrl: "https://media.discordapp.net/attachments/531174573463306240/757329826091892736/unknown.png",
		Name: {
			[Language.English]: "Subterranean Bunker",
			[Language.Portuguese]: "Bunker Subterrâneo",
			[Language.Spanish]: "Bunker Subterráneo",
		},
		Description: {
			[Language.English]: "A fortified underground bunker, ideal for planning your next moves and safeguarding your operations.",
			[Language.Portuguese]: "Um bunker subterrâneo fortificado, ideal para planejar seus próximos movimentos e salvaguardar suas operações.",
			[Language.Spanish]: "Un búnker subterráneo fortificado, ideal para planificar tus próximos movimientos y salvaguardar tus operaciones.",
		},
		Modifier: {
			Defense: {
				Positive: 0.5,
			},
		},
	},
	[GangBaseId.BikeClub]: {
		Id: GangBaseId.BikeClub,
		ImageUrl: "https://media.discordapp.net/attachments/531174573463306240/757330594303574146/unknown.png",
		Name: {
			[Language.English]: "Anarchist Bikeclub",
			[Language.Portuguese]: "Motoclube Anarquista",
			[Language.Spanish]: "Club de Motociclistas Anarquistas",
		},
		Description: {
			[Language.English]: "A rowdy bike club, a haven for outlaws and a strategic point for controlling the streets.",
			[Language.Portuguese]: "Um motoclube barulhento, um refúgio para foras da lei e um ponto estratégico para controlar as ruas.",
			[Language.Spanish]: "Un ruidoso club de motociclistas, un refugio para forajidos y un punto estratégico para controlar las calles.",
		},
		Modifier: {
			Attack: {
				Positive: 0.5,
			},
		},
	},
};

export function getGangBases(): GangBase[] {
	return Object.values(GangBases);
}