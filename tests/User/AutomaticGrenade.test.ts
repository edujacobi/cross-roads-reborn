/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { User } from "#core/models/User";
import { Language } from "#core/models/Language";
import { ItemId } from "#core/types/Ids";
import { ItemList, type UserItem } from "#core/types/Items";
import { runUserBeatUp } from "#bot/utils/beatupHelper";
import { runUserRobbery } from "#bot/utils/robberyHelper";

// Mock timers/promises to bypass the long waits in runUserBeatUp/runUserRobbery
vi.mock("timers/promises", () => ({
	setTimeout: vi.fn(() => Promise.resolve()),
}));

// Mock user repository
const { mockUpdate } = vi.hoisted(() => ({
	mockUpdate: vi.fn(),
}));

const {
	mockStartBeatUp,
	mockStartUserRobbery,
	mockWaitForCompletion,
	mockSubscribe,
	mockGetVisibleSession,
} = vi.hoisted(() => ({
	mockStartBeatUp: vi.fn(),
	mockStartUserRobbery: vi.fn(),
	mockWaitForCompletion: vi.fn(),
	mockSubscribe: vi.fn(),
	mockGetVisibleSession: vi.fn(),
}));

vi.mock("#core/models/MultiplayerSession", () => ({
	MultiplayerSession: {
		StartBeatUp: mockStartBeatUp,
		StartUserRobbery: mockStartUserRobbery,
		WaitForCompletion: mockWaitForCompletion,
		Subscribe: mockSubscribe,
		GetVisibleSession: mockGetVisibleSession,
		DecodeResult: (serialized: string) => JSON.parse(serialized, (key, value) =>
			typeof value === "string" && key.endsWith("Time") ? new Date(value) : value),
	},
}));

vi.mock("#core/database/Users", () => ({
	Users: {
		update: mockUpdate,
		findOne: vi.fn(),
		findByPk: vi.fn(() => Promise.resolve({ nickname: "TargetUser" })),
	},
}));

// Mock discord interactions helper
const { mockReplyWithContainer, mockDeferUpdate } = vi.hoisted(() => ({
	mockReplyWithContainer: vi.fn(),
	mockDeferUpdate: vi.fn(),
}));

vi.mock("#bot/utils/discordInteractions", () => ({
	replyWithContainer: mockReplyWithContainer,
	deferUpdate: mockDeferUpdate,
}));

// Mock logger
vi.mock("#shared/log", () => ({
	Log: {
		Info: vi.fn(),
		Success: vi.fn(),
		Warning: vi.fn(),
	},
}));

// Mock client fetching
vi.mock("#bot/client", () => ({
	getClient: () => ({
		users: {
			fetch: vi.fn().mockResolvedValue({
				send: vi.fn().mockResolvedValue({
					createMessageComponentCollector: vi.fn().mockReturnValue({
						on: vi.fn(),
						stop: vi.fn(),
					}),
					edit: vi.fn().mockResolvedValue({}),
				}),
			}),
		},
	}),
}));

describe("Automatic Grenade Feature", () => {
	let attacker: User;
	let defender: User;

	beforeEach(() => {
		vi.clearAllMocks();

		attacker = new User("111", Language.English);
		attacker.Nickname = "Attacker";
		attacker.Money = 10_000;
		attacker.Items = [
			{ ...ItemList[ItemId.Grenade], Quantity: 1 } as UserItem,
		];

		defender = new User("222", Language.English);
		defender.Nickname = "Defender";
		defender.Money = 5_000;

		vi.spyOn(attacker, "GetAttributes").mockResolvedValue(undefined as any);
		vi.spyOn(defender, "GetAttributes").mockResolvedValue(undefined as any);
		vi.spyOn(attacker, "GetItemSkin").mockReturnValue("💣");
		vi.spyOn(attacker, "GetInfo").mockResolvedValue(attacker);
		vi.spyOn(defender, "GetInfo").mockResolvedValue(defender);
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
		mockWaitForCompletion.mockImplementation(async (id: string) => ({
			phase: "completed",
			result: id === "beatup-session"
				? JSON.stringify({ success: true, attackerBeatUpTime: new Date(), defenderHospitalTime: new Date() })
				: JSON.stringify({ success: true, attackerWantedTime: new Date(), moneyRobbed: 100, willBeBeatenUp: false }),
		}));
		mockSubscribe.mockReturnValue(vi.fn());
		mockGetVisibleSession.mockReturnValue(null);
	});

	describe("User Model Toggle Settings", () => {
		it("should have automaticGrenade default to false", () => {
			expect(attacker.AutomaticGrenade).toBe(false);
		});

		it("should successfully update automaticGrenade using SetAutomaticGrenade", async () => {
			await attacker.SetAutomaticGrenade(true);
			expect(attacker.AutomaticGrenade).toBe(true);
			expect(mockUpdate).toHaveBeenCalledWith({ automaticGrenade: true }, { where: { id: "111" } });
		});
	});

	describe("Integration in BeatUp", () => {
		it("should bypass the confirmation container and set usedGrenade to true when automaticGrenade is enabled", async () => {
			attacker.AutomaticGrenade = true;

			const mockInteraction: any = {
				reply: vi.fn(),
				editReply: vi.fn(),
			};

			await runUserBeatUp(mockInteraction, attacker, defender);

			expect(mockStartBeatUp).toHaveBeenCalledWith(attacker, defender, true, "discord");
			// It should not reply with the grenade confirmation container
			const hasGrenadeContainerSent = mockReplyWithContainer.mock.calls.some((call: any[]) => {
				const builder = call[1];
				// eslint-disable-next-line max-nested-callbacks
				return builder && builder.components?.some((c: any) => c.customId === "use_grenade");
			});
			expect(hasGrenadeContainerSent).toBe(false);
		});

		it("should display the confirmation container when automaticGrenade is disabled", async () => {
			attacker.AutomaticGrenade = false;

			const mockInteraction: any = {
				reply: vi.fn(),
				editReply: vi.fn(),
			};

			// Return null message to end execution early in helper
			mockReplyWithContainer.mockResolvedValue(null);

			await runUserBeatUp(mockInteraction, attacker, defender);

			// It should show confirmation container
			expect(mockReplyWithContainer).toHaveBeenCalled();
		});
	});

	describe("Integration in Robbery", () => {
		it("should bypass the confirmation container and set usedGrenade to true when automaticGrenade is enabled", async () => {
			attacker.AutomaticGrenade = true;

			const mockInteraction: any = {
				reply: vi.fn(),
				editReply: vi.fn(),
			};

			await runUserRobbery(mockInteraction, attacker, defender);

			expect(mockStartUserRobbery).toHaveBeenCalledWith(attacker, defender, true, "discord");
			// It should not reply with the grenade confirmation container
			const hasGrenadeContainerSent = mockReplyWithContainer.mock.calls.some((call: any[]) => {
				const builder = call[1];
				// eslint-disable-next-line max-nested-callbacks
				return builder && builder.components?.some((c: any) => c.customId === "use_grenade");
			});
			expect(hasGrenadeContainerSent).toBe(false);
		});

		it("should display the confirmation container when automaticGrenade is disabled", async () => {
			attacker.AutomaticGrenade = false;

			const mockInteraction: any = {
				reply: vi.fn(),
				editReply: vi.fn(),
			};

			// Return null message to end execution early in helper
			mockReplyWithContainer.mockResolvedValue(null);

			await runUserRobbery(mockInteraction, attacker, defender);

			// It should show confirmation container
			expect(mockReplyWithContainer).toHaveBeenCalled();
		});
	});
});
