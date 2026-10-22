import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { User } from "#core/models/User";
import { Language } from "#core/models/Language";
import { ClassId } from "#core/types/Classes";
import { cleanupActiveEscapes, Prison, PrisonFailureReason } from "#core/models/Prison";
import { UserRepository } from "#core/repositories/UserRepository";
import { Event } from "#core/models/Event";
import { Notification } from "#core/models/Notification";
import { Users } from "#core/database/Users";
import { Op } from "sequelize";

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

	afterEach(() => {
		cleanupActiveEscapes();
		vi.restoreAllMocks();
		vi.useRealTimers();
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
		beforeEach(() => {
			user.Prison.Time = new Date(Date.now() + 3_600_000);
			user.Escape.HasTried = true;
			user.Escape.Time = new Date(Date.now() - 1_000);
			vi.spyOn(Event, "GetActiveFromType").mockResolvedValue(1);
			vi.spyOn(Notification, "Dismiss").mockResolvedValue(undefined);
			vi.spyOn(Notification, "Free").mockResolvedValue(undefined);
			vi.spyOn(Notification, "RobAgain").mockResolvedValue(undefined);
			vi.spyOn(Math, "random").mockReturnValue(0.99);
		});

		it("Should apply the prison penalty after the escape timer expires", async () => {
			const prisonTime = user.Prison.Time;
			const escapeTime = user.Escape.Time;
			const update = vi.spyOn(UserRepository, "TryEndEscape").mockResolvedValue(true);

			const result = await new Prison(user).EndEscape();

			expect(result?.success).toBe(false);
			expect(user.Prison.Time.getTime()).toBe(prisonTime.getTime() + 15 * 60_000);
			expect(user.Escape.Time.getTime()).toBe(0);
			expect(update).toHaveBeenCalledWith(user.Id, escapeTime, prisonTime, expect.objectContaining({
				escapeTime: new Date(0),
				prisonTime: user.Prison.Time,
			}));
		});

		it("Should remain escaping until the result is saved, even after the countdown", async () => {
			const prisonTime = user.Prison.Time;
			let save!: (saved: boolean) => void;
			vi.spyOn(UserRepository, "TryEndEscape").mockImplementation(() => new Promise(resolve => {
				save = resolve;
			}));
			const completion = new Prison(user).EndEscape();
			await vi.waitFor(() => expect(save).toBeTypeOf("function"));

			expect(user.IsEscaping()).toBe(true);
			expect(user.Prison.Time).toBe(prisonTime);
			expect(Notification.Free).not.toHaveBeenCalled();

			save(true);
			await completion;
			expect(user.IsEscaping()).toBe(false);
			expect(Notification.Free).toHaveBeenCalledWith(user);
		});

		it("Should leave a failed save pending and retry without doubling the penalty", async () => {
			const prisonTime = user.Prison.Time;
			const save = vi.spyOn(UserRepository, "TryEndEscape")
				.mockRejectedValueOnce(new Error("SQLITE_BUSY"))
				.mockResolvedValueOnce(true);
			const prison = new Prison(user);

			await expect(prison.EndEscape()).rejects.toThrow("SQLITE_BUSY");
			expect(user.IsEscaping()).toBe(true);
			expect(user.Prison.Time).toBe(prisonTime);
			expect(Notification.Free).not.toHaveBeenCalled();

			await prison.EndEscape();
			expect(save).toHaveBeenCalledTimes(2);
			expect(user.Prison.Time.getTime()).toBe(prisonTime.getTime() + 15 * 60_000);
		});

		it("Should persist only one result for concurrent completions", async () => {
			const other = new User(user.Id, Language.English);
			other.Prison.Time = user.Prison.Time;
			other.Escape.Time = user.Escape.Time;
			other.Escape.HasTried = true;
			vi.mocked(Users.update).mockResolvedValueOnce([1]).mockResolvedValueOnce([0]);
			const escapeTime = user.Escape.Time;
			const prisonTime = user.Prison.Time;

			const results = await Promise.all([new Prison(user).EndEscape(), new Prison(other).EndEscape()]);

			expect(results.filter(result => result !== null)).toHaveLength(1);
			expect(Notification.Free).toHaveBeenCalledOnce();
			expect(Users.update).toHaveBeenCalledWith(expect.objectContaining({ escapeTime: new Date(0) }), {
				where: { id: user.Id, escapeHasTried: true, escapeTime, prisonTime },
			});
		});

		it("Should apply the multiplied penalty from now when recovering an expired sentence", async () => {
			vi.useFakeTimers();
			user.Prison.Time = new Date(Date.now() - 3_600_000);
			user.Attributes.Attack = 10;
			vi.mocked(Event.GetActiveFromType).mockResolvedValue(2);
			vi.spyOn(UserRepository, "TryEndEscape").mockResolvedValue(true);

			const result = await new Prison(user).EndEscape();

			expect(result?.totalTime).toBe(40);
			expect(user.Prison.Time.getTime()).toBe(Date.now() + 40 * 60_000);
		});

		it("Should preserve successful escape rewards and notify only after saving", async () => {
			vi.useFakeTimers();
			const save = vi.spyOn(UserRepository, "TryEndEscape").mockResolvedValue(true);
			const prison = new Prison(user);
			prison.Escape.TotalChance = 100;
			vi.mocked(Math.random).mockReturnValue(0);

			const result = await prison.EndEscape();

			expect(result?.success).toBe(true);
			expect(user.Escape.Count).toBe(1);
			expect(user.Prison.Time.getTime()).toBe(Date.now());
			expect(user.Wanted.Time.getTime()).toBe(Date.now() + 40 * 60_000);
			expect(save.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(Notification.RobAgain).mock.invocationCallOrder[0]);
		});
	});

	describe("When recovering pending escapes", () => {
		it("Should recover at startup and retry a failed save on the next interval", async () => {
			vi.useFakeTimers();
			user.Prison.Time = new Date(Date.now() + 3_600_000);
			const prisonTime = user.Prison.Time.getTime();
			user.Escape.HasTried = true;
			user.Escape.Time = new Date(Date.now() - 1_000);
			vi.spyOn(UserRepository, "FindOverdueEscapes").mockResolvedValue([{ id: user.Id }]);
			vi.spyOn(User.prototype, "GetInfo").mockResolvedValue(user);
			vi.spyOn(Prison.prototype, "CalculateEscapeChance").mockResolvedValue(undefined);
			vi.spyOn(Event, "GetActiveFromType").mockResolvedValue(1);
			vi.spyOn(Notification, "Free").mockResolvedValue(undefined);
			vi.spyOn(Math, "random").mockReturnValue(0.99);
			const save = vi.spyOn(UserRepository, "TryEndEscape")
				.mockRejectedValueOnce(new Error("SQLITE_BUSY"))
				.mockResolvedValueOnce(true);

			await Prison.Initialize();
			expect(user.IsEscaping()).toBe(true);
			await vi.advanceTimersByTimeAsync(5_000);

			expect(save).toHaveBeenCalledTimes(2);
			expect(user.IsEscaping()).toBe(false);
			expect(user.Prison.Time.getTime()).toBe(prisonTime + 15 * 60_000);
		});

		it("Should query only overdue, unresolved attempts", async () => {
			vi.useFakeTimers();
			vi.mocked(Users.findAll).mockResolvedValueOnce([]);

			await UserRepository.FindOverdueEscapes();

			expect(Users.findAll).toHaveBeenCalledWith({
				attributes: ["id"],
				where: {
					escapeHasTried: true,
					escapeTime: { [Op.gt]: new Date(0), [Op.lte]: new Date() },
				},
			});
		});
	});
});
