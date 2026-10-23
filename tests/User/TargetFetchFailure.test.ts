/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { User } from "#core/models/User";
import { Language } from "#core/models/Language";
import { runUserBeatUp } from "#bot/utils/beatupHelper";
import { runUserRobbery } from "#bot/utils/robberyHelper";

const { mockWait, mockReplyWithContainer, mockDeferUpdate, mockFetch } = vi.hoisted(() => ({
	mockWait: vi.fn(() => Promise.resolve()),
	mockReplyWithContainer: vi.fn(),
	mockDeferUpdate: vi.fn(),
	mockFetch: vi.fn(),
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
		DecodeResult: <T>(serialized: string) => JSON.parse(serialized, (key, value) =>
			typeof value === "string" && key.endsWith("Time") ? new Date(value) : value) as T,
	},
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

	it("should complete beat up successfully when client.users.fetch throws an error", async () => {
		mockFetch.mockRejectedValue(new Error("DiscordAPIError[50007]: Cannot send messages to this user"));

		const mockInteraction: any = {
			reply: vi.fn(),
			editReply: vi.fn(),
		};

		await expect(runUserBeatUp(mockInteraction, attacker, defender)).resolves.not.toThrow();
		expect(mockFetch).toHaveBeenCalledWith(defender.Id);
		expect(mockWaitForCompletion).toHaveBeenCalledWith("beatup-session");
	});

	it("should complete robbery successfully when client.users.fetch throws an error", async () => {
		mockFetch.mockRejectedValue(new Error("DiscordAPIError[50007]: Cannot send messages to this user"));

		const mockInteraction: any = {
			reply: vi.fn(),
			editReply: vi.fn(),
		};

		await expect(runUserRobbery(mockInteraction, attacker, defender)).resolves.not.toThrow();
		expect(mockFetch).toHaveBeenCalledWith(defender.Id);
		expect(mockWaitForCompletion).toHaveBeenCalledWith("robbery-session");
	});
});
