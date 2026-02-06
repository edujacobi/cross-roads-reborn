import { describe, it, expect, vi, beforeEach } from "vitest";
import { User } from "@core/models/User";
import { Language } from "@core/models/Language";
import { JobId } from "@core/types/Jobs";
import { ClassId } from "@core/types/Classes";
import { BeatUp } from "@core/models/BeatUp";
import { ScavengeId } from "@core/types/Scavenge";
import { ItemId } from "@core/types/Ids";
import { ItemList, UserItem } from "@core/types/Items";
import { LocationId } from "@core/types/Locations";

// --- Global Mocks ---

vi.mock("@core/database/Users", () => ({
	Users: {
		update: vi.fn(),
		findOne: vi.fn(),
		findByPk: vi.fn(() => Promise.resolve({ class: ClassId.Entrepreneur, nickname: "OtherUser" })),
		findAll: vi.fn(() => Promise.resolve([])),
	},
}));

describe("BeatUp", () => {
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

	describe("When testing if user can beat up", () => {
		beforeEach(async () => {
			user.Items = [ItemList[ItemId.Knife] as UserItem];
			defender.Items = [ItemList[ItemId.Knife] as UserItem];
		});

		it("Should fail if attacker is defender", async () => {
			const beatUp = new BeatUp(user, user);
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("yourself");
		});

		it("Should fail if defender has no nickname", async () => {
			const beatUp = new BeatUp(user, defender);
			defender.Nickname = "";
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("nickname");
		});

		it("Should fail if defender has no class", async () => {
			const beatUp = new BeatUp(user, defender);
			defender.Class = ClassId.None;
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("class");
		});

		it("Should fail if attacker without weapon", async () => {
			user.Items = [];
			await user.GetAttributes(true);
			const beatUp = new BeatUp(user, defender);
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("weapon");
		});

		it("Should fail if defender too strong", async () => {
			user.Items = [ItemList[ItemId.Knife] as UserItem];
			defender.Items = [ItemList[ItemId.Bazooka] as UserItem];

			const beatUp = new BeatUp(user, defender);
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("current weapons");
		});

		it("Should fail if attacker is scavenging", async () => {
			const beatUp = new BeatUp(user, defender);
			user.Scavenge.IsScavengingId = ScavengeId.AlienShip;
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("scavenging");
		});

		it("Should fail if defender is scavenging", async () => {
			const beatUp = new BeatUp(user, defender);
			defender.Scavenge.IsScavengingId = ScavengeId.AlienShip;
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("scavenging");
		});

		it("Should fail if attacker is working", async () => {
			const beatUp = new BeatUp(user, defender);
			user.Job.Id = JobId.Bodyguard;
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("working");
		});

		it("Should fail if defender is working", async () => {
			const beatUp = new BeatUp(user, defender);
			defender.Job.Id = JobId.Bodyguard;
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("working");
		});

		it("Should fail if attacker is in prison but defender is not", async () => {
			const beatUp = new BeatUp(user, defender);
			user.Prison.Time = new Date(Date.now() + 3_600_000);
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("prison");
		});

		it("Should fail if defender is in prison but attacker is not", async () => {
			const beatUp = new BeatUp(user, defender);
			defender.Prison.Time = new Date(Date.now() + 3_600_000);
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("prison");
		});

		it("Should fail if attacker is wanted by the police", async () => {
			const beatUp = new BeatUp(user, defender);
			user.Wanted.Time = new Date(Date.now() + 3_600_000);
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("wanted");
		});

		it("Should fail if attacker is in hospital", async () => {
			const beatUp = new BeatUp(user, defender);
			user.Hospital.Time = new Date(Date.now() + 3_600_000);
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("hospital");
		});

		it("Should fail if defender is in hospital", async () => {
			const beatUp = new BeatUp(user, defender);
			defender.Hospital.Time = new Date(Date.now() + 3_600_000);
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("hospital");
		});

		it("Should fail if attacker is in casino game", async () => {
			const beatUp = new BeatUp(user, defender);
			user.Casino.IsInGame = true;
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("casino");
		});

		it("Should fail if defender is in casino game", async () => {
			const beatUp = new BeatUp(user, defender);
			defender.Casino.IsInGame = true;
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("casino");
		});

		it("Should fail if beat up is in cooldown", async () => {
			const beatUp = new BeatUp(user, defender);
			user.BeatUp.Time = new Date(Date.now() + 3_600_000);
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("beat again");
		});

		it("Should fail if already beating", async () => {
			const beatUp = new BeatUp(user, defender);
			user.BeatUp.IsBeatingId = "123";
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("beating");
		});

		it("Should fail if already being beaten", async () => {
			const beatUp = new BeatUp(user, defender);
			defender.BeatUp.IsBeingBeatUpById = "123";
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("beated");
		});

		it("Should fail if defender is in beating", async () => {
			const beatUp = new BeatUp(user, defender);
			defender.BeatUp.IsBeatingId = "123";
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("beating");
		});

		it("Should fail if defender is being beaten", async () => {
			const beatUp = new BeatUp(user, defender);
			defender.BeatUp.IsBeingBeatUpById = "123";
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("beated");
		});

		it("Should fail if already robbing", async () => {
			const beatUp = new BeatUp(user, defender);
			user.Robbery.IsRobbingId = "123";
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("robbing");
		});

		it("Should fail if already being robbed", async () => {
			const beatUp = new BeatUp(user, defender);
			defender.Robbery.IsBeingRobbedById = "123";
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("robbed");
		});

		it("Should fail if defender is in robbing", async () => {
			const beatUp = new BeatUp(user, defender);
			defender.Robbery.IsRobbingId = "123";
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("robbing");
		});

		it("Should fail if defender is being robbed", async () => {
			const beatUp = new BeatUp(user, defender);
			defender.Robbery.IsBeingRobbedById = "123";
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("robbed");
		});

		it("Should fail if attacker is robbing location", async () => {
			const beatUp = new BeatUp(user, defender);
			user.Robbery.IsRobbingLocationId = LocationId.ArmyDepot;
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("robbing");
		});

		it("Should fail if defender is robbing location", async () => {
			const beatUp = new BeatUp(user, defender);
			defender.Robbery.IsRobbingLocationId = LocationId.ArmyDepot;
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("robbing");
		});

		it("Should fail if attacker is escaping prison", async () => {
			const beatUp = new BeatUp(user, defender);
			user.Escape.Time = new Date(Date.now() + 3_600_000);
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("escape");
		});

		it("Should fail if defender is escaping prison", async () => {
			const beatUp = new BeatUp(user, defender);
			defender.Escape.Time = new Date(Date.now() + 3_600_000);
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(false);
			expect(result.message).toContain("escape");
		});

		it("Should succeed", async () => {
			const beatUp = new BeatUp(user, defender);
			const result = await beatUp.CanBeatUser();
			expect(result.canBeat).toBe(true);
		});
	});
});
