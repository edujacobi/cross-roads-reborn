import { describe, it, expect, vi, beforeEach } from "vitest";
import { User } from "#core/models/User";
import { Language } from "#core/models/Language";
import { ClassId } from "#core/types/Classes";
import { Prison, PrisonFailureReason } from "#core/models/Prison";
import { UserRepository } from "#core/repositories/UserRepository";
import { Event } from "#core/models/Event";
import { Notification } from "#core/models/Notification";

// --- Global Mocks ---

vi.mock("#core/database/Users", () => ({
	Users: {
		update: vi.fn(),
		findOne: vi.fn(),
		findByPk: vi.fn(() => Promise.resolve({ class: ClassId.Entrepreneur, nickname: "OtherUser" })),
		findAll: vi.fn(() => Promise.resolve([])),
	},
}));

describe("Prison", () => {
	let user: User;

	beforeEach(() => {
		vi.clearAllMocks();
		user = new User("123", Language.English);
		user.Nickname = "TestUser";
		user.Class = ClassId.Entrepreneur;
		user.Money = 5_000;
	});

	describe("When testing if user can escape", () => {
		it("Should fail if user not in prison", async () => {
			const prison = new Prison(user);
			const result = await prison.CanEscape();
			expect(result.canEscape).toBe(false);
			expect(result.reason).toBe(PrisonFailureReason.BribeNotInPrison);
		});

		it("Should fail if user already tried escaping", async () => {
			user.Prison.Time = new Date(Date.now() + 3_600_000);
			user.Escape.HasTried = true;
			const prison = new Prison(user);
			const result = await prison.CanEscape();
			expect(result.canEscape).toBe(false);
			expect(result.reason).toBe(PrisonFailureReason.EscapeHasTried);
		});

		it("Should fail if user is already escaping", async () => {
			user.Prison.Time = new Date(Date.now() + 3_600_000);
			user.Escape.Time = new Date(Date.now() + 3_600_000);
			const prison = new Prison(user);
			const result = await prison.CanEscape();
			expect(result.canEscape).toBe(false);
			expect(result.reason).toBe(PrisonFailureReason.EscapeEscaping);
		});

		it("Should fail if user is being robbed", async () => {
			user.Prison.Time = new Date(Date.now() + 3_600_000);
			user.Robbery.IsBeingRobbedById = "123";
			const prison = new Prison(user);
			const result = await prison.CanEscape();
			expect(result.canEscape).toBe(false);
			expect(result.reason).toBe(PrisonFailureReason.AttackerIsBeingRobbedById);
		});

		it("Should fail if user is beating", async () => {
			user.Prison.Time = new Date(Date.now() + 3_600_000);
			user.BeatUp.IsBeatingId = "123";
			const prison = new Prison(user);
			const result = await prison.CanEscape();
			expect(result.canEscape).toBe(false);
			expect(result.reason).toBe(PrisonFailureReason.AttackerIsBeatingId);
		});

		it("Should fail if user is being beat up", async () => {
			user.Prison.Time = new Date(Date.now() + 3_600_000);
			user.BeatUp.IsBeingBeatUpById = "123";
			const prison = new Prison(user);
			const result = await prison.CanEscape();
			expect(result.canEscape).toBe(false);
			expect(result.reason).toBe(PrisonFailureReason.AttackerIsBeingBeatedById);
		});

		it("Should succeed", async () => {
			user.Prison.Time = new Date(Date.now() + 3_600_000);
			const prison = new Prison(user);
			const result = await prison.CanEscape();
			expect(result.canEscape).toBe(true);
		});
	});

	describe("When starting an escape", () => {
		it("Should not start a duplicate escape after another request claimed it", async () => {
			user.Prison.Time = new Date(Date.now() + 3_600_000);
			vi.spyOn(UserRepository, "TryStartEscape").mockResolvedValue(false);
			const prison = new Prison(user);

			await expect(prison.StartEscape()).resolves.toBe(false);
			expect(user.Escape.HasTried).toBe(false);
		});
	});

	describe("When ending an escape", () => {
		it("Should apply the prison penalty after the escape timer expires", async () => {
			const prisonTime = new Date(Date.now() + 3_600_000);
			user.Prison.Time = prisonTime;
			user.Escape.HasTried = true;
			user.Escape.Time = new Date(Date.now() - 1_000);

			vi.spyOn(Event, "GetActiveFromType").mockResolvedValue(1);
			vi.spyOn(Notification, "Dismiss").mockResolvedValue(undefined);
			vi.spyOn(Notification, "Free").mockResolvedValue(undefined);
			const update = vi.spyOn(user, "Update").mockResolvedValue(true);
			vi.spyOn(Math, "random").mockReturnValue(0.99);

			const result = await new Prison(user).EndEscape();

			expect(result.success).toBe(false);
			expect(user.Prison.Time.getTime()).toBe(prisonTime.getTime() + 15 * 60_000);
			expect(user.Escape.Time.getTime()).toBe(0);
			expect(update).toHaveBeenCalledWith(expect.objectContaining({
				escapeTime: new Date(0),
				prisonTime: user.Prison.Time,
			}));
		});
	});
});
