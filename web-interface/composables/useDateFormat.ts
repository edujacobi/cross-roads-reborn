import { formatDistance, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GAME_TIME_OFFSET, GAME_TIME_ZONE } from "../../src/shared/gameTimeZone.js";

export function useDateFormat() {
	const shortDateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "short",
		timeStyle: "medium",
		timeZone: GAME_TIME_ZONE,
	});

	const shortDateShortTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "short",
		timeStyle: "short",
		timeZone: GAME_TIME_ZONE,
	});

	const longDateFormatter = new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "long",
		timeZone: GAME_TIME_ZONE,
	});

	const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "short",
		timeZone: GAME_TIME_ZONE,
	});

	const shortMonthDayFormatter = new Intl.DateTimeFormat("pt-BR", {
		month: "numeric",
		day: "numeric",
		timeZone: GAME_TIME_ZONE,
	});

	const shortTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
		timeZone: GAME_TIME_ZONE,
	});

	const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
		timeZone: GAME_TIME_ZONE,
	});

	const longDateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "long",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
		timeZone: GAME_TIME_ZONE,
	});

	const dateTimeInputFormatter = new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
		timeZone: GAME_TIME_ZONE,
	});

	const calendarDayFormatter = new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "numeric",
		day: "numeric",
		timeZone: GAME_TIME_ZONE,
	});

	const hourFormatter = new Intl.DateTimeFormat("en-US", {
		hour: "numeric",
		hourCycle: "h23",
		timeZone: GAME_TIME_ZONE,
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

	function shortDate(date: string | Date) {
		return shortDateFormatter.format(new Date(date));
	}

	function shortMonthDay(date: string | Date) {
		return shortMonthDayFormatter.format(new Date(date));
	}

	function shortTime(date: string | Date) {
		return shortTimeFormatter.format(new Date(date));
	}

	function dateTime(date: string | Date) {
		return dateTimeFormatter.format(new Date(date));
	}

	function longDateTime(date: string | Date) {
		return longDateTimeFormatter.format(new Date(date));
	}

	function toGameDateTimeInput(date: string | Date) {
		const parts = dateTimeInputFormatter.formatToParts(new Date(date));
		const part = (type: string) => parts.find((value) => value.type === type)?.value ?? "";
		return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
	}

	function fromGameDateTimeInput(value: string) {
		const valueWithSeconds = value.length === 16 ? `${value}:00` : value;
		return new Date(`${valueWithSeconds}${GAME_TIME_OFFSET}`);
	}

	function calendarDay(date: string | Date) {
		const parts = calendarDayFormatter.formatToParts(new Date(date));
		const part = (type: string) => Number(parts.find((value) => value.type === type)?.value);
		return Date.UTC(part("year"), part("month") - 1, part("day"));
	}

	function hourInGameTime(date: string | Date) {
		return Number(hourFormatter.format(new Date(date)));
	}

	function relative(date: string | Date, addSuffix = false) {
		return formatDistanceToNow(new Date(date), { addSuffix, locale: ptBR });
	}

	function distance(date1: string | Date, date2: string | Date) {
		return formatDistance(new Date(date1), new Date(date2), { locale: ptBR });
	}

	function decimalHoursToDeclarative(decimalHours: number) {
		const hours = Math.floor(decimalHours);
		const minutes = Math.round((decimalHours - hours) * 60);

		if (minutes === 0) {
			return `${hours}h`;
		}

		return `${hours}h${minutes}min`;
	}

	return {
		shortDateTime,
		shortDateShortTime,
		longDate,
		shortDate,
		shortMonthDay,
		shortTime,
		dateTime,
		longDateTime,
		toGameDateTimeInput,
		fromGameDateTimeInput,
		calendarDay,
		hourInGameTime,
		relative,
		distance,
		decimalHoursToDeclarative,
	};
}
