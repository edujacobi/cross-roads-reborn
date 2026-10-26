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
import { getOutcomeDate, getOutcomeNumber, parseMultiplayerOutcome } from "~/utils/multiplayerResult";

const props = defineProps<{
	session: MultiplayerSession;
	viewerId: string;
}>();
const emit = defineEmits<{
	"update:open": [open: boolean];
}>();
const { formatMoney } = useMoneyFormat();
const outcome = computed(() => parseMultiplayerOutcome(props.session.result));
const succeeded = computed(() => (typeof outcome.value?.success === "boolean" ? outcome.value.success : null));
const attackerName = computed(
	() => props.session.participants.find(({ userId }) => userId === props.session.ownerId)?.nickname ?? "O atacante",
);
const targetName = computed(() => props.session.targetNickname ?? "o alvo");
const isTarget = computed(() => props.session.targetId === props.viewerId);
const details = computed(() => {
	if (succeeded.value === null) return [];
	const lines: string[] = [];

	if (succeeded.value) {
		const amount = getOutcomeNumber(outcome.value, "moneyRobbed");
		lines.push(
			isTarget.value
				? `Você foi roubado${amount === null ? "" : ` e perdeu ${formatMoney(amount)}`} para ${attackerName.value}!`
				: `Você roubou ${targetName.value}${amount === null ? "" : ` e ganhou ${formatMoney(amount)}`}!`,
		);
		if (outcome.value?.willBeBeatenUp === true) {
			const hospitalTime = getOutcomeDate(outcome.value, "defenderHospitalTime");
			lines.push(
				isTarget.value
					? `Você também foi espancado${hospitalTime ? ` e ficará hospitalizado até ${hospitalTime}` : ""}.`
					: `${targetName.value} também foi espancado${hospitalTime ? ` e ficará hospitalizado até ${hospitalTime}` : ""}.`,
			);
		}
	} else {
		lines.push(
			isTarget.value
				? props.session.response === "police"
					? `${attackerName.value} tentou lhe roubar, mas a polícia o capturou!`
					: `${attackerName.value} tentou lhe roubar, mas falhou.`
				: `Seu roubo contra ${targetName.value} falhou.`,
		);
		const prisonTime = getOutcomeDate(outcome.value, "attackerPrisonTime");
		if (prisonTime) {
			lines.push(isTarget.value ? `Ele ficará preso até ${prisonTime}.` : `Você ficará preso até ${prisonTime}.`);
		}
	}

	return lines;
});
</script>

<template>
	<BaseModal
		:open="true"
		title="Roubo finalizado"
		:icon="imagePaths.situations.robbery"
		@update:open="emit('update:open', $event)"
	>
		<section class="robbery-result">
			<BaseBadge
				v-if="succeeded !== null"
				:variant="succeeded ? 'success' : 'danger'"
			>
				{{ succeeded ? "Sucesso." : "Falha!" }}
			</BaseBadge>
			<div
				v-if="details.length"
				class="robbery-result__details"
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
				class="robbery-result__error"
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

.robbery-result {
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
