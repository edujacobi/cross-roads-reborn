import { GAME_TIME_ZONE } from "./gameTimeZone";

export { GAME_TIME_OFFSET, GAME_TIME_ZONE } from "./gameTimeZone";

export function getGameTime(date = new Date()) {
	return Temporal.Instant.fromEpochMilliseconds(date.getTime()).toZonedDateTimeISO(GAME_TIME_ZONE);
}

export function isGameNight(date = new Date()) {
	const hour = getGameTime(date).hour;
	return hour < 6 || hour >= 18;
}
