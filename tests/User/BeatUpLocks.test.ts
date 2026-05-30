/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { User } from "#core/models/User";
import { Language } from "#core/models/Language";
import { BeatUp } from "#core/models/BeatUp";
import { ClassId } from "#core/types/Classes";
import { ItemId } from "#core/types/Ids";
import { ItemList, type UserItem } from "#core/types/Items";

// --- Global Mocks ---

const { mockUpdate } = vi.hoisted(() => ({
	mockUpdate: vi.fn(),
}));

vi.mock("#core/database/Users", () => ({
	Users: {
		update: mockUpdate,
		findOne: vi.fn(),
		findByPk: vi.fn(() => Promise.resolve({ class: ClassId.Entrepreneur, nickname: "OtherUser" })),
	},
}));

describe("BeatUp — LockStates & ReleaseLocks", () => {
	let attacker: User;
	let defender: User;
	let beatUp: BeatUp;

	beforeEach(() => {
		vi.clearAllMocks();

		attacker = new User("111", Language.English);
		attacker.Nickname = "Attacker";
		attacker.Class = ClassId.Entrepreneur;
		attacker.Money = 1_000;
		attacker.Items = [ItemList[ItemId.Pistol] as UserItem];

		defender = new User("222", Language.English);
		defender.Nickname = "Defender";
		defender.Class = ClassId.Entrepreneur;
		defender.Money = 2_000;
		defender.Items = [ItemList[ItemId.Pistol] as UserItem];

		// Prevent fire-and-forget GetAttributes in constructor from interfering
		vi.spyOn(attacker, "GetAttributes").mockResolvedValue(undefined as any);
		vi.spyOn(defender, "GetAttributes").mockResolvedValue(undefined as any);
		vi.spyOn(attacker, "GetItemSkin").mockReturnValue("🔪");

		// Manually set attributes so logic is deterministic
		attacker.Attributes = { Attack: 20, Defense: 5, MoneyAttack: 10, MoneyDefense: 5 };
		defender.Attributes = { Attack: 10, Defense: 10, MoneyAttack: 5, MoneyDefense: 5 };

		beatUp = new BeatUp(attacker, defender);
	});

	// -------------------------------------------------------------------------
	describe("LockStates", () => {
		it("should set IsBeatingId on attacker and IsBeingBeatUpById on defender", async () => {
			await beatUp.LockStates(false);

			expect(attacker.BeatUp.IsBeatingId).toBe(defender.Id);
			expect(defender.BeatUp.IsBeingBeatUpById).toBe(attacker.Id);
		});

		it("should write lock fields to the database for both attacker and defender", async () => {
			await beatUp.LockStates(false);

			expect(mockUpdate).toHaveBeenCalledTimes(2);

			const attackerCallArgs = mockUpdate.mock.calls.find(
				(call: any[]) => call[0].beatingUserId === defender.Id,
			);
			expect(attackerCallArgs).toBeDefined();

			const defenderCallArgs = mockUpdate.mock.calls.find(
				(call: any[]) => call[0].beingBeatUpByUserId === attacker.Id,
			);
			expect(defenderCallArgs).toBeDefined();
		});

		it("should calculate TimeInHospital.Base based on defender ATK", async () => {
			await beatUp.LockStates(false);

			const expectedBase = 45 + defender.Attributes.Attack;
			expect(beatUp.TimeInHospital.Base).toBe(expectedBase);
		});

		it("should calculate TimeInHospital.Aditional based on defender ATK", async () => {
			await beatUp.LockStates(false);

			const expectedAdditional = 5 + defender.Attributes.Attack;
			expect(beatUp.TimeInHospital.Aditional).toBe(expectedAdditional);
		});

		it("should return correct BeatUpInitData shape", async () => {
			const data = await beatUp.LockStates(false);

			expect(data).toHaveProperty("cannotRun");
			expect(data).toHaveProperty("usedGunSkin");
			expect(data).toHaveProperty("usedGunName");
			expect(data).toHaveProperty("timeInHospitalBase");
			expect(data).toHaveProperty("timeInHospitalAditional");
		});

		it("should set cannotRun when defender ATK is below 5", async () => {
			defender.Attributes.Attack = 4;

			const data = await beatUp.LockStates(false);

			expect(data.cannotRun).toBe(true);
		});

		it("should NOT set cannotRun when defender ATK is 5 or above", async () => {
			defender.Attributes.Attack = 5;

			const data = await beatUp.LockStates(false);

			expect(data.cannotRun).toBe(false);
		});

		it("should boost attacker ATK by 1.35x when defender has 0 or less defense", async () => {
			const originalAttack = attacker.Attributes.Attack;
			defender.Attributes.Defense = 0;

			await beatUp.LockStates(false);

			expect(attacker.Attributes.Attack).toBeCloseTo(originalAttack * 1.35);
		});

		it("should NOT boost attacker ATK when defender has positive defense", async () => {
			const originalAttack = attacker.Attributes.Attack;
			defender.Attributes.Defense = 10;

			await beatUp.LockStates(false);

			expect(attacker.Attributes.Attack).toBe(originalAttack);
		});

		it("should consume a grenade and push ItemId.Grenade to UsedConsumables when useGrenade is true", async () => {
			vi.spyOn(attacker, "ConsumeItem").mockResolvedValue(true);

			await beatUp.LockStates(true);

			expect(attacker.ConsumeItem).toHaveBeenCalledWith(ItemId.Grenade);
			expect(beatUp.UsedConsumables).toContain(ItemId.Grenade);
		});

		it("should NOT add grenade to UsedConsumables if ConsumeItem returns false", async () => {
			vi.spyOn(attacker, "ConsumeItem").mockResolvedValue(false);

			await beatUp.LockStates(true);

			expect(beatUp.UsedConsumables).not.toContain(ItemId.Grenade);
		});
	});

	// -------------------------------------------------------------------------
	describe("ReleaseLocks", () => {
		it("should clear IsBeatingId on attacker and IsBeingBeatUpById on defender", async () => {
			// Simulate locks being set first
			attacker.BeatUp.IsBeatingId = defender.Id;
			defender.BeatUp.IsBeingBeatUpById = attacker.Id;

			await beatUp.ReleaseLocks();

			expect(attacker.BeatUp.IsBeatingId).toBeNull();
			expect(defender.BeatUp.IsBeingBeatUpById).toBeNull();
		});

		it("should write null lock fields to the database for both attacker and defender", async () => {
			await beatUp.ReleaseLocks();

			expect(mockUpdate).toHaveBeenCalledTimes(2);

			const attackerCallArgs = mockUpdate.mock.calls.find(
				(call: any[]) => "beatingUserId" in call[0],
			);
			expect(attackerCallArgs).toBeDefined();
			expect(attackerCallArgs![0].beatingUserId).toBeNull();

			const defenderCallArgs = mockUpdate.mock.calls.find(
				(call: any[]) => "beingBeatUpByUserId" in call[0],
			);
			expect(defenderCallArgs).toBeDefined();
			expect(defenderCallArgs![0].beingBeatUpByUserId).toBeNull();
		});

		it("should be idempotent — calling twice does not throw", async () => {
			await expect(beatUp.ReleaseLocks()).resolves.not.toThrow();
			await expect(beatUp.ReleaseLocks()).resolves.not.toThrow();
		});

		it("should clear locks even if they were never set", async () => {
			// Locks start as null by default
			expect(attacker.BeatUp.IsBeatingId).toBeNull();
			expect(defender.BeatUp.IsBeingBeatUpById).toBeNull();

			await beatUp.ReleaseLocks();

			expect(attacker.BeatUp.IsBeatingId).toBeNull();
			expect(defender.BeatUp.IsBeingBeatUpById).toBeNull();
		});
	});
});
