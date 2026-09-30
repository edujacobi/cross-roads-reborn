import { afterEach, describe, expect, it, vi } from "vitest";
import { Event } from "#core/models/Event";

describe("Event.IsActive", () => {
	afterEach(() => vi.useRealTimers());

	it("is true only after the start and before the end", () => {
		const periodStart = new Date("2026-09-30T10:00:00.000Z");
		const periodEnd = new Date("2026-09-30T11:00:00.000Z");
		const event = { periodStart, periodEnd };

		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-09-30T10:30:00.000Z"));
		expect(Event.IsActive(event)).toBe(true);

		vi.setSystemTime(periodStart);
		expect(Event.IsActive(event)).toBe(false);

		vi.setSystemTime(periodEnd);
		expect(Event.IsActive(event)).toBe(false);
	});
});
