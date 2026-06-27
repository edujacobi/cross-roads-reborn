/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { User } from "#core/models/User";
import { Language } from "#core/models/Language";
import { runUserBeatUp } from "#bot/utils/beatupHelper";
import { runUserRobbery } from "#bot/utils/robberyHelper";
import { BeatUp } from "#core/models/BeatUp";
import { UserRobberyStrategy } from "#core/models/strategies/robbery/UserRobberyStrategy";

const { mockWait, mockReplyWithContainer, mockDeferUpdate, mockFetch } = vi.hoisted(() => ({
	mockWait: vi.fn(() => Promise.resolve()),
	mockReplyWithContainer: vi.fn(),
	mockDeferUpdate: vi.fn(),
	mockFetch: vi.fn(),
}));

// Mock timers/promises to bypass the long waits in runUserBeatUp/runUserRobbery
vi.mock("timers/promises", () => ({
	setTimeout: () => mockWait(),
}));

// Mock discord interactions helper
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
	logger: {
		warn: vi.fn(),
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

// Mock client fetching to reject/throw an error simulating missing mutual server / closed DMs
vi.mock("#bot/client", () => ({
	getClient: () => ({
		users: {
			fetch: mockFetch,
		},
	}),
}));

// Mock user repository
vi.mock("#core/database/Users", () => ({
	Users: {
		update: vi.fn(),
		findOne: vi.fn(),
		findByPk: vi.fn(() => Promise.resolve({ nickname: "TargetUser" })),
	},
}));

describe("Target Discord User Fetch/Send Failure Handling", () => {
	let attacker: User;
	let defender: User;

	beforeEach(() => {
		vi.clearAllMocks();

		attacker = new User("111", Language.English);
		attacker.Nickname = "Attacker";
		attacker.Money = 10_000;
		attacker.Items = [];

		defender = new User("222", Language.English);
		defender.Nickname = "Defender";
		defender.Money = 5_000;

		vi.spyOn(attacker, "GetAttributes").mockResolvedValue(undefined as any);
		vi.spyOn(defender, "GetAttributes").mockResolvedValue(undefined as any);
		vi.spyOn(attacker, "GetInfo").mockResolvedValue(attacker);
		vi.spyOn(defender, "GetInfo").mockResolvedValue(defender);
	});

	it("should complete beat up successfully when client.users.fetch throws an error", async () => {
		mockFetch.mockRejectedValue(new Error("DiscordAPIError[50007]: Cannot send messages to this user"));

		const beatUp = new BeatUp(attacker, defender);
		vi.spyOn(beatUp, "CanBeatUser").mockResolvedValue({ canBeat: true } as any);
		vi.spyOn(beatUp, "LockStates").mockResolvedValue({
			cannotRun: false,
			usedGunSkin: "🔫",
			usedGunName: "Pistol",
			timeInHospitalBase: 40,
			timeInHospitalAditional: 10,
		});
		const mockResolve = vi.spyOn(beatUp, "Resolve").mockResolvedValue({
			success: true,
			attackerBeatUpTime: new Date(),
			defenderHospitalTime: new Date(),
		} as any);
		const mockReleaseLocks = vi.spyOn(beatUp, "ReleaseLocks").mockResolvedValue(undefined);

		const mockInteraction: any = {
			reply: vi.fn(),
			editReply: vi.fn(),
		};

		await expect(runUserBeatUp(mockInteraction, beatUp, attacker, defender)).resolves.not.toThrow();

		// Should still execute standard wait time of 45 seconds (timers/promises setTimeout called)
		expect(mockWait).toHaveBeenCalled();

		// Should resolve the beatup outcome with "nothing" since defender DM could not be sent/received
		expect(mockResolve).toHaveBeenCalledWith("nothing");

		// Should release database locks
		expect(mockReleaseLocks).toHaveBeenCalled();
	});

	it("should complete robbery successfully when client.users.fetch throws an error", async () => {
		mockFetch.mockRejectedValue(new Error("DiscordAPIError[50007]: Cannot send messages to this user"));

		const robbery = new UserRobberyStrategy(attacker, defender);
		vi.spyOn(robbery, "CanRob").mockResolvedValue({ canRob: true } as any);
		vi.spyOn(robbery, "LockStates").mockResolvedValue({
			cannotReact: false,
			cannotCallPolice: false,
			usedGunSkin: "🔫",
			usedGunName: "Pistol",
			attackerTimeInPrison: 30,
			attackerAditionalTimeCallPolice: 5,
			defenderTimeInHospital: 20,
		} as any);
		const mockResolve = vi.spyOn(robbery, "Resolve").mockResolvedValue({
			success: true,
			attackerWantedTime: new Date(),
			moneyRobbed: 100,
		} as any);
		const mockReleaseLocks = vi.spyOn(robbery, "ReleaseLocks").mockResolvedValue(undefined);

		const mockInteraction: any = {
			reply: vi.fn(),
			editReply: vi.fn(),
		};

		await expect(runUserRobbery(mockInteraction, robbery, attacker, defender)).resolves.not.toThrow();

		// Should still execute standard wait time of 60 seconds (timers/promises setTimeout called)
		expect(mockWait).toHaveBeenCalled();

		// Should resolve the robbery outcome with "nothing" since defender DM could not be sent/received
		expect(mockResolve).toHaveBeenCalledWith("nothing");

		// Should release database locks
		expect(mockReleaseLocks).toHaveBeenCalled();
	});
});
