"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const BlackMarket_1 = require("#core/models/BlackMarket");
const Lottery_1 = require("#core/models/Lottery");
const Heist_1 = require("#core/types/Heist");
const gameTime_1 = require("#shared/gameTime");
(0, vitest_1.describe)("game time", () => {
    (0, vitest_1.it)("uses Brasília time for the clock and calendar", () => {
        const gameTime = (0, gameTime_1.getGameTime)(new Date("2026-10-21T21:00:00.000Z"));
        (0, vitest_1.expect)(gameTime.hour).toBe(18);
        (0, vitest_1.expect)(gameTime.dayOfWeek).toBe(3);
    });
    (0, vitest_1.it)("opens the Black Market at 18:00 on Friday in Brasília time", () => {
        (0, vitest_1.expect)(BlackMarket_1.BlackMarket.IsOpenAt(new Date("2026-10-23T20:59:00.000Z"))).toBe(false);
        (0, vitest_1.expect)(BlackMarket_1.BlackMarket.IsOpenAt(new Date("2026-10-23T21:00:00.000Z"))).toBe(true);
        (0, vitest_1.expect)(BlackMarket_1.BlackMarket.IsOpenAt(new Date("2026-10-24T03:00:00.000Z"))).toBe(true);
    });
    (0, vitest_1.it)("uses Brasília weekdays for main heists and weekly targets", () => {
        (0, vitest_1.expect)((0, Heist_1.isMainHeistDay)(new Date("2026-10-19T02:59:00.000Z"))).toBe(false);
        (0, vitest_1.expect)((0, Heist_1.isMainHeistDay)(new Date("2026-10-19T03:00:00.000Z"))).toBe(true);
        (0, vitest_1.expect)((0, Heist_1.getWeeklyTarget)(new Date("2026-10-25T02:59:00.000Z"))).toBe(Heist_1.HeistTargets[1]);
        (0, vitest_1.expect)((0, Heist_1.getWeeklyTarget)(new Date("2026-10-25T03:00:00.000Z"))).toBe(Heist_1.HeistTargets[0]);
        (0, vitest_1.expect)((0, Heist_1.getWeeklyTarget)(new Date("2026-12-27T02:59:00.000Z"))).toBe(Heist_1.HeistTargets[0]);
        (0, vitest_1.expect)((0, Heist_1.getWeeklyTarget)(new Date("2026-12-27T03:00:00.000Z"))).toBe(Heist_1.HeistTargets[1]);
    });
    (0, vitest_1.it)("schedules lottery draws at 18:00 in Brasília time, including mega draws", () => {
        (0, vitest_1.expect)(Lottery_1.Lottery.GetNextDrawTime(new Date("2026-10-21T20:59:00.000Z")).toISOString())
            .toBe("2026-10-21T21:00:00.000Z");
        (0, vitest_1.expect)(Lottery_1.Lottery.GetNextDrawTime(new Date("2026-10-21T21:00:00.000Z")).toISOString())
            .toBe("2026-10-22T21:00:00.000Z");
        (0, vitest_1.expect)(Lottery_1.Lottery.GetNextDrawTime(new Date("2026-10-31T21:00:00.000Z")).toISOString())
            .toBe("2026-11-01T02:59:59.000Z");
        (0, vitest_1.expect)(Lottery_1.Lottery.IsMegaDraw(new Date("2026-11-01T02:59:59.000Z"))).toBe(true);
        (0, vitest_1.expect)(Lottery_1.Lottery.GetTicketPrice(new Date("2026-10-24T21:00:00.000Z"))).toBe(30_000);
    });
});
//# sourceMappingURL=GameTime.test.js.map