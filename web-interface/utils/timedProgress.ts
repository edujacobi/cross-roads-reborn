export function timedProgress(endTime: string | null | undefined, startTime: number, now: number): number | undefined {
	if (!endTime) return undefined;
	const end = new Date(endTime).getTime();
	if (!Number.isFinite(end)) return undefined;
	const duration = end - startTime;
	return duration <= 0 ? 1 : Math.min(1, Math.max(0, (now - startTime) / duration));
}
