import { ItemId } from "./Ids";
import { Language } from "../models/Language";
import { IDescription } from "./Interfaces";

export enum JobId {
	UberDriver, // pedreiro
	Butcher, // açougueiro
	Security, // vigilante
	Gangster, // segurança
	Hunter, // caçador
	Funeral, // funeral wrecker
	Militia, // milicia
	Terrorist, // mercenario
	CounterTerrorist, // rei
	Spy, // espiao
	Yakuza, // yakuza
	Demolitionist, // bomba pensar em outro
	Bodyguard, // jacobi
	BlackMarket, // informante
	Double, // duble
	Extraditor, // et
	Godfather, // mafia
	Conqueror, // conquistador
}

export interface Jobs {
	readonly Id: JobId,
	readonly Description: IDescription;
	readonly Duration: number,
	readonly Salary: number,
	readonly NeedItem: ItemId[] | null,
	readonly Special: boolean,
}

interface JobType {
	[string: string]: Jobs;
}

export const JobList: JobType = {
	[JobId.UberDriver]: {
		Id: JobId.UberDriver,
		Description: {
			[Language.English]: "Uber driver",
			[Language.Portuguese]: "Motorista de Uber",
			[Language.Spanish]: "Conductor de Uber",
		},
		Duration: 0.5,
		Salary: 175,
		NeedItem: null,
		Special: false,
	},
	[JobId.Butcher]: {
		Id: JobId.Butcher,
		Description: {
			[Language.English]: "Butcher",
			[Language.Portuguese]: "Açougueiro",
			[Language.Spanish]: "Carnicero",
		},
		Duration: 1,
		Salary: 500,
		NeedItem: [ItemId.Knife],
		Special: false,
	},
	[JobId.Security]: {
		Id: JobId.Security,
		Description: {
			[Language.English]: "Nightclub Security Guard",
			[Language.Portuguese]: "Segurança de boate",
			[Language.Spanish]: "Guardia de Seguridad de Club Nocturno",
		},
		Duration: 1.5,
		Salary: 1.5 * 700,
		NeedItem: [ItemId.Pistol],
		Special: false,
	},
	[JobId.Gangster]: {
		Id: JobId.Gangster,
		Description: {
			[Language.English]: "Gangster",
			[Language.Portuguese]: "Gângster",
			[Language.Spanish]: "Gánster",
		},
		Duration: 2,
		Salary: 2 * 1_150,
		NeedItem: [ItemId.MachinePistol],
		Special: false,
	},
	[JobId.Hunter]: {
		Id: JobId.Hunter,
		Description: {
			[Language.English]: "Cuckold Hunter",
			[Language.Portuguese]: "Caçador de Corno",
			[Language.Spanish]: "Cazador de Cuerno",
		},
		Duration: 2.5,
		Salary: 2.5 * 1_700,
		NeedItem: [ItemId.HuntRifle],
		Special: false,
	},
	[JobId.Funeral]: {
		Id: JobId.Funeral,
		Description: {
			[Language.English]: "Funeral wrecker",
			[Language.Portuguese]: "Estraga funeral",
			[Language.Spanish]: "Arruina Funeral",
		},
		Duration: 3,
		Salary: 3 * 2_000,
		NeedItem: [ItemId.Shotgun],
		Special: false,
	},
	[JobId.Militia]: {
		Id: JobId.Militia,
		Description: {
			[Language.English]: "Militia Member",
			[Language.Portuguese]: "Miliciano",
			[Language.Spanish]: "Miliciano",
		},
		Duration: 3.5,
		Salary: 3.5 * 2_400,
		NeedItem: [ItemId.SMG],
		Special: false,
	},
	[JobId.Terrorist]: {
		Id: JobId.Terrorist,
		Description: {
			[Language.English]: "Terrorist",
			[Language.Portuguese]: "Terrorista",
			[Language.Spanish]: "Terrorista",
		},
		Duration: 4,
		Salary: 4 * 2900,
		NeedItem: [ItemId.AssaultRifle],
		Special: false,
	},
	[JobId.CounterTerrorist]: {
		Id: JobId.CounterTerrorist,
		Description: {
			[Language.English]: "Counter-terrorist",
			[Language.Portuguese]: "Contra-terrorista",
			[Language.Spanish]: "Contra-terrorista",
		},
		Duration: 4.5,
		Salary: 4.5 * 3_700,
		NeedItem: [ItemId.Carbine],
		Special: false,
	},
	[JobId.Spy]: {
		Id: JobId.Spy,
		Description: {
			[Language.English]: "CIA's spy",
			[Language.Portuguese]: "Espião da ABIN",
			[Language.Spanish]: "Espía de la CNI",
		},
		Duration: 5,
		Salary: 5 * 7_100,
		NeedItem: [ItemId.Sniper],
		Special: false,
	},
	[JobId.Yakuza]: {
		Id: JobId.Yakuza,
		Description: {
			[Language.English]: "Yakuza swordsman",
			[Language.Portuguese]: "Espadachim da Yakuza",
			[Language.Spanish]: "Espadachín de la Yakuza",
		},
		Duration: 5.5,
		Salary: 5.5 * 12_500,
		NeedItem: [ItemId.Katana],
		Special: false,
	},
	[JobId.Demolitionist]: {
		Id: JobId.Demolitionist,
		Description: {
			[Language.English]: "Demolitionist",
			[Language.Portuguese]: "Demolicionista",
			[Language.Spanish]: "Demolicionista",
		},
		Duration: 6,
		Salary: 6 * 35_000,
		NeedItem: [ItemId.RPG],
		Special: false,
	},
	[JobId.Bodyguard]: {
		Id: JobId.Bodyguard,
		Description: {
			[Language.English]: "Jacobi's Security Guard",
			[Language.Portuguese]: "Segurança do Jacobi",
			[Language.Spanish]: "Guardia de Seguridad de Jacobi",
		},
		Duration: 7,
		Salary: 7 * 100_000,
		NeedItem: [ItemId.Knife, ItemId.Pistol, ItemId.MachinePistol, ItemId.HuntRifle, ItemId.Shotgun, ItemId.SMG, ItemId.AssaultRifle, ItemId.Carbine, ItemId.Sniper, ItemId.Katana, ItemId.RPG, ItemId.LightVest],
		Special: false,
	},
	[JobId.BlackMarket]: {
		Id: JobId.BlackMarket,
		Description: {
			[Language.English]: "Black Market Informant",
			[Language.Portuguese]: "Informante do Mercado Negro",
			[Language.Spanish]: "Informante del Mercado Negro",
		},
		Duration: 4,
		Salary: 4 * 375000,
		NeedItem: [ItemId.Minigun],
		Special: true,
	},
	[JobId.Double]: {
		Id: JobId.Double,
		Description: {
			[Language.English]: "Power Ranger Stunt Double",
			[Language.Portuguese]: "Dublê de Power Ranger",
			[Language.Spanish]: "Doble de Riesgo de Power Ranger",
		},
		Duration: 4,
		Salary: 4 * 150000,
		NeedItem: [ItemId.Katana, ItemId.Jetpack, ItemId.Goggles],
		Special: true,
	},
	[JobId.Extraditor]: {
		Id: JobId.Extraditor,
		Description: {
			[Language.English]: "Extraterrestrial Extraditor",
			[Language.Portuguese]: "Extraditor de Extraterrestre",
			[Language.Spanish]: "Extraditor de Extraterrestre",
		},
		Duration: 6,
		Salary: 1000000,
		NeedItem: [ItemId.Katana, ItemId.RPG, ItemId.LightVest, ItemId.HeavyVest, ItemId.Goggles],
		Special: true,
	},
	[JobId.Godfather]: {
		Id: JobId.Godfather,
		Description: {
			[Language.English]: "Godfather of the Jacobin Mafia",
			[Language.Portuguese]: "Godfather da Máfia Jacobina",
			[Language.Spanish]: "El padrino de la Mafia Jacobina",
		},
		Duration: 24,
		Salary: 10000000,
		NeedItem: [ItemId.Minigun],
		Special: true,
	},
	[JobId.Conqueror]: {
		Id: JobId.Conqueror,
		Description: {
			[Language.English]: "Galactic Conqueror",
			[Language.Portuguese]: "Conquistador Galático",
			[Language.Spanish]: "Conquistador Galáctico",
		},
		Duration: 72,
		Salary: 50000000,
		NeedItem: [ItemId.Bazooka, ItemId.Minigun, ItemId.Exoskeleton, ItemId.Jetpack],
		Special: true,
	},
} as const;

export function getJobList(): Jobs[] {
	return Object.values(JobList);
}