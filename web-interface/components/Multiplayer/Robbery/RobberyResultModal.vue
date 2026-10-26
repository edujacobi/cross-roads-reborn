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
import { getOutcomeDate, getOutcomeNumber, parseMultiplayerOutcome } from "~/utils/multiplayerResult";

type ResultLine = {
	text: string;
	image?: ImagePath;
	tone: "success" | "hospital" | "neutral" | "prison";
};

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
const resultLines = computed<ResultLine[]>(() => {
	if (succeeded.value === null) return [];
	const lines: ResultLine[] = [];

	if (succeeded.value) {
		const amount = getOutcomeNumber(outcome.value, "moneyRobbed");
		lines.push({
			text: isTarget.value
				? `Você foi roubado${amount === null ? "" : ` e perdeu ${formatMoney(amount)}`} para ${attackerName.value}!`
				: `Você roubou ${targetName.value}${amount === null ? "" : ` e ganhou ${formatMoney(amount)}`}!`,
			tone: "neutral",
		});
		if (outcome.value?.willBeBeatenUp === true) {
			const hospitalTime = getOutcomeDate(outcome.value, "defenderHospitalTime");
			lines.push({
				text: isTarget.value
					? `Você também foi espancado${hospitalTime ? ` e ficará hospitalizado até ${hospitalTime}` : ""}.`
					: `${targetName.value} também foi espancado${hospitalTime ? ` e ficará hospitalizado até ${hospitalTime}` : ""}.`,
				image: imagePaths.situations.hospital,
				tone: "hospital",
			});
		}
	} else {
		lines.push({
			text: isTarget.value
				? props.session.response === "police"
					? `${attackerName.value} tentou lhe roubar, mas a polícia o capturou!`
					: `${attackerName.value} tentou lhe roubar, mas falhou.`
				: `Seu roubo contra ${targetName.value} falhou.`,
			tone: "neutral",
		});
		const prisonTime = getOutcomeDate(outcome.value, "attackerPrisonTime");
		if (prisonTime) {
			lines.push({
				text: isTarget.value ? `Ele ficará preso até ${prisonTime}.` : `Você ficará preso até ${prisonTime}.`,
				image: imagePaths.situations.prison,
				tone: "prison",
			});
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
		variant="robbery"
		@update:open="emit('update:open', $event)"
	>
		<section class="robbery-result">
			<BaseBadge
				v-if="succeeded !== null"
				:variant="(succeeded && !isTarget) || (!succeeded && isTarget) ? 'success' : 'danger'"
			>
				{{ succeeded ? (isTarget ? "Sucesso." : "Sucesso!") : isTarget ? "Falha!" : "Falha." }}
			</BaseBadge>
			<div
				v-if="resultLines.length"
				class="robbery-result__details"
			>
				<p
					v-for="(line, index) in resultLines"
					:key="index"
					:class="`robbery-result__line robbery-result__line--${line.tone}`"
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

		&--prison {
			color: $color-prison;
		}
	}

	&__error {
		margin: 0;
		color: $color-danger;
	}
}
</style>
