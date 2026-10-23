<script
	setup
	lang="ts"
>
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import type { MultiplayerSession } from "~/graphql/generated";

defineProps<{
	session: MultiplayerSession;
	dismissible: boolean;
	responding: boolean;
	countdown: string;
}>();
const emit = defineEmits<{
	respond: [response: string];
	"update:open": [open: boolean];
}>();
const { formatMoney } = useMoneyFormat();
const responseLabels: Record<string, string> = {
	defend: "Defender investimento",
};
</script>

<template>
	<BaseModal
		:open="true"
		:dismissible="dismissible"
		title="Roubo em andamento"
		description="Escolha uma ação para responder. Esta janela ficará aberta até a ação terminar."
		@update:open="emit('update:open', $event)"
	>
		<section
			class="defender-prompt"
			:aria-labelledby="`defender-prompt-title-${session.id}`"
		>
			<h2 :id="`defender-prompt-title-${session.id}`">Roubo em andamento</h2>
			<div>
				<h3
					:id="`defender-attackers-${session.id}`"
					class="defender-prompt__label"
				>
					Atacantes
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
				<time :datetime="session.expiresAt">{{ countdown }}</time>
			</p>
			<fieldset
				v-if="session.phase === 'awaitingDefender' && session.response === null"
				class="defender-prompt__actions"
				aria-label="Ações para Roubo em andamento"
				:aria-busy="responding"
			>
				<BaseButton
					v-for="response in session.allowedResponses"
					:key="response"
					variant="secondary"
					:disabled="responding"
					@click="emit('respond', response)"
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
@use "~/assets/scss/defender-prompt";
</style>
