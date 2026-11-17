import { describe, expect, it } from "vitest";
import { timedProgress } from "../../web-interface/utils/timedProgress";

describe("timedProgress", () => {
	it("fills from the time a deadline is received to the deadline", () => {
		const end = new Date(20_000).toISOString();
		expect(timedProgress(end, 10_000, 10_000)).toBe(0);
		expect(timedProgress(end, 10_000, 15_000)).toBe(0.5);
		expect(timedProgress(end, 10_000, 25_000)).toBe(1);
		expect(timedProgress(end, 10_000, 5_000)).toBe(0);
		expect(timedProgress(end, 25_000, 25_000)).toBe(1);
	});

	it("remains indeterminate until a valid deadline is known", () => {
		expect(timedProgress(null, 0, 0)).toBeUndefined();
		expect(timedProgress("invalid", 0, 0)).toBeUndefined();
	});
});
