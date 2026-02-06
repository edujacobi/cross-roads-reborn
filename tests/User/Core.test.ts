import { describe, it, expect, vi, beforeEach } from "vitest";
import { User } from "@core/models/User";
import { Language } from "@core/models/Language";
import { ClassId } from "@core/types/Classes";
import { JobId } from "@core/types/Jobs";

// --- Global Mocks ---

vi.mock("@core/database/Users", () => ({
	Users: {
		update: vi.fn(),
		findOne: vi.fn(),
		findByPk: vi.fn(() => Promise.resolve({ class: ClassId.Entrepreneur, nickname: "OtherUser" })),
		findAll: vi.fn(() => Promise.resolve([])),
	},
}));

describe("User Model Core Actions (Regression)", () => {
	let user: User;

	beforeEach(() => {
		vi.clearAllMocks();
		user = new User("123", Language.English);
		user.Nickname = "TestUser";
		user.Class = ClassId.Entrepreneur;
		user.Money = 5_000;
	});

	it("should pass model lifecycle tests (Job status)", async () => {
		const jobId = JobId.Butcher;
		await user.StartJob(jobId);
		expect(user.Job.Id).toBe(jobId);
		expect(user.IsWorking()).toBe(true);

		await user.CancelJob();
		expect(user.Job.Id).toBe(null);
		expect(user.IsWorking()).toBe(false);
	});
});
