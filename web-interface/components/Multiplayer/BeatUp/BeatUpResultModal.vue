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
import { getOutcomeDate, parseMultiplayerOutcome } from "~/utils/multiplayerResult";

const props = defineProps<{
	session: MultiplayerSession;
	viewerId: string;
}>();
const emit = defineEmits<{
	"update:open": [open: boolean];
}>();
const outcome = computed(() => parseMultiplayerOutcome(props.session.result));
const succeeded = computed(() => (typeof outcome.value?.success === "boolean" ? outcome.value.success : null));
const attackerName = computed(
	() => props.session.participants.find(({ userId }) => userId === props.session.ownerId)?.nickname ?? "O atacante",
);
const targetName = computed(() => props.session.targetNickname ?? "o alvo");
const isTarget = computed(() => props.session.targetId === props.viewerId);
const details = computed(() => {
	if (succeeded.value === null) return [];
	if (succeeded.value) {
		const lines = [isTarget.value ? `Você foi espancado por ${attackerName.value}.` : `Você espancou ${targetName.value}.`];
		const hospitalTime = getOutcomeDate(outcome.value, "defenderHospitalTime");
		if (hospitalTime) {
			lines.push(
				isTarget.value
					? `Você ficará hospitalizado até ${hospitalTime}.`
					: `${targetName.value} ficará hospitalizado até ${hospitalTime}.`,
			);
		}
		return lines;
	}

	const lines = [
		isTarget.value
			? `Você conseguiu se defender de ${attackerName.value}.`
			: `Você falhou ao tentar espancar ${targetName.value}.`,
	];
	const hospitalTime = getOutcomeDate(outcome.value, "attackerHospitalTime");
	if (hospitalTime) {
		lines.push(
			isTarget.value
				? `${attackerName.value} ficará hospitalizado até ${hospitalTime}.`
				: `Você ficará hospitalizado até ${hospitalTime}.`,
		);
	}
	return lines;
});
</script>

<template>
	<BaseModal
		:open="true"
		title="Espancamento finalizado"
		:icon="imagePaths.situations.beatup"
		@update:open="emit('update:open', $event)"
	>
		<section class="beat-up-result">
			<BaseBadge
				v-if="succeeded !== null"
				:variant="succeeded ? 'success' : 'danger'"
			>
				{{ succeeded ? "Sucesso." : "Falha!" }}
			</BaseBadge>
			<div
				v-if="details.length"
				class="beat-up-result__details"
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
				class="beat-up-result__error"
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

.beat-up-result {
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
