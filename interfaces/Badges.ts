import { IDescription } from "./Interfaces";
import { Language } from "../models/Language";
import { EmoteId, EmoteString } from "../utils/emotes";
import { EmoteBadgeId, EmoteBadgeString } from "../utils/badges";

export enum BadgeId {
	VIP,
	VIPEternal,
	Developer,
	Moderator,
	Helper,
	BugCatcher,
	Artist,
	Billionaire,
	ChristmasArt2020,
	EasterGoldenEggs2021,
	HalloweenArt2021,
	ChristmasCookie2021,
	KeyishMandrake,

	S1Top1Money,
	S1Top2Money,
	S1Top3Money,

	S2Top1Money,
	S2Top2Money,
	S2Top3Money,
	S2Top1BeatUp,
	S2Top1Escapes,
	S2Top1CasinoWR,
	S2Top1RobberyQuantity,
	S2Top1RobberyProfit,
	S2TopRooster,

	S3Top1Money,
	S3Top2Money,
	S3Top3Money,
	S3Top1BeatUp,
	S3Top1Beated,
	S3Top1Escapes,
	S3Top1CasinoWR,
	S3Top1CasinoProfit,
	S3Top1RobberyQuantity,
	S3Top1RobberyProfit,
	S3Top1Rooster,
	S3Top1Stolen,
	S3Top1Alms,
	S3Top1Investments,
	S3Top1Jobs,
	S3Top1Spender,
	S3Top1Bribery,
	S3Top1Hospital,

	S4Top1Money,
	S4Top2Money,
	S4Top3Money,
	S4Top1BeatUp,
	S4Top1Scavenge,
	S4Top1Escapes,
	S4Top1CasinoWR,
	S4Top1CasinoProfit,
	S4Top1RobberyQuantity,
	S4Top1RobberyProfit,
	S4Top1Rooster,
	S4Top1Alms,
	S4Top1Investments,
	S4Top1Jobs,
	S4Top1Spender,
	S4Top1Bribery,
	S4Top1Hospital,

	S5Top1Money,
	S5Top2Money,
	S5Top3Money,
	S5Top1BeatUp,
	S5Top1Scavenge,
	S5Top1Escapes,
	S5Top1CasinoWR,
	S5Top1CasinoProfit,
	S5Top1RobberyQuantity,
	S5Top1RobberyProfit,
	S5Top1Rooster,
	S5Top1Alms,
	S5Top1Investments,
	S5Top1Jobs,
	S5Top1Spender,
	S5Top1Bribery,
	S5Top1Hospital,
	S5Top1Gang,

	S6Top1Money,
	S6Top2Money,
	S6Top3Money,
	S6Top1BeatUp,
	S6Top1Scavenge,
	S6Top1Escapes,
	S6Top1CasinoWR,
	S6Top1CasinoProfit,
	S6Top1RobberyQuantity,
	S6Top1RobberyProfit,
	S6Top1Rooster,
	S6Top1Alms,
	S6Top1Investments,
	S6Top1Jobs,
	S6Top1Spender,
	S6Top1Bribery,
	S6Top1Hospital,
	S6Top1Gang,
}

export interface IBadge {
	Id: BadgeId,
	Name: IDescription;
	Description: IDescription;
	Emoji: {
		Id: string,
		String: string
	};
}

interface BadgeListType {
	[key: number]: IBadge,
}

export const BadgeList: BadgeListType = {
	[BadgeId.VIP]: {
		Id: BadgeId.VIP,
		Name: {
			[Language.English]: "VIP",
			[Language.Portuguese]: "VIP",
			[Language.Spanish]: "VIP",
		},
		Description: {
			[Language.English]: "This user is a VIP member",
			[Language.Portuguese]: "Este usuário é um membro VIP",
			[Language.Spanish]: "Este usuario es un miembro VIP",
		},
		Emoji: {
			Id: EmoteId.VIP,
			String: EmoteString.VIP,
		},
	},
	[BadgeId.VIPEternal]: {
		Id: BadgeId.VIPEternal,
		Name: {
			[Language.English]: "Eternal VIP",
			[Language.Portuguese]: "VIP Eterno",
			[Language.Spanish]: "VIP Eterno",
		},
		Description: {
			[Language.English]: "This user is an Eternal VIP member",
			[Language.Portuguese]: "Este usuário é um membro VIP Eterno",
			[Language.Spanish]: "Este usuario es un miembro VIP Eterno",
		},
		Emoji: {
			Id: EmoteId.VIP,
			String: EmoteString.VIP,
		},
	},
	[BadgeId.Developer]: {
		Id: BadgeId.Developer,
		Name: {
			[Language.English]: "Developer",
			[Language.Portuguese]: "Desenvolvedor",
			[Language.Spanish]: "Desarrolladora",
		},
		Description: {
			[Language.English]: "This user is a game developer",
			[Language.Portuguese]: "Este usuário é um desenvolvedor do jogo",
			[Language.Spanish]: "Este usuario es un desarrollador del juego",
		},
		Emoji: {
			Id: EmoteBadgeId.General.Developer,
			String: EmoteBadgeString.General.Developer,
		},
	},
	[BadgeId.Moderator]: {
		Id: BadgeId.Moderator,
		Name: {
			[Language.English]: "Moderator",
			[Language.Portuguese]: "Moderador",
			[Language.Spanish]: "Moderador",
		},
		Description: {
			[Language.English]: "This user is a game moderator",
			[Language.Portuguese]: "Este usuário é um moderador do jogo",
			[Language.Spanish]: "Este usuario es un moderador del juego",
		},
		Emoji: {
			Id: EmoteBadgeId.General.Moderator,
			String: EmoteBadgeString.General.Moderator,
		},
	},
	[BadgeId.Helper]: {
		Id: BadgeId.Helper,
		Name: {
			[Language.English]: "Helper",
			[Language.Portuguese]: "Ajudante",
			[Language.Spanish]: "Ayudante",
		},
		Description: {
			[Language.English]: "This user is a game helper",
			[Language.Portuguese]: "Este usuário é um ajudante do jogo",
			[Language.Spanish]: "Este usuario es un ayudante del juego",
		},
		Emoji: {
			Id: EmoteBadgeId.General.Helper,
			String: EmoteBadgeString.General.Helper,
		},
	},
	[BadgeId.BugCatcher]: {
		Id: BadgeId.BugCatcher,
		Name: {
			[Language.English]: "Bug Catcher",
			[Language.Portuguese]: "Cata Bug",
			[Language.Spanish]: "Atrapa Bug",
		},
		Description: {
			[Language.English]: "This user has found a game-breaking bug and reported it",
			[Language.Portuguese]: "Este usuário encontrou um bug que interrompe o jogo e o relatou",
			[Language.Spanish]: "Este usuario ha encontrado un error que rompe el juego y lo ha reportado.",
		},
		Emoji: {
			Id: EmoteBadgeId.General.BugCatcher,
			String: EmoteBadgeString.General.BugCatcher,
		},
	},
	[BadgeId.Artist]: {
		Id: BadgeId.Artist,
		Name: {
			[Language.English]: "Artist",
			[Language.Portuguese]: "Artista",
			[Language.Spanish]: "Artista",
		},
		Description: {
			[Language.English]: "This user contributed with art to the game",
			[Language.Portuguese]: "Este usuário contribuiu com arte para o jogo",
			[Language.Spanish]: "Este usuario contribuyó con arte para el juego",
		},
		Emoji: {
			Id: EmoteBadgeId.General.Artist,
			String: EmoteBadgeString.General.Artist,
		},
	},
	[BadgeId.Billionaire]: {
		Id: BadgeId.Billionaire,
		Name: {
			[Language.English]: "Billionaire",
			[Language.Portuguese]: "Bilionário",
			[Language.Spanish]: "Multimillonario",
		},
		Description: {
			[Language.English]: "This user has accumulated over 1 billion Cr$",
			[Language.Portuguese]: "Este usuário acumulou mais de 1 bilhão de Cr$",
			[Language.Spanish]: "Este usuario ha acumulado más de mil millones de Cr$",
		},
		Emoji: {
			Id: EmoteBadgeId.General.Billionaire,
			String: EmoteBadgeString.General.Billionaire,
		},
	},
	[BadgeId.ChristmasArt2020]: {
		Id: BadgeId.ChristmasArt2020,
		Name: {
			[Language.English]: "Christmas 2020",
			[Language.Portuguese]: "Natal 2020",
			[Language.Spanish]: "Navidad 2020",
		},
		Description: {
			[Language.English]: "Christmas Art Event 2020",
			[Language.Portuguese]: "Evento de Arte de Natal 2020",
			[Language.Spanish]: "Evento de Arte Navideño 2020",
		},
		Emoji: {
			Id: EmoteBadgeId.Events.Christmas2020,
			String: EmoteBadgeString.Events.Christmas2020,
		},
	},
	[BadgeId.EasterGoldenEggs2021]: {
		Id: BadgeId.EasterGoldenEggs2021,
		Name: {
			[Language.English]: "Golden Eggs",
			[Language.Portuguese]: "Ovos Dourados",
			[Language.Spanish]: "Huevos de oro",
		},
		Description: {
			[Language.English]: "Bought at the Egg Market with 500 eggs - Easter 2021",
			[Language.Portuguese]: "Comprado no Mercado de Ovos com 500 ovos - Páscoa 2021",
			[Language.Spanish]: "Comprado en el Mercado de Huevos con 500 huevos - Pascua 2021",
		},
		Emoji: {
			Id: EmoteBadgeId.Events.Easter2021,
			String: EmoteBadgeString.Events.Easter2021,
		},
	},
	[BadgeId.HalloweenArt2021]: {
		Id: BadgeId.HalloweenArt2021,
		Name: {
			[Language.English]: "Halloween 2021",
			[Language.Portuguese]: "Halloween 2021",
			[Language.Spanish]: "Halloween 2021",
		},
		Description: {
			[Language.English]: "Halloween Art Event 2021",
			[Language.Portuguese]: "Evento de Arte de Halloween 2021",
			[Language.Spanish]: "Evento de Arte de Halloween 2021",
		},
		Emoji: {
			Id: EmoteBadgeId.Events.Halloween2021,
			String: EmoteBadgeString.Events.Halloween2021,
		},
	},
	[BadgeId.ChristmasCookie2021]: {
		Id: BadgeId.ChristmasCookie2021,
		Name: {
			[Language.English]: "Christmas Cookie",
			[Language.Portuguese]: "Biscoito de Natal",
			[Language.Spanish]: "Galleta de Navidad",
		},
		Description: {
			[Language.English]: "Bought at the Christmas Market with 500 presents - Christmas 2021",
			[Language.Portuguese]: "Comprado no Mercado de Natal com 500 presentes - Natal 2021",
			[Language.Spanish]: "Comprado en el Mercado Navideño con 500 regalos - Navidad 2021",
		},
		Emoji: {
			Id: EmoteBadgeId.Events.Christmas2021,
			String: EmoteBadgeString.Events.Christmas2021,
		},
	},
	[BadgeId.KeyishMandrake]: {
		Id: BadgeId.KeyishMandrake,
		Name: {
			[Language.English]: "Keyish Mandrake",
			[Language.Portuguese]: "Mandrake Chavoso",
			[Language.Spanish]: "Mandrake Chavoso",
		},
		Description: {
			[Language.English]: "Rewarded at the Baile of the end of 6th season",
			[Language.Portuguese]: "Recompensado no Baile do final da 6ª temporada",
			[Language.Spanish]: "Recompensado en el Baile del final de la sexta temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Events.KeyishMandrake,
			String: EmoteBadgeString.Events.KeyishMandrake,
		},
	},
	[BadgeId.S1Top1Money]: {
		Id: BadgeId.S1Top1Money,
		Name: {
			[Language.English]: "Top 1 Money S1",
			[Language.Portuguese]: "Top 1 Grana S1",
			[Language.Spanish]: "Top 1 Dinero S1",
		},
		Description: {
			[Language.English]: "1st place in Top Money in the 1st season",
			[Language.Portuguese]: "1º lugar no Top Grana na 1ª temporada",
			[Language.Spanish]: "1er lugar en Top Dinero en la 1ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season1.Top1Money,
			String: EmoteBadgeString.Season1.Top1Money,
		},
	},
	[BadgeId.S1Top2Money]: {
		Id: BadgeId.S1Top2Money,
		Name: {
			[Language.English]: "Top 2 Money S1",
			[Language.Portuguese]: "Top 2 Grana S1",
			[Language.Spanish]: "Top 2 Dinero S1",
		},
		Description: {
			[Language.English]: "2nd place in Top Money in the 1st season",
			[Language.Portuguese]: "2º lugar no Top Grana na 1ª temporada",
			[Language.Spanish]: "2do lugar en Top Dinero en la 1ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season1.Top2Money,
			String: EmoteBadgeString.Season1.Top2Money,
		},
	},
	[BadgeId.S1Top3Money]: {
		Id: BadgeId.S1Top3Money,
		Name: {
			[Language.English]: "Top 3 Money S1",
			[Language.Portuguese]: "Top 3 Grana S1",
			[Language.Spanish]: "Top 3 Dinero S1",
		},
		Description: {
			[Language.English]: "3rd place in Top Money in the 1st season",
			[Language.Portuguese]: "3º lugar no Top Grana na 1ª temporada",
			[Language.Spanish]: "3er lugar en Top Dinero en la 1ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season1.Top3Money,
			String: EmoteBadgeString.Season1.Top3Money,
		},
	},
	[BadgeId.S2Top1Money]: {
		Id: BadgeId.S2Top1Money,
		Name: {
			[Language.English]: "Top 1 Money S2",
			[Language.Portuguese]: "Top 1 Grana S2",
			[Language.Spanish]: "Top 1 Dinero S2",
		},
		Description: {
			[Language.English]: "1st place in Top Money in the 2nd season",
			[Language.Portuguese]: "1º lugar no Top Grana na 2ª temporada",
			[Language.Spanish]: "1er lugar en Top Dinero en la 2da temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season2.Top1Money,
			String: EmoteBadgeString.Season2.Top1Money,
		},
	},
	[BadgeId.S2Top2Money]: {
		Id: BadgeId.S2Top2Money,
		Name: {
			[Language.English]: "Top 2 Money S2",
			[Language.Portuguese]: "Top 2 Grana S2",
			[Language.Spanish]: "Top 2 Dinero S2",
		},
		Description: {
			[Language.English]: "2nd place in Top Money in the 2nd season",
			[Language.Portuguese]: "2º lugar no Top Grana na 2ª temporada",
			[Language.Spanish]: "2do lugar en Top Dinero en la 2da temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season2.Top2Money,
			String: EmoteBadgeString.Season2.Top2Money,
		},
	},
	[BadgeId.S2Top3Money]: {
		Id: BadgeId.S2Top3Money,
		Name: {
			[Language.English]: "Top 3 Money S2",
			[Language.Portuguese]: "Top 3 Grana S2",
			[Language.Spanish]: "Top 3 Dinero S2",
		},
		Description: {
			[Language.English]: "3rd place in Top Money in the 2nd season",
			[Language.Portuguese]: "3º lugar no Top Grana na 2ª temporada",
			[Language.Spanish]: "3er lugar en Top Dinero en la 2da temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season2.Top3Money,
			String: EmoteBadgeString.Season2.Top3Money,
		},
	},
	[BadgeId.S2Top1BeatUp]: {
		Id: BadgeId.S2Top1BeatUp,
		Name: {
			[Language.English]: "Home Run S2",
			[Language.Portuguese]: "Home Run S2",
			[Language.Spanish]: "Home Run S2",
		},
		Description: {
			[Language.English]: "1st place in Top Beat Up in the 2nd season",
			[Language.Portuguese]: "1º lugar no Top Pancada na 2ª temporada",
			[Language.Spanish]: "1er lugar en Top Pelea en la 2da temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season2.HomeRun,
			String: EmoteBadgeString.Season2.HomeRun,
		},
	},
	[BadgeId.S2Top1Escapes]: {
		Id: BadgeId.S2Top1Escapes,
		Name: {
			[Language.English]: "Escapist S2",
			[Language.Portuguese]: "Fujão S2",
			[Language.Spanish]: "Top 1 Fugas S2",
		},
		Description: {
			[Language.English]: "1st place in Top Escapes in the 2nd season",
			[Language.Portuguese]: "1º lugar no Top Fugas na 2ª temporada",
			[Language.Spanish]: "1er lugar en Top Fugas en la 2da temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season2.Escapist,
			String: EmoteBadgeString.Season2.Escapist,
		},
	},
	[BadgeId.S2Top1CasinoWR]: {
		Id: BadgeId.S2Top1CasinoWR,
		Name: {
			[Language.English]: "Lucky One S2",
			[Language.Portuguese]: "Sortudo S2",
			[Language.Spanish]: "Afortunado S2",
		},
		Description: {
			[Language.English]: "1st place in Top Casino Win Rate in the 2nd season",
			[Language.Portuguese]: "1º lugar no Top Taxa de Vitória do Cassino na 2ª temporada",
			[Language.Spanish]: "1er lugar en Top Tasa de Victoria del Casino en la 2da temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season2.LuckyOne,
			String: EmoteBadgeString.Season2.LuckyOne,
		},
	},
	[BadgeId.S2Top1RobberyQuantity]: {
		Id: BadgeId.S2Top1RobberyQuantity,
		Name: {
			[Language.English]: "Silly Hand S2",
			[Language.Portuguese]: "Mão Boba S2",
			[Language.Spanish]: "Mano Tonta S2",
		},
		Description: {
			[Language.English]: "1st place in Top Robbery Quantity in the 2nd season",
			[Language.Portuguese]: "1º lugar no Top Quantidade de Roubos na 2ª temporada",
			[Language.Spanish]: "1er lugar en Top Cantidad de Robos en la 2da temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season2.SillyHand,
			String: EmoteBadgeString.Season2.SillyHand,
		},
	},
	[BadgeId.S2Top1RobberyProfit]: {
		Id: BadgeId.S2Top1RobberyProfit,
		Name: {
			[Language.English]: "Large Pocket S2",
			[Language.Portuguese]: "Bolso Largo S2",
			[Language.Spanish]: "Bolsillo grande S2",
		},
		Description: {
			[Language.English]: "1st place in Top Robbery Profit in the 2nd season",
			[Language.Portuguese]: "1º lugar no Top Lucro de Roubos na 2ª temporada",
			[Language.Spanish]: "1er lugar en Top Beneficio de Robos en la 2da temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season2.LargePocket,
			String: EmoteBadgeString.Season2.LargePocket,
		},
	},
	[BadgeId.S2TopRooster]: {
		Id: BadgeId.S2TopRooster,
		Name: {
			[Language.English]: "Top Rooster S2",
			[Language.Portuguese]: "Top Galo S2",
			[Language.Spanish]: "Top Pollo S2",
		},
		Description: {
			[Language.English]: "1st place in Top Rooster in the 2nd season",
			[Language.Portuguese]: "1º lugar no Top Galo na 2ª temporada",
			[Language.Spanish]: "1er lugar en Top Pollo en la 2da temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season2.TopRooster,
			String: EmoteBadgeString.Season2.TopRooster,
		},
	},
	[BadgeId.S3Top1Money]: {
		Id: BadgeId.S3Top1Money,
		Name: {
			[Language.English]: "Top 1 Money S3",
			[Language.Portuguese]: "Top 1 Grana S3",
			[Language.Spanish]: "Top 1 Dinero S3",
		},
		Description: {
			[Language.English]: "1st place in Top Money in the 3rd season",
			[Language.Portuguese]: "1º lugar no Top Grana na 3ª temporada",
			[Language.Spanish]: "1er lugar en Top Dinero en la 3ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season3.Top1Money,
			String: EmoteBadgeString.Season3.Top1Money,
		},
	},
	[BadgeId.S3Top2Money]: {
		Id: BadgeId.S3Top2Money,
		Name: {
			[Language.English]: "Top 2 Money S3",
			[Language.Portuguese]: "Top 2 Grana S3",
			[Language.Spanish]: "Top 2 Dinero S3",
		},
		Description: {
			[Language.English]: "2nd place in Top Money in the 3rd season",
			[Language.Portuguese]: "2º lugar no Top Grana na 3ª temporada",
			[Language.Spanish]: "2do lugar en Top Dinero en la 3ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season3.Top2Money,
			String: EmoteBadgeString.Season3.Top2Money,
		},
	},
	[BadgeId.S3Top3Money]: {
		Id: BadgeId.S3Top3Money,
		Name: {
			[Language.English]: "Top 3 Money S3",
			[Language.Portuguese]: "Top 3 Grana S3",
			[Language.Spanish]: "Top 3 Dinero S3",
		},
		Description: {
			[Language.English]: "3rd place in Top Money in the 3rd season",
			[Language.Portuguese]: "3º lugar no Top Grana na 3ª temporada",
			[Language.Spanish]: "3er lugar en Top Dinero en la 3ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season3.Top3Money,
			String: EmoteBadgeString.Season3.Top3Money,
		},
	},
	[BadgeId.S3Top1BeatUp]: {
		Id: BadgeId.S3Top1BeatUp,
		Name: {
			[Language.English]: "Head Smasher S3",
			[Language.Portuguese]: "Esmaga Crânio S3",
			[Language.Spanish]: "Aplasta Cráneos S3",
		},
		Description: {
			[Language.English]: "1st place in Top Beat Up in the 3rd season",
			[Language.Portuguese]: "1º lugar no Top Pancada na 3ª temporada",
			[Language.Spanish]: "1er lugar en Top Pelea en la 3ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season3.HeadSmasher,
			String: EmoteBadgeString.Season3.HeadSmasher,
		},
	},
	[BadgeId.S3Top1Beated]: {
		Id: BadgeId.S3Top1Beated,
		Name: {
			[Language.English]: "Crazy Dead Body S3",
			[Language.Portuguese]: "Morto Muito Louco S3",
			[Language.Spanish]: "Cadáver Loco S3",
		},
		Description: {
			[Language.English]: "1st place in Top Beated in the 3rd season",
			[Language.Portuguese]: "1º lugar no Top Espancado na 3ª temporada",
			[Language.Spanish]: "1er lugar en Top Golpeado en la 3ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season3.CrazyDeadBody,
			String: EmoteBadgeString.Season3.CrazyDeadBody,
		},
	},
	[BadgeId.S3Top1Escapes]: {
		Id: BadgeId.S3Top1Escapes,
		Name: {
			[Language.English]: "Escapist S3",
			[Language.Portuguese]: "Fujão S3",
			[Language.Spanish]: "Escapista S3",
		},
		Description: {
			[Language.English]: "1st place in Top Escapes in the 3rd season",
			[Language.Portuguese]: "1º lugar no Top Fugas na 3ª temporada",
			[Language.Spanish]: "1er lugar en Top Fugas en la 3ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season3.Escapist,
			String: EmoteBadgeString.Season3.Escapist,
		},
	},
	[BadgeId.S3Top1CasinoWR]: {
		Id: BadgeId.S3Top1CasinoWR,
		Name: {
			[Language.English]: "Lucky One S3",
			[Language.Portuguese]: "Sortudo S3",
			[Language.Spanish]: "Afortunado S3",
		},
		Description: {
			[Language.English]: "1st place in Top Casino Win Rate in the 3rd season",
			[Language.Portuguese]: "1º lugar no Top Taxa de Vitória do Cassino na 3ª temporada",
			[Language.Spanish]: "1er lugar en Top Tasa de Victoria del Casino en la 3ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season3.LuckyOne,
			String: EmoteBadgeString.Season3.LuckyOne,
		},
	},
	[BadgeId.S3Top1CasinoProfit]: {
		Id: BadgeId.S3Top1CasinoProfit,
		Name: {
			[Language.English]: "Elite Trader S3",
			[Language.Portuguese]: "Trader Elite S3",
			[Language.Spanish]: "Comerciante de Élite S3",
		},
		Description: {
			[Language.English]: "1st place in Top Casino Profit in the 3rd season",
			[Language.Portuguese]: "1º lugar no Top Lucro do Cassino na 3ª temporada",
			[Language.Spanish]: "1er lugar en Top Beneficio del Casino en la 3ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season3.EliteTrader,
			String: EmoteBadgeString.Season3.EliteTrader,
		},
	},
	[BadgeId.S3Top1RobberyQuantity]: {
		Id: BadgeId.S3Top1RobberyQuantity,
		Name: {
			[Language.English]: "Silly Hand S3",
			[Language.Portuguese]: "Mão Boba S3",
			[Language.Spanish]: "Mano Tonta S3",
		},
		Description: {
			[Language.English]: "1st place in Top Robbery Quantity in the 3rd season",
			[Language.Portuguese]: "1º lugar no Top Quantidade de Roubos na 3ª temporada",
			[Language.Spanish]: "1er lugar en Top Cantidad de Robos en la 3ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season3.SillyHand,
			String: EmoteBadgeString.Season3.SillyHand,
		},
	},
	[BadgeId.S3Top1RobberyProfit]: {
		Id: BadgeId.S3Top1RobberyProfit,
		Name: {
			[Language.English]: "Large Pocket S3",
			[Language.Portuguese]: "Bolso Largo S3",
			[Language.Spanish]: "Bolsillo Grande S3",
		},
		Description: {
			[Language.English]: "1st place in Top Robbery Profit in the 3rd season",
			[Language.Portuguese]: "1º lugar no Top Lucro de Roubos na 3ª temporada",
			[Language.Spanish]: "1er lugar en Top Beneficio de Robos en la 3ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season3.LargePocket,
			String: EmoteBadgeString.Season3.LargePocket,
		},
	},
	[BadgeId.S3Top1Rooster]: {
		Id: BadgeId.S3Top1Rooster,
		Name: {
			[Language.English]: "Top Rooster S3",
			[Language.Portuguese]: "Top Galo S3",
			[Language.Spanish]: "Top Pollo S3",
		},
		Description: {
			[Language.English]: "1st place in Top Rooster in the 3rd season",
			[Language.Portuguese]: "1º lugar no Top Galo na 3ª temporada",
			[Language.Spanish]: "1er lugar en Top Pollo en la 3ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season3.TopRooster,
			String: EmoteBadgeString.Season3.TopRooster,
		},
	},
	[BadgeId.S3Top1Stolen]: {
		Id: BadgeId.S3Top1Stolen,
		Name: {
			[Language.English]: "Walking Target S3",
			[Language.Portuguese]: "Alvo Ambulante S3",
			[Language.Spanish]: "Blanco Ambulante S3",
		},
		Description: {
			[Language.English]: "1st place in Top Stolen in the 3rd season",
			[Language.Portuguese]: "1º lugar no Top Roubado na 3ª temporada",
			[Language.Spanish]: "1er lugar en Top Robado en la 3ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season3.WalkingTarget,
			String: EmoteBadgeString.Season3.WalkingTarget,
		},
	},
	[BadgeId.S3Top1Alms]: {
		Id: BadgeId.S3Top1Alms,
		Name: {
			[Language.English]: "Philantrope S3",
			[Language.Portuguese]: "Filantropo S3",
			[Language.Spanish]: "Filántropo S3",
		},
		Description: {
			[Language.English]: "1st place in Top Alms in the 3rd season",
			[Language.Portuguese]: "1º lugar no Top Esmolas na 3ª temporada",
			[Language.Spanish]: "1er lugar en Top Limosnas en la 3ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season3.Philantrope,
			String: EmoteBadgeString.Season3.Philantrope,
		},
	},
	[BadgeId.S3Top1Investments]: {
		Id: BadgeId.S3Top1Investments,
		Name: {
			[Language.English]: "Investor S3",
			[Language.Portuguese]: "Investidor S3",
			[Language.Spanish]: "Inversor S3",
		},
		Description: {
			[Language.English]: "1st place in Top Investments in the 3rd season",
			[Language.Portuguese]: "1º lugar no Top Investimentos na 3ª temporada",
			[Language.Spanish]: "1er lugar en Top Inversiones en la 3ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season3.Invester,
			String: EmoteBadgeString.Season3.Invester,
		},
	},
	[BadgeId.S3Top1Jobs]: {
		Id: BadgeId.S3Top1Jobs,
		Name: {
			[Language.English]: "Workaholic S3",
			[Language.Portuguese]: "Workaholic S3",
			[Language.Spanish]: "Workaholic S3",
		},
		Description: {
			[Language.English]: "1st place in Top Jobs in the 3rd season",
			[Language.Portuguese]: "1º lugar no Top Trabalhos na 3ª temporada",
			[Language.Spanish]: "1er lugar en Top Trabajos en la 3ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season3.Workaholic,
			String: EmoteBadgeString.Season3.Workaholic,
		},
	},
	[BadgeId.S3Top1Spender]: {
		Id: BadgeId.S3Top1Spender,
		Name: {
			[Language.English]: "Preppy S3",
			[Language.Portuguese]: "Patricinha S3",
			[Language.Spanish]: "Pijo S3",
		},
		Description: {
			[Language.English]: "1st place in Top Spender in the 3rd season",
			[Language.Portuguese]: "1º lugar no Top Gastador na 3ª temporada",
			[Language.Spanish]: "1er lugar en Top Gastador en la 3ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season3.Preppy,
			String: EmoteBadgeString.Season3.Preppy,
		},
	},
	[BadgeId.S3Top1Bribery]: {
		Id: BadgeId.S3Top1Bribery,
		Name: {
			[Language.English]: "Politician S3",
			[Language.Portuguese]: "Deputado S3",
			[Language.Spanish]: "Político S3",
		},
		Description: {
			[Language.English]: "1st place in Top Bribery in the 3rd season",
			[Language.Portuguese]: "1º lugar no Top Suborno na 3ª temporada",
			[Language.Spanish]: "1er lugar en Top Soborno en la 3ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season3.Politician,
			String: EmoteBadgeString.Season3.Politician,
		},
	},
	[BadgeId.S3Top1Hospital]: {
		Id: BadgeId.S3Top1Hospital,
		Name: {
			[Language.English]: "Hypochondriac S3",
			[Language.Portuguese]: "Hipocondríaco S3",
			[Language.Spanish]: "Hipocondríaco S3",
		},
		Description: {
			[Language.English]: "1st place in Top Hospital in the 3rd season",
			[Language.Portuguese]: "1º lugar no Top Hospital na 3ª temporada",
			[Language.Spanish]: "1er lugar en Top Hospital en la 3ra temporada",
		},
		Emoji: {
			Id: EmoteBadgeId.Season3.Hypochondriac,
			String: EmoteBadgeString.Season3.Hypochondriac,
		},
	}
};

export function getBadgeList(): IBadge[] {
	return Object.values(BadgeList);
}