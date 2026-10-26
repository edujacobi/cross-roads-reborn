<script
	setup
	lang="ts"
>
import AttackIcon from "~/components/icons/AttackIcon.vue";
import BaseBadge from "~/components/ui/BaseBadge.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import { imagePaths } from "~/constants/imagePaths";
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
const responseLabels: Record<string, { text: string; image: string }> = {
	defend: {
		text: "Defender investimento",
		image: imagePaths.attributes.defense,
	},
};
const responseStatuses: Record<string, string> = {
	defend: "Defendendo Investimento...",
};
</script>

<template>
	<BaseModal
		:open="true"
		:dismissible="dismissible"
		title="Ataque ao investimento"
		@update:open="emit('update:open', $event)"
		icon="/images/situations/defending-investment.png"
	>
		<section
			class="defender-prompt"
			:aria-labelledby="`defender-attackers-${session.id}`"
		>
			<h3
				:id="`defender-attackers-${session.id}`"
				class="defender-prompt__label"
			>
				<span>Membros da gangue <strong>{{ session.gangName ?? "" }}</strong></span>
				estão atacando o seu investimento
				<strong>{{ session.investmentName ?? "Investimento" }}</strong>.
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
					<BaseBadge
						variant="danger"
						class="defender-prompt__attack-badge"
					>
						<AttackIcon
							:size="14"
							variant="solid"
						/>
						{{ participant.attack }}
						ATK
					</BaseBadge>
				</li>
			</ul>
		</section>

		<section class="defender-prompt__actions-wrapper">
			<p>Decida o que fazer:</p>
			<fieldset
				v-if="session.phase === 'awaitingDefender' && session.response === null"
				class="defender-prompt__response"
				aria-label="Ações para Roubo em andamento"
				:aria-busy="responding"
			>
				<BaseButton
					v-for="response in session.allowedResponses"
					:key="response"
					variant="secondary"
					size="lg"
					:disabled="responding"
					:aria-describedby="`response-effect-${session.id}`"
					@click="emit('respond', response)"
				>
					<NuxtImg
						v-if="responseLabels[response]?.image"
						:src="responseLabels[response].image"
						alt=""
						width="24"
						height="24"
					/>
					{{ responseLabels[response]?.text ?? response }}
				</BaseButton>
				<p :id="`response-effect-${session.id}`">+5 DEF, mas quem sair derrotado ficará 30 minutos hospitalizado.</p>
			</fieldset>
			<p
				v-else
				class="defender-prompt__status"
				role="status"
			>
				<NuxtImg
					v-if="session.response && responseLabels[session.response]?.image"
					:src="responseLabels[session.response].image"
					alt=""
					width="20"
					height="20"
				/>
				{{ (session.response && responseStatuses[session.response]) || "A ação está sendo resolvida." }}
			</p>
		</section>

		<template #footer>
			<p
				v-if="session.expiresAt"
				class="defender-prompt__countdown"
			>
				<time :datetime="session.expiresAt">{{ countdown }}</time>
				restantes
			</p>
			<span v-if="session.investmentYield"> Lucro acumulado: {{ formatMoney(session.investmentYield) }} </span>
		</template>
	</BaseModal>
</template>

<style
	scoped
	lang="scss"
>
@use "~/assets/scss/defender-prompt";
</style>
