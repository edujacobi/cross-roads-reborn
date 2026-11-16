import { afterEach, describe, expect, it, vi } from "vitest";
import { Events } from "#core/database/Events";
import { Event, EventType } from "#core/models/Event";
import { EventRepository } from "#core/repositories/EventRepository";

describe("Event.IsActive", () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

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

	it("checks whether an event type is active", async () => {
		const activeEvent = new Events({
			type: EventType.CLASS_CHANGE_BONUS,
			value: 0,
			periodStart: new Date("2026-09-30T10:00:00.000Z"),
			periodEnd: new Date("2026-09-30T11:00:00.000Z"),
		});
		const findActiveEvent = vi.spyOn(EventRepository, "FindActiveEvent");
		findActiveEvent.mockResolvedValue(activeEvent);

		await expect(Event.IsTypeActive(EventType.CLASS_CHANGE_BONUS)).resolves.toBe(true);

		findActiveEvent.mockResolvedValue(null);
		await expect(Event.IsTypeActive(EventType.CLASS_CHANGE_BONUS)).resolves.toBe(false);
	});
});
