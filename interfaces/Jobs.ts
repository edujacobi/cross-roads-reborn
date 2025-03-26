import { ItemId } from "./Items";
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
	Id: JobId,
	Description: IDescription;
	Duration: number,
	Salary: number,
	NeedItem: ItemId[] | null,
	Special: boolean,
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
		Salary: 200,
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
		Duration: 2,
		Salary: 2 * 700,
		NeedItem: [ItemId.Colt45],
		Special: false,
	},
	[JobId.Gangster]: {
		Id: JobId.Gangster,
		Description: {
			[Language.English]: "Gangster",
			[Language.Portuguese]: "Gângster",
			[Language.Spanish]: "Gánster",
		},
		Duration: 3,
		Salary: 3 * 1150,
		NeedItem: [ItemId.Tec9],
		Special: false,
	},
	[JobId.Hunter]: {
		Id: JobId.Hunter,
		Description: {
			[Language.English]: "Cuckold Hunter",
			[Language.Portuguese]: "Caçador de Corno",
			[Language.Spanish]: "Cazador de Cuerno",
		},
		Duration: 4,
		Salary: 4 * 1700,
		NeedItem: [ItemId.Rifle],
		Special: false,
	},
	[JobId.Funeral]: {
		Id: JobId.Funeral,
		Description: {
			[Language.English]: "Funeral wrecker",
			[Language.Portuguese]: "Estraga funeral",
			[Language.Spanish]: "Arruina Funeral",
		},
		Duration: 5,
		Salary: 5 * 2000,
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
		Duration: 6,
		Salary: 6 * 2400,
		NeedItem: [ItemId.MP5],
		Special: false,
	},
	[JobId.Terrorist]: {
		Id: JobId.Terrorist,
		Description: {
			[Language.English]: "Terrorist",
			[Language.Portuguese]: "Terrorista",
			[Language.Spanish]: "Terrorista",
		},
		Duration: 7,
		Salary: 7 * 2900,
		NeedItem: [ItemId.AK47],
		Special: false,
	},
	[JobId.CounterTerrorist]: {
		Id: JobId.CounterTerrorist,
		Description: {
			[Language.English]: "Counter-terrorist",
			[Language.Portuguese]: "Contra-terrorista",
			[Language.Spanish]: "Contra-terrorista",
		},
		Duration: 6,
		Salary: 6 * 3700,
		NeedItem: [ItemId.M4],
		Special: false,
	},
	[JobId.Spy]: {
		Id: JobId.Spy,
		Description: {
			[Language.English]: "CIA's spy",
			[Language.Portuguese]: "Espião da ABIN",
			[Language.Spanish]: "Espía de la CNI",
		},
		Duration: 7,
		Salary: 7 * 7100,
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
		Duration: 8,
		Salary: 8 * 12500,
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
		Duration: 9,
		Salary: 300000,
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
		Duration: 10,
		Salary: 1000000,
		NeedItem: [ItemId.Knife, ItemId.Colt45, ItemId.Tec9, ItemId.Rifle, ItemId.Shotgun, ItemId.MP5, ItemId.AK47, ItemId.M4, ItemId.Sniper, ItemId.Katana, ItemId.RPG, ItemId.LightVest],
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
};

export function getJobList(): Jobs[] {
	return Object.values(JobList);
}