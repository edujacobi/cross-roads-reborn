export function timedProgress(endTime, startTime, now) {
    if (!endTime)
        return undefined;
    const end = new Date(endTime).getTime();
    if (!Number.isFinite(end))
        return undefined;
    const duration = end - startTime;
    return duration <= 0 ? 1 : Math.min(1, Math.max(0, (now - startTime) / duration));
}
//# sourceMappingURL=timedProgress.js.map