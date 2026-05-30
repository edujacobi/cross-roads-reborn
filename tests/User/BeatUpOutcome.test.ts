/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { User } from "#core/models/User";
import { Language } from "#core/models/Language";
import { BeatUp } from "#core/models/BeatUp";
import { ClassId } from "#core/types/Classes";
import { Event } from "#core/models/Event";
import { Notification } from "#core/models/Notification";
import { RobHistories } from "#core/database/RobHistories";

// Mock Database & External APIs
vi.mock("#core/database/Users", () => ({
	Users: {
		update: vi.fn(),
		findOne: vi.fn(),
		findByPk: vi.fn(() => Promise.resolve({ class: ClassId.Entrepreneur, nickname: "OtherUser" })),
	},
}));

vi.mock("#bot/utils/discordInteractions", () => ({
	replyWithContainer: vi.fn(() => Promise.resolve({ edit: vi.fn() })),
	sendComplexPrivateMessage: vi.fn(() => Promise.resolve({ edit: vi.fn() })),
	deferUpdate: vi.fn(() => Promise.resolve()),
}));

describe("BeatUp Outcome Logic", () => {
	let attacker: User;
	let defender: User;
	let beatUp: BeatUp;

	beforeEach(() => {
		vi.clearAllMocks();

		// Spy on static methods
		vi.spyOn(Event, "GetActiveFromType").mockResolvedValue(1);
		vi.spyOn(Event, "GetActiveBonusFromType").mockResolvedValue(0);
		vi.spyOn(Notification, "BeatAgain").mockResolvedValue(undefined as any);
		vi.spyOn(Notification, "Hospital").mockResolvedValue(undefined as any);
		vi.spyOn(RobHistories, "CreateUserBeatUpHistory").mockResolvedValue(undefined as any);

		attacker = new User("111", Language.English);
		attacker.Nickname = "Attacker";
		attacker.Class = ClassId.Entrepreneur;
		attacker.Money = 1_000;
		attacker.Attributes = { Attack: 20, Defense: 5, MoneyAttack: 10, MoneyDefense: 5 };

		defender = new User("222", Language.English);
		defender.Nickname = "Defender";
		defender.Class = ClassId.Entrepreneur;
		defender.Money = 2_000;
		defender.Attributes = { Attack: 10, Defense: 10, MoneyAttack: 5, MoneyDefense: 10 };

		// Spy on GetAttributes BEFORE calling BeatUp constructor
		vi.spyOn(attacker, "GetAttributes").mockResolvedValue(undefined as any);
		vi.spyOn(defender, "GetAttributes").mockResolvedValue(undefined as any);

		beatUp = new BeatUp(attacker, defender);

		// Spy on domain loading to bypass database
		vi.spyOn(attacker, "GetInfo").mockImplementation(async function(this: User) {
			return this;
		});
		vi.spyOn(defender, "GetInfo").mockImplementation(async function(this: User) {
			return this;
		});
	});

	it("should calculate correct beatup outcome when successful", async () => {
		beatUp.Success = true;
		beatUp.TimeInHospital = { Base: 45, Aditional: 5 };

		const mockInteraction = {
			client: {},
			user: { id: "111" },
		} as any;
		const mockPrivateMsg = {
			edit: vi.fn(() => Promise.resolve({})),
		} as any;

		await beatUp.EndBeating(mockInteraction, mockPrivateMsg);

		expect(attacker.BeatUp.SuccessCount).toBe(1);
		expect(defender.BeatUp.BeatedUpCount).toBe(1);
		expect(defender.Hospital.Count).toBe(1);
		expect(defender.Hospital.Time.getTime()).toBeGreaterThan(Date.now());
		expect(attacker.Wanted.Count).toBe(1);
		expect(attacker.Wanted.Time.getTime()).toBeGreaterThan(Date.now());
	});

	it("should hospitalize attacker when unsuccessful", async () => {
		beatUp.Success = false;
		beatUp.TimeInHospital = { Base: 45, Aditional: 5 };

		const mockInteraction = {
			client: {},
			user: { id: "111" },
		} as any;

		await beatUp.EndBeating(mockInteraction, undefined);

		expect(attacker.BeatUp.FailureCount).toBe(1);
		expect(attacker.BeatUp.BeatedUpCount).toBe(1);
		expect(defender.BeatUp.SuccessCount).toBe(1);
		expect(attacker.Hospital.Count).toBe(1);
		expect(attacker.Hospital.Time.getTime()).toBeGreaterThan(Date.now());
	});
});
