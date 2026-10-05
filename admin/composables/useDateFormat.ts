import { format, formatDistance, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function useDateFormat() {
	const shortDateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "short",
		timeStyle: "medium",
	});

	const shortDateShortTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "short",
		timeStyle: "short",
	});

	const longDateFormatter = new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "long",
	});

	function shortDateTime(date: string | Date) {
		return shortDateTimeFormatter.format(new Date(date));
	}

	function shortDateShortTime(date: string | Date) {
		return shortDateShortTimeFormatter.format(new Date(date));
	}

	function longDate(date: string | Date) {
		return longDateFormatter.format(new Date(date));
	}

	function dateTime(date: string | Date) {
		return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
	}

	function relative(date: string | Date, addSuffix = false) {
		return formatDistanceToNow(new Date(date), { addSuffix, locale: ptBR });
	}

	function distance(date1: string | Date, date2: string | Date) {
		return formatDistance(new Date(date1), new Date(date2), { locale: ptBR });
	}

	return { shortDateTime, shortDateShortTime, longDate, dateTime, relative, distance };
}
