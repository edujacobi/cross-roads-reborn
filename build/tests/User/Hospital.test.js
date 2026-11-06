"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const User_1 = require("#core/models/User");
const Language_1 = require("#core/models/Language");
const Classes_1 = require("#core/types/Classes");
const Hospital_1 = require("#core/models/Hospital");
// --- Global Mocks ---
vitest_1.vi.mock("#core/database/Users", () => ({
    Users: {
        update: vitest_1.vi.fn(),
        findOne: vitest_1.vi.fn(),
        findByPk: vitest_1.vi.fn(() => Promise.resolve({ class: Classes_1.ClassId.Entrepreneur, nickname: "OtherUser" })),
        findAll: vitest_1.vi.fn(() => Promise.resolve([])),
    },
}));
(0, vitest_1.describe)("Hospital", () => {
    let user;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        user = new User_1.User("123", Language_1.Language.English);
        user.Nickname = "TestUser";
        user.Class = Classes_1.ClassId.Entrepreneur;
        user.Money = 5_000;
    });
    (0, vitest_1.describe)("When testing if user can pay private care", () => {
        (0, vitest_1.it)("Should fail if user is not in hospital", async () => {
            const hospital = new Hospital_1.Hospital(user);
            const result = await hospital.CanPayPrivate();
            (0, vitest_1.expect)(result.canPay).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Hospital_1.HospitalFailureReason.UserFree);
        });
        (0, vitest_1.it)("Should fail if user is next in line (<5 min)", async () => {
            user.Hospital.Time = new Date(Date.now() + 120_000); // 2 min away
            const hospital = new Hospital_1.Hospital(user);
            const result = await hospital.CanPayPrivate();
            (0, vitest_1.expect)(result.canPay).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Hospital_1.HospitalFailureReason.NextInLine);
        });
        (0, vitest_1.it)("Should fail if user does not have enough money", async () => {
            user.Money = 0;
            user.Hospital.Time = new Date(Date.now() + 3_600_000);
            const hospital = new Hospital_1.Hospital(user);
            const result = await hospital.CanPayPrivate();
            (0, vitest_1.expect)(result.canPay).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Hospital_1.HospitalFailureReason.WithoutMoney);
        });
        (0, vitest_1.it)("Should succeed", async () => {
            user.Hospital.Time = new Date(Date.now() + 3_600_000);
            const hospital = new Hospital_1.Hospital(user);
            const result = await hospital.CanPayPrivate();
            (0, vitest_1.expect)(result.canPay).toBe(true);
        });
    });
});
//# sourceMappingURL=Hospital.test.js.map