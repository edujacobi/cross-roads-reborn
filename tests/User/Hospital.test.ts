import { describe, it, expect, vi, beforeEach } from "vitest";
import { User } from "#core/models/User";
import { Language } from "#core/models/Language";
import { ClassId } from "#core/types/Classes";
import { Hospital, HospitalFailureReason } from "#core/models/Hospital";

// --- Global Mocks ---

vi.mock("#core/database/Users", () => ({
	Users: {
		update: vi.fn(),
		findOne: vi.fn(),
		findByPk: vi.fn(() => Promise.resolve({ class: ClassId.Entrepreneur, nickname: "OtherUser" })),
		findAll: vi.fn(() => Promise.resolve([])),
	},
}));

describe("Hospital", () => {
	let user: User;

	beforeEach(() => {
		vi.clearAllMocks();
		user = new User("123", Language.English);
		user.Nickname = "TestUser";
		user.Class = ClassId.Entrepreneur;
		user.Money = 5_000;
	});

	describe("When testing if user can pay private care", () => {
		it("Should fail if user is not in hospital", async () => {
			const hospital = new Hospital(user);
			const result = await hospital.CanPayPrivate();
			expect(result.canPay).toBe(false);
			expect(result.reason).toBe(HospitalFailureReason.UserFree);
		});

		it("Should fail if user is next in line (<5 min)", async () => {
			user.Hospital.Time = new Date(Date.now() + 120_000); // 2 min away
			const hospital = new Hospital(user);
			const result = await hospital.CanPayPrivate();
			expect(result.canPay).toBe(false);
			expect(result.reason).toBe(HospitalFailureReason.NextInLine);
		});

		it("Should fail if user does not have enough money", async () => {
			user.Money = 0;
			user.Hospital.Time = new Date(Date.now() + 3_600_000);
			const hospital = new Hospital(user);
			const result = await hospital.CanPayPrivate();
			expect(result.canPay).toBe(false);
			expect(result.reason).toBe(HospitalFailureReason.WithoutMoney);
		});

		it("Should succeed", async () => {
			user.Hospital.Time = new Date(Date.now() + 3_600_000);
			const hospital = new Hospital(user);
			const result = await hospital.CanPayPrivate();
			expect(result.canPay).toBe(true);
		});
	});
});
