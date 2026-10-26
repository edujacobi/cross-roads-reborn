<script
	setup
	lang="ts"
>
import { computed } from "vue";
import BaseBadge from "~/components/ui/BaseBadge.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import type { ImagePath } from "~/constants/imagePaths";
import { imagePaths } from "~/constants/imagePaths";
import type { MultiplayerSession } from "~/graphql/generated";
import { getOutcomeDate, parseMultiplayerOutcome } from "~/utils/multiplayerResult";

type ResultLine = {
	text: string;
	image?: ImagePath;
	tone: "success" | "hospital" | "neutral";
};

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

const resultLines = computed<ResultLine[]>(() => {
	if (succeeded.value === null) return [];
	if (succeeded.value) {
		const lines: ResultLine[] = [
			{
				text: isTarget.value ? `Você foi espancado por ${attackerName.value}.` : `Você espancou ${targetName.value}.`,
				tone: "neutral",
			},
		];

		const hospitalTime = getOutcomeDate(outcome.value, "defenderHospitalTime");
		if (hospitalTime) {
			lines.push({
				text: isTarget.value
					? `Você ficará hospitalizado até ${hospitalTime}.`
					: `${targetName.value} ficará hospitalizado até ${hospitalTime}.`,
				image: imagePaths.situations.hospital,
				tone: "hospital",
			});
		}
		return lines;
	}

	const lines: ResultLine[] = [
		{
			text: isTarget.value
				? `Você conseguiu se defender de ${attackerName.value}.`
				: `Você falhou ao tentar espancar ${targetName.value}.`,
			tone: "neutral",
		},
	];

	const hospitalTime = getOutcomeDate(outcome.value, "attackerHospitalTime");
	if (hospitalTime) {
		lines.push({
			text: isTarget.value
				? `${attackerName.value} ficará hospitalizado até ${hospitalTime}.`
				: `Você ficará hospitalizado até ${hospitalTime}.`,
			image: imagePaths.situations.hospital,
			tone: "hospital",
		});
	}
	return lines;
});
</script>

<template>
	<BaseModal
		:open="true"
		title="Espancamento finalizado"
		:icon="imagePaths.situations.beatup"
		variant="beatup"
		@update:open="emit('update:open', $event)"
	>
		<section class="beat-up-result">
			<BaseBadge
				v-if="succeeded !== null"
				:variant="succeeded && !isTarget || !succeeded && isTarget? 'success' : 'danger'"
			>
				{{ succeeded ? (isTarget ? "Sucesso." : "Sucesso!") : isTarget ? "Falha!" : "Falha." }}
			</BaseBadge>
			<div
				v-if="resultLines.length"
				class="beat-up-result__details"
			>
				<p
					v-for="(line, index) in resultLines"
					:key="index"
					:class="`beat-up-result__line beat-up-result__line--${line.tone}`"
				>
					<NuxtImg
						v-if="line.image"
						:src="line.image"
						alt=""
						width="24"
						height="24"
					/>
					{{ line.text }}
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

	:deep(.base-badge) {
		justify-content: center;
		padding: 1rem;
		border-radius: $radius-sm;
		font-size: $font-size-18;
	}

	&__details {
		display: grid;
		gap: $spacing-xs;
	}

	&__line {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		margin: 0;

		&--success {
			color: $color-success;
		}

		&--hospital {
			color: $color-hospital;
		}
	}

	&__error {
		margin: 0;
		color: $color-danger;
	}
}
</style>
