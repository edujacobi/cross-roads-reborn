<script
	setup
	lang="ts"
>
import { computed } from "vue";
import BaseBadge from "~/components/ui/BaseBadge.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import { imagePaths } from "~/constants/imagePaths";
import type { MultiplayerSession } from "~/graphql/generated";
import { getOutcomeNumber, parseMultiplayerOutcome } from "~/utils/multiplayerResult";

const props = defineProps<{
	session: MultiplayerSession;
	viewerId: string;
}>();
const emit = defineEmits<{
	"update:open": [open: boolean];
}>();
const { formatMoney } = useMoneyFormat();
const outcome = computed(() => parseMultiplayerOutcome(props.session.result));
const succeeded = computed(() => (typeof outcome.value?.win === "boolean" ? outcome.value.win : null));
const targetName = computed(() => props.session.targetNickname ?? "o alvo");
const isTarget = computed(() => props.session.targetId === props.viewerId);
const details = computed(() => {
	if (succeeded.value === null) return [];
	if (succeeded.value) {
		const lines = [
			isTarget.value
				? `A gangue ${props.session.gangName ?? ""} roubou seu investimento!`
				: `Sua gangue roubou o investimento de ${targetName.value}!`,
		];
		const amount = getOutcomeNumber(outcome.value, "robbedAmount");
		const remainingYield = getOutcomeNumber(outcome.value, "remainingYield");
		if (amount !== null) lines.push(`Roubado para caixa da gangue: ${formatMoney(amount)}.`);
		if (remainingYield !== null) lines.push(`Próximo lucro: ${formatMoney(remainingYield)}.`);
		return lines;
	}

	const lines = [
		isTarget.value
			? "Você defendeu seu investimento com sucesso!"
			: `Sua gangue falhou ao roubar o investimento de ${targetName.value}.`,
		isTarget.value ? "Todos os atacantes foram presos!" : "Os atacantes foram presos.",
	];
	const prisonHours = getOutcomeNumber(outcome.value, "prisonHours");
	if (prisonHours !== null) {
		lines.push(`Eles serão liberados em ${new Intl.NumberFormat("pt-BR").format(prisonHours)} horas.`);
	}
	return lines;
});
</script>

<template>
	<BaseModal
		:open="true"
		title="Ataque ao investimento"
		:icon="imagePaths.situations.defendingInvestment"
		@update:open="emit('update:open', $event)"
	>
		<section class="investment-robbery-result">
			<BaseBadge
				v-if="succeeded !== null"
				:variant="succeeded ? 'success' : 'danger'"
			>
				{{ succeeded ? "Sucesso." : "Falha!" }}
			</BaseBadge>
			<div
				v-if="details.length"
				class="investment-robbery-result__details"
			>
				<p
					v-for="(line, index) in details"
					:key="index"
				>
					{{ line }}
				</p>
			</div>
			<p
				v-else
				class="investment-robbery-result__error"
				role="alert"
			>
				Não foi possível carregar o resultado desta ação.
			</p>
		</section>
		<template #footer>
			<BaseButton
				variant="secondary"
				@click="emit('update:open', false)"
			>
				Fechar
			</BaseButton>
		</template>
	</BaseModal>
</template>

<style
	scoped
	lang="scss"
>
@use "~/assets/scss/variables" as *;

.investment-robbery-result {
	display: grid;
	gap: $spacing-sm;

	&__details {
		display: grid;
		gap: $spacing-xs;

		p {
			margin: 0;
		}
	}

	&__error {
		margin: 0;
		color: $color-danger;
	}
}
</style>
