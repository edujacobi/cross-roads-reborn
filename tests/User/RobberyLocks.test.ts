/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { User } from "#core/models/User";
import { Language } from "#core/models/Language";
import { UserRobberyStrategy } from "#core/models/strategies/robbery/UserRobberyStrategy";
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

describe("Robbery — LockStates & ReleaseLocks", () => {
	let attacker: User;
	let defender: User;
	let robbery: UserRobberyStrategy;

	beforeEach(() => {
		vi.clearAllMocks();

		attacker = new User("111", Language.English);
		attacker.Nickname = "Attacker";
		attacker.Class = ClassId.Entrepreneur;
		attacker.Money = 1_000;
		attacker.Items = [ItemList[ItemId.Pistol] as UserItem];
		attacker.GetAttributes();

		vi.spyOn(attacker, "GetItemSkin").mockReturnValue("🔫");

		defender = new User("222", Language.English);
		defender.Nickname = "Defender";
		defender.Class = ClassId.Entrepreneur;
		defender.Money = 2_000;
		defender.Items = [ItemList[ItemId.Pistol] as UserItem];
		defender.GetAttributes();

		robbery = new UserRobberyStrategy(attacker, defender) as UserRobberyStrategy;
	});

	// -------------------------------------------------------------------------
	describe("LockStates", () => {
		it("should set IsRobbingId on attacker and IsBeingRobbedById on defender", async () => {
			await robbery.LockStates(false);

			expect(attacker.Robbery.IsRobbingId).toBe(defender.Id);
			expect(defender.Robbery.IsBeingRobbedById).toBe(attacker.Id);
		});

		it("should write lock fields to the database for both attacker and defender", async () => {
			await robbery.LockStates(false);

			expect(mockUpdate).toHaveBeenCalledTimes(2);

			// Verify attacker DB write contains the lock field
			const attackerCallArgs = mockUpdate.mock.calls.find(
				(call: any[]) => call[0].robbingUserId === defender.Id,
			);
			expect(attackerCallArgs).toBeDefined();

			// Verify defender DB write contains the lock field
			const defenderCallArgs = mockUpdate.mock.calls.find(
				(call: any[]) => call[0].beingRobbedByUserId === attacker.Id,
			);
			expect(defenderCallArgs).toBeDefined();
		});

		it("should calculate AttackerTimeInPrison based on attacker ATK", async () => {
			await robbery.LockStates(false);

			const expectedTime = 10 + 1.5 * attacker.Attributes.Attack;
			expect(robbery.AttackerTimeInPrison).toBe(expectedTime);
		});

		it("should calculate AttackerAditionalTimeCallPolice based on attacker ATK", async () => {
			await robbery.LockStates(false);

			const expectedAdditional = Math.floor(25 + 0.5 * attacker.Attributes.Attack);
			expect(robbery.AttackerAditionalTimeCallPolice).toBe(expectedAdditional);
		});

		it("should calculate DefenderTimeInHospital based on defender DEF", async () => {
			await robbery.LockStates(false);

			const expectedTime = 25 + defender.Attributes.Defense / 2;
			expect(robbery.DefenderTimeInHospital).toBe(expectedTime);
		});

		it("should return correct RobberyInitData shape", async () => {
			const data = await robbery.LockStates(false);

			expect(data).toHaveProperty("attackerTimeInPrison");
			expect(data).toHaveProperty("attackerAditionalTimeCallPolice");
			expect(data).toHaveProperty("defenderTimeInHospital");
			expect(data).toHaveProperty("cannotReact");
			expect(data).toHaveProperty("cannotCallPolice");
			expect(data).toHaveProperty("usedGunSkin");
			expect(data).toHaveProperty("usedGunName");
		});

		it("should set cannotReact when defender is working", async () => {
			defender.Job.Id = 1 as any; // any active job
			defender.Job.EndsIn = new Date(Date.now() + 3_600_000);

			const data = await robbery.LockStates(false);

			expect(data.cannotReact).toBe(true);
		});

		it("should set cannotCallPolice when defender defense is below 5", async () => {
			defender.Attributes.Defense = 4;

			const data = await robbery.LockStates(false);

			expect(data.cannotCallPolice).toBe(true);
		});

		it("should boost attacker ATK by 1.35x when defender has 0 or less defense", async () => {
			const originalAttack = attacker.Attributes.Attack;
			defender.Attributes.Defense = 0;

			await robbery.LockStates(false);

			expect(attacker.Attributes.Attack).toBeCloseTo(originalAttack * 1.35);
		});

		it("should NOT boost attacker ATK when defender has positive defense", async () => {
			const originalAttack = attacker.Attributes.Attack;
			defender.Attributes.Defense = 10;

			await robbery.LockStates(false);

			expect(attacker.Attributes.Attack).toBe(originalAttack);
		});

		it("should consume a grenade and push ItemId.Grenade to UsedConsumables when useGrenade is true", async () => {
			attacker.Items = [
				ItemList[ItemId.Pistol] as UserItem,
				{ ...ItemList[ItemId.Grenade], Quantity: 1 } as UserItem,
			];

			vi.spyOn(attacker, "ConsumeItem").mockResolvedValue(true);
			vi.spyOn(attacker, "GetAttributes").mockResolvedValue(undefined as any);

			await robbery.LockStates(true);

			expect(attacker.ConsumeItem).toHaveBeenCalledWith(ItemId.Grenade);
			expect(robbery.UsedConsumables).toContain(ItemId.Grenade);
		});

		it("should NOT add grenade to UsedConsumables if ConsumeItem returns false", async () => {
			vi.spyOn(attacker, "ConsumeItem").mockResolvedValue(false);

			await robbery.LockStates(true);

			expect(robbery.UsedConsumables).not.toContain(ItemId.Grenade);
		});
	});

	// -------------------------------------------------------------------------
	describe("ReleaseLocks", () => {
		it("should clear IsRobbingId on attacker and IsBeingRobbedById on defender", async () => {
			// Simulate locks being set first
			attacker.Robbery.IsRobbingId = defender.Id;
			defender.Robbery.IsBeingRobbedById = attacker.Id;

			await robbery.ReleaseLocks();

			expect(attacker.Robbery.IsRobbingId).toBeNull();
			expect(defender.Robbery.IsBeingRobbedById).toBeNull();
		});

		it("should write null lock fields to the database for both attacker and defender", async () => {
			await robbery.ReleaseLocks();

			expect(mockUpdate).toHaveBeenCalledTimes(2);

			const attackerCallArgs = mockUpdate.mock.calls.find(
				(call: any[]) => "robbingUserId" in call[0],
			);
			expect(attackerCallArgs).toBeDefined();
			expect(attackerCallArgs![0].robbingUserId).toBeNull();

			const defenderCallArgs = mockUpdate.mock.calls.find(
				(call: any[]) => "beingRobbedByUserId" in call[0],
			);
			expect(defenderCallArgs).toBeDefined();
			expect(defenderCallArgs![0].beingRobbedByUserId).toBeNull();
		});

		it("should be idempotent — calling twice does not throw", async () => {
			await expect(robbery.ReleaseLocks()).resolves.not.toThrow();
			await expect(robbery.ReleaseLocks()).resolves.not.toThrow();
		});

		it("should clear locks even if they were never set", async () => {
			// Locks start as null by default
			expect(attacker.Robbery.IsRobbingId).toBeNull();
			expect(defender.Robbery.IsBeingRobbedById).toBeNull();

			await robbery.ReleaseLocks();

			expect(attacker.Robbery.IsRobbingId).toBeNull();
			expect(defender.Robbery.IsBeingRobbedById).toBeNull();
		});
	});
});
