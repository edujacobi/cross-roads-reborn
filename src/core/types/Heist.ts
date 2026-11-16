import { EmoteId, EmoteString } from "#bot/utils/emotes";
import { Language } from "#core/models/Language";
import { getGameTime } from "../../shared/gameTime";

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
	readonly BaseChanceDivisor: number;
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
		Thumbnail: "https://media.discordapp.net/attachments/1233604589064818808/1547950330820432033/CasinoVault.png",
		Emote: {
			Id: EmoteId.CasinoVault,
			String: EmoteString.CasinoVault,
		}
	},
];

function getGameWeek(date: Date): number {
	const gameDate = getGameTime(date).toPlainDate();
	const firstDayOfYear = Temporal.PlainDate.from({ year: gameDate.year, month: 1, day: 1 });
	const firstWeekStart = firstDayOfYear.subtract({ days: firstDayOfYear.dayOfWeek % 7 });
	const nextYearFirstDay = Temporal.PlainDate.from({ year: gameDate.year + 1, month: 1, day: 1 });
	const nextYearFirstWeekStart = nextYearFirstDay.subtract({ days: nextYearFirstDay.dayOfWeek % 7 });
	const currentWeekStart = gameDate.subtract({ days: gameDate.dayOfWeek % 7 });

	if (Temporal.PlainDate.compare(currentWeekStart, nextYearFirstWeekStart) >= 0) return 1;
	return Math.floor(firstWeekStart.until(currentWeekStart, { largestUnit: "day" }).days / 7) + 1;
}

/**
 * Gets the current weekly heist target deterministically.
 */
export function getWeeklyTarget(date = new Date()): HeistTarget {
	const currentWeek = getGameWeek(date);
	const index = currentWeek % HeistTargets.length;
	return HeistTargets[index];
}

export function isMainHeistDay(date = new Date()): boolean {
	const day = getGameTime(date).dayOfWeek;
	return day === 1 || day === 3 || day === 5;
}
