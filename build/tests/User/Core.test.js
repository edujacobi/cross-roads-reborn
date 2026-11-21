"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const User_1 = require("#core/models/User");
const Event_1 = require("#core/models/Event");
const Language_1 = require("#core/models/Language");
const Classes_1 = require("#core/types/Classes");
const Jobs_1 = require("#core/types/Jobs");
const Ids_1 = require("#core/types/Ids");
// --- Global Mocks ---
vitest_1.vi.mock("#core/database/Users", () => ({
    Users: {
        update: vitest_1.vi.fn(),
        findOne: vitest_1.vi.fn(),
        findByPk: vitest_1.vi.fn(() => Promise.resolve({ class: Classes_1.ClassId.Entrepreneur, nickname: "OtherUser" })),
        findAll: vitest_1.vi.fn(() => Promise.resolve([])),
    },
}));
(0, vitest_1.describe)("User Model Core Actions (Regression)", () => {
    let user;
    (0, vitest_1.afterEach)(() => vitest_1.vi.restoreAllMocks());
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        user = new User_1.User("123", Language_1.Language.English);
        user.Nickname = "TestUser";
        user.Class = Classes_1.ClassId.Entrepreneur;
        user.Money = 5_000;
    });
    (0, vitest_1.it)("should pass model lifecycle tests (Job status)", async () => {
        const jobId = Jobs_1.JobId.Butcher;
        await user.StartJob(jobId);
        (0, vitest_1.expect)(user.Job.Id).toBe(jobId);
        (0, vitest_1.expect)(user.IsWorking()).toBe(true);
        await user.CancelJob();
        (0, vitest_1.expect)(user.Job.Id).toBe(null);
        (0, vitest_1.expect)(user.IsWorking()).toBe(false);
    });
    (0, vitest_1.it)("keeps the default avatar decoration when adding timed VIP after eternal VIP", async () => {
        vitest_1.vi.spyOn(user, "Update").mockResolvedValue(true);
        user.VipEternal = true;
        await user.SetEternalVip(false);
        await user.AddVip(30, false);
        (0, vitest_1.expect)(user.AvatarDecoration.Id).toBe(Ids_1.AvatarDecorationId.Default);
    });
    (0, vitest_1.it)("uses the base class-change cost during the class-change bonus event", async () => {
        vitest_1.vi.spyOn(Event_1.Event, "IsTypeActive").mockResolvedValue(true);
        user.ClassChangeCount = 3;
        await (0, vitest_1.expect)(user.GetClassChangeCost()).resolves.toBe(100_000);
        user.VipEternal = true;
        await (0, vitest_1.expect)(user.GetClassChangeCost()).resolves.toBe(75_000);
    });
    (0, vitest_1.it)("does not increment class-change count during the class-change bonus event", async () => {
        vitest_1.vi.spyOn(Event_1.Event, "IsTypeActive").mockResolvedValue(true);
        vitest_1.vi.spyOn(user, "Update").mockResolvedValue(true);
        user.ClassChangeCount = 3;
        user.Money = 100_000;
        await user.SetClass(Classes_1.ClassId.Hobo, 100_000);
        (0, vitest_1.expect)(user.ClassChangeCount).toBe(3);
        (0, vitest_1.expect)(user.Update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            classChangeCount: 3,
        }));
    });
    (0, vitest_1.it)("keeps escalating class-change costs outside the event", async () => {
        vitest_1.vi.spyOn(Event_1.Event, "IsTypeActive").mockResolvedValue(false);
        user.ClassChangeCount = 3;
        await (0, vitest_1.expect)(user.GetClassChangeCost()).resolves.toBe(10_000_000);
    });
});
//# sourceMappingURL=Core.test.js.map