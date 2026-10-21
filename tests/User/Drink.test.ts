import { afterEach, describe, expect, it, vi } from "vitest";
import { User } from "#core/models/User";
import { getDrinkCountMessages, isHappyHour } from "#core/types/Drinks";

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("isHappyHour", () => {
	it("uses the Brasília Happy Hour window", () => {
		expect(isHappyHour(new Date("2026-10-21T20:59:00.000Z"))).toBe(false);
		expect(isHappyHour(new Date("2026-10-21T21:00:00.000Z"))).toBe(true);
		expect(isHappyHour(new Date("2026-10-22T02:00:00.000Z"))).toBe(false);
	});

	it("is active all weekend", () => {
		expect(isHappyHour(new Date("2026-10-24T12:00:00.000Z"))).toBe(true);
	});
});

describe("getDrinkCountMessages", () => {
	it("adds the same threshold messages as the drink command", () => {
		expect(getDrinkCountMessages(5, "cliente", "Portuguese")).toEqual([]);
		expect(getDrinkCountMessages(6, "cliente", "Portuguese")).toEqual(["Desce redondo, hein?"]);
		expect(getDrinkCountMessages(11, "cliente", "Portuguese")).toEqual([
			"Desce redondo, hein?",
			"Vai com calma, cliente.",
		]);
	});
});

describe("User.DrinkAtBar", () => {
	it("rejects a client count beyond the next drink", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-10-21T12:00:00.000Z"));
		const user = new User("test-user");
		const update = vi.spyOn(user, "Update").mockResolvedValue(true);

		const result = await user.DrinkAtBar(2);

		expect(result.success).toBe(false);
		expect(update).not.toHaveBeenCalled();
	});

	it("records a drink in the normal session", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-10-21T12:00:00.000Z"));
		vi.spyOn(Math, "random").mockReturnValue(0.5);
		const user = new User("test-user");
		vi.spyOn(user, "Update").mockResolvedValue(true);

		const result = await user.DrinkAtBar(1);

		expect(result.success).toBe(true);
		expect(result.normalRecord).toBe(1);
		expect(result.hospitalized).toBe(false);
	});

	it("does not keep updated drink state when persistence fails", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-10-21T12:00:00.000Z"));
		vi.spyOn(Math, "random").mockReturnValue(0.5);
		const user = new User("test-user");
		vi.spyOn(user, "Update").mockResolvedValue(false);

		const result = await user.DrinkAtBar(1);

		expect(result.success).toBe(false);
		expect(user.Drink.Normal).toBe(0);
	});
});
