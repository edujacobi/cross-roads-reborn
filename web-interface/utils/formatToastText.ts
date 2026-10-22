import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatToastText(text: string) {
	return text
		.replace(/<t:(\d+)(?::([tTdDfFR]))?>/g, (_match, timestamp: string, style?: string) => {
			const date = new Date(Number(timestamp) * 1_000);
			if (Number.isNaN(date.getTime())) return "";
			if (style === "R") return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });

			const options: Intl.DateTimeFormatOptions = {
				...(style === "t" ? { hour: "2-digit", minute: "2-digit" } : {}),
				...(style === "T" ? { hour: "2-digit", minute: "2-digit", second: "2-digit" } : {}),
				...(style === "d" ? { dateStyle: "short" } : {}),
				...(style === "D" ? { dateStyle: "long" } : {}),
				...(style === "f" || !style ? { dateStyle: "short", timeStyle: "short" } : {}),
				...(style === "F" ? { dateStyle: "long", timeStyle: "short" } : {}),
			};
			return new Intl.DateTimeFormat("pt-BR", options).format(date);
		})
		.replace(/<a?:[\w~]+:\d+>/g, "")
		.replace(/\*\*|__|~~|`/g, "")
		.replace(/[ \t]+([,.;!?])/g, "$1")
		.replace(/[ \t]{2,}/g, " ")
		.replace(/ *\n */g, "\n")
		.trim();
}
