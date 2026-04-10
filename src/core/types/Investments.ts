import { Language } from "#core/models/Language";
import type { IDescription, IEmote } from "./Interfaces";

export enum InvestmentId {
	ChurrosCart,
	CrackDen,
	BocceCourt,
	VeganRestaurant,
	GolfClub,
	VehicleManufacturer,
	UnderdevelopedCountry,
	ReligiousCult,
	StarGalaxy,
}

export interface Investment {
	readonly Id: InvestmentId;
	readonly Name: IDescription;
	readonly Description: IDescription;
	readonly Emote: IEmote;
	readonly ImageUrl: string;
	readonly Price: number;
	readonly HourlyYield: number;
	readonly BaseDefense: number;
	readonly PrisonSeverity: number;
	readonly HenchmanFee: number;
}

export const InvestmentList: Record<number, Investment> = {
	[InvestmentId.ChurrosCart]: {
		Id: InvestmentId.ChurrosCart,
		Name: {
			[Language.English]: "Churros Cart",
			[Language.Portuguese]: "Carrinho de Churros",
			[Language.Spanish]: "Carrito de Churros",
		},
		Description: {
			[Language.English]: "A simple churros cart at the corner of the fishcutter's street.",
			[Language.Portuguese]: "Um carrinho de churros simples na esquina da rua da peixeira.",
			[Language.Spanish]: "Un simple carrito de churros en la esquina de la calle de la pescatera.",
		},
		Emote: {
			Id: "0",
			String: "📰",
		},
		ImageUrl: "https://media.discordapp.net/attachments/529795576993415175/923591337561980979/1-Churros.png",
		Price: 5_000,
		HourlyYield: 5_000 * 0.012,
		BaseDefense: 20,
		PrisonSeverity: 1 * 0.3,
		HenchmanFee: 14,
	},
	[InvestmentId.CrackDen]: {
		Id: InvestmentId.CrackDen,
		Name: {
			[Language.English]: "Crack den",
			[Language.Portuguese]: "Boca de Fumo",
			[Language.Spanish]: "Guarida de Crack",
		},
		Description: {
			[Language.English]: "A place for illicit trade and questionable activities.",
			[Language.Portuguese]: "Um local de comércio ilícito e atividades duvidosas.",
			[Language.Spanish]: "Un lugar para el comercio ilícito y actividades dudosas.",
		},
		Emote: {
			Id: "0",
			String: "🏪",
		},
		ImageUrl: "https://media.discordapp.net/attachments/529795576993415175/923591337972989952/2-Boca.png",
		Price: 15_000,
		HourlyYield: 15_000 * 0.013,
		BaseDefense: 25,
		PrisonSeverity: 2 * 0.3,
		HenchmanFee: 16,
	},
	[InvestmentId.BocceCourt]: {
		Id: InvestmentId.BocceCourt,
		Name: {
			[Language.English]: "Bocce Court",
			[Language.Portuguese]: "Cancha de Bocha",
			[Language.Spanish]: "Cancha de Bocha",
		},
		Description: {
			[Language.English]: "A nice place to play bocce and drink a beer.",
			[Language.Portuguese]: "Um lugar agradável para jogar bocha e tomar uma cerveja.",
			[Language.Spanish]: "Un buen lugar para jugar bochas y tomar una cerveza.",
		},
		Emote: {
			Id: "0",
			String: "🍺",
		},
		ImageUrl: "https://media.discordapp.net/attachments/529795576993415175/923591338430185472/3-Cancha.png",
		Price: 50_000,
		HourlyYield: 50_000 * 0.014,
		BaseDefense: 30,
		PrisonSeverity: 3 * 0.3,
		HenchmanFee: 18,
	},
	[InvestmentId.VeganRestaurant]: {
		Id: InvestmentId.VeganRestaurant,
		Name: {
			[Language.English]: "Vegan Restaurant",
			[Language.Portuguese]: "Restaurante Vegano",
			[Language.Spanish]: "Restaurante Vegano",
		},
		Description: {
			[Language.English]: "Sells genetically modified vegan food.",
			[Language.Portuguese]: "Vende comida vegana geneticamente modificada.",
			[Language.Spanish]: "Vende comida vegana genéticamente modificada.",
		},
		Emote: {
			Id: "0",
			String: "⛽",
		},
		ImageUrl: "https://media.discordapp.net/attachments/529795576993415175/923591338824466532/4-Vegano.png",
		Price: 150_000,
		HourlyYield: 150_000 * 0.015,
		BaseDefense: 35,
		PrisonSeverity: 4 * 0.3,
		HenchmanFee: 20,
	},
	[InvestmentId.GolfClub]: {
		Id: InvestmentId.GolfClub,
		Name: {
			[Language.English]: "Golf Club",
			[Language.Portuguese]: "Clube de Golfe",
			[Language.Spanish]: "Clube de Golfe",
		},
		Description: {
			[Language.English]: "An exclusive social club for the city's elite.",
			[Language.Portuguese]: "Um clube social exclusivo para a elite da cidade.",
			[Language.Spanish]: "Un club social exclusivo para la élite de la ciudad.",
		},
		Emote: {
			Id: "0",
			String: "🛒",
		},
		ImageUrl: "https://media.discordapp.net/attachments/529795576993415175/923591339667488768/5-Golfe.png",
		Price: 500_000,
		HourlyYield: 500_000 * 0.016,
		BaseDefense: 40,
		PrisonSeverity: 5 * 0.3,
		HenchmanFee: 22,
	},
	[InvestmentId.VehicleManufacturer]: {
		Id: InvestmentId.VehicleManufacturer,
		Name: {
			[Language.English]: "Vehicle Manufacturer",
			[Language.Portuguese]: "Montadora de Veículos",
			[Language.Spanish]: "Montadora de Vehículos",
		},
		Description: {
			[Language.English]: "Sells luxury cars. Great for trafficking packs of cigarettes.",
			[Language.Portuguese]: "Vende carros de luxo. Ótimos para traficar maços de cigarro.",
			[Language.Spanish]: "Vende coches de lujo. Ideales para traficar paquetes de cigarrillos.",
		},
		Emote: {
			Id: "0",
			String: "🚗",
		},
		ImageUrl: "https://media.discordapp.net/attachments/529795576993415175/923591340078555226/6-Montadora.png",
		Price: 1_500_000,
		HourlyYield: 1_500_000 * 0.017,
		BaseDefense: 45,
		PrisonSeverity: 6 * 0.3,
		HenchmanFee: 24,
	},
	[InvestmentId.UnderdevelopedCountry]: {
		Id: InvestmentId.UnderdevelopedCountry,
		Name: {
			[Language.English]: "Underdeveloped Country",
			[Language.Portuguese]: "País Subdesenvolvido",
			[Language.Spanish]: "País Subdesarrollado",
		},
		Description: {
			[Language.English]: "A nation with untapped potential and resources.",
			[Language.Portuguese]: "Uma nação com potencial e recursos inexplorados.",
			[Language.Spanish]: "Una nación con potencial y recursos sin explotar.",
		},
		Emote: {
			Id: "0",
			String: "🕺",
		},
		ImageUrl: "https://media.discordapp.net/attachments/529795576993415175/923591340711903282/7-Pais.png",
		Price: 5_000_000,
		HourlyYield: 5_000_000 * 0.018,
		BaseDefense: 50,
		PrisonSeverity: 7 * 0.3,
		HenchmanFee: 26,
	},
	[InvestmentId.ReligiousCult]: {
		Id: InvestmentId.ReligiousCult,
		Name: {
			[Language.English]: "Religious Cult",
			[Language.Portuguese]: "Seita Religiosa",
			[Language.Spanish]: "Seita Religiosa",
		},
		Description: {
			[Language.English]: "A gathering of followers seeking enlightenment and profit.",
			[Language.Portuguese]: "Uma reunião de seguidores em busca de iluminação e lucro.",
			[Language.Spanish]: "Una reunión de seguidores que buscan iluminación y ganancias.",
		},
		Emote: {
			Id: "0",
			String: "🏨",
		},
		ImageUrl: "https://media.discordapp.net/attachments/529795576993415175/923591341282316368/8-Seita.png",
		Price: 15_000_000,
		HourlyYield: 15_000_000 * 0.019,
		BaseDefense: 55,
		PrisonSeverity: 8 * 0.3,
		HenchmanFee: 28,
	},
	[InvestmentId.StarGalaxy]: {
		Id: InvestmentId.StarGalaxy,
		Name: {
			[Language.English]: "Star Galaxy",
			[Language.Portuguese]: "Galáxia Estelar",
			[Language.Spanish]: "Galaxia Estelar",
		},
		Description: {
			[Language.English]: "Complete control over a celestial body of stars.",
			[Language.Portuguese]: "Controle total sobre um corpo celeste de estrelas.",
			[Language.Spanish]: "Control total sobre un cuerpo celeste de estrellas.",
		},
		Emote: {
			Id: "0",
			String: "🏦",
		},
		ImageUrl: "https://media.discordapp.net/attachments/529795576993415175/923591341684953188/9-Galaxia.png",
		Price: 50_000_000,
		HourlyYield: 50_000_000 * 0.02,
		BaseDefense: 60,
		PrisonSeverity: 10 * 0.3,
		HenchmanFee: 30,
	},
};

export function getInvestmentList(): Investment[] {
	return Object.values(InvestmentList);
}

export type InvestmentActionReason =
	| "insufficient_funds"
	| "already_has_investment"
	| "no_investment"
	| "already_has_henchman"
	| "unknown";

export interface InvestmentActionResult {
	success: boolean;
	reason?: InvestmentActionReason;
}
