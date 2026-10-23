<script
	setup
	lang="ts"
>
import { computed } from "vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import type { MultiplayerSession } from "~/graphql/generated";

const { formatMoney } = useMoneyFormat();

const props = defineProps<{
	session: MultiplayerSession;
	currentUserId: string;
}>();

const emit = defineEmits<{
	join: [sessionId: string];
	respond: [payload: { sessionId: string; response: string }];
	abort: [sessionId: string];
}>();

const titles: Record<string, string> = {
	russianRoulette: "Roleta Russa",
	beatUp: "Espancamento",
	userRobbery: "Roubo",
	investmentRobbery: "Roubo de investimento",
	gangHeist: "Golpe de gangue",
};

const responseLabels: Record<string, string> = {
	fight: "Lutar",
	run: "Correr",
	nothing: "Não fazer nada",
	react: "Reagir",
	police: "Chamar a polícia",
	defend: "Defender investimento",
};

const isParticipant = computed(() =>
	props.session.participants.some((participant) => participant.userId === props.currentUserId),
);
const canJoin = computed(
	() =>
		props.session.phase === "lobby" &&
		!isParticipant.value &&
		props.session.ownerId !== props.currentUserId &&
		props.session.targetId !== props.currentUserId &&
		props.session.participants.length < props.session.maxParticipants,
);
const canAbort = computed(
	() =>
		props.session.phase === "lobby" &&
		props.session.ownerId === props.currentUserId &&
		["investmentRobbery", "gangHeist"].includes(props.session.kind),
);
const canRespond = computed(
	() =>
		props.session.phase === "awaitingDefender" &&
		props.session.response === null &&
		props.session.targetId === props.currentUserId,
);
const resultSummary = computed(() => {
	if (!props.session.result) return "";
	try {
		const parsed: unknown = JSON.parse(props.session.result);
		if (typeof parsed !== "object" || parsed === null) return "Resultado disponível.";
		const result = parsed as Record<string, unknown>;
		const amount = (value: unknown) => (typeof value === "number" ? formatMoney(value) : "");
		if (props.session.kind === "russianRoulette") {
			const winner = props.session.participants.find((participant) => participant.userId === result.winnerId);
			return winner ? `${winner.nickname} venceu com ${amount(result.prize)}.` : "Partida concluída.";
		}
		if (props.session.kind === "investmentRobbery") {
			if (result.win === true) {
				return props.session.targetId === props.currentUserId
					? `Seu investimento perdeu ${amount(result.robbedAmount)}.`
					: `Roubo concluído: ${amount(result.robbedAmount)} para a gangue.`;
			}
			return props.session.targetId === props.currentUserId
				? "Você defendeu seu investimento."
				: `Roubo fracassado. Prisão: ${String(result.prisonHours ?? 0)} horas.`;
		}
		if (props.session.kind === "gangHeist") {
			if (result.success !== true) return `Golpe fracassado. Prisão: ${String(result.jailHours ?? 0)} horas.`;
			return result.stolenAmount === undefined
				? "Preparação concluída com sucesso."
				: `Golpe concluído: ${amount(result.stolenAmount)} roubados.`;
		}
		if (props.session.kind === "userRobbery") {
			if (result.success === true) {
				return props.session.targetId === props.currentUserId
					? `Você perdeu ${amount(result.moneyRobbed)}.`
					: `Roubo concluído: ${amount(result.moneyRobbed)}.`;
			}
			return props.session.targetId === props.currentUserId ? "Você se defendeu do roubo." : "O roubo falhou.";
		}
		if (props.session.kind === "beatUp") {
			return result.success === true
				? props.session.targetId === props.currentUserId
					? "Você foi espancado."
					: "Espancamento bem-sucedido."
				: props.session.targetId === props.currentUserId
					? "Você venceu a luta."
					: "O espancamento falhou.";
		}
		return result.success === true ? "Ação concluída com sucesso." : "Ação concluída.";
	} catch {
		return "Não foi possível ler o resultado.";
	}
});
const statusLabel = computed(() => {
	if (props.session.phase === "lobby") return "Aguardando participantes";
	if (props.session.phase === "awaitingDefender") {
		if (props.session.response !== null) return "Resposta registrada";
		return props.session.targetId === props.currentUserId ? "Aguardando sua resposta" : "Aguardando resposta do alvo";
	}
	if (props.session.phase === "resolving" || props.session.phase === "running" || props.session.phase === "starting") {
		return "Em andamento";
	}
	if (props.session.phase === "completed") return "Concluída";
	return "Interrompida";
});

function eventLabel(event: MultiplayerSession["events"][number]) {
	const name =
		props.session.participants.find((participant) => participant.userId === event.userId)?.nickname ?? "Jogador";
	if (event.type === "started") return `${name} começou a rodada.`;
	if (event.type === "turn" && event.outcome === "eliminated") return `${name} foi hospitalizado.`;
	if (event.type === "turn") return `${name} sobreviveu à rodada.`;
	if (event.type === "finished") return `${name} venceu.`;
	return "";
}
</script>

<template>
	<BaseCard class="multiplayer-card">
		<header class="multiplayer-card__header">
			<div>
				<h3>{{ titles[session.kind] ?? "Ação multiplayer" }}</h3>
				<p role="status">{{ statusLabel }}</p>
			</div>
			<span v-if="session.bet">Aposta: {{ formatMoney(session.bet) }}</span>
		</header>

		<p v-if="session.targetNickname">Alvo: <strong>{{ session.targetNickname }}</strong></p>
		<p v-if="session.gangName">Gangue: <strong>{{ session.gangName }}</strong></p>
		<p v-if="session.investmentName">
			Investimento: <strong>{{ session.investmentName }}</strong>
			<span v-if="session.investmentYield"> · Rendimento: {{ formatMoney(session.investmentYield) }}</span>
		</p>

		<p class="multiplayer-card__count">
			Participantes: {{ session.participants.length }}/{{ session.maxParticipants }}
		</p>
		<p
			v-if="resultSummary"
			class="multiplayer-card__result"
			role="status"
		>
			{{ resultSummary }}
		</p>
		<ul
			class="multiplayer-card__participants"
			aria-label="Participantes"
		>
			<li
				v-for="participant in session.participants"
				:key="participant.userId"
			>
				{{ participant.nickname }}
				<span v-if="session.aliveUserIds.length">
					{{ session.aliveUserIds.includes(participant.userId) ? "· na partida" : "· hospitalizado" }}
				</span>
			</li>
		</ul>

		<p v-if="session.expiresAt">
			Prazo:
			<time :datetime="session.expiresAt">
				{{ new Date(session.expiresAt).toLocaleTimeString("pt-BR") }}
			</time>
		</p>
		<ul
			v-if="session.events.length"
			class="multiplayer-card__events"
			aria-label="Eventos recentes"
			aria-live="polite"
			aria-relevant="additions"
		>
			<li
				v-for="(event, index) in session.events.slice(-5)"
				:key="Math.max(0, session.events.length - 5) + index"
			>
				{{ eventLabel(event) }}
			</li>
		</ul>

		<fieldset
			v-if="canJoin || canAbort || canRespond"
			class="multiplayer-card__actions"
			:aria-label="`Ações para ${titles[session.kind] ?? 'esta sessão'}`"
		>
			<BaseButton
				v-if="canJoin"
				variant="primary"
				@click="emit('join', session.id)"
			>
				Entrar na sala
			</BaseButton>
			<BaseButton
				v-for="response in canRespond ? session.allowedResponses : []"
				:key="response"
				variant="secondary"
				@click="emit('respond', { sessionId: session.id, response })"
			>
				{{ responseLabels[response] ?? response }}
			</BaseButton>
			<BaseButton
				v-if="canAbort"
				variant="danger"
				@click="emit('abort', session.id)"
			>
				Cancelar sala
			</BaseButton>
		</fieldset>
	</BaseCard>
</template>

<style
	scoped
	lang="scss"
>
.multiplayer-card {
	display: grid;
	gap: 0.75rem;
}

.multiplayer-card__header,
.multiplayer-card__actions {
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 0.65rem;
}

.multiplayer-card__header h3 {
	margin: 0;
}

.multiplayer-card__header p,
.multiplayer-card__count {
	margin: 0.25rem 0 0;
}

.multiplayer-card__participants,
.multiplayer-card__events {
	margin: 0;
	padding-left: 1.25rem;
}
</style>
