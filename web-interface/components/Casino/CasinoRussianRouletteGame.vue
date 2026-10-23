<script
	setup
	lang="ts"
>
import { computed, ref } from "vue";
import MultiplayerSessionCard from "~/components/Multiplayer/MultiplayerSessionCard.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import { useMultiplayerSessions } from "~/composables/useMultiplayerSessions";

const { showToast } = useToast();
const auth = useAuth();
const {
	sessions,
	loading: sessionsLoading,
	error: sessionsError,
	streamError,
	startRussianRoulette,
	joinSession,
	refetch,
} = useMultiplayerSessions();
const bet = ref(5000);
const rouletteSessions = computed(() =>
	sessions.value.filter((session) => session.kind === "russianRoulette" && session.phase === "lobby"),
);
const modalOpen = ref(false);

async function createRoom() {
	const amount = bet.value;
	if (!Number.isSafeInteger(amount) || amount < 5_000) {
		showToast({ text: "A aposta deve ser um valor inteiro de pelo menos Cr$ 5.000.", variant: "warning" });
		return;
	}

	try {
		const result = (await startRussianRoulette({ bet: amount }))?.data?.startRussianRoulette;
		showToast({
			text: result?.message ?? "Falha ao criar a sala.",
			variant: result?.success ? "success" : "error",
		});
		if (result?.success) await refetch();
		modalOpen.value = false;
	} catch (caughtError: unknown) {
		showToast({ text: caughtError instanceof Error ? caughtError.message : "Erro inesperado.", variant: "error" });
	}
}

async function joinRoom(sessionId: string) {
	try {
		const result = (await joinSession({ sessionId }))?.data?.joinMultiplayerSession;
		showToast({
			text: result?.message ?? "Falha ao entrar na sala.",
			variant: result?.success ? "success" : "error",
		});
		if (result?.success) await refetch();
	} catch (caughtError: unknown) {
		showToast({ text: caughtError instanceof Error ? caughtError.message : "Erro inesperado.", variant: "error" });
	}
}
</script>

<template>
	<div class="roulette-game">
		<BaseCard
			title="Criar uma sala"
			no-body
		>
			<template #actions>
				<BaseButton variant="primary" @click="modalOpen = true"> Criar sala </BaseButton>
			</template>
		</BaseCard>

		<section
			class="roulette-game__sessions"
			aria-labelledby="roulette-sessions-heading"
		>
			<h2 id="roulette-sessions-heading">Salas abertas</h2>
			<p
				v-if="sessionsError"
				class="roulette-game__hint"
				role="alert"
			>
				Não foi possível carregar as salas de Roleta Russa.
			</p>
			<p
				v-else-if="streamError"
				class="roulette-game__hint"
				role="status"
			>
				Atualizações em tempo real foram interrompidas. A página tentará se reconectar.
			</p>
			<p
				v-else-if="sessionsLoading && !rouletteSessions.length"
				class="roulette-game__hint"
				role="status"
			>
				Carregando salas abertas...
			</p>
			<BaseCard v-else-if="!rouletteSessions.length">
				<p
					class="roulette-game__hint"
					role="status"
				>
					Nenhuma sala aberta no momento.
				</p>
			</BaseCard>
			<MultiplayerSessionCard
				v-for="session in rouletteSessions"
				:key="session.id"
				:session="session"
				:current-user-id="auth.user.value?.userId ?? ''"
				@join="joinRoom"
			/>
		</section>

		<BaseModal
			:open="modalOpen"
			title="Criar uma sala"
			description="O jogo começa automaticamente ao atingir cinco participantes"
			@update:open="modalOpen = $event"
		>
			<form
				class="roulette-game__form"
				@submit.prevent="createRoom()"
			>
				<BaseInput
					id="roulette-bet"
					v-model="bet"
					type="number"
					label="Aposta por jogador (mínimo Cr$ 5.000)"
					input-mode="numeric"
					placeholder="5000"
					required
				/>
			</form>
			<template #footer>
				<BaseButton
					variant="secondary"
					@click="modalOpen = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					type="submit"
					variant="primary"
				>
					Criar sala
				</BaseButton>
			</template>
		</BaseModal>
	</div>
</template>

<style
	scoped
	lang="scss"
>
@use "~/assets/scss/variables" as *;

.roulette-game,
.roulette-game__sessions {
	display: grid;
	gap: $spacing-md;
}
</style>
