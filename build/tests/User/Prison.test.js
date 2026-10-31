"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const User_1 = require("#core/models/User");
const Language_1 = require("#core/models/Language");
const Classes_1 = require("#core/types/Classes");
const Prison_1 = require("#core/models/Prison");
const UserRepository_1 = require("#core/repositories/UserRepository");
const Event_1 = require("#core/models/Event");
const Notification_1 = require("#core/models/Notification");
const Users_1 = require("#core/database/Users");
const sequelize_1 = require("sequelize");
// --- Global Mocks ---
vitest_1.vi.mock("#core/database/Users", () => ({
    Users: {
        update: vitest_1.vi.fn(),
        findOne: vitest_1.vi.fn(),
        findByPk: vitest_1.vi.fn(() => Promise.resolve({ class: Classes_1.ClassId.Entrepreneur, nickname: "OtherUser" })),
        findAll: vitest_1.vi.fn(() => Promise.resolve([])),
    },
}));
(0, vitest_1.describe)("Prison", () => {
    let user;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        user = new User_1.User("123", Language_1.Language.English);
        user.Nickname = "TestUser";
        user.Class = Classes_1.ClassId.Entrepreneur;
        user.Money = 5_000;
    });
    (0, vitest_1.afterEach)(() => {
        (0, Prison_1.cleanupActiveEscapes)();
        vitest_1.vi.restoreAllMocks();
        vitest_1.vi.useRealTimers();
    });
    (0, vitest_1.describe)("When testing if user can escape", () => {
        (0, vitest_1.it)("Should fail if user not in prison", async () => {
            const prison = new Prison_1.Prison(user);
            const result = await prison.CanEscape();
            (0, vitest_1.expect)(result.canEscape).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Prison_1.PrisonFailureReason.BribeNotInPrison);
        });
        (0, vitest_1.it)("Should fail if user already tried escaping", async () => {
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            user.Escape.HasTried = true;
            const prison = new Prison_1.Prison(user);
            const result = await prison.CanEscape();
            (0, vitest_1.expect)(result.canEscape).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Prison_1.PrisonFailureReason.EscapeHasTried);
        });
        (0, vitest_1.it)("Should fail if user is already escaping", async () => {
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            user.Escape.Time = new Date(Date.now() + 3_600_000);
            const prison = new Prison_1.Prison(user);
            const result = await prison.CanEscape();
            (0, vitest_1.expect)(result.canEscape).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Prison_1.PrisonFailureReason.EscapeEscaping);
        });
        (0, vitest_1.it)("Should fail if user is being robbed", async () => {
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            user.Robbery.IsBeingRobbedById = "123";
            const prison = new Prison_1.Prison(user);
            const result = await prison.CanEscape();
            (0, vitest_1.expect)(result.canEscape).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Prison_1.PrisonFailureReason.AttackerIsBeingRobbedById);
        });
        (0, vitest_1.it)("Should fail if user is beating", async () => {
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            user.BeatUp.IsBeatingId = "123";
            const prison = new Prison_1.Prison(user);
            const result = await prison.CanEscape();
            (0, vitest_1.expect)(result.canEscape).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Prison_1.PrisonFailureReason.AttackerIsBeatingId);
        });
        (0, vitest_1.it)("Should fail if user is being beat up", async () => {
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            user.BeatUp.IsBeingBeatUpById = "123";
            const prison = new Prison_1.Prison(user);
            const result = await prison.CanEscape();
            (0, vitest_1.expect)(result.canEscape).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Prison_1.PrisonFailureReason.AttackerIsBeingBeatedById);
        });
        (0, vitest_1.it)("Should succeed", async () => {
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            const prison = new Prison_1.Prison(user);
            const result = await prison.CanEscape();
            (0, vitest_1.expect)(result.canEscape).toBe(true);
        });
    });
    (0, vitest_1.describe)("When starting an escape", () => {
        (0, vitest_1.it)("Should not start a duplicate escape after another request claimed it", async () => {
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            vitest_1.vi.spyOn(UserRepository_1.UserRepository, "TryStartEscape").mockResolvedValue(false);
            const prison = new Prison_1.Prison(user);
            await (0, vitest_1.expect)(prison.StartEscape()).resolves.toBe(false);
            (0, vitest_1.expect)(user.Escape.HasTried).toBe(false);
        });
    });
    (0, vitest_1.describe)("When ending an escape", () => {
        (0, vitest_1.beforeEach)(() => {
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            user.Escape.HasTried = true;
            user.Escape.Time = new Date(Date.now() - 1_000);
            vitest_1.vi.spyOn(Event_1.Event, "GetActiveFromType").mockResolvedValue(1);
            vitest_1.vi.spyOn(Notification_1.Notification, "Dismiss").mockResolvedValue(undefined);
            vitest_1.vi.spyOn(Notification_1.Notification, "Free").mockResolvedValue(undefined);
            vitest_1.vi.spyOn(Notification_1.Notification, "RobAgain").mockResolvedValue(undefined);
            vitest_1.vi.spyOn(Math, "random").mockReturnValue(0.99);
        });
        (0, vitest_1.it)("Should apply the prison penalty after the escape timer expires", async () => {
            const prisonTime = user.Prison.Time;
            const escapeTime = user.Escape.Time;
            const update = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "TryEndEscape").mockResolvedValue(true);
            const result = await new Prison_1.Prison(user).EndEscape();
            (0, vitest_1.expect)(result?.success).toBe(false);
            (0, vitest_1.expect)(user.Prison.Time.getTime()).toBe(prisonTime.getTime() + 15 * 60_000);
            (0, vitest_1.expect)(user.Escape.Time.getTime()).toBe(0);
            (0, vitest_1.expect)(update).toHaveBeenCalledWith(user.Id, escapeTime, prisonTime, vitest_1.expect.objectContaining({
                escapeTime: new Date(0),
                prisonTime: user.Prison.Time,
            }));
        });
        (0, vitest_1.it)("Should remain escaping until the result is saved, even after the countdown", async () => {
            const prisonTime = user.Prison.Time;
            let save;
            vitest_1.vi.spyOn(UserRepository_1.UserRepository, "TryEndEscape").mockImplementation(() => new Promise(resolve => {
                save = resolve;
            }));
            const completion = new Prison_1.Prison(user).EndEscape();
            await vitest_1.vi.waitFor(() => (0, vitest_1.expect)(save).toBeTypeOf("function"));
            (0, vitest_1.expect)(user.IsEscaping()).toBe(true);
            (0, vitest_1.expect)(user.Prison.Time).toBe(prisonTime);
            (0, vitest_1.expect)(Notification_1.Notification.Free).not.toHaveBeenCalled();
            save(true);
            await completion;
            (0, vitest_1.expect)(user.IsEscaping()).toBe(false);
            (0, vitest_1.expect)(Notification_1.Notification.Free).toHaveBeenCalledWith(user);
        });
        (0, vitest_1.it)("Should leave a failed save pending and retry without doubling the penalty", async () => {
            const prisonTime = user.Prison.Time;
            const save = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "TryEndEscape")
                .mockRejectedValueOnce(new Error("SQLITE_BUSY"))
                .mockResolvedValueOnce(true);
            const prison = new Prison_1.Prison(user);
            await (0, vitest_1.expect)(prison.EndEscape()).rejects.toThrow("SQLITE_BUSY");
            (0, vitest_1.expect)(user.IsEscaping()).toBe(true);
            (0, vitest_1.expect)(user.Prison.Time).toBe(prisonTime);
            (0, vitest_1.expect)(Notification_1.Notification.Free).not.toHaveBeenCalled();
            await prison.EndEscape();
            (0, vitest_1.expect)(save).toHaveBeenCalledTimes(2);
            (0, vitest_1.expect)(user.Prison.Time.getTime()).toBe(prisonTime.getTime() + 15 * 60_000);
        });
        (0, vitest_1.it)("Should persist only one result for concurrent completions", async () => {
            const other = new User_1.User(user.Id, Language_1.Language.English);
            other.Prison.Time = user.Prison.Time;
            other.Escape.Time = user.Escape.Time;
            other.Escape.HasTried = true;
            vitest_1.vi.mocked(Users_1.Users.update).mockResolvedValueOnce([1]).mockResolvedValueOnce([0]);
            const escapeTime = user.Escape.Time;
            const prisonTime = user.Prison.Time;
            const results = await Promise.all([new Prison_1.Prison(user).EndEscape(), new Prison_1.Prison(other).EndEscape()]);
            (0, vitest_1.expect)(results.filter(result => result !== null)).toHaveLength(1);
            (0, vitest_1.expect)(Notification_1.Notification.Free).toHaveBeenCalledOnce();
            (0, vitest_1.expect)(Users_1.Users.update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ escapeTime: new Date(0) }), {
                where: { id: user.Id, escapeHasTried: true, escapeTime, prisonTime },
            });
        });
        (0, vitest_1.it)("Should apply the multiplied penalty from now when recovering an expired sentence", async () => {
            vitest_1.vi.useFakeTimers();
            user.Prison.Time = new Date(Date.now() - 3_600_000);
            user.Attributes.Attack = 10;
            vitest_1.vi.mocked(Event_1.Event.GetActiveFromType).mockResolvedValue(2);
            vitest_1.vi.spyOn(UserRepository_1.UserRepository, "TryEndEscape").mockResolvedValue(true);
            const result = await new Prison_1.Prison(user).EndEscape();
            (0, vitest_1.expect)(result?.totalTime).toBe(40);
            (0, vitest_1.expect)(user.Prison.Time.getTime()).toBe(Date.now() + 40 * 60_000);
        });
        (0, vitest_1.it)("Should preserve successful escape rewards and notify only after saving", async () => {
            vitest_1.vi.useFakeTimers();
            const save = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "TryEndEscape").mockResolvedValue(true);
            const prison = new Prison_1.Prison(user);
            prison.Escape.TotalChance = 100;
            vitest_1.vi.mocked(Math.random).mockReturnValue(0);
            const result = await prison.EndEscape();
            (0, vitest_1.expect)(result?.success).toBe(true);
            (0, vitest_1.expect)(user.Escape.Count).toBe(1);
            (0, vitest_1.expect)(user.Prison.Time.getTime()).toBe(Date.now());
            (0, vitest_1.expect)(user.Wanted.Time.getTime()).toBe(Date.now() + 40 * 60_000);
            (0, vitest_1.expect)(save.mock.invocationCallOrder[0]).toBeLessThan(vitest_1.vi.mocked(Notification_1.Notification.RobAgain).mock.invocationCallOrder[0]);
        });
    });
    (0, vitest_1.describe)("When recovering pending escapes", () => {
        (0, vitest_1.it)("Should recover at startup and retry a failed save on the next interval", async () => {
            vitest_1.vi.useFakeTimers();
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            const prisonTime = user.Prison.Time.getTime();
            user.Escape.HasTried = true;
            user.Escape.Time = new Date(Date.now() - 1_000);
            vitest_1.vi.spyOn(UserRepository_1.UserRepository, "FindOverdueEscapes").mockResolvedValue([{ id: user.Id }]);
            vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockResolvedValue(user);
            vitest_1.vi.spyOn(Prison_1.Prison.prototype, "CalculateEscapeChance").mockResolvedValue(undefined);
            vitest_1.vi.spyOn(Event_1.Event, "GetActiveFromType").mockResolvedValue(1);
            vitest_1.vi.spyOn(Notification_1.Notification, "Free").mockResolvedValue(undefined);
            vitest_1.vi.spyOn(Math, "random").mockReturnValue(0.99);
            const save = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "TryEndEscape")
                .mockRejectedValueOnce(new Error("SQLITE_BUSY"))
                .mockResolvedValueOnce(true);
            await Prison_1.Prison.Initialize();
            (0, vitest_1.expect)(user.IsEscaping()).toBe(true);
            await vitest_1.vi.advanceTimersByTimeAsync(5_000);
            (0, vitest_1.expect)(save).toHaveBeenCalledTimes(2);
            (0, vitest_1.expect)(user.IsEscaping()).toBe(false);
            (0, vitest_1.expect)(user.Prison.Time.getTime()).toBe(prisonTime + 15 * 60_000);
        });
        (0, vitest_1.it)("Should query only overdue, unresolved attempts", async () => {
            vitest_1.vi.useFakeTimers();
            vitest_1.vi.mocked(Users_1.Users.findAll).mockResolvedValueOnce([]);
            await UserRepository_1.UserRepository.FindOverdueEscapes();
            (0, vitest_1.expect)(Users_1.Users.findAll).toHaveBeenCalledWith({
                attributes: ["id"],
                where: {
                    escapeHasTried: true,
                    escapeTime: { [sequelize_1.Op.gt]: new Date(0), [sequelize_1.Op.lte]: new Date() },
                },
            });
        });
    });
});
//# sourceMappingURL=Prison.test.js.map