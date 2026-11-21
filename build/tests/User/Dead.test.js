"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const User_1 = require("#core/models/User");
const Language_1 = require("#core/models/Language");
const Classes_1 = require("#core/types/Classes");
const Jobs_1 = require("#core/types/Jobs");
const date_fns_1 = require("date-fns");
// --- Global Mocks ---
vitest_1.vi.mock("#core/database/Users", () => ({
    Users: {
        update: vitest_1.vi.fn(),
        findOne: vitest_1.vi.fn(),
        findByPk: vitest_1.vi.fn(() => Promise.resolve({ class: Classes_1.ClassId.Entrepreneur, nickname: "OtherUser" })),
        findAll: vitest_1.vi.fn(() => Promise.resolve([])),
    },
}));
(0, vitest_1.describe)("Dead Status", () => {
    let user;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        user = new User_1.User("123", Language_1.Language.English);
        user.Nickname = "TestUser";
        user.Class = Classes_1.ClassId.Entrepreneur;
        user.Money = 5_000;
    });
    (0, vitest_1.describe)("When testing if user is dead", () => {
        (0, vitest_1.it)("Should return false by default (new user)", () => {
            (0, vitest_1.expect)(user.IsDead()).toBe(false);
        });
        (0, vitest_1.it)("Should return true if DeadUntil is in the future", () => {
            user.DeadUntil = (0, date_fns_1.addDays)(new Date(), 3);
            (0, vitest_1.expect)(user.IsDead()).toBe(true);
        });
        (0, vitest_1.it)("Should return false if DeadUntil is in the past", () => {
            user.DeadUntil = (0, date_fns_1.addDays)(new Date(), -1);
            (0, vitest_1.expect)(user.IsDead()).toBe(false);
        });
    });
    (0, vitest_1.describe)("When testing availability and situation", () => {
        (0, vitest_1.it)("Should not be available if dead", async () => {
            user.DeadUntil = (0, date_fns_1.addDays)(new Date(), 3);
            const availability = user.CheckAvailability();
            (0, vitest_1.expect)(availability.available).toBe(false);
            if (!availability.available) {
                (0, vitest_1.expect)(availability.reason).toBe("dead");
            }
        });
        (0, vitest_1.it)("Should set Situation Id to Dead when dead", async () => {
            user.DeadUntil = (0, date_fns_1.addDays)(new Date(), 3);
            await user.GetSituation();
            (0, vitest_1.expect)(user.Situation.Id).toBe(User_1.SituationId.Dead);
        });
    });
    (0, vitest_1.describe)("When /kill logic is simulated", () => {
        (0, vitest_1.it)("Should successfully clear money, job, and hospitalize the user", async () => {
            // Set initial job
            user.Job.Id = Jobs_1.JobId.Butcher;
            (0, vitest_1.expect)(user.IsWorking()).toBe(true);
            const deadUntil = (0, date_fns_1.addDays)(new Date(), 3);
            user.DeadUntil = deadUntil;
            user.Hospital.Time = deadUntil;
            user.Money = 0;
            user.Job.Id = null;
            (0, vitest_1.expect)(user.IsDead()).toBe(true);
            (0, vitest_1.expect)(user.IsInHospital()).toBe(true);
            (0, vitest_1.expect)(user.Money).toBe(0);
            (0, vitest_1.expect)(user.IsWorking()).toBe(false);
            (0, vitest_1.expect)(user.Job.Id).toBe(null);
        });
    });
});
//# sourceMappingURL=Dead.test.js.map