import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { User } from "#core/models/User";
import { MultiplayerSession } from "#core/models/MultiplayerSession";
import { ItemList } from "#core/types/Items";
import { BundleId, ItemId } from "#core/types/Ids";
import { Language } from "#core/models/Language";

const {
	mockCanBeatUser,
	mockBeatUpLock,
	mockBeatUpResolve,
	mockBeatUpRelease,
	mockCanRob,
	mockRobberyLock,
	mockRobberyResolve,
	mockRobberyRelease,
	mockCasinoCanPlay,
	mockCasinoStart,
	mockRepository,
	mockGetGangByUserId,
	mockInvestmentOutcome,
} = vi.hoisted(() => ({
	mockGetGangByUserId: vi.fn(),
	mockInvestmentOutcome: vi.fn(),
	mockCanBeatUser: vi.fn(),
	mockBeatUpLock: vi.fn(),
	mockBeatUpResolve: vi.fn(),
	mockBeatUpRelease: vi.fn(),
	mockCanRob: vi.fn(),
	mockRobberyLock: vi.fn(),
	mockRobberyResolve: vi.fn(),
	mockRobberyRelease: vi.fn(),
	mockCasinoCanPlay: vi.fn(),
	mockCasinoStart: vi.fn(),
	mockRepository: {
		Create: vi.fn(),
		Update: vi.fn(),
		Finish: vi.fn(),
		FindActive: vi.fn(),
		PruneFinished: vi.fn(),
		ReleaseLocks: vi.fn(),
	},
}));

vi.mock("#core/models/BeatUp", () => ({
	BeatUp: class {
		CanBeatUser() {
			return mockCanBeatUser();
		}
		LockStates(useGrenade: boolean) {
			return mockBeatUpLock(useGrenade);
		}
		Resolve(response: string) {
			return mockBeatUpResolve(response);
		}
		ReleaseLocks() {
			return mockBeatUpRelease();
		}
	},
}));

vi.mock("#core/models/strategies/robbery/UserRobberyStrategy", () => ({
	UserRobberyStrategy: class {
		CanRob() {
			return mockCanRob();
		}
		LockStates(useGrenade: boolean) {
			return mockRobberyLock(useGrenade);
		}
		Resolve(response: string) {
			return mockRobberyResolve(response);
		}
		ReleaseLocks() {
			return mockRobberyRelease();
		}
	},
}));

vi.mock("#core/models/Casino", () => ({
	Casino: {
		CanUserPlayGame: mockCasinoCanPlay,
		StartUserGame: mockCasinoStart,
		FinishUserGameWithWin: vi.fn(),
		FinishUserGameWithLoss: vi.fn(),
	},
}));

vi.mock("#core/models/Gang", () => ({
	Gang: { GetByUserId: mockGetGangByUserId },
}));

vi.mock("#core/models/InvestmentRobbery", async importOriginal => {
	const actual = await importOriginal<typeof import("#core/models/InvestmentRobbery")>();
	return {
		InvestmentRobbery: class {
			constructor(_gang: unknown, _leader: User, public Target: User) {}
			Participants = new Map();
			InvestmentBase = { Name: { 0: "Bar", 1: "Bar", 2: "Bar" }, ImageUrl: "" };
			InvestmentData = { accumulatedYield: 1_000 };
			Validate = () => ({ success: true });
			ApplyAttackerState = vi.fn();
			ApplyDefenderState = vi.fn(actual.InvestmentRobbery.prototype.ApplyDefenderState);
			ClearTargetState = vi.fn(actual.InvestmentRobbery.prototype.ClearTargetState);
			ClearAttackerStates = vi.fn(async () => {
				await this.ClearTargetState();
			});
			Abort = vi.fn(async () => {
				await this.ClearAttackerStates();
			});
			CalculateAndApplyOutcome = mockInvestmentOutcome;
		},
	};
});

vi.mock("#core/repositories/MultiplayerSessionRepository", () => ({
	MultiplayerSessionRepository: mockRepository,
}));

function makeUser(id: string): User {
	const user = new User(id);
	user.Nickname = `Player ${id}`;
	user.Money = 50_000;
	vi.spyOn(user, "GetInfo").mockResolvedValue(user);
	vi.spyOn(user, "Update").mockResolvedValue(true);
	return user;
}

describe("Multiplayer sessions", () => {
	beforeEach(async () => {
		vi.useFakeTimers();
		vi.clearAllMocks();
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
		await MultiplayerSession.Stop();
	});

	afterEach(async () => {
		await MultiplayerSession.Stop();
		vi.useRealTimers();
	});

	it.each(["beatUp", "userRobbery"] as const)("includes weapon and response consequences in %s queries and updates", async kind => {
		const attacker = makeUser("attacker");
		const defender = makeUser("defender");
		attacker.BestGun = {
			...ItemList[ItemId.Pistol],
			SelectedSkin: BundleId.Default,
			RemainingTime: new Date(),
			Quantity: 1,
		};
		const listener = vi.fn();
		const unsubscribe = MultiplayerSession.Subscribe(defender.Id, null, listener);
		const started = kind === "beatUp"
			? await MultiplayerSession.StartBeatUp(attacker, defender, false)
			: await MultiplayerSession.StartUserRobbery(attacker, defender, false);
		expect(started.success).toBe(true);
		if (!started.success) return;
		const expected = {
			weaponName: ItemList[ItemId.Pistol].Description[Language.Portuguese],
			weaponImageUrl: `https://cdn.discordapp.com/emojis/${ItemList[ItemId.Pistol].Skin[BundleId.Default].Id}.png`,
			usedGrenade: false,
			hospitalMinutes: kind === "beatUp" ? 45 : 25,
			hospitalMinutesDelta: kind === "beatUp" ? 5 : 0,
			prisonMinutesDelta: kind === "userRobbery" ? 5 : 0,
		};
		expect(started.session.duelDetails).toEqual(expected);
		expect(MultiplayerSession.GetVisibleSession(started.session.id, defender.Id, null)?.duelDetails).toEqual(expected);
		expect(listener).toHaveBeenCalledWith(expect.objectContaining({ duelDetails: expected }));
		unsubscribe();
	});

	it("includes grenade use in defender-visible duel details", async () => {
		mockBeatUpLock.mockResolvedValueOnce({
			cannotRun: false,
			usedGunSkin: "",
			usedGunName: "Pistol",
			usedGrenade: true,
			timeInHospitalBase: 45,
			timeInHospitalAditional: 5,
		});

		const started = await MultiplayerSession.StartBeatUp(makeUser("attacker"), makeUser("defender"), true);

		expect(started.success).toBe(true);
		if (!started.success) return;
		expect(started.session.duelDetails?.usedGrenade).toBe(true);
	});

	it("accepts only one defender response from the target and resolves it once", async () => {
		const attacker = makeUser("attacker");
		const defender = makeUser("defender");
		const otherPlayer = makeUser("other");
		const removed = vi.fn();
		const unsubscribe = MultiplayerSession.Subscribe(defender.Id, null, vi.fn(), removed);
		const started = await MultiplayerSession.StartBeatUp(attacker, defender, false);

		expect(started.success).toBe(true);
		if (!started.success) return;

		expect((await MultiplayerSession.Respond(started.session.id, otherPlayer.Id, "fight")).success).toBe(false);
		expect((await MultiplayerSession.Respond(started.session.id, defender.Id, "fight")).success).toBe(true);
		expect((await MultiplayerSession.Respond(started.session.id, defender.Id, "run")).success).toBe(false);

		const completedPromise = MultiplayerSession.WaitForCompletion(started.session.id);
		await vi.advanceTimersByTimeAsync(45_000);
		const completed = await completedPromise;

		expect(completed.phase).toBe("completed");
		expect(mockBeatUpResolve).toHaveBeenCalledTimes(1);
		expect(mockBeatUpResolve).toHaveBeenCalledWith("fight");
		expect(mockBeatUpRelease).toHaveBeenCalledTimes(1);
		expect(mockRepository.Finish).toHaveBeenCalledWith(started.session.id, "completed", expect.any(Object));

		await vi.advanceTimersByTimeAsync(10 * 60_000);
		expect(removed).toHaveBeenCalledWith(started.session.id);
		unsubscribe();
	});

	it("defaults a missing user-robbery response to do nothing", async () => {
		const attacker = makeUser("attacker");
		const defender = makeUser("defender");
		const started = await MultiplayerSession.StartUserRobbery(attacker, defender, false);

		expect(started.success).toBe(true);
		if (!started.success) return;

		const completedPromise = MultiplayerSession.WaitForCompletion(started.session.id);
		await vi.advanceTimersByTimeAsync(60_000);
		const completed = await completedPromise;

		expect(completed.phase).toBe("completed");
		expect(mockRobberyResolve).toHaveBeenCalledTimes(1);
		expect(mockRobberyResolve).toHaveBeenCalledWith("nothing");
		expect(mockRobberyRelease).toHaveBeenCalledTimes(1);
	});

	it("starts roulette only at five players and rejects joins after the room closes", async () => {
		const host = makeUser("host");
		const started = await MultiplayerSession.StartRussianRoulette(host, 5_000);
		expect(started.success).toBe(true);
		if (!started.success) return;
		expect((await MultiplayerSession.StartRussianRoulette(host, 5_000)).success).toBe(false);

		const otherRoom = await MultiplayerSession.StartRussianRoulette(makeUser("other-host"), 5_000);
		expect(otherRoom.success).toBe(true);
		if (!otherRoom.success) return;

		let lastSessionId = started.session.id;
		for (const id of ["two", "three", "four", "five"]) {
			const participant = makeUser(id);
			const joined = await MultiplayerSession.JoinRussianRoulette(lastSessionId, participant);
			expect(joined.success).toBe(true);
			lastSessionId = joined.session?.id ?? lastSessionId;
			if (id === "two") {
				expect((await MultiplayerSession.JoinRussianRoulette(otherRoom.session.id, participant)).success).toBe(false);
			}
		}

		const running = MultiplayerSession.GetVisibleSession(started.session.id, host.Id, null);
		expect(running?.phase).toBe("running");
		expect(running?.participants).toHaveLength(5);
		expect((await MultiplayerSession.JoinRussianRoulette(started.session.id, makeUser("six"))).success).toBe(false);
	});

	it("waits for an in-flight investment defense before resolving on timeout", async () => {
		const leader = makeUser("leader");
		const defender = makeUser("defender");
		mockGetGangByUserId.mockResolvedValue({
			Id: 1,
			Name: "Gang",
			LastInvestmentRobbery: null,
			GetMaxMembers: () => 5,
			UpdateLastInvestmentRobbery: vi.fn(),
		});
		mockInvestmentOutcome.mockResolvedValue({ win: false });
		const started = await MultiplayerSession.StartInvestmentRobbery(leader, defender);
		expect(started.success).toBe(true);
		if (!started.success) return;
		expect(defender.IsDefendingInvestment()).toBe(true);
		expect(defender.IsIdling()).toBe(false);
		await vi.advanceTimersByTimeAsync(60_000);

		let finishDefenderLoad!: () => void;
		vi.mocked(defender.GetInfo).mockReturnValueOnce(new Promise(resolve => {
			finishDefenderLoad = () => resolve(defender);
		}));
		const response = MultiplayerSession.Respond(started.session.id, defender.Id, "defend");
		const completedPromise = MultiplayerSession.WaitForCompletion(started.session.id);
		await vi.advanceTimersByTimeAsync(60_000);
		expect(mockInvestmentOutcome).not.toHaveBeenCalled();

		finishDefenderLoad();
		expect((await response).success).toBe(true);
		expect((await completedPromise).phase).toBe("completed");
		expect(mockInvestmentOutcome).toHaveBeenCalledWith(true);
		expect(defender.IsDefendingInvestment()).toBe(false);
	});

	it("locks investment targets during the lobby and rejects overlapping incoming actions", async () => {
		const defender = makeUser("defender");
		mockGetGangByUserId.mockResolvedValue({
			Id: 1,
			Name: "Gang",
			LastInvestmentRobbery: null,
			GetMaxMembers: () => 5,
			UpdateLastInvestmentRobbery: vi.fn(),
		});
		mockInvestmentOutcome.mockResolvedValue({ win: false });
		const started = await MultiplayerSession.StartInvestmentRobbery(makeUser("leader"), defender);
		expect(started.success).toBe(true);
		if (!started.success) return;
		expect(started.session.phase).toBe("lobby");
		expect(defender.Update).toHaveBeenCalledWith({ robberyInvestmentDefending: true });
		expect(defender.CheckAvailability()).toEqual({ available: false, reason: "defendingInvestment" });

		mockGetGangByUserId.mockResolvedValue({
			Id: 2,
			Name: "Other gang",
			LastInvestmentRobbery: null,
			GetMaxMembers: () => 5,
		});
		const staleDefender = makeUser(defender.Id);
		expect((await MultiplayerSession.StartInvestmentRobbery(makeUser("other-leader"), staleDefender)).success).toBe(false);
		expect((await MultiplayerSession.StartBeatUp(makeUser("attacker"), staleDefender, false)).success).toBe(false);
		expect((await MultiplayerSession.StartUserRobbery(makeUser("robber"), staleDefender, false)).success).toBe(false);

		const completed = MultiplayerSession.WaitForCompletion(started.session.id);
		await vi.advanceTimersByTimeAsync(120_000);
		expect((await completed).phase).toBe("completed");
		expect(mockInvestmentOutcome).toHaveBeenCalledWith(false);
		expect(defender.IsDefendingInvestment()).toBe(false);
	});

	it("rejects an investment attack while another incoming action is active", async () => {
		const defender = makeUser("defender");
		await MultiplayerSession.StartBeatUp(makeUser("attacker"), defender, false);
		mockGetGangByUserId.mockResolvedValue({
			Id: 1,
			Name: "Gang",
			LastInvestmentRobbery: null,
			GetMaxMembers: () => 5,
		});
		expect((await MultiplayerSession.StartInvestmentRobbery(makeUser("leader"), defender)).success).toBe(false);
		expect(defender.IsDefendingInvestment()).toBe(false);
	});

	it("clears the defender lock when investment attack startup fails or the session stops", async () => {
		const defender = makeUser("defender");
		mockGetGangByUserId.mockResolvedValue({
			Id: 1,
			Name: "Gang",
			LastInvestmentRobbery: null,
			GetMaxMembers: () => 5,
		});
		const failure = new Error("Failed to persist defender lock");
		vi.mocked(defender.Update).mockRejectedValueOnce(failure);
		await expect(MultiplayerSession.StartInvestmentRobbery(makeUser("leader"), defender)).rejects.toThrow(failure);
		expect(defender.IsDefendingInvestment()).toBe(false);
		expect(mockRepository.Finish).toHaveBeenCalledWith(expect.any(String), "aborted", { reason: "start-failed" });

		expect((await MultiplayerSession.StartInvestmentRobbery(makeUser("leader"), defender)).success).toBe(true);
		expect(defender.IsDefendingInvestment()).toBe(true);
		await MultiplayerSession.Stop();
		expect(defender.IsDefendingInvestment()).toBe(false);
	});

	it("aborts persisted sessions and clears their locks during startup", async () => {
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

		await MultiplayerSession.Initialize();

		expect(mockRepository.ReleaseLocks).toHaveBeenCalledWith(record);
		expect(mockRepository.Finish).toHaveBeenCalledWith("stale-session", "aborted", { reason: "process-restart" });
		expect(mockRepository.PruneFinished).toHaveBeenCalledWith(expect.any(Date));
	});
});
