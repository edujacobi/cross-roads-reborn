"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const vitest_1 = require("vitest");
const Season_1 = require("#core/models/Season");
const SeasonRepository_1 = require("#core/repositories/SeasonRepository");
const UserBadge_1 = require("#core/models/UserBadge");
const Badges_1 = require("#core/types/Badges");
const date_fns_1 = require("date-fns");
vitest_1.vi.mock("#shared/log", () => ({
    Log: {
        Info: vitest_1.vi.fn(),
        Warning: vitest_1.vi.fn(),
        Success: vitest_1.vi.fn(),
        Error: vitest_1.vi.fn(),
    },
    logger: {
        info: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
    },
}));
vitest_1.vi.mock("#core/repositories/SeasonRepository", () => ({
    SeasonRepository: {
        FindLatest: vitest_1.vi.fn().mockResolvedValue(null),
        FindByNumber: vitest_1.vi.fn().mockResolvedValue(null),
        FindAll: vitest_1.vi.fn().mockResolvedValue([]),
        FindAllNumbers: vitest_1.vi.fn().mockResolvedValue([]),
        Create: vitest_1.vi.fn().mockImplementation((data) => Promise.resolve({ id: 1, ...data })),
        UpdateById: vitest_1.vi.fn().mockResolvedValue([1]),
        DeleteByNumber: vitest_1.vi.fn().mockResolvedValue(1),
        GetEndSeasonRankingData: vitest_1.vi.fn().mockResolvedValue([
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
        GetEndSeasonStats: vitest_1.vi.fn().mockResolvedValue([1, 1, 2, 2, 1, 5, 10, 3, 2, 1, 0]),
        ResetSeasonDatabase: vitest_1.vi.fn().mockResolvedValue(undefined),
    },
}));
vitest_1.vi.mock("#core/repositories/UserRepository", () => ({
    UserRepository: {
        FindAllActive: vitest_1.vi.fn().mockResolvedValue([{ id: "user1", language: 0 }]),
        FindById: vitest_1.vi.fn().mockImplementation((id) => {
            if (id === "gangMember2") {
                return Promise.resolve({ deadUntil: (0, date_fns_1.addDays)(new Date(), 5) });
            }
            return Promise.resolve({ deadUntil: null });
        }),
    },
}));
vitest_1.vi.mock("#core/repositories/GangMemberRepository", () => ({
    GangMemberRepository: {
        FindAllByGang: vitest_1.vi.fn().mockResolvedValue([{ userId: "gangMember1" }, { userId: "gangMember2" }]),
    },
}));
vitest_1.vi.mock("#core/models/UserBadge", () => ({
    UserBadge: {
        Create: vitest_1.vi.fn().mockResolvedValue(true),
    },
}));
vitest_1.vi.mock("#bot/utils/discordInteractions", () => ({
    sendPrivateMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
}));
(0, vitest_1.describe)("Season Model", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)("should have a default duration of 120 days", () => {
        (0, vitest_1.expect)(Season_1.Season.DEFAULT_DURATION_DAYS).toBe(120);
        const season = new Season_1.Season();
        (0, vitest_1.expect)(season.GetDaysRemaining()).toBeGreaterThanOrEqual(119);
    });
    (0, vitest_1.it)("should return remaining days correctly for active season without flakiness", () => {
        const season = new Season_1.Season();
        season.EndDate = (0, date_fns_1.addDays)(new Date(), 45);
        const days = season.GetDaysRemaining();
        (0, vitest_1.expect)(days).toBeGreaterThanOrEqual(44);
        (0, vitest_1.expect)(days).toBeLessThanOrEqual(45);
    });
    (0, vitest_1.it)("should return 0 remaining days for past season", () => {
        const season = new Season_1.Season();
        season.EndDate = (0, date_fns_1.subDays)(new Date(), 5);
        (0, vitest_1.expect)(season.GetDaysRemaining()).toBe(0);
    });
    (0, vitest_1.it)("should correctly determine if a season is active", () => {
        const activeSeason = new Season_1.Season();
        activeSeason.EndDate = (0, date_fns_1.addDays)(new Date(), 1);
        (0, vitest_1.expect)(activeSeason.IsActive).toBe(true);
        const expiredSeason = new Season_1.Season();
        expiredSeason.EndDate = (0, date_fns_1.subDays)(new Date(), 1);
        (0, vitest_1.expect)(expiredSeason.IsActive).toBe(false);
    });
    (0, vitest_1.it)("should snapshot ranking leaders and active player counts", async () => {
        const season = new Season_1.Season();
        season.Number = 6;
        await season.UpdateTopPlayers();
        (0, vitest_1.expect)(season.HowManyPlayers).toBe(1);
        (0, vitest_1.expect)(season.TopData.topMoney[0].nickname).toBe("RichPlayer1");
        (0, vitest_1.expect)(season.TopData.topMoney[0].value).toBe(1_000_000);
        (0, vitest_1.expect)(season.TopData.topMoney[1].nickname).toBe("RichPlayer2");
        (0, vitest_1.expect)(season.TopData.topMoney[2].nickname).toBe("RichPlayer3");
        (0, vitest_1.expect)(season.TopData.topGambler[0].nickname).toBe("Gambler");
        (0, vitest_1.expect)(season.TopData.topSpender[0].nickname).toBe("Spender");
        (0, vitest_1.expect)(season.TopData.topThiefProfit[0].nickname).toBe("Thief");
        (0, vitest_1.expect)(season.TopData.topWorker[0].nickname).toBe("Worker");
        (0, vitest_1.expect)(season.TopData.topBeater[0].nickname).toBe("Beater");
        (0, vitest_1.expect)(season.TopData.topScavenger[0].nickname).toBe("Scavenger");
        (0, vitest_1.expect)(season.TopData.topHospital[0].nickname).toBe("Patient");
        (0, vitest_1.expect)(season.TopData.topBriber[0].nickname).toBe("Briber");
        (0, vitest_1.expect)(season.TopData.topEscaper[0].nickname).toBe("Escaper");
        (0, vitest_1.expect)(season.TopData.topDrunk[0].nickname).toBe("Drunkard");
        (0, vitest_1.expect)(season.TopData.topInvestor[0].nickname).toBe("Investor");
        (0, vitest_1.expect)(season.TopData.topGang[0].name).toBe("TopGang");
    });
    (0, vitest_1.it)("should award badges to top ranking players including 2nd/3rd money except Top Drunk and Top Thief Quantity", async () => {
        const season = new Season_1.Season();
        season.Number = 6;
        await season.UpdateTopPlayers();
        await season.AwardTopPlayers();
        // Top Money 1st, 2nd, 3rd
        (0, vitest_1.expect)(UserBadge_1.UserBadge.Create).toHaveBeenCalledWith("user1", Badges_1.BadgeId.S6Top1Money);
        (0, vitest_1.expect)(UserBadge_1.UserBadge.Create).toHaveBeenCalledWith("user2", Badges_1.BadgeId.S6Top2Money);
        (0, vitest_1.expect)(UserBadge_1.UserBadge.Create).toHaveBeenCalledWith("user3", Badges_1.BadgeId.S6Top3Money);
        // Other individual categories
        (0, vitest_1.expect)(UserBadge_1.UserBadge.Create).toHaveBeenCalledWith("user4", Badges_1.BadgeId.S6Top1CasinoProfit);
        (0, vitest_1.expect)(UserBadge_1.UserBadge.Create).toHaveBeenCalledWith("user5", Badges_1.BadgeId.S6Top1Spender);
        (0, vitest_1.expect)(UserBadge_1.UserBadge.Create).toHaveBeenCalledWith("user6", Badges_1.BadgeId.S6Top1RobberyProfit);
        (0, vitest_1.expect)(UserBadge_1.UserBadge.Create).toHaveBeenCalledWith("user7", Badges_1.BadgeId.S6Top1Jobs);
        (0, vitest_1.expect)(UserBadge_1.UserBadge.Create).toHaveBeenCalledWith("user8", Badges_1.BadgeId.S6Top1BeatUp);
        (0, vitest_1.expect)(UserBadge_1.UserBadge.Create).toHaveBeenCalledWith("user9", Badges_1.BadgeId.S6Top1Scavenge);
        (0, vitest_1.expect)(UserBadge_1.UserBadge.Create).toHaveBeenCalledWith("user10", Badges_1.BadgeId.S6Top1Hospital);
        (0, vitest_1.expect)(UserBadge_1.UserBadge.Create).toHaveBeenCalledWith("user11", Badges_1.BadgeId.S6Top1Bribery);
        (0, vitest_1.expect)(UserBadge_1.UserBadge.Create).toHaveBeenCalledWith("user12", Badges_1.BadgeId.S6Top1Escapes);
        (0, vitest_1.expect)(UserBadge_1.UserBadge.Create).toHaveBeenCalledWith("user14", Badges_1.BadgeId.S6Top1Investments);
        // Top Gang members: gangMember1 is alive, gangMember2 is dead/banned
        (0, vitest_1.expect)(UserBadge_1.UserBadge.Create).toHaveBeenCalledWith("gangMember1", Badges_1.BadgeId.S6Top1Gang);
        (0, vitest_1.expect)(UserBadge_1.UserBadge.Create).not.toHaveBeenCalledWith("gangMember2", Badges_1.BadgeId.S6Top1Gang);
        // Drunkard and Thief Quantity should NOT receive badges
        (0, vitest_1.expect)(UserBadge_1.UserBadge.Create).not.toHaveBeenCalledWith("user6", Badges_1.BadgeId.S6Top1RobberyQuantity);
        (0, vitest_1.expect)(UserBadge_1.UserBadge.Create).not.toHaveBeenCalledWith("user13", vitest_1.expect.anything());
    });
    (0, vitest_1.it)("should gracefully handle seasons without defined badges (e.g. Season 7+)", async () => {
        const season = new Season_1.Season();
        season.Number = 99;
        await season.UpdateTopPlayers();
        await season.AwardTopPlayers();
        // Should not throw and should not call UserBadge.Create for nonexistent badges
        (0, vitest_1.expect)(UserBadge_1.UserBadge.Create).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("should safely deserialize empty or default topData JSON", async () => {
        vitest_1.vi.mocked(SeasonRepository_1.SeasonRepository.FindLatest).mockResolvedValueOnce({
            id: 1,
            number: 1,
            startDate: new Date(),
            endDate: (0, date_fns_1.addDays)(new Date(), 100),
            topData: "{}",
            howManyPlayers: 0,
        });
        const season = await Season_1.Season.GetCurrent();
        (0, vitest_1.expect)(season.TopData.topMoney).toEqual([]);
        (0, vitest_1.expect)(season.TopData.topGambler).toEqual([]);
        (0, vitest_1.expect)(season.TopData.topGang).toEqual([]);
    });
});
//# sourceMappingURL=Season.test.js.map