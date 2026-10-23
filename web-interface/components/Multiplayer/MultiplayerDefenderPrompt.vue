<script
	setup
	lang="ts"
>
import { computed, onMounted, onUnmounted, ref } from "vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import { useMultiplayerSessions } from "~/composables/useMultiplayerSessions";

const auth = useAuth();
const { showToast } = useToast();
const { formatMoney } = useMoneyFormat();
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
const defenderSessions = computed(() =>
	sessions.value.filter(
		(session) =>
			session.targetId === userId.value &&
			["beatUp", "userRobbery", "investmentRobbery"].includes(session.kind) &&
			["awaitingDefender", "resolving"].includes(session.phase),
	),
);
const respondingSessionId = ref<string | null>(null);

const actionTitles: Record<string, string> = {
	beatUp: "Espancamento",
	userRobbery: "Roubo",
	investmentRobbery: "Roubo de investimento",
};
const responseLabels: Record<string, string> = {
	fight: "Lutar",
	run: "Correr",
	nothing: "Não fazer nada",
	react: "Reagir",
	police: "Chamar a polícia",
	defend: "Defender investimento",
};

function formatCountdown(expiresAt: string) {
	const totalSeconds = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now.value) / 1_000));
	return `${totalSeconds} ${totalSeconds === 1 ? "segundo" : "segundos"}`;
}

async function respond(sessionId: string, response: string) {
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
	<BaseModal
		:open="defenderSessions.length > 0"
		:dismissible="false"
		title="Ação contra você"
		:description="
			defenderSessions.length === 1
				? 'Escolha uma ação para responder. Esta janela ficará aberta até a ação terminar.'
				: 'Responda às ações contra você. Esta janela ficará aberta até todas terminarem.'
		"
	>
		<section
			v-for="session in defenderSessions"
			:key="session.id"
			class="defender-prompt"
			:aria-labelledby="`defender-prompt-title-${session.id}`"
		>
			<h2 :id="`defender-prompt-title-${session.id}`">
				{{ actionTitles[session.kind] ?? "Ação multiplayer" }}
			</h2>

			<div>
				<h3
					:id="`defender-attackers-${session.id}`"
					class="defender-prompt__label"
				>
					{{ session.kind === "investmentRobbery" ? "Atacantes" : "Atacante" }}
				</h3>
				<ul
					class="defender-prompt__attackers"
					:aria-labelledby="`defender-attackers-${session.id}`"
				>
					<li
						v-for="participant in session.participants"
						:key="participant.userId"
					>
						<strong>{{ participant.nickname }}</strong>
						<span>{{ participant.attack }} ATK</span>
					</li>
				</ul>
			</div>

			<p v-if="session.gangName">Gangue: <strong>{{ session.gangName }}</strong></p>
			<p v-if="session.investmentName">
				Investimento: <strong>{{ session.investmentName }}</strong>
				<span v-if="session.investmentYield"> · Rendimento: {{ formatMoney(session.investmentYield) }} </span>
			</p>
			<p v-if="session.expiresAt">
				Tempo para responder:
				<time :datetime="session.expiresAt">
					{{ formatCountdown(session.expiresAt) }}
				</time>
			</p>

			<fieldset
				v-if="session.phase === 'awaitingDefender' && session.response === null"
				class="defender-prompt__actions"
				:aria-label="`Ações para ${actionTitles[session.kind] ?? 'ação multiplayer'}`"
				:aria-busy="respondingSessionId === session.id"
			>
				<BaseButton
					v-for="response in session.allowedResponses"
					:key="response"
					variant="secondary"
					:disabled="respondingSessionId !== null"
					@click="respond(session.id, response)"
				>
					{{ responseLabels[response] ?? response }}
				</BaseButton>
			</fieldset>
			<p
				v-else
				class="defender-prompt__status"
				role="status"
			>
				{{ session.response ? "Sua resposta foi registrada. Aguarde o resultado." : "A ação está sendo resolvida." }}
			</p>
		</section>
	</BaseModal>
</template>

<style
	scoped
	lang="scss"
>
@use "~/assets/scss/variables" as *;

.defender-prompt {
	display: grid;
	gap: $spacing-sm;

	& + & {
		margin-top: $spacing-md;
		padding-top: $spacing-md;
		border-top: 1px solid $border-subtle;
	}

	h2,
	h3,
	p {
		margin: 0;
	}

	h2 {
		font-size: $font-size-16;
	}

	&__label {
		margin-bottom: $spacing-xs;
		color: $text-secondary;
		font-size: $font-size-12;
		font-weight: $font-weight-semibold;
	}

	&__attackers {
		display: grid;
		gap: $spacing-xs;
		margin: 0;
		padding: 0;
		list-style: none;

		li {
			display: flex;
			justify-content: space-between;
			gap: $spacing-sm;
		}
	}

	&__actions {
		display: flex;
		flex-wrap: wrap;
		gap: $spacing-sm;
	}

	&__status {
		color: $text-secondary;
	}
}
</style>
