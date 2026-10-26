<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { computed, onMounted, onUnmounted, ref } from "vue";
import BeatUpAttackerActionModal from "~/components/Multiplayer/BeatUp/BeatUpAttackerActionModal.vue";
import BeatUpDefenderModal from "~/components/Multiplayer/BeatUp/BeatUpDefenderModal.vue";
import BeatUpResultModal from "~/components/Multiplayer/BeatUp/BeatUpResultModal.vue";
import RobberyAttackerActionModal from "~/components/Multiplayer/Robbery/RobberyAttackerActionModal.vue";
import InvestmentRobberyDefenderModal from "~/components/Multiplayer/InvestmentRobbery/InvestmentRobberyDefenderModal.vue";
import InvestmentRobberyResultModal from "~/components/Multiplayer/InvestmentRobbery/InvestmentRobberyResultModal.vue";
import RobberyDefenderModal from "~/components/Multiplayer/Robbery/RobberyDefenderModal.vue";
import RobberyResultModal from "~/components/Multiplayer/Robbery/RobberyResultModal.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import { useMultiplayerSessions } from "~/composables/useMultiplayerSessions";
import { GetDefenderActionProfilesDocument, type MultiplayerSession } from "~/graphql/generated";

const auth = useAuth();
const { showToast } = useToast();
const { sessions, completedSessions, respondToSession, refetch } = useMultiplayerSessions();
const isDevelopment = import.meta.dev;
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
const previewAttackerAction = ref(false);
const previewMenu = ref<HTMLDetailsElement | null>(null);
const previewResultPerspective = ref<"defender" | "attacker">("defender");
const previewResults = {
	beatUpSuccess: {
		label: "Espancamento (sucesso)",
		kind: "beatUp",
		response: "fight",
		result: () => ({
			success: true,
			defenderHospitalTime: new Date(Date.now() + 60 * 60_000).toISOString(),
		}),
	},
	beatUpFailure: {
		label: "Espancamento (falha)",
		kind: "beatUp",
		response: "run",
		result: () => ({
			success: false,
			attackerHospitalTime: new Date(Date.now() + 30 * 60_000).toISOString(),
		}),
	},
	robberySuccess: {
		label: "Roubo (sucesso)",
		kind: "userRobbery",
		response: "react",
		result: () => ({
			success: true,
			moneyRobbed: 45_000,
			willBeBeatenUp: true,
			defenderHospitalTime: new Date(Date.now() + 45 * 60_000).toISOString(),
		}),
	},
	robberyFailure: {
		label: "Roubo (falha)",
		kind: "userRobbery",
		response: "police",
		result: () => ({
			success: false,
			attackerPrisonTime: new Date(Date.now() + 60 * 60_000).toISOString(),
		}),
	},
	investmentRobberySuccess: {
		label: "Investimento (sucesso)",
		kind: "investmentRobbery",
		response: "defend",
		result: () => ({ win: true, robbedAmount: 75_000, remainingYield: 12_500 }),
	},
	investmentRobberyFailure: {
		label: "Investimento (falha)",
		kind: "investmentRobbery",
		response: "defend",
		result: () => ({ win: false, prisonHours: 48 }),
	},
} as const;
const previewResultKinds = [
	"beatUpSuccess",
	"beatUpFailure",
	"robberySuccess",
	"robberyFailure",
	"investmentRobberySuccess",
	"investmentRobberyFailure",
] as const;
const attackerResultPreviewKinds = ["beatUpSuccess", "beatUpFailure", "robberySuccess", "robberyFailure"] as const;
type PreviewResultKind = (typeof previewResultKinds)[number];
const previewResultKind = ref<PreviewResultKind | null>(null);
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
				usedGrenade: true,
				hospitalMinutes: previewKind.value === "beatUp" ? 60 : 27.5,
				hospitalMinutesDelta: previewKind.value === "beatUp" ? 20 : 0,
				prisonMinutesDelta: previewKind.value === "userRobbery" ? 60 : 0,
			},
	};
});
const session = computed(() =>
	previewKind.value ? previewSession.value : (incomingSession.value ?? previewSession.value),
);
const completedResult = computed(() => completedSessions.value[0] ?? null);
const attackerPreviewSession = computed(() => {
	const preview = previewSession.value;
	if (!previewAttackerAction.value || !preview || !["userRobbery", "beatUp"].includes(preview.kind)) return null;
	return { ...preview, targetId: "preview-target", targetNickname: "Defensor de exemplo" };
});
const liveAttackerSession = computed(() =>
	sessions.value.find(
		(candidate) =>
			candidate.ownerId === userId.value &&
			["userRobbery", "beatUp"].includes(candidate.kind) &&
			["awaitingDefender", "resolving"].includes(candidate.phase),
	) ?? null,
);
const attackerActionSession = computed(() => attackerPreviewSession.value ?? liveAttackerSession.value);
const attackerActionModals = {
	beatUp: BeatUpAttackerActionModal,
	userRobbery: RobberyAttackerActionModal,
};
const attackerActionModal = computed(() => {
	const kind = attackerActionSession.value?.kind;
	return kind && Object.hasOwn(attackerActionModals, kind)
		? attackerActionModals[kind as keyof typeof attackerActionModals]
		: null;
});
const attackerPreviewKinds = ["userRobbery", "beatUp"] as const;
const dismissedAttackerSessionId = ref<string | null>(null);
const previewResultSession = computed<MultiplayerSession | null>(() => {
	if (!import.meta.dev || !previewResultKind.value) return null;
	const scenario = previewResults[previewResultKind.value];
	const isInvestment = scenario.kind === "investmentRobbery";
	return {
		id: `result-preview-${previewResultKind.value}`,
		kind: scenario.kind,
		phase: "completed",
		ownerId: "preview-attacker",
		targetId: userId.value,
		targetNickname: "Defensor de exemplo",
		response: scenario.response,
		participants: [
			{ userId: "preview-attacker", nickname: "Atacante de exemplo", attack: 1_500, classId: 0 },
			...(isInvestment
				? [{ userId: "preview-accomplice", nickname: "Cúmplice de exemplo", attack: 1_200, classId: 0 }]
				: []),
		],
		maxParticipants: isInvestment ? 5 : 1,
		aliveUserIds: [],
		allowedResponses: [],
		events: [],
		hasHenchman: isInvestment,
		gangName: isInvestment ? "Gangue de exemplo" : null,
		investmentName: isInvestment ? "Investimento de exemplo" : null,
		investmentYield: isInvestment ? 25_000 : null,
		expiresAt: null,
		duelDetails: isInvestment
			? null
			: {
				weaponName: "RPG",
				weaponImageUrl: "/images/items/10_RPG.png",
				usedGrenade: true,
				hospitalMinutes: scenario.kind === "beatUp" ? 60 : 27.5,
				hospitalMinutesDelta: scenario.kind === "beatUp" ? 20 : 0,
				prisonMinutesDelta: scenario.kind === "userRobbery" ? 60 : 0,
			},
		result: JSON.stringify(scenario.result()),
	};
});
const displayedResult = computed(() => previewResultSession.value ?? completedResult.value);
const displayedResultViewerId = computed(() =>
	previewResultSession.value && previewResultPerspective.value === "attacker" ? "preview-attacker" : userId.value,
);
const resultModals = {
	beatUp: BeatUpResultModal,
	userRobbery: RobberyResultModal,
	investmentRobbery: InvestmentRobberyResultModal,
};
const completedResultModal = computed(() => {
	const kind = displayedResult.value?.kind;
	return kind && Object.hasOwn(resultModals, kind) ? resultModals[kind as keyof typeof resultModals] : null;
});
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
		attackerAvatarDecoration: isPreview
			? "master_of_arms"
			: attacker?.id === session.value.ownerId
				? attacker.avatarDecoration
				: null,
		money: isPreview ? 219_532 : defender?.id === userId.value ? defender.money : null,
		profileError: !isPreview && Boolean(profileError.value || (profiles.value && (!attacker || !defender))),
	};
});
const respondingSessionId = ref<string | null>(null);

const actionTitles: Record<string, string> = {
	beatUp: "Espancamento em andamento",
	userRobbery: "Roubo em andamento",
	investmentRobbery: "Roubo de Investimento",
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
	if (!open) {
		previewKind.value = null;
		previewAttackerAction.value = false;
	}
}

function closeAttackerAction(open: boolean) {
	if (open) return;
	if (attackerPreviewSession.value) {
		closePreview(false);
		return;
	}
	dismissedAttackerSessionId.value = attackerActionSession.value?.id ?? null;
}

function closeResult(open: boolean) {
	if (open) return;
	if (previewResultKind.value) {
		previewResultKind.value = null;
		previewResultPerspective.value = "defender";
	}
	else {
		completedSessions.value = completedSessions.value.slice(1);
	}
}

function closePreviewMenu() {
	if (previewMenu.value) previewMenu.value.open = false;
}

function showDefenderPreview(kind: (typeof previewKinds)[number]) {
	closePreviewMenu();
	previewResultKind.value = null;
	previewAttackerAction.value = false;
	previewKind.value = kind;
}

function showAttackerActionPreview(kind: (typeof attackerPreviewKinds)[number]) {
	closePreviewMenu();
	previewResultKind.value = null;
	previewAttackerAction.value = true;
	previewKind.value = kind;
}

function showResultPreview(kind: PreviewResultKind, perspective: "defender" | "attacker") {
	closePreviewMenu();
	previewKind.value = null;
	previewAttackerAction.value = false;
	previewResultKind.value = kind;
	previewResultPerspective.value = perspective;
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
	}
	catch (error: unknown) {
		showToast({ text: error instanceof Error ? error.message : "Erro inesperado.", variant: "error" });
	}
	finally {
		respondingSessionId.value = null;
	}
}
</script>

<template>
	<details
		v-if="isDevelopment"
		ref="previewMenu"
		class="multiplayer-preview-menu"
	>
		<summary class="multiplayer-preview-menu__trigger">Pré-visualizações</summary>
		<div class="multiplayer-preview-menu__content">
			<section class="multiplayer-preview-menu__group">
				<h2>Defensor: ação recebida</h2>
				<BaseButton
					v-for="kind in previewKinds"
					:key="kind"
					variant="secondary"
					@click="showDefenderPreview(kind)"
				>
					{{ actionTitles[kind] }}
				</BaseButton>
			</section>
			<section class="multiplayer-preview-menu__group">
				<h2>Atacante: durante a ação</h2>
				<BaseButton
					v-for="kind in attackerPreviewKinds"
					:key="kind"
					variant="secondary"
					@click="showAttackerActionPreview(kind)"
				>
					{{ actionTitles[kind] }}
				</BaseButton>
			</section>
			<section class="multiplayer-preview-menu__group">
				<h2>Defensor: resultado</h2>
				<BaseButton
					v-for="kind in previewResultKinds"
					:key="kind"
					variant="secondary"
					@click="showResultPreview(kind, 'defender')"
				>
					{{ previewResults[kind].label }}
				</BaseButton>
			</section>
			<section class="multiplayer-preview-menu__group">
				<h2>Atacante: resultado</h2>
				<BaseButton
					v-for="kind in attackerResultPreviewKinds"
					:key="kind"
					variant="secondary"
					@click="showResultPreview(kind, 'attacker')"
				>
					{{ previewResults[kind].label }}
				</BaseButton>
			</section>
		</div>
	</details>
	<component
		:is="activeModal"
		v-if="session && activeModal && !completedResult && !previewAttackerAction"
		:session="session"
		:dismissible="!incomingSession"
		:responding="respondingSessionId !== null"
		:countdown="session.expiresAt ? formatCountdown(session.expiresAt) : ''"
		v-bind="duelProps"
		@update:open="closePreview"
		@respond="respond(session.id, $event)"
	/>
	<component
		:is="attackerActionModal"
		v-if="
			attackerActionSession &&
				attackerActionModal &&
				!completedResult &&
				dismissedAttackerSessionId !== attackerActionSession.id
		"
		:session="attackerActionSession"
		:countdown="attackerActionSession.expiresAt ? formatCountdown(attackerActionSession.expiresAt) : ''"
		@update:open="closeAttackerAction"
	/>
	<component
		:is="completedResultModal"
		v-if="displayedResult && completedResultModal"
		:session="displayedResult"
		:viewer-id="displayedResultViewerId"
		@update:open="closeResult"
	/>
</template>

<style
	scoped
	lang="scss"
>
@use "~/assets/scss/variables" as *;

.multiplayer-preview-menu {
	position: fixed;
	right: $spacing-md;
	bottom: $spacing-md;
	z-index: 90;

	&__trigger {
		padding: $spacing-sm $spacing-md;
		border: 1px solid $border-subtle;
		border-radius: $radius-md;
		background: $bg-card;
		color: $text-primary;
		cursor: pointer;
		list-style: none;
		box-shadow: $shadow-md;
	}

	&__trigger::-webkit-details-marker {
		display: none;
	}

	&__trigger:focus-visible {
		outline: 2px solid $border-focus;
		outline-offset: 2px;
	}

	&__content {
		position: absolute;
		right: 0;
		bottom: calc(100% + $spacing-sm);
		display: grid;
		gap: $spacing-md;
		width: min(22rem, calc(100vw - 2 * $spacing-md));
		max-height: 70vh;
		overflow-y: auto;
		padding: $spacing-md;
		border: 1px solid $border-card;
		border-radius: $radius-md;
		background: $bg-card;
		box-shadow: $shadow-md;
	}

	&__group {
		display: grid;
		gap: $spacing-xs;

		h2 {
			margin: 0;
			color: $text-secondary;
			font-size: 0.75rem;
			text-transform: uppercase;
		}
	}
}
</style>
