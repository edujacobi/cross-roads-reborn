import { describe, expect, it } from "vitest";
import { useDateFormat } from "../web-interface/composables/useDateFormat";

describe("game date formatting", () => {
	it("formats displayed timestamps and datetime inputs in Brasília time", () => {
		const dateFormat = useDateFormat();
		const instant = "2026-10-21T21:00:00.000Z";

		expect(dateFormat.shortDateShortTime(instant)).toContain("18:00");
		expect(dateFormat.toGameDateTimeInput(instant)).toBe("2026-10-21T18:00");
		expect(dateFormat.fromGameDateTimeInput("2026-10-21T18:00").toISOString()).toBe(instant);
	});

	it("counts calendar days and hours in Brasília time", () => {
		const dateFormat = useDateFormat();

		expect(dateFormat.calendarDay("2026-10-21T02:00:00.000Z")).toBe(Date.UTC(2026, 9, 20));
		expect(dateFormat.hourInGameTime("2026-10-21T21:00:00.000Z")).toBe(18);
	});
});
