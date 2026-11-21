"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const Language_1 = require("#core/models/Language");
const { mockRandomInt, mockReplyWithContainer, mockStartUserGame, mockFinishWin, mockFinishLoss, } = vitest_1.vi.hoisted(() => ({
    mockRandomInt: vitest_1.vi.fn(),
    mockReplyWithContainer: vitest_1.vi.fn(),
    mockStartUserGame: vitest_1.vi.fn(),
    mockFinishWin: vitest_1.vi.fn(),
    mockFinishLoss: vitest_1.vi.fn(),
}));
vitest_1.vi.mock("node:crypto", async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, randomInt: mockRandomInt };
});
vitest_1.vi.mock("#bot/ui/builders/CustomContainerBuilder", () => ({
    CustomContainerBuilder: class {
        setUser() {
            return this;
        }
        setAccentColor() {
            return this;
        }
        addTexts() {
            return this;
        }
        addLargeSeparator() {
            return this;
        }
        addFooter() {
            return this;
        }
        addButtonRow() {
            return this;
        }
    },
}));
vitest_1.vi.mock("#bot/utils/collectors", () => ({
    createButtonCollector: () => undefined,
    disableButtons: vitest_1.vi.fn(),
}));
vitest_1.vi.mock("#bot/utils/colors", () => ({ CrColors: { Casino: 0 } }));
vitest_1.vi.mock("#bot/utils/discordInteractions", () => ({
    deferUpdate: vitest_1.vi.fn(),
    replyWithContainer: mockReplyWithContainer,
}));
vitest_1.vi.mock("#bot/utils/emotes", () => ({ EmoteString: {} }));
vitest_1.vi.mock("#bot/utils/ui", () => ({ formatMoney: (amount) => String(amount) }));
vitest_1.vi.mock("#core/models/Casino", () => ({
    Casino: {
        StartUserGame: mockStartUserGame,
        FinishUserGameWithWin: mockFinishWin,
        FinishUserGameWithLoss: mockFinishLoss,
        CanUserPlayGame: vitest_1.vi.fn().mockResolvedValue({ canPlay: true, message: "" }),
    },
}));
vitest_1.vi.mock("#core/types/Classes", () => ({ getCasinoClassModifier: () => 1 }));
vitest_1.vi.mock("node:timers/promises", () => ({ setTimeout: vitest_1.vi.fn().mockResolvedValue(undefined) }));
(0, vitest_1.afterEach)(() => {
    vitest_1.vi.restoreAllMocks();
});
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
});
(0, vitest_1.describe)("Discord coin flip", () => {
    vitest_1.it.each([
        { draw: 0, expectedOutcome: "win" },
        { draw: 1, expectedOutcome: "loss" },
    ])("uses a cryptographic draw for a $expectedOutcome", async ({ draw, expectedOutcome }) => {
        const user = {
            Id: `bet-${expectedOutcome}`,
            Money: 10_000,
            Class: 0,
            Casino: { IsInGame: false },
            Update: vitest_1.vi.fn().mockResolvedValue(true),
        };
        mockRandomInt.mockReturnValueOnce(2_000).mockReturnValueOnce(draw);
        mockStartUserGame.mockImplementation(async () => {
            user.Casino.IsInGame = true;
            return true;
        });
        mockFinishWin.mockImplementation(async () => {
            user.Casino.IsInGame = false;
        });
        mockFinishLoss.mockImplementation(async () => {
            user.Casino.IsInGame = false;
        });
        mockReplyWithContainer.mockResolvedValue({});
        const interaction = {
            options: {
                getInteger: () => 0,
                getNumber: () => 1_000,
            },
        };
        const imported = await import("#bot/commands/utility/bet");
        const command = imported.default ?? imported;
        await command.execute(interaction, user, Language_1.Language.English);
        (0, vitest_1.expect)(mockRandomInt).toHaveBeenNthCalledWith(1, 2_000, 3_001);
        (0, vitest_1.expect)(mockRandomInt).toHaveBeenNthCalledWith(2, 2);
        (0, vitest_1.expect)(mockFinishWin).toHaveBeenCalledTimes(expectedOutcome === "win" ? 1 : 0);
        (0, vitest_1.expect)(mockFinishLoss).toHaveBeenCalledTimes(expectedOutcome === "loss" ? 1 : 0);
    });
});
//# sourceMappingURL=BetCommand.test.js.map