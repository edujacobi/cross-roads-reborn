import { EmoteId, EmoteString } from "#bot/utils/emotes";
import { Language } from "#core/models/Language";
import { getWeek } from "date-fns";

export enum HeistMissionId {
	Blueprint = 1,
	GetawayCars = 2,
	HackCameras = 3,
	MainHeist = 4,
}

export interface HeistTarget {
	readonly Id: string;
	readonly Name: {
		readonly [Language.English]: string;
		readonly [Language.Portuguese]: string;
		readonly [Language.Spanish]: string;
	};
	readonly Description: {
		readonly [Language.English]: string;
		readonly [Language.Portuguese]: string;
		readonly [Language.Spanish]: string;
	};
	readonly VaultType: "bank" | "casino";
	readonly BaseChanceDivisor: number; // e.g. 50 (or 40 for motoclube)
	readonly Thumbnail: string;
	readonly Emote: {
		readonly Id: string;
		readonly String: string;
	}
}

export const HeistTargets: HeistTarget[] = [
	{
		Id: "bank",
		Name: {
			[Language.English]: "Central Bank",
			[Language.Portuguese]: "Banco Central",
			[Language.Spanish]: "Banco Central",
		},
		Description: {
			[Language.English]: "The city's main financial repository, containing huge reserves of paper currency.",
			[Language.Portuguese]: "O principal repositório financeiro da cidade, contendo grandes reservas de papel-moeda.",
			[Language.Spanish]: "El principal repositorio financiero de la ciudad, con enormes reservas de papel moneda.",
		},
		VaultType: "bank",
		BaseChanceDivisor: 50,
		Thumbnail: "https://media.discordapp.net/attachments/1233604589064818808/1540819271054270504/CentralBank.png",
		Emote: {
			Id: EmoteId.CentralBank,
			String: EmoteString.CentralBank,
		}
	},
	{
		Id: "casino",
		Name: {
			[Language.English]: "Casino Vault",
			[Language.Portuguese]: "Cofre do Cassino",
			[Language.Spanish]: "Caja Fuerte del Casino",
		},
		Description: {
			[Language.English]: "A secure vault filled with chips, gold bullion, and loose high-roller cash.",
			[Language.Portuguese]: "Um cofre seguro cheio de fichas, barras de ouro e dinheiro de grandes apostadores.",
			[Language.Spanish]: "Una bóveda de seguridad llena de fichas, lingotes de oro y dinero de grandes apostadores.",
		},
		VaultType: "casino",
		BaseChanceDivisor: 48,
		Thumbnail: "https://media.discordapp.net/attachments/1233604589064818808/1460598163546312857/Casino_New.png",
		Emote: {
			Id: EmoteId.Casino,
			String: EmoteString.Casino,
		}
	},
];

/**
 * Gets the current weekly heist target deterministically.
 */
export function getWeeklyTarget(): HeistTarget {
	const currentWeek = getWeek(new Date());
	const index = currentWeek % HeistTargets.length;
	return HeistTargets[index];
}
