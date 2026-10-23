<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { computed, onMounted, onUnmounted, ref } from "vue";
import BeatUpDefenderModal from "~/components/Multiplayer/BeatUpDefenderModal.vue";
import InvestmentRobberyDefenderModal from "~/components/Multiplayer/InvestmentRobberyDefenderModal.vue";
import RobberyDefenderModal from "~/components/Multiplayer/RobberyDefenderModal.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import { useMultiplayerSessions } from "~/composables/useMultiplayerSessions";
import { GetDefenderActionProfilesDocument, type MultiplayerSession } from "~/graphql/generated";

const auth = useAuth();
const { showToast } = useToast();
const { sessions, respondToSession, refetch } = useMultiplayerSessions();
const now = ref(Date.now());
let countdownInterval: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
	now.value = Date.now();
	countdownInterval = setInterval(() => {
		now.value = Date.now();
	}, 1_000);
});
onUnmounted(() => {
	if (countdownInterval) clearInterval(countdownInterval);
});

const userId = computed(() => auth.user.value?.userId ?? "");
const incomingSession = computed(() =>
	sessions.value.find(
		(candidate) =>
			candidate.targetId === userId.value &&
			["beatUp", "userRobbery", "investmentRobbery"].includes(candidate.kind) &&
			["awaitingDefender", "resolving"].includes(candidate.phase),
	),
);
const previewKinds = ["userRobbery", "beatUp", "investmentRobbery"] as const;
const previewKind = ref<(typeof previewKinds)[number] | null>(null);
const previewSession = computed<MultiplayerSession | null>(() => {
	if (!import.meta.dev || !previewKind.value) return null;
	const isInvestment = previewKind.value === "investmentRobbery";
	return {
		id: "defender-visual-preview",
		kind: previewKind.value,
		phase: "awaitingDefender",
		ownerId: "preview-attacker",
		targetId: userId.value,
		response: null,
		participants: [
			{ userId: "preview-attacker", nickname: "Atacante de exemplo", attack: 1_500, classId: 0 },
			...(isInvestment
				? [{ userId: "preview-accomplice", nickname: "Cúmplice de exemplo", attack: 1_200, classId: 0 }]
				: []),
		],
		maxParticipants: isInvestment ? 5 : 1,
		aliveUserIds: [],
		allowedResponses: isInvestment
			? ["defend"]
			: previewKind.value === "beatUp"
				? ["fight", "run", "nothing"]
				: ["react", "police", "nothing"],
		events: [],
		hasHenchman: isInvestment,
		gangName: isInvestment ? "Gangue de exemplo" : null,
		investmentName: isInvestment ? "Investimento de exemplo" : null,
		investmentYield: isInvestment ? 25_000 : null,
		expiresAt: new Date(Date.now() + 60_000).toISOString(),
		duelDetails: isInvestment
			? null
			: {
					weaponName: "RPG",
					weaponImageUrl: "/images/items/10_RPG.png",
					hospitalMinutes: previewKind.value === "beatUp" ? 60 : 27.5,
					hospitalMinutesDelta: previewKind.value === "beatUp" ? 20 : 0,
					prisonMinutesDelta: previewKind.value === "userRobbery" ? 60 : 0,
				},
	};
});
const session = computed(() => incomingSession.value ?? previewSession.value);
const { result: profiles, error: profileError } = useQuery(
	GetDefenderActionProfilesDocument,
	() => ({ attackerId: incomingSession.value?.ownerId ?? "", defenderId: userId.value }),
	() => ({
		enabled: Boolean(incomingSession.value && incomingSession.value.kind !== "investmentRobbery" && userId.value),
		fetchPolicy: "network-only",
	}),
);
const duelProps = computed(() => {
	if (!session.value || session.value.kind === "investmentRobbery") return {};
	const isPreview = !incomingSession.value;
	const attacker = profiles.value?.attacker;
	const defender = profiles.value?.defender;
	return {
		attackerImageUrl:
			isPreview || attacker?.id === session.value.ownerId
				? (attacker?.avatarUrl ?? useFallbackUserImage(attacker?.id || "0"))
				: null,
		money: isPreview ? 219_532 : defender?.id === userId.value ? defender.money : null,
		profileError: !isPreview && Boolean(profileError.value || (profiles.value && (!attacker || !defender))),
	};
});
const respondingSessionId = ref<string | null>(null);

const actionTitles: Record<string, string> = {
	beatUp: "Espancamento em andamento",
	userRobbery: "Roubo em andamento",
	investmentRobbery: "Roubo em andamento",
};
const defenderModals = {
	beatUp: BeatUpDefenderModal,
	userRobbery: RobberyDefenderModal,
	investmentRobbery: InvestmentRobberyDefenderModal,
};
const activeModal = computed(() => {
	const kind = session.value?.kind;
	return kind && Object.hasOwn(defenderModals, kind) ? defenderModals[kind as keyof typeof defenderModals] : null;
});

function formatCountdown(expiresAt: string) {
	const totalSeconds = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now.value) / 1_000));
	return `${totalSeconds} ${totalSeconds === 1 ? "segundo" : "segundos"}`;
}

function closePreview(open: boolean) {
	if (!open) previewKind.value = null;
}

async function respond(sessionId: string, response: string) {
	if (import.meta.dev && sessionId === previewSession.value?.id) {
		showToast({ text: "Prévia visual: nenhuma ação foi enviada.", variant: "neutral" });
		return;
	}
	respondingSessionId.value = sessionId;
	try {
		const result = (await respondToSession({ sessionId, response }))?.data?.respondMultiplayerSession;
		if (!result) {
			showToast({ text: "Não foi possível registrar sua resposta.", variant: "error" });
			return;
		}

		showToast({
			text: result.message,
			variant: result.success ? "success" : "error",
		});
		if (result.success) await refetch();
	} catch (error: unknown) {
		showToast({ text: error instanceof Error ? error.message : "Erro inesperado.", variant: "error" });
	} finally {
		respondingSessionId.value = null;
	}
}
</script>

<template>
	<div
		v-if="true"
		class="defender-prompt__actions"
	>
		<BaseButton
			v-for="kind in previewKinds"
			:key="kind"
			variant="secondary"
			@click="previewKind = kind"
		>
			Prévia: {{ actionTitles[kind] }}
		</BaseButton>
	</div>
	<component
		:is="activeModal"
		v-if="session && activeModal"
		:session="session"
		:dismissible="!incomingSession"
		:responding="respondingSessionId !== null"
		:countdown="session.expiresAt ? formatCountdown(session.expiresAt) : ''"
		v-bind="duelProps"
		@update:open="closePreview"
		@respond="respond(session.id, $event)"
	/>
</template>

<style
	scoped
	lang="scss"
>
@use "~/assets/scss/variables" as *;

.defender-prompt {
	&__actions {
		display: flex;
		flex-wrap: wrap;
		gap: $spacing-sm;
	}
}
</style>
