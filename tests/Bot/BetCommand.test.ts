import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "#core/models/User";
import { Language } from "#core/models/Language";

const {
	mockRandomInt,
	mockReplyWithContainer,
	mockStartUserGame,
	mockFinishWin,
	mockFinishLoss,
} = vi.hoisted(() => ({
	mockRandomInt: vi.fn(),
	mockReplyWithContainer: vi.fn(),
	mockStartUserGame: vi.fn(),
	mockFinishWin: vi.fn(),
	mockFinishLoss: vi.fn(),
}));

vi.mock("node:crypto", async importOriginal => {
	const actual = await importOriginal<typeof import("node:crypto")>();
	return { ...actual, randomInt: mockRandomInt };
});

vi.mock("#bot/ui/builders/CustomContainerBuilder", () => ({
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
vi.mock("#bot/utils/collectors", () => ({
	createButtonCollector: () => undefined,
	disableButtons: vi.fn(),
}));
vi.mock("#bot/utils/colors", () => ({ CrColors: { Casino: 0 } }));
vi.mock("#bot/utils/discordInteractions", () => ({
	deferUpdate: vi.fn(),
	replyWithContainer: mockReplyWithContainer,
}));
vi.mock("#bot/utils/emotes", () => ({ EmoteString: {} }));
vi.mock("#bot/utils/ui", () => ({ formatMoney: (amount: number) => String(amount) }));
vi.mock("#core/models/Casino", () => ({
	Casino: {
		StartUserGame: mockStartUserGame,
		FinishUserGameWithWin: mockFinishWin,
		FinishUserGameWithLoss: mockFinishLoss,
		CanUserPlayGame: vi.fn().mockResolvedValue({ canPlay: true, message: "" }),
	},
}));
vi.mock("#core/types/Classes", () => ({ getCasinoClassModifier: () => 1 }));
vi.mock("node:timers/promises", () => ({ setTimeout: vi.fn().mockResolvedValue(undefined) }));

afterEach(() => {
	vi.restoreAllMocks();
});

beforeEach(() => {
	vi.clearAllMocks();
});

describe("Discord coin flip", () => {
	it.each([
		{ draw: 0, expectedOutcome: "win" },
		{ draw: 1, expectedOutcome: "loss" },
	])("uses a cryptographic draw for a $expectedOutcome", async ({ draw, expectedOutcome }) => {
		const user = {
			Id: `bet-${expectedOutcome}`,
			Money: 10_000,
			Class: 0,
			Casino: { IsInGame: false },
			Update: vi.fn().mockResolvedValue(true),
		} as unknown as User;
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
		const imported = await import("#bot/commands/utility/bet") as unknown as {
			default?: { execute: (interaction: never, user: User, language: Language) => Promise<void> };
			execute?: (interaction: never, user: User, language: Language) => Promise<void>;
		};
		const command = imported.default ?? imported as Required<typeof imported>;
		await command.execute(interaction as never, user, Language.English);

		expect(mockRandomInt).toHaveBeenNthCalledWith(1, 2_000, 3_001);
		expect(mockRandomInt).toHaveBeenNthCalledWith(2, 2);
		expect(mockFinishWin).toHaveBeenCalledTimes(expectedOutcome === "win" ? 1 : 0);
		expect(mockFinishLoss).toHaveBeenCalledTimes(expectedOutcome === "loss" ? 1 : 0);
	});
});
