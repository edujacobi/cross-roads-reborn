import { IDescription } from "./Interfaces";
import { Language } from "../models/Language";
import { EmoteId, EmoteString } from "../utils/emotes";
import { EmoteBadgeId, EmoteBadgeString } from "../utils/badges";

export enum BadgeId {
	VIP,
	VIPEternal,
	Moderator,
	Contributor,
	Developer,
	Donator,
	EventWinner,
	Beta,
	OG
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
	// [BadgeId.Contributor]: {
	// 	Id: BadgeId.Contributor,
	// 	Name: {
	// 		[Language.English]: "Contributor",
	// 		[Language.Portuguese]: "Contribuidor",
	// 		[Language.Spanish]: "Contribuidor",
	// 	},
	// 	Description: {
	// 		[Language.English]: "This user has contributed to the bot development",
	// 		[Language.Portuguese]: "Este usuário contribuiu para o desenvolvimento do bot",
	// 		[Language.Spanish]: "Este usuario ha contribuido al desarrollo del bot",
	// 	},
	// 	Emoji: {
	// 		Id: EmoteId.Star,
	// 		String: EmoteString.Star,
	// 	},
	// },
	// [BadgeId.Developer]: {
	// 	Id: BadgeId.Developer,
	// 	Name: {
	// 		[Language.English]: "Developer",
	// 		[Language.Portuguese]: "Desenvolvedor",
	// 		[Language.Spanish]: "Desarrollador",
	// 	},
	// 	Description: {
	// 		[Language.English]: "This user is a developer of the bot",
	// 		[Language.Portuguese]: "Este usuário é um desenvolvedor do bot",
	// 		[Language.Spanish]: "Este usuario es un desarrollador del bot",
	// 	},
	// 	Emoji: {
	// 		Id: EmoteId.Dev,
	// 		String: EmoteString.Dev,
	// 	},
	// },
	// [BadgeId.Donator]: {
	// 	Id: BadgeId.Donator,
	// 	Name: {
	// 		[Language.English]: "Donator",
	// 		[Language.Portuguese]: "Doador",
	// 		[Language.Spanish]: "Donante",
	// 	},
	// 	Description: {
	// 		[Language.English]: "This user has donated to the bot",
	// 		[Language.Portuguese]: "Este usuário doou para o bot",
	// 		[Language.Spanish]: "Este usuario ha donado al bot",
	// 	},
	// 	Emoji: {
	// 		Id: EmoteId.Money,
	// 		String: EmoteString.Money,
	// 	},
	// },
	// [BadgeId.EventWinner]: {
	// 	Id: BadgeId.EventWinner,
	// 	Name: {
	// 		[Language.English]: "Event Winner",
	// 		[Language.Portuguese]: "Vencedor de Evento",
	// 		[Language.Spanish]: "Ganador de Evento",
	// 	},
	// 	Description: {
	// 		[Language.English]: "This user has won a server event",
	// 		[Language.Portuguese]: "Este usuário venceu um evento do servidor",
	// 		[Language.Spanish]: "Este usuario ha ganado un evento del servidor",
	// 	},
	// 	Emoji: {
	// 		Id: EmoteId.Trophy,
	// 		String: EmoteString.Trophy,
	// 	},
	// },
	// [BadgeId.Beta]: {
	// 	Id: BadgeId.Beta,
	// 	Key: "beta",
	// 	Name: {
	// 		[Language.English]: "Beta Tester",
	// 		[Language.Portuguese]: "Testador Beta",
	// 		[Language.Spanish]: "Probador Beta",
	// 	},
	// 	Description: {
	// 		[Language.English]: "This user participated in the bot's beta testing",
	// 		[Language.Portuguese]: "Este usuário participou do teste beta do bot",
	// 		[Language.Spanish]: "Este usuario participó en las pruebas beta del bot",
	// 	},
	// 	Emoji: {
	// 		Id: EmoteId.Beta,
	// 		String: EmoteString.Beta,
	// 	},
	// },
	// [BadgeId.OG]: {
	// 	Id: BadgeId.OG,
	// 	Name: {
	// 		[Language.English]: "OG Member",
	// 		[Language.Portuguese]: "Membro OG",
	// 		[Language.Spanish]: "Miembro OG",
	// 	},
	// 	Description: {
	// 		[Language.English]: "This user has been here since the beginning",
	// 		[Language.Portuguese]: "Este usuário está aqui desde o início",
	// 		[Language.Spanish]: "Este usuario ha estado aquí desde el principio",
	// 	},
	// 	Emoji: {
	// 		Id: EmoteId.Crown,
	// 		String: EmoteString.Crown,
	// 	},
	// },
};

export function getBadgeList(): IBadge[] {
	return Object.values(BadgeList);
}