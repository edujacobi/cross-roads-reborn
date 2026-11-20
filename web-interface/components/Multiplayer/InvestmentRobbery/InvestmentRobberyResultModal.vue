<script
	setup
	lang="ts"
>
import { computed } from "vue";
import DefenseIcon from "~/components/icons/DefenseIcon.vue";
import GangIcon from "~/components/icons/GangIcon.vue";
import HospitalIcon from "~/components/icons/HospitalIcon.vue";
import InvestmentIcon from "~/components/icons/InvestmentIcon.vue";
import PrisonIcon from "~/components/icons/PrisonIcon.vue";
import RobberyIcon from "~/components/icons/RobberyIcon.vue";
import BaseBadge from "~/components/ui/BaseBadge.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import { imagePaths } from "~/constants/imagePaths";
import type { MultiplayerSession } from "~/graphql/generated";
import { getOutcomeDate, getOutcomeNumber, parseMultiplayerOutcome } from "~/utils/multiplayerResult";

type ResultIcon =
	| typeof DefenseIcon
	| typeof GangIcon
	| typeof HospitalIcon
	| typeof InvestmentIcon
	| typeof PrisonIcon
	| typeof RobberyIcon;

type ResultLine = {
	text: string;
	icon?: ResultIcon;
	style: "primary" | "secondary" | "muted";
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
const succeeded = computed(() => (typeof outcome.value?.win === "boolean" ? outcome.value.win : null));
const targetName = computed(() => props.session.targetNickname ?? "o alvo");
const isTarget = computed(() => props.session.targetId === props.viewerId);
const viewerSucceeded = computed(() =>
	succeeded.value === null ? null : isTarget.value ? !succeeded.value : succeeded.value,
);

function getTargetSuccessLines(): ResultLine[] {
	const lines: ResultLine[] = [
		{
			text: `A gangue ${props.session.gangName ?? "inimiga"} roubou seu investimento.`,
			style: "primary",
		},
	];
	const amount = getOutcomeNumber(outcome.value, "robbedAmount");
	if (amount !== null) {
		lines.push({
			text: `Você perdeu ${formatMoney(amount)} do investimento.`,
			style: "secondary",
		});
	}
	if (outcome.value?.henchmanHospitalized === true) {
		lines.push({
			text: "Seu capanga foi hospitalizado.",
			icon: HospitalIcon,
			style: "muted",
		});
	}
	if (outcome.value?.defenderHospitalized === true) {
		const hospitalTime = getOutcomeDate(outcome.value, "defenderHospitalTime");
		lines.push({
			text: hospitalTime ? `Você ficará hospitalizado até ${hospitalTime}.` : "Você foi hospitalizado.",
			icon: HospitalIcon,
			style: "muted",
		});
	}
	return lines;
}

function getAttackerSuccessLines(): ResultLine[] {
	const lines: ResultLine[] = [
		{
			text: `Sua gangue roubou o investimento de ${targetName.value}!`,
			style: "primary",
		},
	];
	const amount = getOutcomeNumber(outcome.value, "robbedAmount");
	if (amount !== null) {
		lines.push({
			text: `Roubado para caixa da gangue: ${formatMoney(amount)}.`,
			style: "secondary",
		});
	}
	const expGain = getOutcomeNumber(outcome.value, "expGain");
	if (expGain !== null) {
		lines.push({
			text: `+${new Intl.NumberFormat("pt-BR").format(expGain)} EXP`,
			style: "secondary",
		});
	}
	if (outcome.value?.henchmanHospitalized === true) {
		lines.push({
			text: `O capanga de ${targetName.value} foi hospitalizado.`,
			icon: HospitalIcon,
			style: "muted",
		});
	}
	if (outcome.value?.defenderHospitalized === true) {
		const hospitalTime = getOutcomeDate(outcome.value, "defenderHospitalTime");
		lines.push({
			text: hospitalTime
				? `${targetName.value} ficará hospitalizado até ${hospitalTime}.`
				: `${targetName.value} foi hospitalizado.`,
			icon: HospitalIcon,
			style: "muted",
		});
	}
	return lines;
}

function getTargetFailureLines(): ResultLine[] {
	const lines: ResultLine[] = [
		{
			text: "Você defendeu seu investimento com sucesso!",
			style: "primary",
		},
		{
			text: "Todos os atacantes foram presos!",
			icon: PrisonIcon,
			style: "secondary",
		},
	];
	const prisonHours = getOutcomeNumber(outcome.value, "prisonHours");
	if (prisonHours !== null) {
		lines.push({
			text: `Eles serão liberados em ${new Intl.NumberFormat("pt-BR").format(prisonHours)} horas.`,
			style: "muted",
		});
	}
	return lines;
}

function getAttackerFailureLines(): ResultLine[] {
	const lines: ResultLine[] = [
		{
			text: `Sua gangue falhou ao roubar o investimento de ${targetName.value}.`,
			style: "primary",
		},
		{
			text: "Todos os atacantes foram presos.",
			style: "secondary",
		},
	];
	const prisonHours = getOutcomeNumber(outcome.value, "prisonHours");
	if (prisonHours !== null) {
		lines.push({
			text: `Você será liberado em ${new Intl.NumberFormat("pt-BR").format(prisonHours)} horas.`,
			icon: PrisonIcon,
			style: "muted",
		});
	}
	return lines;
}

const resultLines = computed<ResultLine[]>(() => {
	if (succeeded.value === null) return [];
	if (isTarget.value) return succeeded.value ? getTargetSuccessLines() : getTargetFailureLines();
	return succeeded.value ? getAttackerSuccessLines() : getAttackerFailureLines();
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
				v-if="viewerSucceeded !== null"
				:variant="viewerSucceeded ? 'success' : 'danger'"
			>
				{{ viewerSucceeded ? (isTarget ? "Sucesso." : "Sucesso!") : isTarget ? "Falha!" : "Falha." }}
			</BaseBadge>
			<div
				v-if="resultLines.length"
				class="investment-robbery-result__details"
			>
				<p
					v-for="(line, index) in resultLines"
					:key="index"
					class="investment-robbery-result__line"
					:class="`investment-robbery-result__line--${line.style}`"
				>
					<component
						:is="line.icon"
						:size="22"
						variant="normal"
					/>
					{{ line.text }}
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
	gap: $spacing-md;

	:deep(.base-badge) {
		justify-content: center;
		padding: 1rem;
		border-radius: $radius-sm;
		font-size: $font-size-18;
	}

	&__details {
		display: grid;
		gap: $spacing-sm;
	}

	&__line {
		display: flex;
		align-items: flex-start;
		gap: $spacing-sm;
		margin: 0;

		svg {
			flex: none;
			margin-top: 2px;
		}

		&--primary {
			color: $text-primary;
			font-weight: $font-weight-semibold;
		}

		&--secondary {
			color: $text-secondary;
		}

		&--muted {
			color: $text-muted;
		}
	}

	&__error {
		margin: 0;
		color: $color-danger;
	}
}
</style>
