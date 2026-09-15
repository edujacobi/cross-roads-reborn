/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Season } from "#core/models/Season";
import { SeasonRepository } from "#core/repositories/SeasonRepository";
import { UserBadge } from "#core/models/UserBadge";
import { BadgeId } from "#core/types/Badges";
import { addDays, subDays } from "date-fns";

vi.mock("#shared/log", () => ({
	Log: {
		Info: vi.fn(),
		Warning: vi.fn(),
		Success: vi.fn(),
		Error: vi.fn(),
	},
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("#core/repositories/SeasonRepository", () => ({
	SeasonRepository: {
		FindLatest: vi.fn().mockResolvedValue(null),
		FindByNumber: vi.fn().mockResolvedValue(null),
		FindAll: vi.fn().mockResolvedValue([]),
		FindAllNumbers: vi.fn().mockResolvedValue([]),
		Create: vi.fn().mockImplementation((data) => Promise.resolve({ id: 1, ...data })),
		UpdateById: vi.fn().mockResolvedValue([1]),
		DeleteByNumber: vi.fn().mockResolvedValue(1),
		GetEndSeasonRankingData: vi.fn().mockResolvedValue([
			[
				{ id: "user1", nickname: "RichPlayer1", class: 1, money: 1_000_000 },
				{ id: "user2", nickname: "RichPlayer2", class: 1, money: 500_000 },
				{ id: "user3", nickname: "RichPlayer3", class: 1, money: 250_000 },
			], // money (top 1, 2, 3)
			[{ id: "user4", nickname: "Gambler", class: 2, casinoWinSum: 500_000 }], // casino
			[{ id: "user5", nickname: "Spender", class: 1, shopSpentSum: 300_000 }], // spender
			[{ id: "user6", nickname: "Thief", class: 3, robberySuccessRobbedSum: 200_000 }], // thief profit
			[{ id: "user6", nickname: "Thief", class: 3, robberySuccessCount: 50 }], // thief qty
			[{ id: "user7", nickname: "Worker", class: 1, jobReceivedSum: 150_000 }], // worker
			[{ id: "user8", nickname: "Beater", class: 2, beatUpSuccessCount: 30 }], // beater
			[{ id: "user9", nickname: "Scavenger", class: 3, scavengeFoundTotal: 40 }], // scavenger
			[{ id: "user10", nickname: "Patient", class: 1, hospitalTreatmentSum: 80_000 }], // hospital
			[{ id: "user11", nickname: "Briber", class: 2, prisonBriberySum: 60_000 }], // briber
			[{ id: "user12", nickname: "Escaper", class: 3, escapeCount: 15 }], // escaper
			[{ id: "user13", nickname: "Drunkard", class: 1, drinkHappyHour: 10 }], // drunk
			[{ id: "user14", nickname: "Investor", class: 1, investmentTotalProfit: 400_000 }], // investor
			[{ id: 1, name: "TopGang", level: 5 }], // gang
		]),
		GetEndSeasonStats: vi.fn().mockResolvedValue([1, 1, 2, 2, 1, 5, 10, 3, 2, 1, 0]),
		ResetSeasonDatabase: vi.fn().mockResolvedValue(undefined),
	},
}));

vi.mock("#core/repositories/UserRepository", () => ({
	UserRepository: {
		FindAllActive: vi.fn().mockResolvedValue([{ id: "user1", language: 0 }]),
		FindById: vi.fn().mockImplementation((id: string) => {
			if (id === "gangMember2") {
				return Promise.resolve({ deadUntil: addDays(new Date(), 5) });
			}
			return Promise.resolve({ deadUntil: null });
		}),
	},
}));

vi.mock("#core/repositories/GangMemberRepository", () => ({
	GangMemberRepository: {
		FindAllByGang: vi.fn().mockResolvedValue([{ userId: "gangMember1" }, { userId: "gangMember2" }]),
	},
}));

vi.mock("#core/models/UserBadge", () => ({
	UserBadge: {
		Create: vi.fn().mockResolvedValue(true),
	},
}));

vi.mock("#bot/utils/discordInteractions", () => ({
	sendPrivateMessage: vi.fn().mockResolvedValue(undefined),
}));

describe("Season Model", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should have a default duration of 120 days", () => {
		expect(Season.DEFAULT_DURATION_DAYS).toBe(120);
		const season = new Season();
		expect(season.GetDaysRemaining()).toBeGreaterThanOrEqual(119);
	});

	it("should return remaining days correctly for active season without flakiness", () => {
		const season = new Season();
		season.EndDate = addDays(new Date(), 45);
		const days = season.GetDaysRemaining();
		expect(days).toBeGreaterThanOrEqual(44);
		expect(days).toBeLessThanOrEqual(45);
	});

	it("should return 0 remaining days for past season", () => {
		const season = new Season();
		season.EndDate = subDays(new Date(), 5);
		expect(season.GetDaysRemaining()).toBe(0);
	});

	it("should correctly determine if a season is active", () => {
		const activeSeason = new Season();
		activeSeason.EndDate = addDays(new Date(), 1);
		expect(activeSeason.IsActive).toBe(true);

		const expiredSeason = new Season();
		expiredSeason.EndDate = subDays(new Date(), 1);
		expect(expiredSeason.IsActive).toBe(false);
	});

	it("should snapshot ranking leaders and active player counts", async () => {
		const season = new Season();
		season.Number = 6;
		await season.UpdateTopPlayers();

		expect(season.HowManyPlayers).toBe(1);
		expect(season.TopData.topMoney[0].nickname).toBe("RichPlayer1");
		expect(season.TopData.topMoney[0].value).toBe(1_000_000);
		expect(season.TopData.topMoney[1].nickname).toBe("RichPlayer2");
		expect(season.TopData.topMoney[2].nickname).toBe("RichPlayer3");
		expect(season.TopData.topGambler[0].nickname).toBe("Gambler");
		expect(season.TopData.topSpender[0].nickname).toBe("Spender");
		expect(season.TopData.topThiefProfit[0].nickname).toBe("Thief");
		expect(season.TopData.topWorker[0].nickname).toBe("Worker");
		expect(season.TopData.topBeater[0].nickname).toBe("Beater");
		expect(season.TopData.topScavenger[0].nickname).toBe("Scavenger");
		expect(season.TopData.topHospital[0].nickname).toBe("Patient");
		expect(season.TopData.topBriber[0].nickname).toBe("Briber");
		expect(season.TopData.topEscaper[0].nickname).toBe("Escaper");
		expect(season.TopData.topDrunk[0].nickname).toBe("Drunkard");
		expect(season.TopData.topInvestor[0].nickname).toBe("Investor");
		expect(season.TopData.topGang[0].name).toBe("TopGang");
	});

	it("should award badges to top ranking players including 2nd/3rd money except Top Drunk and Top Thief Quantity", async () => {
		const season = new Season();
		season.Number = 6;
		await season.UpdateTopPlayers();
		await season.AwardTopPlayers();

		// Top Money 1st, 2nd, 3rd
		expect(UserBadge.Create).toHaveBeenCalledWith("user1", BadgeId.S6Top1Money);
		expect(UserBadge.Create).toHaveBeenCalledWith("user2", BadgeId.S6Top2Money);
		expect(UserBadge.Create).toHaveBeenCalledWith("user3", BadgeId.S6Top3Money);

		// Other individual categories
		expect(UserBadge.Create).toHaveBeenCalledWith("user4", BadgeId.S6Top1CasinoProfit);
		expect(UserBadge.Create).toHaveBeenCalledWith("user5", BadgeId.S6Top1Spender);
		expect(UserBadge.Create).toHaveBeenCalledWith("user6", BadgeId.S6Top1RobberyProfit);
		expect(UserBadge.Create).toHaveBeenCalledWith("user7", BadgeId.S6Top1Jobs);
		expect(UserBadge.Create).toHaveBeenCalledWith("user8", BadgeId.S6Top1BeatUp);
		expect(UserBadge.Create).toHaveBeenCalledWith("user9", BadgeId.S6Top1Scavenge);
		expect(UserBadge.Create).toHaveBeenCalledWith("user10", BadgeId.S6Top1Hospital);
		expect(UserBadge.Create).toHaveBeenCalledWith("user11", BadgeId.S6Top1Bribery);
		expect(UserBadge.Create).toHaveBeenCalledWith("user12", BadgeId.S6Top1Escapes);
		expect(UserBadge.Create).toHaveBeenCalledWith("user14", BadgeId.S6Top1Investments);

		// Top Gang members: gangMember1 is alive, gangMember2 is dead/banned
		expect(UserBadge.Create).toHaveBeenCalledWith("gangMember1", BadgeId.S6Top1Gang);
		expect(UserBadge.Create).not.toHaveBeenCalledWith("gangMember2", BadgeId.S6Top1Gang);

		// Drunkard and Thief Quantity should NOT receive badges
		expect(UserBadge.Create).not.toHaveBeenCalledWith("user6", BadgeId.S6Top1RobberyQuantity);
		expect(UserBadge.Create).not.toHaveBeenCalledWith("user13", expect.anything());
	});

	it("should gracefully handle seasons without defined badges (e.g. Season 7+)", async () => {
		const season = new Season();
		season.Number = 99;
		await season.UpdateTopPlayers();
		await season.AwardTopPlayers();

		// Should not throw and should not call UserBadge.Create for nonexistent badges
		expect(UserBadge.Create).not.toHaveBeenCalled();
	});

	it("should safely deserialize empty or default topData JSON", async () => {
		vi.mocked(SeasonRepository.FindLatest).mockResolvedValueOnce({
			id: 1,
			number: 1,
			startDate: new Date(),
			endDate: addDays(new Date(), 100),
			topData: "{}",
			howManyPlayers: 0,
		} as any);

		const season = await Season.GetCurrent();
		expect(season.TopData.topMoney).toEqual([]);
		expect(season.TopData.topGambler).toEqual([]);
		expect(season.TopData.topGang).toEqual([]);
	});
});
