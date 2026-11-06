"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const User_1 = require("#core/models/User");
const Language_1 = require("#core/models/Language");
const Classes_1 = require("#core/types/Classes");
const Alms_1 = require("#core/models/Alms");
// --- Global Mocks ---
vitest_1.vi.mock("#core/database/Users", () => ({
    Users: {
        update: vitest_1.vi.fn(),
        findOne: vitest_1.vi.fn(),
        findByPk: vitest_1.vi.fn((id) => Promise.resolve({ id, class: Classes_1.ClassId.Entrepreneur, nickname: "OtherUser" })),
        findAll: vitest_1.vi.fn(() => Promise.resolve([])),
    },
}));
(0, vitest_1.describe)("Alms", () => {
    let user;
    let defender;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        user = new User_1.User("123", Language_1.Language.English);
        user.Nickname = "TestUser";
        user.Class = Classes_1.ClassId.Entrepreneur;
        user.Money = 5_000;
        defender = new User_1.User("456", Language_1.Language.English);
        defender.Nickname = "Defender";
        defender.Class = Classes_1.ClassId.Entrepreneur;
        defender.Money = 5_000;
        vitest_1.vi.spyOn(user, "GetInfo").mockImplementation(async function () {
            return this;
        });
        vitest_1.vi.spyOn(defender, "GetInfo").mockImplementation(async function () {
            return this;
        });
    });
    (0, vitest_1.describe)("When testing if user can give alms", () => {
        (0, vitest_1.it)("Should fail if same giver and receiver", () => {
            user.Money = 5_000;
            const alms = new Alms_1.Alms(user, user);
            const result = alms.CanGiveAlms();
            (0, vitest_1.expect)(result.canGive).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("yourself");
        });
        (0, vitest_1.it)("Should fail if giver has no money", () => {
            const alms = new Alms_1.Alms(user, defender);
            user.Money = 0;
            const result = alms.CanGiveAlms();
            (0, vitest_1.expect)(result.canGive).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("money");
        });
        (0, vitest_1.it)("Should fail if user is in cooldown to give alms", () => {
            const alms = new Alms_1.Alms(user, defender);
            user.Alms.GiveTime = new Date(Date.now() + 3_600_000);
            const result = alms.CanGiveAlms();
            (0, vitest_1.expect)(result.canGive).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("give alms again");
        });
        (0, vitest_1.it)("Should fail if receiver is in cooldown to receive", () => {
            const alms = new Alms_1.Alms(user, defender);
            defender.Alms.ReceiveTime = new Date(Date.now() + 3_600_000);
            const result = alms.CanGiveAlms();
            (0, vitest_1.expect)(result.canGive).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("receive alms again");
        });
        (0, vitest_1.it)("Should fail if receiver doesn't have a nickname", () => {
            const alms = new Alms_1.Alms(user, defender);
            defender.Nickname = "";
            const result = alms.CanGiveAlms();
            (0, vitest_1.expect)(result.canGive).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("nickname");
        });
        (0, vitest_1.it)("Should fail if receiver doesn't have a class", () => {
            const alms = new Alms_1.Alms(user, defender);
            defender.Class = Classes_1.ClassId.None;
            const result = alms.CanGiveAlms();
            (0, vitest_1.expect)(result.canGive).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("class");
        });
        (0, vitest_1.it)("Should fail if giver in casino", () => {
            const alms = new Alms_1.Alms(user, defender);
            user.Casino.IsInGame = true;
            const result = alms.CanGiveAlms();
            (0, vitest_1.expect)(result.canGive).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("casino");
        });
        (0, vitest_1.describe)("And user can give alms", () => {
            (0, vitest_1.it)("Then should return true", () => {
                const alms = new Alms_1.Alms(user, defender);
                const result = alms.CanGiveAlms();
                (0, vitest_1.expect)(result.canGive).toBe(true);
                (0, vitest_1.expect)(result.message).toBe("");
            });
        });
    });
    (0, vitest_1.describe)("When giving alms", () => {
        let value = 50;
        (0, vitest_1.describe)("And user is not vip", () => {
            (0, vitest_1.it)("Then should give alms with default value", async () => {
                const alms = new Alms_1.Alms(user, defender);
                const initialMoneyUser = user.Money;
                const initialMoneyDefender = defender.Money;
                await alms.GiveAlms();
                (0, vitest_1.expect)(user.Money).toBe(initialMoneyUser - value);
                (0, vitest_1.expect)(defender.Money).toBe(initialMoneyDefender + value);
            });
        });
        (0, vitest_1.describe)("And user is vip", () => {
            (0, vitest_1.it)("Then should give alms with vip value", async () => {
                user.VipEternal = true;
                const alms = new Alms_1.Alms(user, defender);
                value *= 1.5;
                const initialMoneyUser = user.Money;
                const initialMoneyDefender = defender.Money;
                await alms.GiveAlms();
                (0, vitest_1.expect)(user.Money).toBe(initialMoneyUser - value);
                (0, vitest_1.expect)(defender.Money).toBe(initialMoneyDefender + value);
            });
        });
    });
});
//# sourceMappingURL=Alms.test.js.map