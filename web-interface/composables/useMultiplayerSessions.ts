import { useMutation, useQuery } from "@vue/apollo-composable";
import { computed, watch } from "vue";
import { localStorageKeys } from "~/constants/localStorageKeys";
import {
	AbortMultiplayerSessionDocument,
	BuyGangHeistGetawayCarsDocument,
	GetMultiplayerSessionsDocument,
	JoinMultiplayerSessionDocument,
	type MultiplayerSession,
	RespondMultiplayerSessionDocument,
	StartBeatUpDocument,
	StartGangHeistDocument,
	StartInvestmentRobberyDocument,
	StartRussianRouletteDocument,
	StartUserRobberyDocument,
} from "~/graphql/generated";
import { readSseData } from "~/utils/readSseData";

const RESULT_DISMISSAL_TTL_MS = 10 * 60_000;
let multiplayerSessionsStreamInitialized = false;

function isMultiplayerSession(value: unknown): value is MultiplayerSession {
	if (typeof value !== "object" || value === null) return false;
	const session = value as Record<string, unknown>;
	return (
		typeof session.id === "string" &&
		typeof session.kind === "string" &&
		typeof session.phase === "string" &&
		Array.isArray(session.participants)
	);
}

export function useMultiplayerSessions() {
	const auth = useAuth();
	const config = useRuntimeConfig();
	const sessions = useState<MultiplayerSession[]>("multiplayer-sessions", () => []);
	const completedSessions = useState<MultiplayerSession[]>("completed-multiplayer-sessions", () => []);
	const reportedResults = new Set<string>();
	const dismissedResultTimestamps = new Map<string, number>();
	let dismissedResultsUserId: string | null = null;
	const streamError = useState<string | null>("multiplayer-sessions-stream-error", () => null);
	const { result, loading, error, refetch } = useQuery(
		GetMultiplayerSessionsDocument,
		{},
		{
			enabled: computed(() => Boolean(auth.token.value)),
			fetchPolicy: "network-only",
		},
	);

	function getDismissedResultTimestamps(userId: string): Map<string, number> {
		if (!import.meta.client) return dismissedResultTimestamps;
		if (dismissedResultsUserId === userId) return dismissedResultTimestamps;

		dismissedResultsUserId = userId;
		dismissedResultTimestamps.clear();
		const storageKey = `${localStorageKeys.dismissedMultiplayerResults}:${userId}`;
		const serializedResults = window.localStorage.getItem(storageKey);
		if (!serializedResults) return dismissedResultTimestamps;

		const now = Date.now();
		for (const serializedResult of serializedResults.split("\n")) {
			const separatorIndex = serializedResult.indexOf("\t");
			if (separatorIndex < 0) continue;
			const id = serializedResult.slice(0, separatorIndex);
			const dismissedAt = Number(serializedResult.slice(separatorIndex + 1));
			if (!id || !Number.isSafeInteger(dismissedAt)) continue;
			const age = now - dismissedAt;
			if (age >= 0 && age < RESULT_DISMISSAL_TTL_MS) {
				dismissedResultTimestamps.set(id, dismissedAt);
			}
		}
		return dismissedResultTimestamps;
	}

	const { mutate: startBeatUp } = useMutation(StartBeatUpDocument);
	const { mutate: startUserRobbery } = useMutation(StartUserRobberyDocument);
	const { mutate: startRussianRoulette } = useMutation(StartRussianRouletteDocument);
	const { mutate: startInvestmentRobbery } = useMutation(StartInvestmentRobberyDocument);
	const { mutate: startGangHeist } = useMutation(StartGangHeistDocument);
	const { mutate: buyGangHeistGetawayCars } = useMutation(BuyGangHeistGetawayCarsDocument);
	const { mutate: joinSession } = useMutation(JoinMultiplayerSessionDocument);
	const { mutate: respondToSession } = useMutation(RespondMultiplayerSessionDocument);
	const { mutate: abortSession } = useMutation(AbortMultiplayerSessionDocument);

	let streamController: AbortController | null = null;
	let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

	function queueResult(session: MultiplayerSession) {
		if (
			!["beatUp", "userRobbery", "investmentRobbery"].includes(session.kind) ||
			session.phase !== "completed" ||
			!session.result ||
			reportedResults.has(session.id)
		) {
			return;
		}

		const userId = auth.user.value?.userId;
		if (userId && getDismissedResultTimestamps(userId).has(session.id)) return;

		reportedResults.add(session.id);
		completedSessions.value = [...completedSessions.value, session];
	}

	function dismissResult(sessionId: string) {
		completedSessions.value = completedSessions.value.filter(({ id }) => id !== sessionId);
		const userId = auth.user.value?.userId;
		if (!userId || !import.meta.client) return;

		const timestamps = getDismissedResultTimestamps(userId);
		const now = Date.now();
		for (const [id, dismissedAt] of timestamps) {
			if (now - dismissedAt < 0 || now - dismissedAt >= RESULT_DISMISSAL_TTL_MS) timestamps.delete(id);
		}
		timestamps.set(sessionId, now);
		window.localStorage.setItem(
			`${localStorageKeys.dismissedMultiplayerResults}:${userId}`,
			Array.from(timestamps, ([id, dismissedAt]) => `${id}\t${dismissedAt}`).join("\n"),
		);
	}

	watch(
		() => auth.user.value?.userId,
		(userId) => {
			if (!userId) return;
			const dismissedResults = getDismissedResultTimestamps(userId);
			completedSessions.value = completedSessions.value.filter(({ id }) => !dismissedResults.has(id));
		},
		{ immediate: true },
	);

	function updateSession(session: MultiplayerSession) {
		const index = sessions.value.findIndex((current) => current.id === session.id);
		if (index < 0) sessions.value = [...sessions.value, session];
		else sessions.value[index] = session;
		queueResult(session);
	}

	function updateSessions(updatedSessions: MultiplayerSession[]) {
		for (const session of updatedSessions) {
			const previous = sessions.value.find((current) => current.id === session.id);
			if (previous && previous.phase !== "completed" && session.phase === "completed") {
				queueResult(session);
			}
		}
		sessions.value = updatedSessions;
	}

	async function refetchSessions() {
		const refreshed = await refetch();
		updateSessions(refreshed.data?.multiplayerSessions ?? []);
		return refreshed;
	}

	async function connectToUpdates() {
		if (!import.meta.client || !auth.token.value) return;
		streamController?.abort();
		const controller = new AbortController();
		streamController = controller;

		try {
			const response = await fetch(`${config.public.apiBaseUrl}/sse/multiplayer-sessions`, {
				headers: { Authorization: `Bearer ${auth.token.value}` },
				cache: "no-store",
				signal: controller.signal,
			});
			streamError.value = null;
			for await (const message of readSseData(response)) {
				const parsed: unknown = JSON.parse(message);
				if (typeof parsed !== "object" || parsed === null) continue;
				const event = parsed as Record<string, unknown>;
				if (event.type === "session-updated" && isMultiplayerSession(event.session)) {
					updateSession(event.session);
				} else if (event.type === "session-removed" && typeof event.sessionId === "string") {
					sessions.value = sessions.value.filter((session) => session.id !== event.sessionId);
				}
			}
		} catch (caughtError: unknown) {
			if (!controller.signal.aborted) {
				streamError.value =
					caughtError instanceof Error ? caughtError.message : "A conexão de partidas foi interrompida.";
			}
		} finally {
			if (streamController === controller) streamController = null;
			if (!controller.signal.aborted && auth.token.value) {
				void refetchSessions().catch((caughtError: unknown) => {
					streamError.value =
						caughtError instanceof Error ? caughtError.message : "Não foi possível atualizar as salas.";
				});
				reconnectTimer = setTimeout(() => void connectToUpdates(), 2_000);
			}
		}
	}

	if (!multiplayerSessionsStreamInitialized) {
		multiplayerSessionsStreamInitialized = true;
		watch(result, (value) => updateSessions(value?.multiplayerSessions ?? []), { immediate: true });
		watch(
			() => auth.token.value,
			(token) => {
				streamController?.abort();
				if (reconnectTimer) clearTimeout(reconnectTimer);
				if (token) void connectToUpdates();
				else sessions.value = [];
			},
			{ immediate: true },
		);
	}

	return {
		sessions,
		completedSessions,
		dismissResult,
		loading,
		error,
		streamError,
		refetch: refetchSessions,
		startBeatUp,
		startUserRobbery,
		startRussianRoulette,
		startInvestmentRobbery,
		startGangHeist,
		buyGangHeistGetawayCars,
		joinSession,
		respondToSession,
		abortSession,
	};
}
