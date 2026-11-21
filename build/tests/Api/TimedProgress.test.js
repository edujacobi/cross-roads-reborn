"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const timedProgress_1 = require("../../web-interface/utils/timedProgress");
(0, vitest_1.describe)("timedProgress", () => {
    (0, vitest_1.it)("fills from the time a deadline is received to the deadline", () => {
        const end = new Date(20_000).toISOString();
        (0, vitest_1.expect)((0, timedProgress_1.timedProgress)(end, 10_000, 10_000)).toBe(0);
        (0, vitest_1.expect)((0, timedProgress_1.timedProgress)(end, 10_000, 15_000)).toBe(0.5);
        (0, vitest_1.expect)((0, timedProgress_1.timedProgress)(end, 10_000, 25_000)).toBe(1);
        (0, vitest_1.expect)((0, timedProgress_1.timedProgress)(end, 10_000, 5_000)).toBe(0);
        (0, vitest_1.expect)((0, timedProgress_1.timedProgress)(end, 25_000, 25_000)).toBe(1);
    });
    (0, vitest_1.it)("remains indeterminate until a valid deadline is known", () => {
        (0, vitest_1.expect)((0, timedProgress_1.timedProgress)(null, 0, 0)).toBeUndefined();
        (0, vitest_1.expect)((0, timedProgress_1.timedProgress)("invalid", 0, 0)).toBeUndefined();
    });
});
//# sourceMappingURL=TimedProgress.test.js.map