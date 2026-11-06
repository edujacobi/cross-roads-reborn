"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const vitest_1 = require("vitest");
const User_1 = require("#core/models/User");
const Language_1 = require("#core/models/Language");
const beatupHelper_1 = require("#bot/utils/beatupHelper");
const robberyHelper_1 = require("#bot/utils/robberyHelper");
const { mockWait, mockReplyWithContainer, mockDeferUpdate, mockFetch } = vitest_1.vi.hoisted(() => ({
    mockWait: vitest_1.vi.fn(() => Promise.resolve()),
    mockReplyWithContainer: vitest_1.vi.fn(),
    mockDeferUpdate: vitest_1.vi.fn(),
    mockFetch: vitest_1.vi.fn(),
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
// Mock timers/promises to bypass the long waits in runUserBeatUp/runUserRobbery
vitest_1.vi.mock("timers/promises", () => ({
    setTimeout: () => mockWait(),
}));
// Mock discord interactions helper
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
    logger: {
        warn: vitest_1.vi.fn(),
        info: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
        debug: vitest_1.vi.fn(),
    },
}));
// Mock client fetching to reject/throw an error simulating missing mutual server / closed DMs
vitest_1.vi.mock("#bot/client", () => ({
    getClient: () => ({
        users: {
            fetch: mockFetch,
        },
    }),
}));
// Mock user repository
vitest_1.vi.mock("#core/database/Users", () => ({
    Users: {
        update: vitest_1.vi.fn(),
        findOne: vitest_1.vi.fn(),
        findByPk: vitest_1.vi.fn(() => Promise.resolve({ nickname: "TargetUser" })),
    },
}));
(0, vitest_1.describe)("Target Discord User Fetch/Send Failure Handling", () => {
    let attacker;
    let defender;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        attacker = new User_1.User("111", Language_1.Language.English);
        attacker.Nickname = "Attacker";
        attacker.Money = 10_000;
        attacker.Items = [];
        defender = new User_1.User("222", Language_1.Language.English);
        defender.Nickname = "Defender";
        defender.Money = 5_000;
        vitest_1.vi.spyOn(attacker, "GetAttributes").mockResolvedValue(undefined);
        vitest_1.vi.spyOn(defender, "GetAttributes").mockResolvedValue(undefined);
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
    (0, vitest_1.it)("should complete beat up successfully when client.users.fetch throws an error", async () => {
        mockFetch.mockRejectedValue(new Error("DiscordAPIError[50007]: Cannot send messages to this user"));
        const mockInteraction = {
            reply: vitest_1.vi.fn(),
            editReply: vitest_1.vi.fn(),
        };
        await (0, vitest_1.expect)((0, beatupHelper_1.runUserBeatUp)(mockInteraction, attacker, defender)).resolves.not.toThrow();
        (0, vitest_1.expect)(mockFetch).toHaveBeenCalledWith(defender.Id);
        (0, vitest_1.expect)(mockWaitForCompletion).toHaveBeenCalledWith("beatup-session");
    });
    (0, vitest_1.it)("should complete robbery successfully when client.users.fetch throws an error", async () => {
        mockFetch.mockRejectedValue(new Error("DiscordAPIError[50007]: Cannot send messages to this user"));
        const mockInteraction = {
            reply: vitest_1.vi.fn(),
            editReply: vitest_1.vi.fn(),
        };
        await (0, vitest_1.expect)((0, robberyHelper_1.runUserRobbery)(mockInteraction, attacker, defender)).resolves.not.toThrow();
        (0, vitest_1.expect)(mockFetch).toHaveBeenCalledWith(defender.Id);
        (0, vitest_1.expect)(mockWaitForCompletion).toHaveBeenCalledWith("robbery-session");
    });
});
//# sourceMappingURL=TargetFetchFailure.test.js.map