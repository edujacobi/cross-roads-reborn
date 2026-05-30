/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { User } from "#core/models/User";
import { Language } from "#core/models/Language";
import { Robbery } from "#core/models/Robbery";
import { ClassId } from "#core/types/Classes";
import { Event } from "#core/models/Event";
import { Notification } from "#core/models/Notification";
import { RobHistories } from "#core/database/RobHistories";

// Mock Database & External APIs
vi.mock("#core/database/Users", () => ({
	Users: {
		update: vi.fn(),
		findOne: vi.fn(),
		findByPk: vi.fn(() => Promise.resolve({ class: ClassId.Thief, nickname: "OtherUser" })),
	},
}));

vi.mock("#bot/utils/discordInteractions", () => ({
	replyWithContainer: vi.fn(() => Promise.resolve({ edit: vi.fn() })),
	sendComplexPrivateMessage: vi.fn(() => Promise.resolve({ edit: vi.fn() })),
	deferUpdate: vi.fn(() => Promise.resolve()),
}));

describe("Robbery Outcome Logic", () => {
	let attacker: User;
	let defender: User;
	let robbery: Robbery;

	beforeEach(() => {
		vi.clearAllMocks();

		// Spy on Event, Notification, and histories static methods to bypass database
		vi.spyOn(Event, "GetActiveFromType").mockResolvedValue(1);
		vi.spyOn(Event, "GetActiveBonusFromType").mockResolvedValue(0);
		vi.spyOn(Notification, "RobAgain").mockResolvedValue(undefined as any);
		vi.spyOn(Notification, "Free").mockResolvedValue(undefined as any);
		vi.spyOn(Notification, "Hospital").mockResolvedValue(undefined as any);
		vi.spyOn(RobHistories, "CreateUserRobberyHistory").mockResolvedValue(undefined as any);
		vi.spyOn(RobHistories, "CreateLocationHistory").mockResolvedValue(undefined as any);

		attacker = new User("111", Language.English);
		attacker.Nickname = "Attacker";
		attacker.Class = ClassId.Thief; // Thief has the 1.15 positive modifier
		attacker.Money = 1_000;
		attacker.Attributes = { Attack: 10, Defense: 5, MoneyAttack: 20, MoneyDefense: 0 };

		defender = new User("222", Language.English);
		defender.Nickname = "Defender";
		defender.Class = ClassId.Entrepreneur;
		defender.Money = 2_000;
		defender.Attributes = { Attack: 5, Defense: 10, MoneyAttack: 5, MoneyDefense: 0 }; // MoneyDefense: 0 prevents reduction

		robbery = new Robbery(attacker, defender);
		robbery.BeatUpChance = 0; // Deterministic behavior

		// Spy on GetInfo to prevent DB loading
		vi.spyOn(attacker, "GetInfo").mockImplementation(async function(this: User) {
			return this;
		});
		vi.spyOn(defender, "GetInfo").mockImplementation(async function(this: User) {
			return this;
		});

		// Spy on GetAttributes to prevent resetting attributes to 0
		vi.spyOn(attacker, "GetAttributes").mockResolvedValue(undefined as any);
		vi.spyOn(defender, "GetAttributes").mockResolvedValue(undefined as any);
	});

	it("should calculate correct robbery outcome when successful", async () => {
		robbery.Success = true;

		const mockInteraction = {
			client: {},
			user: { id: "111" },
		} as any;
		const mockPrivateMsg = {
			edit: vi.fn(() => Promise.resolve({})),
		} as any;

		await robbery.EndRobbery(mockInteraction, mockPrivateMsg);

		// 20% of defender's 2000 money = 400.
		// Class modifier for Thief is 1.15
		// 400 * 1.15 = 460, but due to floating-point precision (400 * 1.15 = 459.99999999999994)
		// Math.floor truncates this to 459.
		expect(robbery.MoneyRobbed).toBe(459);
		expect(attacker.Money).toBe(1459);
		expect(defender.Money).toBe(1541);
		expect(attacker.Robbery.SuccessCount).toBe(1);
		expect(defender.Robbery.BeingRobbedCount).toBe(1);
	});

	it("should apply prison time to attacker when unsuccessful", async () => {
		robbery.Success = false;
		robbery.AttackerTimeInPrison = 45; // minutes

		const mockInteraction = {
			client: {},
			user: { id: "111" },
		} as any;

		await robbery.EndRobbery(mockInteraction, undefined);

		expect(attacker.Prison.Count).toBe(1);
		expect(attacker.Robbery.FailureCount).toBe(1);
		expect(attacker.Prison.Time.getTime()).toBeGreaterThan(Date.now());
	});
});
