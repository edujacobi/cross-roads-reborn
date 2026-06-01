/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { User } from "#core/models/User";
import { Language } from "#core/models/Language";
import { BeatUp } from "#core/models/BeatUp";
import { ClassId } from "#core/types/Classes";
import { Event } from "#core/models/Event";
import { Notification } from "#core/models/Notification";
import { RobHistoryRepository } from "#core/repositories/RobHistoryRepository";

// Mock Database & External APIs
vi.mock("#core/database/Users", () => ({
	Users: {
		update: vi.fn(),
		findOne: vi.fn(),
		findByPk: vi.fn(() => Promise.resolve({ class: ClassId.Entrepreneur, nickname: "OtherUser" })),
	},
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
		vi.spyOn(RobHistoryRepository, "CreateUserBeatUpHistory").mockResolvedValue(undefined as any);

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
		vi.spyOn(attacker, "GetItemSkin").mockReturnValue("🔪");

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
		// Mock Math.random to return 0.9 on first call (Attacker: 0.9 * 20 = 18) and 0.1 on second call (Defender: 0.1 * 10 = 1) -> Success = true
		const randomSpy = vi.spyOn(Math, "random")
			.mockReturnValueOnce(0.9)
			.mockReturnValueOnce(0.1);

		await beatUp.LockStates(false);
		const outcome = await beatUp.Resolve("nothing");

		expect(outcome.success).toBe(true);
		expect(attacker.BeatUp.SuccessCount).toBe(1);
		expect(defender.BeatUp.BeatedUpCount).toBe(1);
		expect(defender.Hospital.Count).toBe(1);
		expect(defender.Hospital.Time.getTime()).toBeGreaterThan(Date.now());
		expect(attacker.Wanted.Count).toBe(1);
		expect(attacker.Wanted.Time.getTime()).toBeGreaterThan(Date.now());

		randomSpy.mockRestore();
	});

	it("should hospitalize attacker when unsuccessful", async () => {
		// Mock Math.random to return 0.1 on first call (Attacker: 0.1 * 20 = 2) and 0.9 on second call (Defender: 0.9 * 10 = 9) -> Success = false
		const randomSpy = vi.spyOn(Math, "random")
			.mockReturnValueOnce(0.1)
			.mockReturnValueOnce(0.9);

		await beatUp.LockStates(false);
		const outcome = await beatUp.Resolve("nothing");

		expect(outcome.success).toBe(false);
		expect(attacker.BeatUp.FailureCount).toBe(1);
		expect(attacker.BeatUp.BeatedUpCount).toBe(1);
		expect(defender.BeatUp.SuccessCount).toBe(1);
		expect(attacker.Hospital.Count).toBe(1);
		expect(attacker.Hospital.Time.getTime()).toBeGreaterThan(Date.now());

		randomSpy.mockRestore();
	});

	it("should increase defender attack and hospital time when defender fights", async () => {
		// Mock Math.random for success = false
		const randomSpy = vi.spyOn(Math, "random")
			.mockReturnValueOnce(0.1) // Attacker chance low
			.mockReturnValueOnce(0.9); // Defender chance high

		await beatUp.LockStates(false);
		
		const originalAttack = defender.Attributes.Attack;
		const originalBaseTime = beatUp.TimeInHospital.Base;
		const additionalTime = beatUp.TimeInHospital.Aditional;

		const outcome = await beatUp.Resolve("fight");

		expect(defender.Attributes.Attack).toBe(originalAttack + 5);
		expect(beatUp.TimeInHospital.Base).toBe(originalBaseTime + additionalTime);
		expect(outcome.success).toBe(false);

		randomSpy.mockRestore();
	});

	it("should decrease defender attack and hospital time when defender runs", async () => {
		// Mock Math.random for success = false
		const randomSpy = vi.spyOn(Math, "random")
			.mockReturnValueOnce(0.1)
			.mockReturnValueOnce(0.9);

		await beatUp.LockStates(false);
		
		const originalAttack = defender.Attributes.Attack;
		const originalBaseTime = beatUp.TimeInHospital.Base;
		const additionalTime = beatUp.TimeInHospital.Aditional;

		const outcome = await beatUp.Resolve("run");

		expect(defender.Attributes.Attack).toBe(originalAttack - 5);
		expect(beatUp.TimeInHospital.Base).toBe(originalBaseTime - additionalTime);
		expect(outcome.success).toBe(false);

		randomSpy.mockRestore();
	});
});
