"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const User_1 = require("#core/models/User");
const Drinks_1 = require("#core/types/Drinks");
(0, vitest_1.afterEach)(() => {
    vitest_1.vi.useRealTimers();
    vitest_1.vi.restoreAllMocks();
});
(0, vitest_1.describe)("isHappyHour", () => {
    (0, vitest_1.it)("uses the Brasília Happy Hour window", () => {
        (0, vitest_1.expect)((0, Drinks_1.isHappyHour)(new Date("2026-10-21T20:59:00.000Z"))).toBe(false);
        (0, vitest_1.expect)((0, Drinks_1.isHappyHour)(new Date("2026-10-21T21:00:00.000Z"))).toBe(true);
        (0, vitest_1.expect)((0, Drinks_1.isHappyHour)(new Date("2026-10-22T02:00:00.000Z"))).toBe(false);
    });
    (0, vitest_1.it)("is active all weekend", () => {
        (0, vitest_1.expect)((0, Drinks_1.isHappyHour)(new Date("2026-10-24T12:00:00.000Z"))).toBe(true);
    });
});
(0, vitest_1.describe)("getDrinkCountMessages", () => {
    (0, vitest_1.it)("adds the same threshold messages as the drink command", () => {
        (0, vitest_1.expect)((0, Drinks_1.getDrinkCountMessages)(5, "cliente", "Portuguese")).toEqual([]);
        (0, vitest_1.expect)((0, Drinks_1.getDrinkCountMessages)(6, "cliente", "Portuguese")).toEqual(["Desce redondo, hein?"]);
        (0, vitest_1.expect)((0, Drinks_1.getDrinkCountMessages)(11, "cliente", "Portuguese")).toEqual([
            "Desce redondo, hein?",
            "Vai com calma, cliente.",
        ]);
    });
});
(0, vitest_1.describe)("User.DrinkAtBar", () => {
    (0, vitest_1.it)("rejects a client count beyond the next drink", async () => {
        vitest_1.vi.useFakeTimers();
        vitest_1.vi.setSystemTime(new Date("2026-10-21T12:00:00.000Z"));
        const user = new User_1.User("test-user");
        const update = vitest_1.vi.spyOn(user, "Update").mockResolvedValue(true);
        const result = await user.DrinkAtBar(2);
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(update).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("records a drink in the normal session", async () => {
        vitest_1.vi.useFakeTimers();
        vitest_1.vi.setSystemTime(new Date("2026-10-21T12:00:00.000Z"));
        vitest_1.vi.spyOn(Math, "random").mockReturnValue(0.5);
        const user = new User_1.User("test-user");
        vitest_1.vi.spyOn(user, "Update").mockResolvedValue(true);
        const result = await user.DrinkAtBar(1);
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.normalRecord).toBe(1);
        (0, vitest_1.expect)(result.hospitalized).toBe(false);
    });
    (0, vitest_1.it)("does not keep updated drink state when persistence fails", async () => {
        vitest_1.vi.useFakeTimers();
        vitest_1.vi.setSystemTime(new Date("2026-10-21T12:00:00.000Z"));
        vitest_1.vi.spyOn(Math, "random").mockReturnValue(0.5);
        const user = new User_1.User("test-user");
        vitest_1.vi.spyOn(user, "Update").mockResolvedValue(false);
        const result = await user.DrinkAtBar(1);
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(user.Drink.Normal).toBe(0);
    });
});
//# sourceMappingURL=Drink.test.js.map