"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const Event_1 = require("#core/models/Event");
(0, vitest_1.describe)("Event.IsActive", () => {
    (0, vitest_1.afterEach)(() => vitest_1.vi.useRealTimers());
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
});
//# sourceMappingURL=Event.test.js.map