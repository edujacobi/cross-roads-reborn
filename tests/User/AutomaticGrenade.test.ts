/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { User } from "#core/models/User";
import { Language } from "#core/models/Language";
import { ItemId } from "#core/types/Ids";
import { ItemList, type UserItem } from "#core/types/Items";
import { runUserBeatUp } from "#bot/utils/beatupHelper";
import { runUserRobbery } from "#bot/utils/robberyHelper";
import { BeatUp } from "#core/models/BeatUp";
import { UserRobberyStrategy } from "#core/models/strategies/robbery/UserRobberyStrategy";

// Mock timers/promises to bypass the long waits in runUserBeatUp/runUserRobbery
vi.mock("timers/promises", () => ({
	setTimeout: vi.fn(() => Promise.resolve()),
}));

// Mock user repository
const { mockUpdate } = vi.hoisted(() => ({
	mockUpdate: vi.fn(),
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
			const beatUp = new BeatUp(attacker, defender);
			const mockLockStates = vi.spyOn(beatUp, "LockStates").mockResolvedValue({
				cannotRun: false,
				usedGunSkin: "🔫",
				usedGunName: "Pistol",
				timeInHospitalBase: 40,
				timeInHospitalAditional: 10,
			});
			vi.spyOn(beatUp, "CanBeatUser").mockResolvedValue({ canBeat: true } as any);
			vi.spyOn(beatUp, "Resolve").mockResolvedValue({ success: true, attackerBeatUpTime: new Date(), defenderHospitalTime: new Date() } as any);
			vi.spyOn(beatUp, "ReleaseLocks").mockResolvedValue(undefined);

			const mockInteraction: any = {
				reply: vi.fn(),
				editReply: vi.fn(),
			};

			await runUserBeatUp(mockInteraction, beatUp, attacker, defender);

			// LockStates should be called with true (usedGrenade = true)
			expect(mockLockStates).toHaveBeenCalledWith(true);
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
			const beatUp = new BeatUp(attacker, defender);
			vi.spyOn(beatUp, "LockStates").mockResolvedValue({} as any);
			vi.spyOn(beatUp, "CanBeatUser").mockResolvedValue({ canBeat: true } as any);

			const mockInteraction: any = {
				reply: vi.fn(),
				editReply: vi.fn(),
			};

			// Return null message to end execution early in helper
			mockReplyWithContainer.mockResolvedValue(null);

			await runUserBeatUp(mockInteraction, beatUp, attacker, defender);

			// It should show confirmation container
			expect(mockReplyWithContainer).toHaveBeenCalled();
		});
	});

	describe("Integration in Robbery", () => {
		it("should bypass the confirmation container and set usedGrenade to true when automaticGrenade is enabled", async () => {
			attacker.AutomaticGrenade = true;
			const robbery = new UserRobberyStrategy(attacker, defender);
			const mockLockStates = vi.spyOn(robbery, "LockStates").mockResolvedValue({
				cannotReact: false,
				cannotCallPolice: false,
				usedGunSkin: "🔫",
				usedGunName: "Pistol",
				attackerTimeInPrison: 30,
				attackerAditionalTimeCallPolice: 5,
				defenderTimeInHospital: 20,
			} as any);
			vi.spyOn(robbery, "CanRob").mockResolvedValue({ canRob: true } as any);
			vi.spyOn(robbery, "Resolve").mockResolvedValue({ success: true, attackerWantedTime: new Date(), moneyRobbed: 100 } as any);
			vi.spyOn(robbery, "ReleaseLocks").mockResolvedValue(undefined);

			const mockInteraction: any = {
				reply: vi.fn(),
				editReply: vi.fn(),
			};

			await runUserRobbery(mockInteraction, robbery, attacker, defender);

			// LockStates should be called with true (usedGrenade = true)
			expect(mockLockStates).toHaveBeenCalledWith(true);
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
			const robbery = new UserRobberyStrategy(attacker, defender);
			vi.spyOn(robbery, "LockStates").mockResolvedValue({} as any);
			vi.spyOn(robbery, "CanRob").mockResolvedValue({ canRob: true } as any);

			const mockInteraction: any = {
				reply: vi.fn(),
				editReply: vi.fn(),
			};

			// Return null message to end execution early in helper
			mockReplyWithContainer.mockResolvedValue(null);

			await runUserRobbery(mockInteraction, robbery, attacker, defender);

			// It should show confirmation container
			expect(mockReplyWithContainer).toHaveBeenCalled();
		});
	});
});
