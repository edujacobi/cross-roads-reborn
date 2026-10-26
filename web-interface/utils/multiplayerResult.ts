export type MultiplayerOutcome = Record<string, unknown>;

export function parseMultiplayerOutcome(result: string | null | undefined): MultiplayerOutcome | null {
	if (!result) return null;
	try {
		const parsed: unknown = JSON.parse(result);
		return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
			? (parsed as MultiplayerOutcome)
			: null;
	} catch {
		return null;
	}
}

export function getOutcomeNumber(outcome: MultiplayerOutcome | null, key: string): number | null {
	const value = outcome?.[key];
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function getOutcomeDate(outcome: MultiplayerOutcome | null, key: string): string | null {
	const value = outcome?.[key];
	if (typeof value !== "string") return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(date);
}
