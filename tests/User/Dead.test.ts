import { describe, it, expect, vi, beforeEach } from "vitest";
import { SituationId, User } from "#core/models/User";
import { Language } from "#core/models/Language";
import { ClassId } from "#core/types/Classes";
import { JobId } from "#core/types/Jobs";
import { addDays } from "date-fns";

// --- Global Mocks ---

vi.mock("#core/database/Users", () => ({
	Users: {
		update: vi.fn(),
		findOne: vi.fn(),
		findByPk: vi.fn(() => Promise.resolve({ class: ClassId.Entrepreneur, nickname: "OtherUser" })),
		findAll: vi.fn(() => Promise.resolve([])),
	},
}));

describe("Dead Status", () => {
	let user: User;

	beforeEach(() => {
		vi.clearAllMocks();
		user = new User("123", Language.English);
		user.Nickname = "TestUser";
		user.Class = ClassId.Entrepreneur;
		user.Money = 5_000;
	});

	describe("When testing if user is dead", () => {
		it("Should return false by default (new user)", () => {
			expect(user.IsDead()).toBe(false);
		});

		it("Should return true if DeadUntil is in the future", () => {
			user.DeadUntil = addDays(new Date(), 3);
			expect(user.IsDead()).toBe(true);
		});

		it("Should return false if DeadUntil is in the past", () => {
			user.DeadUntil = addDays(new Date(), -1);
			expect(user.IsDead()).toBe(false);
		});
	});

	describe("When testing availability and situation", () => {
		it("Should not be available if dead", async () => {
			user.DeadUntil = addDays(new Date(), 3);
			const availability = user.CheckAvailability();
			expect(availability.available).toBe(false);
			if (!availability.available) {
				expect(availability.reason).toBe("dead");
			}
		});

		it("Should set Situation Id to Dead when dead", async () => {
			user.DeadUntil = addDays(new Date(), 3);
			await user.GetSituation();
			expect(user.Situation.Id).toBe(SituationId.Dead);
		});
	});

	describe("When /kill logic is simulated", () => {
		it("Should successfully clear money, job, and hospitalize the user", async () => {
			// Set initial job
			user.Job.Id = JobId.Butcher;
			expect(user.IsWorking()).toBe(true);

			const deadUntil = addDays(new Date(), 3);
			user.DeadUntil = deadUntil;
			user.Hospital.Time = deadUntil;
			user.Money = 0;
			user.Job.Id = null;

			expect(user.IsDead()).toBe(true);
			expect(user.IsInHospital()).toBe(true);
			expect(user.Money).toBe(0);
			expect(user.IsWorking()).toBe(false);
			expect(user.Job.Id).toBe(null);
		});
	});
});
