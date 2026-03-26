import { describe, it, expect, vi, beforeEach } from "vitest";
import { User } from "@core/models/User";
import { Language } from "@core/models/Language";
import { ClassId } from "@core/types/Classes";
import { Robbery } from "@core/models/Robbery";
import { RobberyLocation } from "@core/models/RobberyLocation";
import { ItemList, type UserItem } from "@core/types/Items";
import { ItemId } from "@core/types/Ids";
import { ScavengeId } from "@core/types/Scavenge";
import { JobId } from "@core/types/Jobs";
import { LocationId } from "@core/types/Locations";

vi.mock("@core/database/Users", () => ({
	Users: {
		update: vi.fn(),
		findOne: vi.fn(),
		findByPk: vi.fn(() => Promise.resolve({ class: ClassId.Entrepreneur, nickname: "OtherUser" })),
		findAll: vi.fn(() => Promise.resolve([])),
	},
}));

describe("Robbery", () => {
	let user: User;
	let defender: User;

	beforeEach(() => {
		vi.clearAllMocks();
		user = new User("123", Language.English);
		user.Nickname = "TestUser";
		user.Class = ClassId.Entrepreneur;
		user.Money = 5_000;

		defender = new User("456", Language.English);
		defender.Nickname = "Defender";
		defender.Class = ClassId.Entrepreneur;
		defender.Money = 5_000;
	});

	describe("When testing if user can rob another user", () => {
		beforeEach(() => {
			user.Items = [ItemList[ItemId.Pistol] as UserItem];
			user.GetAttributes();
		});

		it("Should fail if attacker is same as defender", async () => {
			const robbery = new Robbery(user, user);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("yourself");
		});

		it("Should fail if defender has no nickname", async () => {
			defender.Nickname = "";
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("nickname");
		});

		it("Should fail if defender has no class", async () => {
			defender.Class = ClassId.None;
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("class");
		});

		it("Should fail if attacker has no weapon", async () => {
			user.Items = [];
			user.GetAttributes();
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("weapon");
		});

		it("Should fail if defender attack is too high", async () => {
			user.Attributes.Attack = 10;
			defender.Attributes.Attack = 30; // Difference > 15
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("weapons");
		});

		it("Should fail if attacker is scavenging", async () => {
			user.Scavenge.IsScavengingId = ScavengeId.Dump;
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("scavenging");
		});

		it("Should fail if defender is scavenging", async () => {
			defender.Scavenge.IsScavengingId = ScavengeId.Dump;
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("scavenging");
		});

		it("Should fail if attacker is working", async () => {
			user.Job.Id = JobId.UberDriver;
			user.Job.EndsIn = new Date(Date.now() + 3_600_000);

			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("working");
		});

		it("Should fail if attacker in prison", async () => {
			user.Prison.Time = new Date(Date.now() + 3_600_000);
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("prison");
		});

		it("Should fail if attacker is wanted", async () => {
			user.Wanted.Time = new Date(Date.now() + 3_600_000);
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("wanted");
		});

		it("Should fail if attacker in hospital", async () => {
			user.Hospital.Time = new Date(Date.now() + 3_600_000);
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("hospital");
		});

		it("Should fail if attacker in casino", async () => {
			user.Casino.IsInGame = true;
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("casino");
		});

		it("Should fail if defender in casino", async () => {
			defender.Casino.IsInGame = true;
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("casino");
		});

		it("Should fail if attacker is beating someone", async () => {
			user.BeatUp.IsBeatingId = "999";
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("beating");
		});

		it("Should fail if attacker is being beaten", async () => {
			user.BeatUp.IsBeingBeatUpById = "999";
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("beated");
		});

		it("Should fail if attacker is already robbing someone", async () => {
			user.Robbery.IsRobbingId = "999";
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("robbing");
		});

		it("Should fail if attacker is being robbed", async () => {
			user.Robbery.IsBeingRobbedById = "999";
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("robbed");
		});

		it("Should fail if attacker is robbing a location", async () => {
			user.Robbery.IsRobbingLocationId = LocationId.GroceryStore;
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("robbing");
		});

		it("Should fail if defender is beating someone", async () => {
			defender.BeatUp.IsBeatingId = "999";
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("beating");
		});

		it("Should fail if defender is being beaten", async () => {
			defender.BeatUp.IsBeingBeatUpById = "999";
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("beated");
		});

		it("Should fail if defender is robbing someone", async () => {
			defender.Robbery.IsRobbingId = "999";
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("robbing");
		});

		it("Should fail if defender is being robbed", async () => {
			defender.Robbery.IsBeingRobbedById = "999";
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("robbed");
		});

		it("Should fail if defender is robbing a location", async () => {
			defender.Robbery.IsRobbingLocationId = LocationId.GroceryStore;
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("robbing");
		});

		it("Should succeed if all conditions met", async () => {
			user.Items = [ItemList[ItemId.Bazooka] as UserItem];
			defender.Items = [ItemList[ItemId.Pistol] as UserItem];
			user.GetAttributes();
			const robbery = new Robbery(user, defender);
			const result = await robbery.CanRobUser();
			expect(result.canRob).toBe(true);
		});
	});

	describe("When testing if user can rob a location", () => {
		beforeEach(() => {
			user.Items = [ItemList[ItemId.Knife] as UserItem];
		});

		it("Should fail if low ATK", async () => {
			const robberyLoc = new RobberyLocation(user, LocationId.SmallBank);
			const result = await robberyLoc.CanRobLocation();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("ATK");
		});

		it("Should fail if scavenging", async () => {
			user.Scavenge.IsScavengingId = ScavengeId.AlienShip;
			const robberyLoc = new RobberyLocation(user, LocationId.SmallBank);
			const result = await robberyLoc.CanRobLocation();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("scavenging");
		});

		it("Should fail if working", async () => {
			user.Items = [{ Id: ItemId.Knife } as UserItem];
			user.Job.Id = JobId.Butcher;
			const robberyLoc = new RobberyLocation(user, LocationId.SmallBank);
			const result = await robberyLoc.CanRobLocation();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("working");
		});

		it("Should fail if user is in prison", async () => {
			user.Prison.Time = new Date(Date.now() + 3_600_000);
			const robberyLoc = new RobberyLocation(user, LocationId.SmallBank);
			const result = await robberyLoc.CanRobLocation();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("prison");
		});

		it("Should fail if user is wanted", async () => {
			user.Wanted.Time = new Date(Date.now() + 3_600_000);
			const robberyLoc = new RobberyLocation(user, LocationId.SmallBank);
			const result = await robberyLoc.CanRobLocation();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("wanted");
		});

		it("Should fail if user is in hospital", async () => {
			user.Hospital.Time = new Date(Date.now() + 3_600_000);
			const robberyLoc = new RobberyLocation(user, LocationId.SmallBank);
			const result = await robberyLoc.CanRobLocation();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("hospital");
		});

		it("Should fail if user is in casino", async () => {
			user.Casino.IsInGame = true;
			const robberyLoc = new RobberyLocation(user, LocationId.SmallBank);
			const result = await robberyLoc.CanRobLocation();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("casino");
		});

		it("Should fail if user is beating", async () => {
			user.BeatUp.IsBeatingId = "999";
			const robberyLoc = new RobberyLocation(user, LocationId.SmallBank);
			const result = await robberyLoc.CanRobLocation();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("beating");
		});

		it("Should fail if user is being beated", async () => {
			user.BeatUp.IsBeingBeatUpById = "999";
			const robberyLoc = new RobberyLocation(user, LocationId.SmallBank);
			const result = await robberyLoc.CanRobLocation();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("beated");
		});

		it("Should fail if user is robbing", async () => {
			user.Robbery.IsRobbingId = "999";
			const robberyLoc = new RobberyLocation(user, LocationId.SmallBank);
			const result = await robberyLoc.CanRobLocation();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("robbing");
		});

		it("Should fail if user is being robbed", async () => {
			user.Robbery.IsBeingRobbedById = "999";
			const robberyLoc = new RobberyLocation(user, LocationId.SmallBank);
			const result = await robberyLoc.CanRobLocation();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("robbed");
		});

		it("Should fail if user is robbing a location", async () => {
			user.Robbery.IsRobbingLocationId = LocationId.SmallBank;
			const robberyLoc = new RobberyLocation(user, LocationId.SmallBank);
			const result = await robberyLoc.CanRobLocation();
			expect(result.canRob).toBe(false);
			expect(result.message).toContain("robbing");
		});

		it("Should succeed if all conditions met", async () => {
			user.Items = [ItemList[ItemId.Bazooka] as UserItem];
			user.GetAttributes();
			const robberyLoc = new RobberyLocation(user, LocationId.SmallBank);
			const result = await robberyLoc.CanRobLocation();
			expect(result.canRob).toBe(true);
		});
	});
});
