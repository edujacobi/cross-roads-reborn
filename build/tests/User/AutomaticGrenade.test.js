"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const vitest_1 = require("vitest");
const User_1 = require("#core/models/User");
const Language_1 = require("#core/models/Language");
const Ids_1 = require("#core/types/Ids");
const Items_1 = require("#core/types/Items");
const beatupHelper_1 = require("#bot/utils/beatupHelper");
const robberyHelper_1 = require("#bot/utils/robberyHelper");
// Mock timers/promises to bypass the long waits in runUserBeatUp/runUserRobbery
vitest_1.vi.mock("timers/promises", () => ({
    setTimeout: vitest_1.vi.fn(() => Promise.resolve()),
}));
// Mock user repository
const { mockUpdate } = vitest_1.vi.hoisted(() => ({
    mockUpdate: vitest_1.vi.fn(),
}));
const { mockStartBeatUp, mockStartUserRobbery, mockWaitForCompletion, mockSubscribe, mockGetVisibleSession, } = vitest_1.vi.hoisted(() => ({
    mockStartBeatUp: vitest_1.vi.fn(),
    mockStartUserRobbery: vitest_1.vi.fn(),
    mockWaitForCompletion: vitest_1.vi.fn(),
    mockSubscribe: vitest_1.vi.fn(),
    mockGetVisibleSession: vitest_1.vi.fn(),
}));
vitest_1.vi.mock("#core/models/MultiplayerSession", () => ({
    MultiplayerSession: {
        StartBeatUp: mockStartBeatUp,
        StartUserRobbery: mockStartUserRobbery,
        WaitForCompletion: mockWaitForCompletion,
        Subscribe: mockSubscribe,
        GetVisibleSession: mockGetVisibleSession,
        DecodeResult: (serialized) => JSON.parse(serialized, (key, value) => typeof value === "string" && key.endsWith("Time") ? new Date(value) : value),
    },
}));
vitest_1.vi.mock("#core/database/Users", () => ({
    Users: {
        update: mockUpdate,
        findOne: vitest_1.vi.fn(),
        findByPk: vitest_1.vi.fn(() => Promise.resolve({ nickname: "TargetUser" })),
    },
}));
// Mock discord interactions helper
const { mockReplyWithContainer, mockDeferUpdate } = vitest_1.vi.hoisted(() => ({
    mockReplyWithContainer: vitest_1.vi.fn(),
    mockDeferUpdate: vitest_1.vi.fn(),
}));
vitest_1.vi.mock("#bot/utils/discordInteractions", () => ({
    replyWithContainer: mockReplyWithContainer,
    deferUpdate: mockDeferUpdate,
}));
// Mock logger
vitest_1.vi.mock("#shared/log", () => ({
    Log: {
        Info: vitest_1.vi.fn(),
        Success: vitest_1.vi.fn(),
        Warning: vitest_1.vi.fn(),
    },
}));
// Mock client fetching
vitest_1.vi.mock("#bot/client", () => ({
    getClient: () => ({
        users: {
            fetch: vitest_1.vi.fn().mockResolvedValue({
                send: vitest_1.vi.fn().mockResolvedValue({
                    createMessageComponentCollector: vitest_1.vi.fn().mockReturnValue({
                        on: vitest_1.vi.fn(),
                        stop: vitest_1.vi.fn(),
                    }),
                    edit: vitest_1.vi.fn().mockResolvedValue({}),
                }),
            }),
        },
    }),
}));
(0, vitest_1.describe)("Automatic Grenade Feature", () => {
    let attacker;
    let defender;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        attacker = new User_1.User("111", Language_1.Language.English);
        attacker.Nickname = "Attacker";
        attacker.Money = 10_000;
        attacker.Items = [
            { ...Items_1.ItemList[Ids_1.ItemId.Grenade], Quantity: 1 },
        ];
        defender = new User_1.User("222", Language_1.Language.English);
        defender.Nickname = "Defender";
        defender.Money = 5_000;
        vitest_1.vi.spyOn(attacker, "GetAttributes").mockResolvedValue(undefined);
        vitest_1.vi.spyOn(defender, "GetAttributes").mockResolvedValue(undefined);
        vitest_1.vi.spyOn(attacker, "GetItemSkin").mockReturnValue("💣");
        vitest_1.vi.spyOn(attacker, "GetInfo").mockResolvedValue(attacker);
        vitest_1.vi.spyOn(defender, "GetInfo").mockResolvedValue(defender);
        mockStartBeatUp.mockResolvedValue({
            success: true,
            session: { id: "beatup-session" },
            initData: {
                cannotRun: false,
                usedGunSkin: "🔫",
                usedGunName: "Pistol",
                timeInHospitalBase: 40,
                timeInHospitalAditional: 10,
            },
        });
        mockStartUserRobbery.mockResolvedValue({
            success: true,
            session: { id: "robbery-session" },
            initData: {
                cannotReact: false,
                cannotCallPolice: false,
                usedGunSkin: "🔫",
                usedGunName: "Pistol",
                attackerTimeInPrison: 30,
                attackerAditionalTimeCallPolice: 5,
                defenderTimeInHospital: 20,
            },
        });
        mockWaitForCompletion.mockImplementation(async (id) => ({
            phase: "completed",
            result: id === "beatup-session"
                ? JSON.stringify({ success: true, attackerBeatUpTime: new Date(), defenderHospitalTime: new Date() })
                : JSON.stringify({ success: true, attackerWantedTime: new Date(), moneyRobbed: 100, willBeBeatenUp: false }),
        }));
        mockSubscribe.mockReturnValue(vitest_1.vi.fn());
        mockGetVisibleSession.mockReturnValue(null);
    });
    (0, vitest_1.describe)("User Model Toggle Settings", () => {
        (0, vitest_1.it)("should have automaticGrenade default to false", () => {
            (0, vitest_1.expect)(attacker.AutomaticGrenade).toBe(false);
        });
        (0, vitest_1.it)("should successfully update automaticGrenade using SetAutomaticGrenade", async () => {
            await attacker.SetAutomaticGrenade(true);
            (0, vitest_1.expect)(attacker.AutomaticGrenade).toBe(true);
            (0, vitest_1.expect)(mockUpdate).toHaveBeenCalledWith({ automaticGrenade: true }, { where: { id: "111" } });
        });
    });
    (0, vitest_1.describe)("Integration in BeatUp", () => {
        (0, vitest_1.it)("should bypass the confirmation container and set usedGrenade to true when automaticGrenade is enabled", async () => {
            attacker.AutomaticGrenade = true;
            const mockInteraction = {
                reply: vitest_1.vi.fn(),
                editReply: vitest_1.vi.fn(),
            };
            await (0, beatupHelper_1.runUserBeatUp)(mockInteraction, attacker, defender);
            (0, vitest_1.expect)(mockStartBeatUp).toHaveBeenCalledWith(attacker, defender, true, "discord");
            // It should not reply with the grenade confirmation container
            const hasGrenadeContainerSent = mockReplyWithContainer.mock.calls.some((call) => {
                const builder = call[1];
                // eslint-disable-next-line max-nested-callbacks
                return builder && builder.components?.some((c) => c.customId === "use_grenade");
            });
            (0, vitest_1.expect)(hasGrenadeContainerSent).toBe(false);
        });
        (0, vitest_1.it)("should display the confirmation container when automaticGrenade is disabled", async () => {
            attacker.AutomaticGrenade = false;
            const mockInteraction = {
                reply: vitest_1.vi.fn(),
                editReply: vitest_1.vi.fn(),
            };
            // Return null message to end execution early in helper
            mockReplyWithContainer.mockResolvedValue(null);
            await (0, beatupHelper_1.runUserBeatUp)(mockInteraction, attacker, defender);
            // It should show confirmation container
            (0, vitest_1.expect)(mockReplyWithContainer).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)("Integration in Robbery", () => {
        (0, vitest_1.it)("should bypass the confirmation container and set usedGrenade to true when automaticGrenade is enabled", async () => {
            attacker.AutomaticGrenade = true;
            const mockInteraction = {
                reply: vitest_1.vi.fn(),
                editReply: vitest_1.vi.fn(),
            };
            await (0, robberyHelper_1.runUserRobbery)(mockInteraction, attacker, defender);
            (0, vitest_1.expect)(mockStartUserRobbery).toHaveBeenCalledWith(attacker, defender, true, "discord");
            // It should not reply with the grenade confirmation container
            const hasGrenadeContainerSent = mockReplyWithContainer.mock.calls.some((call) => {
                const builder = call[1];
                // eslint-disable-next-line max-nested-callbacks
                return builder && builder.components?.some((c) => c.customId === "use_grenade");
            });
            (0, vitest_1.expect)(hasGrenadeContainerSent).toBe(false);
        });
        (0, vitest_1.it)("should display the confirmation container when automaticGrenade is disabled", async () => {
            attacker.AutomaticGrenade = false;
            const mockInteraction = {
                reply: vitest_1.vi.fn(),
                editReply: vitest_1.vi.fn(),
            };
            // Return null message to end execution early in helper
            mockReplyWithContainer.mockResolvedValue(null);
            await (0, robberyHelper_1.runUserRobbery)(mockInteraction, attacker, defender);
            // It should show confirmation container
            (0, vitest_1.expect)(mockReplyWithContainer).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=AutomaticGrenade.test.js.map