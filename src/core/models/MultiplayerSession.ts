import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { setTimeout as wait } from "node:timers/promises";
import { addHours } from "date-fns/addHours";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import type { BeatUpInitData } from "#core/models/BeatUp";
import { BeatUp } from "#core/models/BeatUp";
import { Casino } from "#core/models/Casino";
import { ClassId, ClassList } from "#core/types/Classes";
import { Gang } from "#core/models/Gang";
import { Heist } from "#core/models/Heist";
import {
	InvestmentRobbery,
	InvestmentRobberyReason,
	type InvestmentRobberyResult,
} from "#core/models/InvestmentRobbery";
import { HeistMissionId } from "#core/types/Heist";
import type { RobberyInitData } from "#core/types/Robbery";
import { UserRobberyStrategy } from "#core/models/strategies/robbery/UserRobberyStrategy";
import type { User } from "#core/models/User";
import { getLocaleFromLanguage, Language, type Localization } from "#core/models/Language";
import { logger } from "#shared/log";
import {
	MultiplayerSessionRepository,
	type MultiplayerSessionKind,
} from "#core/repositories/MultiplayerSessionRepository";

export interface MultiplayerSessionPlayer {
	userId: string;
	nickname: string;
	attack: number;
	classId: number;
}

export interface MultiplayerSessionView {
	id: string;
	kind: MultiplayerSessionKind;
	phase: string;
	source: "discord" | "web";
	ownerId: string;
	targetId: string | null;
	targetNickname: string | null;
	gangId: number | null;
	gangName: string | null;
	investmentName: string | null;
	investmentImageUrl: string | null;
	investmentYield: number | null;
	hasHenchman: boolean;
	participants: MultiplayerSessionPlayer[];
	maxParticipants: number;
	bet: number | null;
	missionId: number | null;
	expiresAt: string | null;
	response: string | null;
	allowedResponses: string[];
	events: Array<{ type: string; userId: string | null; outcome: string | null }>;
	aliveUserIds: string[];
	result: string | null;
	duelDetails: {
		weaponName: string;
		weaponEmoji: string;
		weaponImageUrl: string | null;
		usedGrenade: boolean;
		hospitalMinutes: number;
		hospitalMinutesDelta: number;
		prisonMinutesDelta: number;
	} | null;
}

type RuntimeBase = {
	id: string;
	kind: MultiplayerSessionKind;
	source: "discord" | "web";
	owner: User;
	target: User | null;
	gang: Gang | null;
	participants: Map<string, User>;
	phase: string;
	maxParticipants: number;
	expiresAt: Date | null;
	timer: NodeJS.Timeout | null;
	task: Promise<void> | null;
	response: string | null;
	allowedResponses: string[];
	result: unknown;
	events: Array<{ type: string; userId: string | null; outcome: string | null }>;
	aliveUserIds: string[];
	lockedUserIds: Set<string>;
	bet: number | null;
	missionId: number | null;
	gangId: number | null;
	gangName: string | null;
	investmentName: string | null;
	investmentImageUrl: string | null;
	investmentYield: number | null;
	hasHenchman: boolean;
};

type BeatUpSession = RuntimeBase & {
	kind: "beatUp";
	target: User;
	model: BeatUp;
	initData: BeatUpInitData;
};

type UserRobberySession = RuntimeBase & {
	kind: "userRobbery";
	target: User;
	model: UserRobberyStrategy;
	initData: RobberyInitData;
};

type RussianRouletteSession = RuntimeBase & {
	kind: "russianRoulette";
	target: null;
	bet: number;
};

type InvestmentRobberySession = RuntimeBase & {
	kind: "investmentRobbery";
	target: User;
	gang: Gang;
	model: InvestmentRobbery;
	defenderJoined: boolean;
	responseTask: Promise<void> | null;
};

type GangHeistSession = RuntimeBase & {
	kind: "gangHeist";
	target: null;
	gang: Gang;
	missionId: HeistMissionId;
};

type RuntimeSession =
	| BeatUpSession
	| UserRobberySession
	| RussianRouletteSession
	| InvestmentRobberySession
	| GangHeistSession;

const investmentRobberyStartMessages: Partial<Record<InvestmentRobberyReason, string>> = {
	[InvestmentRobberyReason.NoPermission]: "Você não tem permissão para iniciar um roubo.",
	[InvestmentRobberyReason.CantRobYourself]: "Você não pode roubar seu próprio investimento.",
	[InvestmentRobberyReason.LeaderNotIdling]: "Você precisa estar vadiando para iniciar um roubo.",
	[InvestmentRobberyReason.TargetSameGang]: "O alvo está na sua gangue.",
	[InvestmentRobberyReason.WithoutItem]: "Você não pode roubar sem uma arma.",
	[InvestmentRobberyReason.TargetWithoutNick]: "O alvo não tem um nickname.",
	[InvestmentRobberyReason.TargetWithoutClass]: "O alvo não tem uma classe.",
	[InvestmentRobberyReason.TargetAlreadyUnderAttack]: "O alvo já está sendo atacado.",
	[InvestmentRobberyReason.TargetNoInvestment]: "O alvo não tem um investimento.",
	[InvestmentRobberyReason.TargetNoYield]: "O investimento do alvo não tem lucros.",
	[InvestmentRobberyReason.LeaderIsWanted]: "Você está sendo procurado pela polícia e não pode iniciar um roubo.",
};

type HeistStartMessages = {
	onlyLeader: string;
	noBase: string;
	scheduleBlock: string;
	missionCompleted: string;
	noMoney: string;
	missionCooldown: (time: string) => string;
	heistCooldown: (time: string) => string;
};

const heistStartMessages: HeistStartMessages = {
	onlyLeader: "Somente o Líder pode orquestrar um golpe.",
	noBase: "Sua gangue não pode realizar um golpe sem uma base.",
	scheduleBlock: "Você só pode realizar o golpe principal na segunda, quarta ou sexta-feira.",
	missionCompleted: "Sua gangue já concluiu esta missão.",
	noMoney: "Sua gangue não tem dinheiro suficiente em caixa.",
	missionCooldown: time => `Sua gangue deve esperar ${time} para tentar esta missão novamente.`,
	heistCooldown: time => `Sua gangue deve esperar ${time} para tentar o golpe novamente.`,
};

function getInvestmentRobberyStartMessage(
	reason: InvestmentRobberyReason | undefined,
	fallback: string,
): string {
	return reason === undefined
		? fallback
		: investmentRobberyStartMessages[reason] ?? fallback;
}

function getHeistStartMessage(
	reason: string | undefined,
	time: Date | undefined,
	fallback: string,
): string {
	const messages = heistStartMessages;
	switch (reason) {
	case "onlyLeader":
		return messages.onlyLeader;
	case "noBase":
		return messages.noBase;
	case "scheduleBlock":
		return messages.scheduleBlock;
	case "missionCompleted":
		return messages.missionCompleted;
	case "noMoney":
		return messages.noMoney;
	case "missionCooldown":
	case "heistCooldown": {
		if (!time || !Number.isFinite(time.getTime())) return fallback;
		const relativeTime = formatDistanceToNow(time, { locale: getLocaleFromLanguage(Language.Portuguese) });
		return reason === "missionCooldown"
			? messages.missionCooldown(relativeTime)
			: messages.heistCooldown(relativeTime);
	}
	default:
		return fallback;
	}
}

export type MultiplayerStartResult<TInitData = never> =
	| { success: true; session: MultiplayerSessionView; initData?: TInitData }
	| { success: false; message: string };

export class MultiplayerSession {
	private static sessions = new Map<string, RuntimeSession>();
	private static updates = new EventEmitter().setMaxListeners(0);
	private static reservations = new Set<string>();

	static async Initialize(): Promise<void> {
		let cleanupFailure: unknown;
		for (const record of await MultiplayerSessionRepository.FindActive()) {
			try {
				await MultiplayerSessionRepository.ReleaseLocks(record);
				await MultiplayerSessionRepository.Finish(record.id, "aborted", { reason: "process-restart" });
			}
			catch (error) {
				cleanupFailure ??= error;
				logger.error(`Failed to clean up multiplayer session ${record.id} after restart: ${error}`);
			}
		}
		await MultiplayerSessionRepository.PruneFinished(new Date(Date.now() - 7 * 24 * 60 * 60_000));
		if (cleanupFailure) throw new Error("Some multiplayer session locks could not be cleaned up.", { cause: cleanupFailure });
	}

	static async Stop(): Promise<void> {
		let cleanupFailure: unknown;
		for (const session of this.sessions.values()) {
			if (session.phase === "completed" || session.phase === "aborted") continue;
			while (
				session.task &&
				(session.phase === "starting" || session.phase === "resolving" || session.phase === "settling")
			) {
				const task = session.task;
				try {
					await task;
				}
				catch (error) {
					cleanupFailure ??= error;
					logger.error(`Failed while resolving multiplayer session ${session.id} during shutdown: ${error}`);
				}
				if (session.task === task) break;
			}
			if (session.phase === "completed" || session.phase === "aborted") continue;
			try {
				await this.AbortRuntime(session, "process-shutdown");
			}
			catch (error) {
				cleanupFailure ??= error;
				logger.error(`Failed to abort multiplayer session ${session.id} during shutdown: ${error}`);
			}
		}
		this.sessions.clear();
		this.reservations.clear();
		if (cleanupFailure) throw new Error("Some multiplayer sessions could not be stopped cleanly.", { cause: cleanupFailure });
	}

	static GetVisibleSessions(userId: string, gangId: number | null): MultiplayerSessionView[] {
		return Array.from(this.sessions.values())
			.filter(session => this.IsVisibleTo(session, userId, gangId))
			.map(session => this.ToView(session));
	}

	static GetVisibleSession(sessionId: string, userId: string, gangId: number | null): MultiplayerSessionView | null {
		const session = this.sessions.get(sessionId);
		return session && this.IsVisibleTo(session, userId, gangId) ? this.ToView(session) : null;
	}

	static WaitForCompletion(sessionId: string): Promise<MultiplayerSessionView> {
		const current = this.sessions.get(sessionId);
		if (!current) return Promise.reject(new Error(`Multiplayer session ${sessionId} was not found.`));
		if (current.phase === "completed" || current.phase === "aborted") {
			return Promise.resolve(this.ToView(current));
		}

		return new Promise(resolve => {
			const handler = (session: RuntimeSession) => {
				if (session.id !== sessionId || (session.phase !== "completed" && session.phase !== "aborted")) return;
				this.updates.off("change", handler);
				resolve(this.ToView(session));
			};
			this.updates.on("change", handler);
		});
	}

	static DecodeResult<T>(serialized: string): T {
		return JSON.parse(serialized, (key, value) =>
			typeof value === "string" && key.endsWith("Time") ? new Date(value) : value) as T;
	}

	static Subscribe(
		userId: string,
		gangId: number | null,
		listener: (session: MultiplayerSessionView) => void,
		onHidden?: (sessionId: string) => void,
		visibleSessionIds = new Set<string>(),
	): () => void {
		const handler = (session: RuntimeSession, removed = false) => {
			if (!removed && this.IsVisibleTo(session, userId, gangId)) {
				visibleSessionIds.add(session.id);
				listener(this.ToView(session));
			}
			else if (visibleSessionIds.delete(session.id)) {
				onHidden?.(session.id);
			}
		};
		this.updates.on("change", handler);
		this.updates.on("removed", handler);
		return () => {
			this.updates.off("change", handler);
			this.updates.off("removed", handler);
		};
	}

	static SubscribeAll(listener: (session: MultiplayerSessionView) => void): () => void {
		const handler = (session: RuntimeSession) => listener(this.ToView(session));
		this.updates.on("change", handler);
		return () => this.updates.off("change", handler);
	}

	private static LanguageFor(user: User, source: "discord" | "web"): Language {
		return source === "web" ? Language.Portuguese : user.Language;
	}

	private static TryReserve(keys: string[]): boolean {
		const uniqueKeys = Array.from(new Set(keys));
		if (uniqueKeys.some(key => this.reservations.has(key))) return false;
		for (const key of uniqueKeys) this.reservations.add(key);
		return true;
	}

	private static TrackTask(session: RuntimeSession, task: Promise<void>): Promise<void> {
		const trackedTask = task.then(
			() => {
				if (session.task === trackedTask) session.task = null;
			},
			error => {
				if (session.task === trackedTask) session.task = null;
				throw error;
			},
		);
		session.task = trackedTask;
		return trackedTask;
	}

	private static ReleaseReservation(keys: string[]): void {
		for (const key of new Set(keys)) this.reservations.delete(key);
	}

	private static HasActiveGangSession(gangId: number): boolean {
		return Array.from(this.sessions.values()).some(session =>
			(session.kind === "investmentRobbery" || session.kind === "gangHeist") &&
			session.gangId === gangId &&
			session.phase !== "completed" &&
			session.phase !== "aborted",
		);
	}

	private static HasActiveRussianRouletteSession(userId: string): boolean {
		return Array.from(this.sessions.values()).some(session =>
			session.kind === "russianRoulette" &&
			session.phase !== "completed" &&
			session.phase !== "aborted" &&
			(session.owner.Id === userId || session.participants.has(userId)),
		);
	}

	private static HasActiveIncomingSession(userId: string): boolean {
		return Array.from(this.sessions.values()).some(session =>
			session.target?.Id === userId &&
			session.phase !== "completed" &&
			session.phase !== "aborted",
		);
	}

	static async StartBeatUp(
		attacker: User,
		defender: User,
		useGrenade: boolean,
		source: "discord" | "web" = "web",
	): Promise<MultiplayerStartResult<BeatUpInitData>> {
		const model = new BeatUp(attacker, defender);
		return this.StartDuel<BeatUpSession>("beatUp", attacker, defender, source, model, 45_000,
			async () => {
				const validation = await model.CanBeatUser();
				return validation.canBeat ? null : validation.message;
			},
			async base => {
				const initData = await model.LockStates(useGrenade || attacker.AutomaticGrenade);
				const allowedResponses = ["fight", ...(!initData.cannotRun ? ["run"] : []), "nothing"];
				return { ...base, kind: "beatUp", model, initData, allowedResponses };
			});
	}

	static async StartUserRobbery(
		attacker: User,
		defender: User,
		useGrenade: boolean,
		source: "discord" | "web" = "web",
	): Promise<MultiplayerStartResult<RobberyInitData>> {
		const model = new UserRobberyStrategy(attacker, defender);
		return this.StartDuel<UserRobberySession>("userRobbery", attacker, defender, source, model, 60_000,
			async () => {
				const validation = await model.CanRob();
				return validation.canRob ? null : validation.message;
			},
			async base => {
				const initData = await model.LockStates(useGrenade || attacker.AutomaticGrenade);
				const allowedResponses = [
					...(!initData.cannotReact ? ["react"] : []),
					...(!initData.cannotCallPolice ? ["police"] : []),
					"nothing",
				];
				return { ...base, kind: "userRobbery", model, initData, allowedResponses };
			});
	}

	private static async StartDuel<TSession extends BeatUpSession | UserRobberySession>(
		kind: TSession["kind"],
		attacker: User,
		defender: User,
		source: "discord" | "web",
		model: TSession["model"],
		timeoutMs: number,
		validate: () => Promise<string | null>,
		lockStates: (base: RuntimeBase & { kind: TSession["kind"]; target: User }) => Promise<TSession>,
	): Promise<MultiplayerStartResult<TSession["initData"]>> {
		const s = Strings[this.LanguageFor(attacker, source)];
		const reservation = [`user:${attacker.Id}`, `user:${defender.Id}`];
		if (!this.TryReserve(reservation)) return { success: false, message: s.playersBusy };
		try {
			if (this.HasActiveIncomingSession(defender.Id)) return { success: false, message: s.playersBusy };
			const validationMessage = await validate();
			if (validationMessage !== null) return { success: false, message: validationMessage };

			const base = this.CreateRuntimeBase(randomUUID(), kind, attacker, defender, 2, source);
			await this.CreateRecord(base);

			try {
				const session = await lockStates(base);
				await this.Activate(session, "awaitingDefender", timeoutMs, () => this.ResolveDuel(session));
				return { success: true, session: this.ToView(session), initData: session.initData };
			}
			catch (error) {
				try {
					await model.ReleaseLocks();
					await MultiplayerSessionRepository.Finish(base.id, "aborted", { reason: "start-failed" });
				}
				catch (cleanupError) {
					throw new AggregateError([error, cleanupError], `Failed to clean up ${kind} session ${base.id}.`);
				}
				throw error;
			}
		}
		finally {
			this.ReleaseReservation(reservation);
		}
	}

	static async StartRussianRoulette(
		host: User,
		bet: number,
		source: "discord" | "web" = "web",
	): Promise<{ success: true; session: MultiplayerSessionView } | { success: false; message: string }> {
		const s = Strings[this.LanguageFor(host, source)];
		if (!Number.isSafeInteger(bet) || bet < 5_000) {
			return { success: false, message: s.invalidBet };
		}
		const reservation = [`user:${host.Id}`];
		if (!this.TryReserve(reservation)) return { success: false, message: s.playersBusy };
		try {
			if (this.HasActiveRussianRouletteSession(host.Id)) {
				return { success: false, message: s.alreadyInRoulette };
			}
			const eligibility = await Casino.CanUserPlayGame(host, bet);
			if (!eligibility.canPlay) return { success: false, message: eligibility.message };

			const id = randomUUID();
			const base = this.CreateRuntimeBase(id, "russianRoulette", host, null, 5, source);
			const session: RussianRouletteSession = { ...base, kind: "russianRoulette", target: null, bet };
			await this.CreateRecord(session);
			try {
				await this.Activate(session, "lobby", 60_000, () => this.AbortRuntime(session, "lobby-timeout"));
			}
			catch (error) {
				await MultiplayerSessionRepository.Finish(id, "aborted", { reason: "start-failed" });
				throw error;
			}
			return { success: true, session: this.ToView(session) };
		}
		finally {
			this.ReleaseReservation(reservation);
		}
	}

	static async JoinRussianRoulette(
		sessionId: string,
		participant: User,
		language = Language.Portuguese,
	): Promise<{ success: boolean; message: string; session?: MultiplayerSessionView }> {
		const s = Strings[language];
		const reservation = [`user:${participant.Id}`, `session:${sessionId}`];
		if (!this.TryReserve(reservation)) return { success: false, message: s.roomBusy };
		try {
			const session = this.sessions.get(sessionId);
			if (!session || session.kind !== "russianRoulette" || session.phase !== "lobby") {
				return { success: false, message: s.roomUnavailable };
			}
			if (session.participants.has(participant.Id)) {
				return { success: false, message: s.alreadyInRoom };
			}
			if (this.HasActiveRussianRouletteSession(participant.Id)) {
				return { success: false, message: s.alreadyInRoulette };
			}
			if (session.participants.size >= session.maxParticipants) {
				return { success: false, message: s.roomFull };
			}

			const eligibility = await Casino.CanUserPlayGame(participant, session.bet);
			if (!eligibility.canPlay) return { success: false, message: eligibility.message };
			if (session.phase !== "lobby" || session.participants.has(participant.Id) || session.participants.size >= session.maxParticipants) {
				return { success: false, message: s.roomUnavailable };
			}

			session.participants.set(participant.Id, participant);
			await this.RenewLobby(session);
			const currentSession = this.sessions.get(sessionId);
			if (!currentSession || currentSession.phase !== "lobby") {
				return { success: false, message: s.roomUnavailable };
			}
			if (session.participants.size === session.maxParticipants) {
				await this.TrackTask(session, this.StartRussianRouletteGame(session));
				const startedSession = this.sessions.get(sessionId);
				if (!startedSession || startedSession.phase === "aborted" || startedSession.phase === "aborting") {
					return { success: false, message: s.roomStartFailed };
				}
			}
			return { success: true, message: s.joined, session: this.ToView(session) };
		}
		finally {
			this.ReleaseReservation(reservation);
		}
	}

	static async StartInvestmentRobbery(
		initializer: User,
		target: User,
		source: "discord" | "web" = "web",
	): Promise<MultiplayerStartResult> {
		const s = Strings[this.LanguageFor(initializer, source)];
		const gang = await Gang.GetByUserId(initializer.Id);
		if (!gang) return { success: false, message: s.notInGang };
		const reservation = [`user:${initializer.Id}`, `user:${target.Id}`, `gang:${gang.Id}`];
		if (!this.TryReserve(reservation)) {
			return { success: false, message: s.gangBusy };
		}
		try {
			if (this.HasActiveIncomingSession(target.Id)) {
				return { success: false, message: s.cannotStartInvestmentRobbery };
			}
			if (this.HasActiveGangSession(gang.Id)) {
				return { success: false, message: s.gangActionActive };
			}
			if (gang.LastInvestmentRobbery && Date.now() < addHours(gang.LastInvestmentRobbery, 6).getTime()) {
				return { success: false, message: s.gangCooldown };
			}

			const model = new InvestmentRobbery(gang, initializer, target);
			const validation = await model.Validate();
			if (!validation.success) {
				return {
					success: false,
					message: source === "web"
						? getInvestmentRobberyStartMessage(validation.reason, s.cannotStartInvestmentRobbery)
						: s.cannotStartInvestmentRobbery,
				};
			}

			model.Participants.set(initializer.Id, initializer);
			const id = randomUUID();
			const base = this.CreateRuntimeBase(id, "investmentRobbery", initializer, target, gang.GetMaxMembers(), source);
			base.gang = gang;
			base.gangId = gang.Id;
			base.gangName = gang.Name;
			base.investmentName = model.InvestmentBase!.Name[initializer.Language];
			base.investmentImageUrl = model.InvestmentBase!.ImageUrl;
			base.investmentYield = model.InvestmentData!.accumulatedYield;
			base.hasHenchman = !!(model.InvestmentData!.henchmanEndsAt && !model.InvestmentData!.henchmanHospitalized && new Date(model.InvestmentData!.henchmanEndsAt) > new Date());
			base.participants = model.Participants;
			const session: InvestmentRobberySession = {
				...base,
				kind: "investmentRobbery",
				target,
				gang,
				model,
				defenderJoined: false,
				responseTask: null,
			};
			await this.CreateRecord(session);

			try {
				await model.ApplyDefenderState();
				session.lockedUserIds.add(target.Id);
				await model.ApplyAttackerState(initializer);
				session.lockedUserIds.add(initializer.Id);
				session.allowedResponses = ["defend"];
				await this.Activate(session, "lobby", 60_000, () => this.BeginInvestmentDefense(session));
				return { success: true, session: this.ToView(session) };
			}
			catch (error) {
				await model.Abort();
				await MultiplayerSessionRepository.Finish(id, "aborted", { reason: "start-failed" });
				throw error;
			}
		}
		finally {
			this.ReleaseReservation(reservation);
		}
	}

	static async StartGangHeist(
		leader: User,
		missionId: HeistMissionId,
		source: "discord" | "web" = "web",
	): Promise<MultiplayerStartResult> {
		const s = Strings[this.LanguageFor(leader, source)];
		if (missionId === HeistMissionId.GetawayCars) {
			return { success: false, message: s.getawayCarsHaveNoLobby };
		}
		const gang = await leader.GetGang();
		if (!gang) return { success: false, message: s.notInGang };
		const reservation = [`user:${leader.Id}`, `gang:${gang.Id}`];
		if (!this.TryReserve(reservation)) {
			return { success: false, message: s.gangBusy };
		}
		try {
			if (this.HasActiveGangSession(gang.Id)) {
				return { success: false, message: s.gangActionActive };
			}
			const validation = await Heist.ValidateStart(leader, gang, missionId);
			if (!validation.success) {
				return {
					success: false,
					message: source === "web"
						? getHeistStartMessage(validation.reason, validation.time, s.cannotStartHeist)
						: s.cannotStartHeist,
				};
			}

			const id = randomUUID();
			const base = this.CreateRuntimeBase(id, "gangHeist", leader, null, gang.GetMaxMembers(), source);
			base.gang = gang;
			base.gangId = gang.Id;
			base.gangName = gang.Name;
			base.missionId = missionId;
			const session: GangHeistSession = { ...base, kind: "gangHeist", target: null, gang, missionId };
			await this.CreateRecord(session);

			try {
				await Heist.LockStates([leader]);
				session.lockedUserIds.add(leader.Id);
				const lobbyTimeout = missionId === HeistMissionId.MainHeist ? 90_000 : 60_000;
				await this.Activate(session, "lobby", lobbyTimeout, () => this.BeginGangHeistResolution(session));
				return { success: true, session: this.ToView(session) };
			}
			catch (error) {
				await Heist.ReleaseLocks([leader]);
				await MultiplayerSessionRepository.Finish(id, "aborted", { reason: "start-failed" });
				throw error;
			}
		}
		finally {
			this.ReleaseReservation(reservation);
		}
	}

	static async BuyGangHeistGetawayCars(
		leader: User,
		language = Language.Portuguese,
		source: "discord" | "web" = "web",
	): Promise<{ success: boolean; message: string }> {
		const s = Strings[language];
		const gang = await leader.GetGang();
		if (!gang) return { success: false, message: s.notInGang };
		const reservation = [`user:${leader.Id}`, `gang:${gang.Id}`];
		if (!this.TryReserve(reservation)) return { success: false, message: s.gangBusy };
		try {
			if (this.HasActiveGangSession(gang.Id)) {
				return { success: false, message: s.gangActionActive };
			}
			const validation = await Heist.ValidateStart(leader, gang, HeistMissionId.GetawayCars);
			if (!validation.success) {
				return {
					success: false,
					message: source === "web"
						? getHeistStartMessage(validation.reason, validation.time, s.cannotBuyGetawayCars)
						: s.cannotBuyGetawayCars,
				};
			}
			if (!await Heist.ResolveMission2(gang)) {
				return { success: false, message: s.gangWithoutMoney };
			}
			return { success: true, message: s.getawayCarsBought };
		}
		finally {
			this.ReleaseReservation(reservation);
		}
	}

	static async Join(
		sessionId: string,
		participant: User,
		language = Language.Portuguese,
	): Promise<{ success: boolean; message: string; session?: MultiplayerSessionView }> {
		const s = Strings[language];
		const session = this.sessions.get(sessionId);
		if (!session) return { success: false, message: s.roomUnavailable };
		if (session.kind === "russianRoulette") return this.JoinRussianRoulette(sessionId, participant, language);
		if (session.kind === "investmentRobbery") return this.JoinInvestmentRobbery(session, participant, s);
		if (session.kind === "gangHeist") return this.JoinGangHeist(session, participant, s);
		return { success: false, message: s.noLobbyToJoin };
	}

	static async Abort(
		sessionId: string,
		actorId: string,
		language = Language.Portuguese,
	): Promise<{ success: boolean; message: string }> {
		const s = Strings[language];
		const reservation = [`session:${sessionId}`];
		if (!this.TryReserve(reservation)) return { success: false, message: s.roomUpdating };
		try {
			const session = this.sessions.get(sessionId);
			if (!session || (session.kind !== "investmentRobbery" && session.kind !== "gangHeist")) {
				return { success: false, message: s.cannotAbort };
			}
			if (session.owner.Id !== actorId) return { success: false, message: s.onlyOwnerCanAbort };
			if (session.phase !== "lobby") return { success: false, message: s.alreadyRunning };

			await this.AbortRuntime(session, "leader-aborted");
			return { success: true, message: s.roomAborted };
		}
		finally {
			this.ReleaseReservation(reservation);
		}
	}

	private static async JoinInvestmentRobbery(
		session: InvestmentRobberySession,
		participant: User,
		s: (typeof Strings)[Language],
	): Promise<{ success: boolean; message: string; session?: MultiplayerSessionView }> {
		const reservation = [`user:${participant.Id}`, `session:${session.id}`];
		if (!this.TryReserve(reservation)) return { success: false, message: s.roomBusy };
		try {
			if (session.phase !== "lobby") return { success: false, message: s.joinClosed };
			if (session.participants.has(participant.Id)) return { success: false, message: s.alreadyInRoom };
			if (session.participants.size >= session.maxParticipants) return { success: false, message: s.roomFull };

			const validation = session.model.ValidateJoin(participant);
			if (!validation.success) return { success: false, message: s.cannotJoinRobbery };
			if (session.phase !== "lobby" || session.participants.has(participant.Id) || session.participants.size >= session.maxParticipants) {
				return { success: false, message: s.joinClosed };
			}

			try {
				await session.model.ApplyAttackerState(participant);
				session.lockedUserIds.add(participant.Id);
				await MultiplayerSessionRepository.Update(session.id, {
					participantIds: Array.from(session.participants.keys()),
				});
				this.Publish(session);
				return { success: true, message: s.joined, session: this.ToView(session) };
			}
			catch (error) {
				await this.AbortRuntime(session, "participant-join-failed");
				throw error;
			}
		}
		finally {
			this.ReleaseReservation(reservation);
		}
	}

	private static async JoinGangHeist(
		session: GangHeistSession,
		participant: User,
		s: (typeof Strings)[Language],
	): Promise<{ success: boolean; message: string; session?: MultiplayerSessionView }> {
		const reservation = [`user:${participant.Id}`, `session:${session.id}`];
		if (!this.TryReserve(reservation)) return { success: false, message: s.roomBusy };
		try {
			if (session.phase !== "lobby") return { success: false, message: s.joinClosed };
			if (session.participants.has(participant.Id)) return { success: false, message: s.alreadyInRoom };
			if (session.participants.size >= session.maxParticipants) return { success: false, message: s.roomFull };

			const validation = await Heist.ValidateJoin(participant, session.gang);
			if (!validation.success) return { success: false, message: s.cannotJoinHeist };
			if (session.phase !== "lobby" || session.participants.has(participant.Id) || session.participants.size >= session.maxParticipants) {
				return { success: false, message: s.joinClosed };
			}

			session.participants.set(participant.Id, participant);
			try {
				await Heist.LockStates([participant]);
				session.lockedUserIds.add(participant.Id);
				await MultiplayerSessionRepository.Update(session.id, {
					participantIds: Array.from(session.participants.keys()),
				});
				this.Publish(session);
				return { success: true, message: s.joined, session: this.ToView(session) };
			}
			catch (error) {
				await this.AbortRuntime(session, "participant-join-failed");
				throw error;
			}
		}
		finally {
			this.ReleaseReservation(reservation);
		}
	}

	static async Respond(
		sessionId: string,
		userId: string,
		response: string,
		language = Language.Portuguese,
	): Promise<{ success: boolean; message: string }> {
		const s = Strings[language];
		const session = this.sessions.get(sessionId);
		if (!session) return { success: false, message: s.actionUnavailable };
		if (!session.target || session.target.Id !== userId) return { success: false, message: s.cannotRespond };
		if (session.phase !== "awaitingDefender" || session.response !== null) {
			return { success: false, message: s.alreadyResponded };
		}
		if (session.kind === "investmentRobbery") {
			if (response !== "defend") return { success: false, message: s.invalidResponse };
			session.response = response;
			const defense = this.DefendInvestment(session, s);
			session.responseTask = defense.then(() => undefined, () => undefined);
			return defense;
		}

		if (!session.allowedResponses.includes(response)) return { success: false, message: s.invalidResponse };
		session.response = response;
		this.Publish(session);
		return { success: true, message: s.responseRecorded };
	}

	private static async DefendInvestment(
		session: InvestmentRobberySession,
		s: (typeof Strings)[Language],
	): Promise<{ success: boolean; message: string }> {
		try {
			if (!await session.target.GetInfo() ||
				!session.target.CheckAvailability(["defendingInvestment", "dead", "wanted", "escaping"]).available) {
				session.response = null;
				return { success: false, message: s.mustBeIdleToDefend };
			}
		}
		catch (error) {
			session.response = null;
			throw error;
		}
		if (session.phase !== "awaitingDefender") {
			return { success: false, message: s.alreadyResponded };
		}
		session.defenderJoined = true;
		this.Publish(session);
		return { success: true, message: s.defending };
	}

	private static CreateRuntimeBase<K extends MultiplayerSessionKind, T extends User | null>(
		id: string,
		kind: K,
		owner: User,
		target: T,
		maxParticipants: number,
		source: "discord" | "web" = "web",
	): RuntimeBase & { kind: K; target: T } {
		return {
			id,
			kind,
			source,
			owner,
			target,
			gang: null,
			participants: new Map([[owner.Id, owner]]),
			phase: "preparing",
			maxParticipants,
			expiresAt: null,
			timer: null,
			task: null,
			response: null,
			allowedResponses: [],
			result: null,
			events: [],
			aliveUserIds: [],
			lockedUserIds: new Set(),
			bet: null,
			missionId: null,
			gangId: null,
			gangName: null,
			investmentName: null,
			investmentImageUrl: null,
			investmentYield: null,
			hasHenchman: false,
		};
	}

	private static async CreateRecord(session: RuntimeBase): Promise<void> {
		await MultiplayerSessionRepository.Create({
			id: session.id,
			kind: session.kind,
			ownerId: session.owner.Id,
			targetId: session.target?.Id ?? null,
			gangId: session.gangId,
			participantIds: Array.from(session.participants.keys()),
			phase: session.phase,
		});
	}

	private static async Activate(
		session: RuntimeSession,
		phase: string,
		timeoutMs: number,
		onTimeout: () => Promise<void>,
	): Promise<void> {
		session.phase = phase;
		session.expiresAt = new Date(Date.now() + timeoutMs);
		await MultiplayerSessionRepository.Update(session.id, {
			phase,
			expiresAt: session.expiresAt,
			participantIds: Array.from(session.participants.keys()),
		});
		if (session.phase !== phase) return;
		this.sessions.set(session.id, session);
		session.timer = setTimeout(() => {
			session.timer = null;
			this.TrackTask(session, onTimeout().catch(async error => {
				logger.error(`Failed to resolve multiplayer session ${session.id}: ${error}`);
				try {
					await this.AbortRuntime(session, "resolution-failed");
				}
				catch (cleanupError) {
					logger.error(`Failed to clean up multiplayer session ${session.id}: ${cleanupError}`);
				}
			}));
		}, timeoutMs);
		session.timer.unref();
		this.Publish(session);
	}

	private static async RenewLobby(session: RussianRouletteSession): Promise<void> {
		if (session.timer) clearTimeout(session.timer);
		session.timer = null;
		await this.Activate(session, "lobby", 60_000, () => this.AbortRuntime(session, "lobby-timeout"));
	}

	private static async StartRussianRouletteGame(session: RussianRouletteSession): Promise<void> {
		if (session.phase !== "lobby" || session.participants.size !== session.maxParticipants) return;
		if (session.timer) clearTimeout(session.timer);
		session.timer = null;
		session.phase = "starting";
		session.expiresAt = null;
		await MultiplayerSessionRepository.Update(session.id, { phase: session.phase, expiresAt: null });
		if (session.phase !== "starting") return;

		const players = Array.from(session.participants.values());
		for (const player of players) {
			if (!await player.GetInfo()) {
				await this.AbortRuntime(session, "participant-unavailable");
				return;
			}
			if (session.phase !== "starting") return;
			const eligibility = await Casino.CanUserPlayGame(player, session.bet);
			if (!eligibility.canPlay) {
				await this.AbortRuntime(session, "participant-unavailable");
				return;
			}
			if (session.phase !== "starting") return;
		}

		for (const player of players) {
			const started = await Casino.StartUserGame(player);
			if (!started) {
				await this.AbortRuntime(session, "participant-already-in-game");
				return;
			}
			if (session.phase !== "starting") {
				player.Casino.IsInGame = false;
				await player.Update({ casinoIsInGame: false });
				return;
			}
			session.lockedUserIds.add(player.Id);
		}

		if (session.phase !== "starting") return;
		players.sort(() => Math.random() - 0.5);
		session.aliveUserIds = players.map(player => player.Id);
		session.phase = "running";
		await MultiplayerSessionRepository.Update(session.id, { phase: session.phase });
		if (session.phase !== "running") return;
		this.Publish(session);
		this.TrackTask(session, this.RunRussianRoulette(session, players).catch(async error => {
			logger.error(`Failed to resolve Russian Roulette session ${session.id}: ${error}`);
			try {
				await this.AbortRuntime(session, "resolution-failed");
			}
			catch (cleanupError) {
				logger.error(`Failed to clean up Russian Roulette session ${session.id}: ${cleanupError}`);
			}
		}));
	}

	private static async RunRussianRoulette(session: RussianRouletteSession, players: User[]): Promise<void> {
		await wait(5_000);
		if (session.phase !== "running") return;
		session.events.push({ type: "started", userId: players[0].Id, outcome: null });
		this.Publish(session);

		const losers: User[] = [];
		let winner: User | null = null;
		while (winner === null) {
			for (const player of players) {
				if (!session.aliveUserIds.includes(player.Id)) continue;
				if (session.aliveUserIds.length === 1) {
					winner = player;
					break;
				}

				const hit = Math.random() < 0.2;
				if (hit) {
					player.Hospital.Time = addHours(new Date(), Math.random() * 0.5 + 1.5);
					player.Hospital.Count += 1;
					losers.push(player);
					session.aliveUserIds = session.aliveUserIds.filter(id => id !== player.Id);
				}
				session.events.push({
					type: "turn",
					userId: player.Id,
					outcome: hit ? "eliminated" : "survived",
				});
				this.Publish(session);
				await wait(3_000);
				if (session.phase !== "running") return;
			}
		}

		if (session.phase !== "running") return;
		session.phase = "settling";
		session.expiresAt = null;
		await MultiplayerSessionRepository.Update(session.id, { phase: session.phase, expiresAt: null });
		this.Publish(session);
		const basePrize = (session.bet * session.maxParticipants) /
			(ClassList[ClassId.Attorney].Modifier?.Casino?.Positive || 1);
		const prize = winner.Class === ClassId.Thief
			? basePrize * (ClassList[ClassId.Thief].Modifier?.Casino?.Negative || 1)
			: winner.Class === ClassId.Attorney
				? session.bet * session.maxParticipants
				: basePrize;
		const prizeToWinner = Math.floor(prize - session.bet);

		try {
			await Promise.all([
				...losers.map(async loser => {
					await Casino.FinishUserGameWithLoss(loser, session.bet);
					session.lockedUserIds.delete(loser.Id);
				}),
				(async () => {
					await Casino.FinishUserGameWithWin(winner, prizeToWinner, session.bet);
					session.lockedUserIds.delete(winner.Id);
				})(),
			]);
			await this.ReleaseRuntimeLocks(session);
			session.result = {
				winnerId: winner.Id,
				prize,
				prizeToWinner,
				loserIds: losers.map(loser => loser.Id),
			};
			session.events.push({ type: "finished", userId: winner.Id, outcome: "winner" });
			session.phase = "completed";
			await MultiplayerSessionRepository.Finish(session.id, "completed", session.result);
		}
		finally {
			session.expiresAt = null;
			this.Publish(session);
			this.RemoveAfterDelay(session.id);
		}
	}

	private static async BeginInvestmentDefense(session: InvestmentRobberySession): Promise<void> {
		if (session.phase !== "lobby") return;
		await this.Activate(session, "awaitingDefender", 60_000, () => this.ResolveInvestmentRobbery(session));
	}

	private static async ResolveInvestmentRobbery(session: InvestmentRobberySession): Promise<void> {
		await session.responseTask;
		if (session.phase !== "awaitingDefender") return;
		session.phase = "resolving";
		session.expiresAt = null;
		await MultiplayerSessionRepository.Update(session.id, { phase: session.phase, expiresAt: null });
		this.Publish(session);
		let result: InvestmentRobberyResult;
		try {
			result = await session.model.CalculateAndApplyOutcome(session.defenderJoined);
			await session.gang.UpdateLastInvestmentRobbery();
		}
		finally {
			await session.model.ClearAttackerStates();
			session.lockedUserIds.clear();
		}
		session.result = result;
		session.phase = "completed";
		await MultiplayerSessionRepository.Finish(session.id, "completed", session.result);
		try {
			this.Publish(session);
			this.RemoveAfterDelay(session.id);
		}
		finally {
			session.expiresAt = null;
		}
	}

	private static async BeginGangHeistResolution(session: GangHeistSession): Promise<void> {
		if (session.phase !== "lobby") return;
		const delay = session.missionId === HeistMissionId.MainHeist ? 45_000 : 30_000;
		await this.Activate(session, "resolving", delay, () => this.ResolveGangHeist(session));
	}

	private static async ResolveGangHeist(session: GangHeistSession): Promise<void> {
		session.expiresAt = null;
		await MultiplayerSessionRepository.Update(session.id, { expiresAt: null });
		this.Publish(session);
		const players = Array.from(session.participants.values());
		try {
			for (const player of players) {
				if (!await player.GetInfo()) throw new Error(`Heist participant ${player.Id} was not found.`);
			}

			if (session.missionId === HeistMissionId.Blueprint) {
				session.result = await Heist.ResolveMission1(session.gang, players);
			}
			else if (session.missionId === HeistMissionId.HackCameras) {
				session.result = await Heist.ResolveMission3(session.gang, players);
			}
			else {
				session.result = await Heist.ResolveMainHeist(session.gang, players);
			}

		}
		finally {
			await Heist.ReleaseLocks(players);
			session.lockedUserIds.clear();
		}
		session.phase = "completed";
		await MultiplayerSessionRepository.Finish(session.id, "completed", session.result);
		this.Publish(session);
		this.RemoveAfterDelay(session.id);
	}

	private static async ResolveDuel(session: BeatUpSession | UserRobberySession): Promise<void> {
		session.phase = "resolving";
		session.expiresAt = null;
		await MultiplayerSessionRepository.Update(session.id, { phase: session.phase, expiresAt: null });
		this.Publish(session);
		const response = session.response ?? "nothing";
		try {
			session.result = session.kind === "beatUp"
				? await session.model.Resolve(response as "fight" | "run" | "nothing")
				: await session.model.Resolve(response as "react" | "police" | "nothing");
		}
		finally {
			await session.model.ReleaseLocks();
			session.timer = null;
		}
		session.phase = "completed";
		await MultiplayerSessionRepository.Finish(session.id, "completed", session.result);
		this.Publish(session);
		this.RemoveAfterDelay(session.id);
	}

	private static async AbortRuntime(session: RuntimeSession, reason: string): Promise<void> {
		if (session.timer) clearTimeout(session.timer);
		session.timer = null;
		session.phase = "aborting";
		session.expiresAt = null;
		session.result = { reason };
		this.Publish(session);
		try {
			await this.ReleaseRuntimeLocks(session);
		}
		catch (error) {
			logger.error(`Failed to release locks for multiplayer session ${session.id}: ${error}`);
			throw error;
		}
		await MultiplayerSessionRepository.Finish(session.id, "aborted", session.result);
		session.phase = "aborted";
		this.Publish(session);
		this.RemoveAfterDelay(session.id);
	}

	private static async ReleaseRuntimeLocks(session: RuntimeSession): Promise<void> {
		if (session.kind === "beatUp" || session.kind === "userRobbery") {
			await session.model.ReleaseLocks();
			session.lockedUserIds.clear();
			return;
		}
		if (session.kind === "investmentRobbery") {
			await session.model.Abort();
			session.lockedUserIds.clear();
			return;
		}
		if (session.kind === "gangHeist") {
			await Heist.ReleaseLocks(Array.from(session.participants.values()));
			session.lockedUserIds.clear();
			return;
		}
		for (const userId of session.lockedUserIds) {
			const user = session.participants.get(userId);
			if (!user) continue;
			user.Casino.IsInGame = false;
			await user.Update({ casinoIsInGame: false });
		}
		session.lockedUserIds.clear();
	}

	private static IsVisibleTo(session: RuntimeSession, userId: string, gangId: number | null): boolean {
		if (session.owner.Id === userId || session.participants.has(userId)) return true;
		if (
			session.target?.Id === userId &&
			(session.kind !== "investmentRobbery" || session.phase !== "lobby")
		) return true;
		if (session.kind === "russianRoulette") return true;
		return session.gangId !== null && session.gangId === gangId && session.phase === "lobby";
	}

	private static ToView(session: RuntimeSession): MultiplayerSessionView {
		const isDuel = session.kind === "beatUp" || session.kind === "userRobbery";
		const weapon = session.owner.BestGun;
		const weaponSkin = weapon?.Skin[weapon.SelectedSkin];
		return {
			id: session.id,
			kind: session.kind,
			source: session.source,
			phase: session.phase,
			ownerId: session.owner.Id,
			targetId: session.target?.Id ?? null,
			targetNickname: session.target?.Nickname ?? null,
			gangId: session.gangId,
			gangName: session.gangName,
			investmentName: session.investmentName,
			investmentImageUrl: session.investmentImageUrl,
			investmentYield: session.investmentYield,
			hasHenchman: session.hasHenchman,
			participants: Array.from(session.participants.values()).map(user => ({
				userId: user.Id,
				nickname: user.Nickname || user.Id,
				attack: user.Attributes.Attack,
				classId: user.Class,
			})),
			maxParticipants: session.maxParticipants,
			bet: session.bet,
			missionId: session.missionId,
			expiresAt: session.expiresAt?.toISOString() ?? null,
			response: session.response,
			allowedResponses: [...session.allowedResponses],
			events: [...session.events],
			aliveUserIds: [...session.aliveUserIds],
			result: session.result === null ? null : JSON.stringify(session.result),
			duelDetails: isDuel ? {
				weaponName: weapon?.Description[Language.Portuguese] ?? session.initData.usedGunName,
				weaponEmoji: session.initData.usedGunSkin,
				weaponImageUrl: weaponSkin ? `https://cdn.discordapp.com/emojis/${weaponSkin.Id}.png` : null,
				usedGrenade: session.initData.usedGrenade,
				hospitalMinutes: session.kind === "beatUp"
					? session.initData.timeInHospitalBase
					: session.initData.defenderTimeInHospital,
				hospitalMinutesDelta: session.kind === "beatUp" ? session.initData.timeInHospitalAditional : 0,
				prisonMinutesDelta: session.kind === "userRobbery" ? session.initData.attackerAditionalTimeCallPolice : 0,
			} : null,
		};
	}

	private static Publish(session: RuntimeSession): void {
		try {
			this.updates.emit("change", session);
		}
		catch (error) {
			logger.error(`Failed to publish multiplayer session ${session.id}: ${error}`);
		}
	}

	private static RemoveAfterDelay(sessionId: string): void {
		const timer = setTimeout(() => {
			const session = this.sessions.get(sessionId);
			if (!session) return;
			this.sessions.delete(sessionId);
			try {
				this.updates.emit("removed", session, true);
			}
			catch (error) {
				logger.error(`Failed to publish multiplayer session removal ${session.id}: ${error}`);
			}
		}, 10 * 60_000);
		timer.unref();
	}
}

export const Strings = {
	[Language.English]: {
		playersBusy: "One of the players is already starting another action.",
		invalidBet: "The bet must be a whole amount of at least Cr$ 5,000.",
		alreadyInRoulette: "You are already in a Russian Roulette room.",
		roomBusy: "This room is receiving another entry. Try again.",
		roomUnavailable: "This room is no longer available.",
		alreadyInRoom: "You are already in this room.",
		roomFull: "This room is full.",
		roomStartFailed: "This room could not be started.",
		joined: "You joined the room.",
		notInGang: "You are not in a gang.",
		gangBusy: "A player or the gang is already starting another action.",
		gangActionActive: "Your gang already has a group action in progress.",
		gangCooldown: "Your gang is still on cooldown.",
		cannotStartInvestmentRobbery: "The investment robbery could not be started.",
		getawayCarsHaveNoLobby: "Buying the getaway cars does not open a room.",
		cannotStartHeist: "You cannot start the heist right now.",
		cannotBuyGetawayCars: "You cannot buy the getaway cars right now.",
		gangWithoutMoney: "The gang does not have enough money.",
		getawayCarsBought: "Getaway cars bought.",
		noLobbyToJoin: "This action has no room to join.",
		roomUpdating: "The room is being updated. Try again.",
		cannotAbort: "This room can no longer be cancelled.",
		onlyOwnerCanAbort: "Only the creator can cancel the room.",
		alreadyRunning: "The room is already in progress.",
		roomAborted: "The room was cancelled.",
		joinClosed: "The joining period has ended.",
		cannotJoinRobbery: "You cannot join this robbery.",
		cannotJoinHeist: "You cannot join this heist.",
		actionUnavailable: "This action is no longer available.",
		cannotRespond: "You cannot respond to this action.",
		alreadyResponded: "This action was already answered or finished.",
		invalidResponse: "Invalid response.",
		mustBeIdleToDefend: "You must be idle to defend the investment.",
		defending: "You are defending your investment.",
		responseRecorded: "Response recorded.",
		actionInterrupted: "The action was interrupted.",
		playerNotFound: "Player not found.",
	},
	[Language.Portuguese]: {
		playersBusy: "Um dos jogadores já está iniciando outra ação.",
		invalidBet: "A aposta deve ser um valor inteiro de pelo menos Cr$ 5.000.",
		alreadyInRoulette: "Você já está em uma sala de Roleta Russa.",
		roomBusy: "Esta sala está recebendo outra entrada. Tente novamente.",
		roomUnavailable: "Esta sala não está mais disponível.",
		alreadyInRoom: "Você já está nesta sala.",
		roomFull: "Esta sala está cheia.",
		roomStartFailed: "Não foi possível iniciar esta sala.",
		joined: "Você entrou na sala.",
		notInGang: "Você não está em uma gangue.",
		gangBusy: "Um dos jogadores ou a gangue já está iniciando outra ação.",
		gangActionActive: "Sua gangue já tem uma ação de grupo em andamento.",
		gangCooldown: "Sua gangue ainda está no tempo de recarga.",
		cannotStartInvestmentRobbery: "Não foi possível iniciar o roubo do investimento.",
		getawayCarsHaveNoLobby: "A compra dos carros de fuga não abre uma sala.",
		cannotStartHeist: "Você não pode iniciar o golpe no momento.",
		cannotBuyGetawayCars: "Você não pode comprar os carros de fuga no momento.",
		gangWithoutMoney: "A gangue não tem dinheiro suficiente.",
		getawayCarsBought: "Carros de fuga comprados.",
		noLobbyToJoin: "Esta ação não tem uma sala para entrar.",
		roomUpdating: "A sala está sendo atualizada. Tente novamente.",
		cannotAbort: "Esta sala não pode mais ser cancelada.",
		onlyOwnerCanAbort: "Somente quem iniciou pode cancelar a sala.",
		alreadyRunning: "A sala já está em andamento.",
		roomAborted: "A sala foi cancelada.",
		joinClosed: "O período de entrada terminou.",
		cannotJoinRobbery: "Você não pode participar deste roubo.",
		cannotJoinHeist: "Você não pode participar deste golpe.",
		actionUnavailable: "Esta ação não está mais disponível.",
		cannotRespond: "Você não pode responder a esta ação.",
		alreadyResponded: "Esta ação já foi respondida ou finalizada.",
		invalidResponse: "Resposta inválida.",
		mustBeIdleToDefend: "Você precisa estar vadiando para defender o investimento.",
		defending: "Você está defendendo seu investimento.",
		responseRecorded: "Resposta registrada.",
		actionInterrupted: "A ação foi interrompida.",
		playerNotFound: "Jogador não encontrado.",
	},
	[Language.Spanish]: {
		playersBusy: "Uno de los jugadores ya está iniciando otra acción.",
		invalidBet: "La apuesta debe ser un valor entero de al menos Cr$ 5.000.",
		alreadyInRoulette: "Ya estás en una sala de Ruleta Rusa.",
		roomBusy: "Esta sala está recibiendo otra entrada. Inténtalo de nuevo.",
		roomUnavailable: "Esta sala ya no está disponible.",
		alreadyInRoom: "Ya estás en esta sala.",
		roomFull: "Esta sala está llena.",
		roomStartFailed: "No fue posible iniciar esta sala.",
		joined: "Entraste en la sala.",
		notInGang: "No estás en una pandilla.",
		gangBusy: "Un jugador o la pandilla ya está iniciando otra acción.",
		gangActionActive: "Tu pandilla ya tiene una acción de grupo en curso.",
		gangCooldown: "Tu pandilla todavía está en tiempo de espera.",
		cannotStartInvestmentRobbery: "No fue posible iniciar el robo de la inversión.",
		getawayCarsHaveNoLobby: "La compra de los autos de escape no abre una sala.",
		cannotStartHeist: "No puedes iniciar el golpe en este momento.",
		cannotBuyGetawayCars: "No puedes comprar los autos de escape en este momento.",
		gangWithoutMoney: "La pandilla no tiene suficiente dinero.",
		getawayCarsBought: "Autos de escape comprados.",
		noLobbyToJoin: "Esta acción no tiene una sala para entrar.",
		roomUpdating: "La sala se está actualizando. Inténtalo de nuevo.",
		cannotAbort: "Esta sala ya no se puede cancelar.",
		onlyOwnerCanAbort: "Solo quien la creó puede cancelar la sala.",
		alreadyRunning: "La sala ya está en curso.",
		roomAborted: "La sala fue cancelada.",
		joinClosed: "El período de entrada terminó.",
		cannotJoinRobbery: "No puedes participar en este robo.",
		cannotJoinHeist: "No puedes participar en este golpe.",
		actionUnavailable: "Esta acción ya no está disponible.",
		cannotRespond: "No puedes responder a esta acción.",
		alreadyResponded: "Esta acción ya fue respondida o finalizada.",
		invalidResponse: "Respuesta inválida.",
		mustBeIdleToDefend: "Debes estar vagueando para defender la inversión.",
		defending: "Estás defendiendo tu inversión.",
		responseRecorded: "Respuesta registrada.",
		actionInterrupted: "La acción fue interrumpida.",
		playerNotFound: "Jugador no encontrado.",
	},
} as const satisfies Localization;
