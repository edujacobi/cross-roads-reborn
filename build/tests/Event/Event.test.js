"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const Events_1 = require("#core/database/Events");
const Event_1 = require("#core/models/Event");
const EventRepository_1 = require("#core/repositories/EventRepository");
(0, vitest_1.describe)("Event.IsActive", () => {
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.useRealTimers();
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)("is true only after the start and before the end", () => {
        const periodStart = new Date("2026-09-30T10:00:00.000Z");
        const periodEnd = new Date("2026-09-30T11:00:00.000Z");
        const event = { periodStart, periodEnd };
        vitest_1.vi.useFakeTimers();
        vitest_1.vi.setSystemTime(new Date("2026-09-30T10:30:00.000Z"));
        (0, vitest_1.expect)(Event_1.Event.IsActive(event)).toBe(true);
        vitest_1.vi.setSystemTime(periodStart);
        (0, vitest_1.expect)(Event_1.Event.IsActive(event)).toBe(false);
        vitest_1.vi.setSystemTime(periodEnd);
        (0, vitest_1.expect)(Event_1.Event.IsActive(event)).toBe(false);
    });
    (0, vitest_1.it)("checks whether an event type is active", async () => {
        const activeEvent = new Events_1.Events({
            type: Event_1.EventType.CLASS_CHANGE_BONUS,
            value: 0,
            periodStart: new Date("2026-09-30T10:00:00.000Z"),
            periodEnd: new Date("2026-09-30T11:00:00.000Z"),
        });
        const findActiveEvent = vitest_1.vi.spyOn(EventRepository_1.EventRepository, "FindActiveEvent");
        findActiveEvent.mockResolvedValue(activeEvent);
        await (0, vitest_1.expect)(Event_1.Event.IsTypeActive(Event_1.EventType.CLASS_CHANGE_BONUS)).resolves.toBe(true);
        findActiveEvent.mockResolvedValue(null);
        await (0, vitest_1.expect)(Event_1.Event.IsTypeActive(Event_1.EventType.CLASS_CHANGE_BONUS)).resolves.toBe(false);
    });
});
//# sourceMappingURL=Event.test.js.map