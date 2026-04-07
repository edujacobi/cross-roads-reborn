import { Locale } from "discord.js";
import { enUS, es, ptBR } from "date-fns/locale";
import type { CreationOptional } from "sequelize";
import { EmoteString } from "@bot/utils/emotes";

export enum Language {
	English,
	Portuguese,
	Spanish
}

type LocalizationReturn =
	string |
	string[] |
	((...param: never) => string) |
	((...param: never) => string)[] |
	Record<
		string,
		string |
		((...param: never) => string)
	>

export type Localization =
	Record<
		Language,
		Record<
			string,
			LocalizationReturn
		>
	>;

export function getLanguageText(language: Language) {
	switch (language) {
	case Language.English:
		return "English";
	case Language.Portuguese:
		return "Portuguese";
	case Language.Spanish:
		return "Spanish";
	}
}

export function getLanguageFromLocale(locale: Locale) {
	switch (locale) {
	case Locale.PortugueseBR:
		return Language.Portuguese;
	case Locale.SpanishES:
	case Locale.SpanishLATAM:
		return Language.Spanish;
	default:
		return Language.English;
	}
}

export function getLocaleFromLanguage(language: Language) {
	switch (language) {
	case Language.Portuguese:
		return ptBR;
	case Language.Spanish:
		return es;
	default:
		return enUS;
	}
}

export const globalStrings = {
	[Language.English]: {
		attackerIsRobbingId: (nick: CreationOptional<string> | undefined) => `You're already robbing **${nick}**! ${EmoteString.Robbery}\n-# Wait a few more seconds and try again!`,
		attackerIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => `You're being robbed by **${nick}**! ${EmoteString.Robbery}\n-# Wait a few more seconds and try again!`,
		defenderIsRobbingId: (nick: CreationOptional<string> | undefined) => `is robbing **${nick}**! ${EmoteString.Robbery}\n-# Wait a few more seconds to start your action!`,
		defenderIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => `is being robbed by **${nick}**! ${EmoteString.Robbery}\n-# Wait a few more seconds to start your action!`,

		attackerIsBeatingId: (nick: CreationOptional<string> | undefined) => `You're beating **${nick}**! ${EmoteString.Beat}\n-# Wait a few more seconds and try again!`,
		attackerIsBeingBeatedById: (nick: CreationOptional<string> | undefined) => `You're being beated by **${nick}**! ${EmoteString.Beat}\n-# Wait a few more seconds and try again!`,
		defenderIsBeatingId: (nick: CreationOptional<string> | undefined) => `is beating **${nick}**! ${EmoteString.Beat}\n-# Wait a few more seconds to start your action!`,
		defenderIsBeingBeatedById: (nick: CreationOptional<string> | undefined) => `is being beated by **${nick}**! ${EmoteString.Beat}\n-# Wait a few more seconds to start your action!`,

		attackerIsDefendingInvestment: `You're defending your investment! ${EmoteString.InvestmentActive}\n-# Wait a few more seconds and try again!`,
		attackerIsParticipatingInGangAction: `You're participating in a gang action! ${EmoteString.Gang}\n-# Wait a few more seconds and try again!`,
		defenderIsDefendingInvestment: (nick: string) => `**${nick}** is defending their investment! ${EmoteString.InvestmentActive}\n-# Wait a few more seconds to start your action!`,
		defenderIsParticipatingInGangAction: (nick: string) => `**${nick}** is participating in a gang action! ${EmoteString.Gang}\n-# Wait a few more seconds to start your action!`,
	},
	[Language.Portuguese]: {
		attackerIsRobbingId: (nick: CreationOptional<string> | undefined) => `Você está roubando **${nick}**! ${EmoteString.Robbery}\n-# Espere mais alguns segundos e tente novamente!`,
		attackerIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => `Você está sendo roubado por **${nick}**! ${EmoteString.Robbery}\n-# Espere mais alguns segundos e tente novamente!`,
		defenderIsRobbingId: (nick: CreationOptional<string> | undefined) => `está roubando **${nick}**! ${EmoteString.Robbery}\n-# Espere mais alguns segundos para iniciar sua ação!`,
		defenderIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => `está sendo roubado por **${nick}**! ${EmoteString.Robbery}\n-# Espere mais alguns segundos para iniciar sua ação!`,

		attackerIsBeatingId: (nick: CreationOptional<string> | undefined) => `Você está espancando **${nick}**! ${EmoteString.Beat}\n-# Espere mais alguns segundos e tente novamente!`,
		attackerIsBeingBeatedById: (nick: CreationOptional<string> | undefined) => `Você está sendo espancado por **${nick}**! ${EmoteString.Beat}\n-# Espere mais alguns segundos e tente novamente!`,
		defenderIsBeatingId: (nick: CreationOptional<string> | undefined) => `está espancando **${nick}**! ${EmoteString.Beat}\n-# Espere mais alguns segundos para iniciar sua ação!`,
		defenderIsBeingBeatedById: (nick: CreationOptional<string> | undefined) => `está sendo espancado por **${nick}**! ${EmoteString.Beat}\n-# Espere mais alguns segundos para iniciar sua ação!`,

		attackerIsDefendingInvestment: `Você está defendendo seu investimento! ${EmoteString.InvestmentActive}\n-# Espere mais alguns segundos e tente novamente!`,
		attackerIsParticipatingInGangAction: `Você está participando de uma ação de gangue! ${EmoteString.Gang}\n-# Espere mais alguns segundos e tente novamente!`,
		defenderIsDefendingInvestment: (nick: string) => `**${nick}** está defendendo o investimento dele! ${EmoteString.InvestmentActive}\n-# Espere mais alguns segundos para iniciar sua ação!`,
		defenderIsParticipatingInGangAction: (nick: string) => `**${nick}** está participando de uma ação de gangue! ${EmoteString.Gang}\n-# Espere mais alguns segundos para iniciar sua ação!`,
	},
	[Language.Spanish]: {
		attackerIsRobbingId: (nick: CreationOptional<string> | undefined) => `¡Estás robando a **${nick}**! ${EmoteString.Robbery}\n-# ¡Espera unos segundos más y vuelve a intentarlo!`,
		attackerIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => `¡Estás siendo robado por **${nick}**! ${EmoteString.Robbery}\n-# ¡Espera unos segundos más y vuelve a intentarlo!`,
		defenderIsRobbingId: (nick: CreationOptional<string> | undefined) => `está robando a **${nick}**! ${EmoteString.Robbery}\n-# ¡Espera unos segundos más para iniciar tu acción!`,
		defenderIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => `está siendo robado por **${nick}**! ${EmoteString.Robbery}\n-# ¡Espera unos segundos más para iniciar tu acción!`,

		attackerIsBeatingId: (nick: CreationOptional<string> | undefined) => `¡Estás golpeando a **${nick}**! ${EmoteString.Beat}\n-# ¡Espera unos segundos más y vuelve a intentarlo!`,
		attackerIsBeingBeatedById: (nick: CreationOptional<string> | undefined) => `¡Estás siendo golpeado por **${nick}**! ${EmoteString.Beat}\n-# ¡Espera unos segundos más y vuelve a intentarlo!`,
		defenderIsBeatingId: (nick: CreationOptional<string> | undefined) => `está golpeando a **${nick}**! ${EmoteString.Beat}\n-# ¡Espera unos segundos más para iniciar tu acción!`,
		defenderIsBeingBeatedById: (nick: CreationOptional<string> | undefined) => `está siendo golpeado por **${nick}**! ${EmoteString.Beat}\n-# ¡Espera unos segundos más para iniciar tu acción!`,

		attackerIsDefendingInvestment: `¡Estás defendiendo tu inversión! ${EmoteString.InvestmentActive}\n-# ¡Espera unos segundos más y vuelve a intentarlo!`,
		attackerIsParticipatingInGangAction: `¡Estás participando en una acción de cuadrilla! ${EmoteString.Gang}\n-# ¡Espera unos segundos más y vuelve a intentarlo!`,
		defenderIsDefendingInvestment: (nick: string) => `**${nick}** está defendiendo su inversión! ${EmoteString.InvestmentActive}\n-# ¡Espera unos segundos más para iniciar tu acción!`,
		defenderIsParticipatingInGangAction: (nick: string) => `**${nick}** está participando en una acción de cuadrilla! ${EmoteString.Gang}\n-# ¡Espera unos segundos más para iniciar tu acción!`,
	},
} as const satisfies Localization;