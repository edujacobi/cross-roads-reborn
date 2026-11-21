"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const useDateFormat_1 = require("../web-interface/composables/useDateFormat");
(0, vitest_1.describe)("game date formatting", () => {
    (0, vitest_1.it)("formats displayed timestamps and datetime inputs in Brasília time", () => {
        const dateFormat = (0, useDateFormat_1.useDateFormat)();
        const instant = "2026-10-21T21:00:00.000Z";
        (0, vitest_1.expect)(dateFormat.shortDateShortTime(instant)).toContain("18:00");
        (0, vitest_1.expect)(dateFormat.toGameDateTimeInput(instant)).toBe("2026-10-21T18:00");
        (0, vitest_1.expect)(dateFormat.fromGameDateTimeInput("2026-10-21T18:00").toISOString()).toBe(instant);
    });
    (0, vitest_1.it)("counts calendar days and hours in Brasília time", () => {
        const dateFormat = (0, useDateFormat_1.useDateFormat)();
        (0, vitest_1.expect)(dateFormat.calendarDay("2026-10-21T02:00:00.000Z")).toBe(Date.UTC(2026, 9, 20));
        (0, vitest_1.expect)(dateFormat.hourInGameTime("2026-10-21T21:00:00.000Z")).toBe(18);
    });
});
//# sourceMappingURL=WebDateFormat.test.js.map