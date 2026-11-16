import { describe, expect, it } from "vitest";
import { BlackMarket } from "#core/models/BlackMarket";
import { Lottery } from "#core/models/Lottery";
import { HeistTargets, getWeeklyTarget, isMainHeistDay } from "#core/types/Heist";
import { getGameTime } from "#shared/gameTime";

describe("game time", () => {
	it("uses Brasília time for the clock and calendar", () => {
		const gameTime = getGameTime(new Date("2026-10-21T21:00:00.000Z"));

		expect(gameTime.hour).toBe(18);
		expect(gameTime.dayOfWeek).toBe(3);
	});

	it("opens the Black Market at 18:00 on Friday in Brasília time", () => {
		expect(BlackMarket.IsOpenAt(new Date("2026-10-23T20:59:00.000Z"))).toBe(false);
		expect(BlackMarket.IsOpenAt(new Date("2026-10-23T21:00:00.000Z"))).toBe(true);
		expect(BlackMarket.IsOpenAt(new Date("2026-10-24T03:00:00.000Z"))).toBe(true);
	});

	it("uses Brasília weekdays for main heists and weekly targets", () => {
		expect(isMainHeistDay(new Date("2026-10-19T02:59:00.000Z"))).toBe(false);
		expect(isMainHeistDay(new Date("2026-10-19T03:00:00.000Z"))).toBe(true);
		expect(getWeeklyTarget(new Date("2026-10-25T02:59:00.000Z"))).toBe(HeistTargets[1]);
		expect(getWeeklyTarget(new Date("2026-10-25T03:00:00.000Z"))).toBe(HeistTargets[0]);
		expect(getWeeklyTarget(new Date("2026-12-27T02:59:00.000Z"))).toBe(HeistTargets[0]);
		expect(getWeeklyTarget(new Date("2026-12-27T03:00:00.000Z"))).toBe(HeistTargets[1]);
	});

	it("schedules lottery draws at 18:00 in Brasília time, including mega draws", () => {
		expect(Lottery.GetNextDrawTime(new Date("2026-10-21T20:59:00.000Z")).toISOString())
			.toBe("2026-10-21T21:00:00.000Z");
		expect(Lottery.GetNextDrawTime(new Date("2026-10-21T21:00:00.000Z")).toISOString())
			.toBe("2026-10-22T21:00:00.000Z");
		expect(Lottery.GetNextDrawTime(new Date("2026-10-31T21:00:00.000Z")).toISOString())
			.toBe("2026-11-01T02:59:59.000Z");
		expect(Lottery.IsMegaDraw(new Date("2026-11-01T02:59:59.000Z"))).toBe(true);
		expect(Lottery.GetTicketPrice(new Date("2026-10-24T21:00:00.000Z"))).toBe(30_000);
	});
});
