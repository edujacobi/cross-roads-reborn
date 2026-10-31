"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const Heist_1 = require("#core/models/Heist");
const User_1 = require("#core/models/User");
const MultiplayerSession_1 = require("#core/models/MultiplayerSession");
const InvestmentRobbery_1 = require("#core/models/InvestmentRobbery");
const Items_1 = require("#core/types/Items");
const Heist_2 = require("#core/types/Heist");
const Ids_1 = require("#core/types/Ids");
const Language_1 = require("#core/models/Language");
const { mockGetGangById, mockCanBeatUser, mockBeatUpLock, mockBeatUpResolve, mockBeatUpRelease, mockCanRob, mockRobberyLock, mockRobberyResolve, mockRobberyRelease, mockCasinoCanPlay, mockCasinoStart, mockRepository, mockGetGangByUserId, mockInvestmentValidation, mockInvestmentOutcome, } = vitest_1.vi.hoisted(() => ({
    mockGetGangById: vitest_1.vi.fn(),
    mockGetGangByUserId: vitest_1.vi.fn(),
    mockInvestmentValidation: vitest_1.vi.fn(),
    mockInvestmentOutcome: vitest_1.vi.fn(),
    mockCanBeatUser: vitest_1.vi.fn(),
    mockBeatUpLock: vitest_1.vi.fn(),
    mockBeatUpResolve: vitest_1.vi.fn(),
    mockBeatUpRelease: vitest_1.vi.fn(),
    mockCanRob: vitest_1.vi.fn(),
    mockRobberyLock: vitest_1.vi.fn(),
    mockRobberyResolve: vitest_1.vi.fn(),
    mockRobberyRelease: vitest_1.vi.fn(),
    mockCasinoCanPlay: vitest_1.vi.fn(),
    mockCasinoStart: vitest_1.vi.fn(),
    mockRepository: {
        Create: vitest_1.vi.fn(),
        Update: vitest_1.vi.fn(),
        Finish: vitest_1.vi.fn(),
        FindActive: vitest_1.vi.fn(),
        PruneFinished: vitest_1.vi.fn(),
        ReleaseLocks: vitest_1.vi.fn(),
    },
}));
vitest_1.vi.mock("#core/models/BeatUp", () => ({
    BeatUp: class {
        CanBeatUser() {
            return mockCanBeatUser();
        }
        LockStates(useGrenade) {
            return mockBeatUpLock(useGrenade);
        }
        Resolve(response) {
            return mockBeatUpResolve(response);
        }
        ReleaseLocks() {
            return mockBeatUpRelease();
        }
    },
}));
vitest_1.vi.mock("#core/models/strategies/robbery/UserRobberyStrategy", () => ({
    UserRobberyStrategy: class {
        CanRob() {
            return mockCanRob();
        }
        LockStates(useGrenade) {
            return mockRobberyLock(useGrenade);
        }
        Resolve(response) {
            return mockRobberyResolve(response);
        }
        ReleaseLocks() {
            return mockRobberyRelease();
        }
    },
}));
vitest_1.vi.mock("#core/models/Casino", () => ({
    Casino: {
        CanUserPlayGame: mockCasinoCanPlay,
        StartUserGame: mockCasinoStart,
        FinishUserGameWithWin: vitest_1.vi.fn(),
        FinishUserGameWithLoss: vitest_1.vi.fn(),
    },
}));
vitest_1.vi.mock("#core/models/Gang", () => ({
    Gang: { GetById: mockGetGangById, GetByUserId: mockGetGangByUserId },
}));
vitest_1.vi.mock("#core/models/InvestmentRobbery", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        InvestmentRobbery: class {
            Target;
            constructor(_gang, _leader, Target) {
                this.Target = Target;
            }
            Participants = new Map();
            InvestmentBase = { Name: { 0: "Bar", 1: "Bar", 2: "Bar" }, ImageUrl: "" };
            InvestmentData = { accumulatedYield: 1_000 };
            Validate = () => mockInvestmentValidation();
            ApplyAttackerState = vitest_1.vi.fn();
            ApplyDefenderState = vitest_1.vi.fn(actual.InvestmentRobbery.prototype.ApplyDefenderState);
            ClearTargetState = vitest_1.vi.fn(actual.InvestmentRobbery.prototype.ClearTargetState);
            ClearAttackerStates = vitest_1.vi.fn(async () => {
                await this.ClearTargetState();
            });
            Abort = vitest_1.vi.fn(async () => {
                await this.ClearAttackerStates();
            });
            CalculateAndApplyOutcome = mockInvestmentOutcome;
        },
    };
});
vitest_1.vi.mock("#core/repositories/MultiplayerSessionRepository", () => ({
    MultiplayerSessionRepository: mockRepository,
}));
function makeUser(id) {
    const user = new User_1.User(id);
    user.Nickname = `Player ${id}`;
    user.Money = 50_000;
    vitest_1.vi.spyOn(user, "GetInfo").mockResolvedValue(user);
    vitest_1.vi.spyOn(user, "Update").mockResolvedValue(true);
    return user;
}
(0, vitest_1.describe)("Multiplayer sessions", () => {
    (0, vitest_1.beforeEach)(async () => {
        vitest_1.vi.useFakeTimers();
        vitest_1.vi.clearAllMocks();
        mockGetGangById.mockReset().mockResolvedValue(null);
        mockGetGangByUserId.mockReset().mockResolvedValue(null);
        mockInvestmentValidation.mockReset().mockResolvedValue({ success: true });
        mockRepository.FindActive.mockResolvedValue([]);
        mockRepository.Create.mockResolvedValue(undefined);
        mockRepository.Update.mockResolvedValue(undefined);
        mockRepository.Finish.mockResolvedValue(undefined);
        mockRepository.PruneFinished.mockResolvedValue(undefined);
        mockRepository.ReleaseLocks.mockResolvedValue(undefined);
        mockCanBeatUser.mockResolvedValue({ canBeat: true, message: "" });
        mockBeatUpLock.mockResolvedValue({
            cannotRun: false,
            usedGunSkin: "",
            usedGunName: "Pistol",
            usedGrenade: false,
            timeInHospitalBase: 45,
            timeInHospitalAditional: 5,
        });
        mockBeatUpResolve.mockResolvedValue({ success: true, defenderHospitalTime: new Date() });
        mockBeatUpRelease.mockResolvedValue(undefined);
        mockCanRob.mockResolvedValue({ canRob: true, message: "" });
        mockRobberyLock.mockResolvedValue({
            cannotReact: false,
            cannotCallPolice: false,
            usedGunSkin: "",
            usedGunName: "Pistol",
            usedGrenade: false,
            attackerTimeInPrison: 10,
            attackerAditionalTimeCallPolice: 5,
            defenderTimeInHospital: 25,
        });
        mockRobberyResolve.mockResolvedValue({ success: true, moneyRobbed: 1_000 });
        mockRobberyRelease.mockResolvedValue(undefined);
        mockCasinoCanPlay.mockResolvedValue({ canPlay: true, message: "" });
        mockCasinoStart.mockResolvedValue(true);
        await MultiplayerSession_1.MultiplayerSession.Stop();
    });
    (0, vitest_1.afterEach)(async () => {
        await MultiplayerSession_1.MultiplayerSession.Stop();
        vitest_1.vi.restoreAllMocks();
        vitest_1.vi.useRealTimers();
    });
    vitest_1.it.each(["beatUp", "userRobbery"])("includes weapon and response consequences in %s queries and updates", async (kind) => {
        const attacker = makeUser("attacker");
        const defender = makeUser("defender");
        attacker.BestGun = {
            ...Items_1.ItemList[Ids_1.ItemId.Pistol],
            SelectedSkin: Ids_1.BundleId.Default,
            RemainingTime: new Date(),
            Quantity: 1,
        };
        const listener = vitest_1.vi.fn();
        const unsubscribe = MultiplayerSession_1.MultiplayerSession.Subscribe(defender.Id, null, listener);
        const started = kind === "beatUp"
            ? await MultiplayerSession_1.MultiplayerSession.StartBeatUp(attacker, defender, false)
            : await MultiplayerSession_1.MultiplayerSession.StartUserRobbery(attacker, defender, false);
        (0, vitest_1.expect)(started.success).toBe(true);
        if (!started.success)
            return;
        const expected = {
            weaponName: Items_1.ItemList[Ids_1.ItemId.Pistol].Description[Language_1.Language.Portuguese],
            weaponEmoji: "",
            weaponImageUrl: `https://cdn.discordapp.com/emojis/${Items_1.ItemList[Ids_1.ItemId.Pistol].Skin[Ids_1.BundleId.Default].Id}.png`,
            usedGrenade: false,
            hospitalMinutes: kind === "beatUp" ? 45 : 25,
            hospitalMinutesDelta: kind === "beatUp" ? 5 : 0,
            prisonMinutesDelta: kind === "userRobbery" ? 5 : 0,
        };
        (0, vitest_1.expect)(started.session.duelDetails).toEqual(expected);
        (0, vitest_1.expect)(MultiplayerSession_1.MultiplayerSession.GetVisibleSession(started.session.id, defender.Id, null)?.duelDetails).toEqual(expected);
        (0, vitest_1.expect)(listener).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ duelDetails: expected }));
        unsubscribe();
    });
    (0, vitest_1.it)("includes grenade use in defender-visible duel details", async () => {
        mockBeatUpLock.mockResolvedValueOnce({
            cannotRun: false,
            usedGunSkin: "",
            usedGunName: "Pistol",
            usedGrenade: true,
            timeInHospitalBase: 45,
            timeInHospitalAditional: 5,
        });
        const started = await MultiplayerSession_1.MultiplayerSession.StartBeatUp(makeUser("attacker"), makeUser("defender"), true);
        (0, vitest_1.expect)(started.success).toBe(true);
        if (!started.success)
            return;
        (0, vitest_1.expect)(started.session.duelDetails?.usedGrenade).toBe(true);
    });
    (0, vitest_1.it)("accepts only one defender response from the target and resolves it once", async () => {
        const attacker = makeUser("attacker");
        const defender = makeUser("defender");
        const otherPlayer = makeUser("other");
        const removed = vitest_1.vi.fn();
        const unsubscribe = MultiplayerSession_1.MultiplayerSession.Subscribe(defender.Id, null, vitest_1.vi.fn(), removed);
        const started = await MultiplayerSession_1.MultiplayerSession.StartBeatUp(attacker, defender, false);
        (0, vitest_1.expect)(started.success).toBe(true);
        if (!started.success)
            return;
        (0, vitest_1.expect)((await MultiplayerSession_1.MultiplayerSession.Respond(started.session.id, otherPlayer.Id, "fight")).success).toBe(false);
        (0, vitest_1.expect)((await MultiplayerSession_1.MultiplayerSession.Respond(started.session.id, defender.Id, "fight")).success).toBe(true);
        (0, vitest_1.expect)((await MultiplayerSession_1.MultiplayerSession.Respond(started.session.id, defender.Id, "run")).success).toBe(false);
        const completedPromise = MultiplayerSession_1.MultiplayerSession.WaitForCompletion(started.session.id);
        await vitest_1.vi.advanceTimersByTimeAsync(45_000);
        const completed = await completedPromise;
        (0, vitest_1.expect)(completed.phase).toBe("completed");
        (0, vitest_1.expect)(mockBeatUpResolve).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(mockBeatUpResolve).toHaveBeenCalledWith("fight");
        (0, vitest_1.expect)(mockBeatUpRelease).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(mockRepository.Finish).toHaveBeenCalledWith(started.session.id, "completed", vitest_1.expect.any(Object));
        await vitest_1.vi.advanceTimersByTimeAsync(10 * 60_000);
        (0, vitest_1.expect)(removed).toHaveBeenCalledWith(started.session.id);
        unsubscribe();
    });
    (0, vitest_1.it)("defaults a missing user-robbery response to do nothing", async () => {
        const attacker = makeUser("attacker");
        const defender = makeUser("defender");
        const started = await MultiplayerSession_1.MultiplayerSession.StartUserRobbery(attacker, defender, false);
        (0, vitest_1.expect)(started.success).toBe(true);
        if (!started.success)
            return;
        const completedPromise = MultiplayerSession_1.MultiplayerSession.WaitForCompletion(started.session.id);
        await vitest_1.vi.advanceTimersByTimeAsync(60_000);
        const completed = await completedPromise;
        (0, vitest_1.expect)(completed.phase).toBe("completed");
        (0, vitest_1.expect)(mockRobberyResolve).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(mockRobberyResolve).toHaveBeenCalledWith("nothing");
        (0, vitest_1.expect)(mockRobberyRelease).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)("starts roulette only at five players and rejects joins after the room closes", async () => {
        const host = makeUser("host");
        const started = await MultiplayerSession_1.MultiplayerSession.StartRussianRoulette(host, 5_000);
        (0, vitest_1.expect)(started.success).toBe(true);
        if (!started.success)
            return;
        (0, vitest_1.expect)((await MultiplayerSession_1.MultiplayerSession.StartRussianRoulette(host, 5_000)).success).toBe(false);
        const otherRoom = await MultiplayerSession_1.MultiplayerSession.StartRussianRoulette(makeUser("other-host"), 5_000);
        (0, vitest_1.expect)(otherRoom.success).toBe(true);
        if (!otherRoom.success)
            return;
        let lastSessionId = started.session.id;
        for (const id of ["two", "three", "four", "five"]) {
            const participant = makeUser(id);
            const joined = await MultiplayerSession_1.MultiplayerSession.JoinRussianRoulette(lastSessionId, participant);
            (0, vitest_1.expect)(joined.success).toBe(true);
            lastSessionId = joined.session?.id ?? lastSessionId;
            if (id === "two") {
                (0, vitest_1.expect)((await MultiplayerSession_1.MultiplayerSession.JoinRussianRoulette(otherRoom.session.id, participant)).success).toBe(false);
            }
        }
        const running = MultiplayerSession_1.MultiplayerSession.GetVisibleSession(started.session.id, host.Id, null);
        (0, vitest_1.expect)(running?.phase).toBe("running");
        (0, vitest_1.expect)(running?.participants).toHaveLength(5);
        (0, vitest_1.expect)((await MultiplayerSession_1.MultiplayerSession.JoinRussianRoulette(started.session.id, makeUser("six"))).success).toBe(false);
    });
    (0, vitest_1.it)("uses Portuguese eligibility messages for web roulette rooms", async () => {
        const host = makeUser("host");
        host.Language = Language_1.Language.English;
        const message = "Você está trabalhando e não pode apostar.";
        mockCasinoCanPlay.mockResolvedValueOnce({ canPlay: false, message });
        const result = await MultiplayerSession_1.MultiplayerSession.StartRussianRoulette(host, 5_000, "web");
        (0, vitest_1.expect)(mockCasinoCanPlay).toHaveBeenCalledWith(host, 5_000, Language_1.Language.Portuguese);
        (0, vitest_1.expect)(result).toEqual({ success: false, message });
    });
    (0, vitest_1.it)("returns the Portuguese eligibility message when joining a web roulette room", async () => {
        const started = await MultiplayerSession_1.MultiplayerSession.StartRussianRoulette(makeUser("host"), 5_000);
        (0, vitest_1.expect)(started.success).toBe(true);
        if (!started.success)
            return;
        const participant = makeUser("participant");
        participant.Language = Language_1.Language.English;
        const message = "Você está trabalhando e não pode apostar.";
        mockCasinoCanPlay.mockResolvedValueOnce({ canPlay: false, message });
        const result = await MultiplayerSession_1.MultiplayerSession.Join(started.session.id, participant);
        (0, vitest_1.expect)(mockCasinoCanPlay).toHaveBeenCalledWith(participant, 5_000, Language_1.Language.Portuguese);
        (0, vitest_1.expect)(result).toMatchObject({ success: false, message });
    });
    (0, vitest_1.it)("waits for an in-flight investment defense before resolving on timeout", async () => {
        const leader = makeUser("leader");
        const defender = makeUser("defender");
        mockGetGangByUserId.mockResolvedValue({
            Id: 1,
            Name: "Gang",
            LastInvestmentRobbery: null,
            GetMaxMembers: () => 5,
            UpdateLastInvestmentRobbery: vitest_1.vi.fn(),
        });
        mockInvestmentOutcome.mockResolvedValue({ win: false });
        const started = await MultiplayerSession_1.MultiplayerSession.StartInvestmentRobbery(leader, defender);
        (0, vitest_1.expect)(started.success).toBe(true);
        if (!started.success)
            return;
        (0, vitest_1.expect)(defender.IsDefendingInvestment()).toBe(true);
        (0, vitest_1.expect)(defender.IsIdling()).toBe(false);
        await vitest_1.vi.advanceTimersByTimeAsync(60_000);
        let finishDefenderLoad;
        vitest_1.vi.mocked(defender.GetInfo).mockReturnValueOnce(new Promise(resolve => {
            finishDefenderLoad = () => resolve(defender);
        }));
        const response = MultiplayerSession_1.MultiplayerSession.Respond(started.session.id, defender.Id, "defend");
        const completedPromise = MultiplayerSession_1.MultiplayerSession.WaitForCompletion(started.session.id);
        await vitest_1.vi.advanceTimersByTimeAsync(60_000);
        (0, vitest_1.expect)(mockInvestmentOutcome).not.toHaveBeenCalled();
        finishDefenderLoad();
        (0, vitest_1.expect)((await response).success).toBe(true);
        (0, vitest_1.expect)((await completedPromise).phase).toBe("completed");
        (0, vitest_1.expect)(mockInvestmentOutcome).toHaveBeenCalledWith(true);
        (0, vitest_1.expect)(defender.IsDefendingInvestment()).toBe(false);
    });
    (0, vitest_1.it)("locks investment targets during the lobby and rejects overlapping incoming actions", async () => {
        const defender = makeUser("defender");
        mockGetGangByUserId.mockResolvedValue({
            Id: 1,
            Name: "Gang",
            LastInvestmentRobbery: null,
            GetMaxMembers: () => 5,
            UpdateLastInvestmentRobbery: vitest_1.vi.fn(),
        });
        mockInvestmentOutcome.mockResolvedValue({ win: false });
        const started = await MultiplayerSession_1.MultiplayerSession.StartInvestmentRobbery(makeUser("leader"), defender);
        (0, vitest_1.expect)(started.success).toBe(true);
        if (!started.success)
            return;
        (0, vitest_1.expect)(started.session.phase).toBe("lobby");
        (0, vitest_1.expect)(defender.Update).toHaveBeenCalledWith({ robberyInvestmentDefending: true });
        (0, vitest_1.expect)(defender.CheckAvailability()).toEqual({ available: false, reason: "defendingInvestment" });
        mockGetGangByUserId.mockResolvedValue({
            Id: 2,
            Name: "Other gang",
            LastInvestmentRobbery: null,
            GetMaxMembers: () => 5,
        });
        const staleDefender = makeUser(defender.Id);
        (0, vitest_1.expect)((await MultiplayerSession_1.MultiplayerSession.StartInvestmentRobbery(makeUser("other-leader"), staleDefender)).success).toBe(false);
        (0, vitest_1.expect)((await MultiplayerSession_1.MultiplayerSession.StartBeatUp(makeUser("attacker"), staleDefender, false)).success).toBe(false);
        (0, vitest_1.expect)((await MultiplayerSession_1.MultiplayerSession.StartUserRobbery(makeUser("robber"), staleDefender, false)).success).toBe(false);
        const completed = MultiplayerSession_1.MultiplayerSession.WaitForCompletion(started.session.id);
        await vitest_1.vi.advanceTimersByTimeAsync(120_000);
        (0, vitest_1.expect)((await completed).phase).toBe("completed");
        (0, vitest_1.expect)(mockInvestmentOutcome).toHaveBeenCalledWith(false);
        (0, vitest_1.expect)(defender.IsDefendingInvestment()).toBe(false);
    });
    (0, vitest_1.it)("rejects an investment attack while another incoming action is active", async () => {
        const defender = makeUser("defender");
        await MultiplayerSession_1.MultiplayerSession.StartBeatUp(makeUser("attacker"), defender, false);
        mockGetGangByUserId.mockResolvedValue({
            Id: 1,
            Name: "Gang",
            LastInvestmentRobbery: null,
            GetMaxMembers: () => 5,
        });
        (0, vitest_1.expect)((await MultiplayerSession_1.MultiplayerSession.StartInvestmentRobbery(makeUser("leader"), defender)).success).toBe(false);
        (0, vitest_1.expect)(defender.IsDefendingInvestment()).toBe(false);
    });
    vitest_1.it.each([
        [InvestmentRobbery_1.InvestmentRobberyReason.LeaderNotIdling, "Você precisa estar vadiando para iniciar um roubo."],
        [InvestmentRobbery_1.InvestmentRobberyReason.TargetSameGang, "O alvo está na sua gangue."],
    ])("returns a specific investment robbery validation message", async (reason, message) => {
        mockGetGangByUserId.mockResolvedValue({
            Id: 1,
            Name: "Gang",
            LastInvestmentRobbery: null,
            GetMaxMembers: () => 5,
        });
        mockInvestmentValidation.mockResolvedValue({ success: false, reason });
        const result = await MultiplayerSession_1.MultiplayerSession.StartInvestmentRobbery(makeUser("leader"), makeUser("target"));
        (0, vitest_1.expect)(result).toEqual({ success: false, message });
    });
    (0, vitest_1.it)("returns the specific gang heist validation message", async () => {
        const leader = makeUser("leader");
        leader.GangId = 1;
        mockGetGangById.mockResolvedValue({ Id: 1, Name: "Gang" });
        vitest_1.vi.spyOn(Heist_1.Heist, "ValidateStart").mockResolvedValue({ success: false, reason: "noBase" });
        const result = await MultiplayerSession_1.MultiplayerSession.StartGangHeist(leader, Heist_2.HeistMissionId.Blueprint);
        (0, vitest_1.expect)(result).toEqual({
            success: false,
            message: "Sua gangue não pode realizar um golpe sem uma base.",
        });
    });
    (0, vitest_1.it)("returns gang heist cooldown details when buying getaway cars", async () => {
        const leader = makeUser("leader");
        leader.GangId = 1;
        mockGetGangById.mockResolvedValue({ Id: 1, Name: "Gang" });
        vitest_1.vi.spyOn(Heist_1.Heist, "ValidateStart").mockResolvedValue({
            success: false,
            reason: "missionCooldown",
            time: new Date(Date.now() + 60_000),
        });
        const result = await MultiplayerSession_1.MultiplayerSession.BuyGangHeistGetawayCars(leader);
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.message).toContain("Sua gangue deve esperar ");
        (0, vitest_1.expect)(result.message).toContain("para tentar esta missão novamente.");
    });
    (0, vitest_1.it)("clears the defender lock when investment attack startup fails or the session stops", async () => {
        const defender = makeUser("defender");
        mockGetGangByUserId.mockResolvedValue({
            Id: 1,
            Name: "Gang",
            LastInvestmentRobbery: null,
            GetMaxMembers: () => 5,
        });
        const failure = new Error("Failed to persist defender lock");
        vitest_1.vi.mocked(defender.Update).mockRejectedValueOnce(failure);
        await (0, vitest_1.expect)(MultiplayerSession_1.MultiplayerSession.StartInvestmentRobbery(makeUser("leader"), defender)).rejects.toThrow(failure);
        (0, vitest_1.expect)(defender.IsDefendingInvestment()).toBe(false);
        (0, vitest_1.expect)(mockRepository.Finish).toHaveBeenCalledWith(vitest_1.expect.any(String), "aborted", { reason: "start-failed" });
        (0, vitest_1.expect)((await MultiplayerSession_1.MultiplayerSession.StartInvestmentRobbery(makeUser("leader"), defender)).success).toBe(true);
        (0, vitest_1.expect)(defender.IsDefendingInvestment()).toBe(true);
        await MultiplayerSession_1.MultiplayerSession.Stop();
        (0, vitest_1.expect)(defender.IsDefendingInvestment()).toBe(false);
    });
    (0, vitest_1.it)("aborts persisted sessions and clears their locks during startup", async () => {
        const record = {
            id: "stale-session",
            kind: "beatUp",
            ownerId: "attacker",
            targetId: "defender",
            gangId: null,
            participantIds: ["attacker"],
            phase: "awaitingDefender",
            status: "active",
            expiresAt: new Date(),
            result: null,
            createdAt: new Date(),
        };
        mockRepository.FindActive.mockResolvedValue([record]);
        await MultiplayerSession_1.MultiplayerSession.Initialize();
        (0, vitest_1.expect)(mockRepository.ReleaseLocks).toHaveBeenCalledWith(record);
        (0, vitest_1.expect)(mockRepository.Finish).toHaveBeenCalledWith("stale-session", "aborted", { reason: "process-restart" });
        (0, vitest_1.expect)(mockRepository.PruneFinished).toHaveBeenCalledWith(vitest_1.expect.any(Date));
    });
});
//# sourceMappingURL=MultiplayerSession.test.js.map