import { Locale } from "discord.js";

export enum Language {
	English,
	Portuguese,
	Spanish
}

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