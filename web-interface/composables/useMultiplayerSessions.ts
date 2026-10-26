import { useMutation, useQuery } from "@vue/apollo-composable";
import { computed, onBeforeUnmount, ref, watch } from "vue";
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
	const sessions = ref<MultiplayerSession[]>([]);
	const completedSessions = ref<MultiplayerSession[]>([]);
	const reportedResults = new Set<string>();
	const streamError = ref<string | null>(null);
	const { result, loading, error, refetch } = useQuery(
		GetMultiplayerSessionsDocument,
		{},
		{
			enabled: computed(() => Boolean(auth.token.value)),
			fetchPolicy: "network-only",
		},
	);

	watch(
		result,
		(value) => {
			const updatedSessions = value?.multiplayerSessions ?? [];
			for (const session of updatedSessions) {
				const previous = sessions.value.find((current) => current.id === session.id);
				if (previous && previous.phase !== "completed" && session.phase === "completed") {
					queueResult(session);
				}
			}
			sessions.value = updatedSessions;
		},
		{ immediate: true },
	);

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

		reportedResults.add(session.id);
		completedSessions.value = [...completedSessions.value, session];
	}

	function updateSession(session: MultiplayerSession) {
		const index = sessions.value.findIndex((current) => current.id === session.id);
		if (index < 0) sessions.value = [...sessions.value, session];
		else sessions.value[index] = session;
		queueResult(session);
	}

	async function connectToUpdates() {
		if (!import.meta.client || !auth.token.value) return;
		streamController?.abort();
		const controller = new AbortController();
		streamController = controller;

		try {
			const response = await fetch(`${config.public.apiBaseUrl}/sse/multiplayer-sessions`, {
				headers: { Authorization: `Bearer ${auth.token.value}` },
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
				void refetch()?.catch((caughtError: unknown) => {
					streamError.value =
						caughtError instanceof Error ? caughtError.message : "Não foi possível atualizar as salas.";
				});
				reconnectTimer = setTimeout(() => void connectToUpdates(), 2_000);
			}
		}
	}

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

	onBeforeUnmount(() => {
		streamController?.abort();
		if (reconnectTimer) clearTimeout(reconnectTimer);
	});

	return {
		sessions,
		completedSessions,
		loading,
		error,
		streamError,
		refetch,
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
