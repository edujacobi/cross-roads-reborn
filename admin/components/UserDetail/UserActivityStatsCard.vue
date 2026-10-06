<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { computed, ref } from "vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseSelector, { type SelectorOption } from "~/components/ui/BaseSelector.vue";
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import RefreshButton from "~/components/ui/RefreshButton.vue";
import { imagePaths } from "~/constants/imagePaths";
import { GetUserActivityStatsDocument } from "~/graphql/generated";

const props = defineProps<{ userId: string }>();

const { result, loading, refetch } = useQuery(GetUserActivityStatsDocument, () => ({ id: props.userId }), {
	fetchPolicy: "cache-and-network",
});
const activityStats = computed(() => result.value?.user?.activityStats);

const tabs = [
	{ id: "sequence", label: "Sequência", image: imagePaths.uiElements.daily },
	{ id: "hospital", label: "Hospital", image: imagePaths.situations.hospital },
	{ id: "prison", label: "Prisão", image: imagePaths.situations.prison },
	{ id: "robbery", label: "Roubos", image: imagePaths.situations.robbery },
	{ id: "beatup", label: "Espancamentos", image: imagePaths.situations.beatup },
	{ id: "casino", label: "Cassino", image: imagePaths.situations.casino },
	{ id: "alms", label: "Esmola", image: imagePaths.uiElements.alms },
	{ id: "scavenge", label: "Vasculhar", image: imagePaths.situations.scavenging },
	{ id: "economy", label: "Economia", image: imagePaths.uiElements.vaultBank },
] as const;

const selectorOptions: SelectorOption[] = tabs.map((tab) => ({
	label: tab.label,
	value: tab.id,
	imagePath: tab.image,
}));

type TabId = (typeof tabs)[number]["id"];
type StatRow = { label: string; value: string };

const activeTab = ref<TabId>("sequence");
const numberFormat = new Intl.NumberFormat("pt-BR");
const formatCount = (value: number) => numberFormat.format(value);
const formatMoney = (value: number) => `Cr$ ${formatCount(value)}`;
const formatCountAndTotal = (count: number, total: number) => `${formatMoney(total)} (${formatCount(count)})`;

const rows = computed<StatRow[]>(() => {
	const stats = activityStats.value;
	if (!stats) return [];

	switch (activeTab.value) {
		case "sequence":
			return [
				{ label: "Sequência atual", value: `${formatCount(stats.dailyCurrentStreak)} dias` },
				{ label: "Maior sequência diária", value: `${formatCount(stats.dailyMaxStreak)} dias` },
			];
		case "hospital":
			return [
				{ label: "Hospitalizações", value: formatCount(stats.hospitalCount) },
				{
					label: "Tratamentos hospitalares",
					value: formatCountAndTotal(stats.hospitalTreatmentCount, stats.hospitalTreatmentSum),
				},
			];
		case "prison":
			return [
				{ label: "Prisões", value: formatCount(stats.prisonCount) },
				{ label: "Fugas", value: formatCount(stats.escapeCount) },
				{ label: "Subornos", value: formatCountAndTotal(stats.prisonBriberyCount, stats.prisonBriberySum) },
			];
		case "robbery":
			return [
				{
					label: "Roubos bem-sucedidos",
					value: formatCountAndTotal(stats.robberySuccessCount, stats.robberySuccessRobbedSum),
				},
				{
					label: "Vezes roubado",
					value: formatCountAndTotal(stats.robberyBeingRobbedCount, stats.robberyBeingRobbedSum),
				},
				{ label: "Falhas em roubos", value: formatCount(stats.robberyFailureCount) },
			];
		case "beatup":
			return [
				{ label: "Espancamentos bem-sucedidos", value: formatCount(stats.beatUpSuccessCount) },
				{ label: "Falhas em espancamentos", value: formatCount(stats.beatUpFailureCount) },
				{ label: "Vezes espancado", value: formatCount(stats.beatUpBeatedUpCount) },
			];
		case "casino": {
			const games = stats.casinoWinCount + stats.casinoLoseCount;
			const winRate = games === 0 ? "—" : `${((stats.casinoWinCount / games) * 100).toFixed(2)}%`;

			return [
				{ label: "Partidas no cassino", value: formatCount(games) },
				{ label: "Ganhos no cassino", value: formatCountAndTotal(stats.casinoWinCount, stats.casinoWinSum) },
				{ label: "Perdas no cassino", value: formatCountAndTotal(stats.casinoLoseCount, stats.casinoLoseSum) },
				{ label: "Taxa de vitória", value: winRate },
			];
		}
		case "alms": {
			return [
				{ label: "Esmolas recebidas", value: formatCountAndTotal(stats.almsReceivedCount, stats.almsReceivedSum) },
				{ label: "Esmolas doadas", value: formatCountAndTotal(stats.almsGivenCount, stats.almsGivenSum) },
			];
		}
		case "scavenge":
			return [
				{ label: "Itens e dinheiro encontrados", value: formatCount(stats.scavengeFoundCount) },
				{ label: "Falhas", value: formatCount(stats.scavengeFailures) },
				{ label: "Hospitalizações", value: formatCount(stats.scavengeHospitalizations) },
				{ label: "Prisões", value: formatCount(stats.scavengePrisonizations) },
			];
		case "economy":
			return [
				{ label: "Ganhos em trabalhos", value: formatCountAndTotal(stats.jobReceivedCount, stats.jobReceivedSum) },
				{ label: "Lucro total em investimentos", value: formatMoney(stats.investmentProfit) },
				{ label: "Gastos em lojas", value: formatCountAndTotal(stats.shopSpentCount, stats.shopSpentSum) },
			];
	}
});
</script>

<template>
	<BaseCard
		title="Atividade"
		class="user-activity"
	>
		<template #actions>
			<BaseSelector
				id="activity-stats-selector"
				:options="selectorOptions"
				:model-value="activeTab"
				@update:model-value="activeTab = $event as TabId"
			/>
			<RefreshButton
				@refresh="() => refetch()"
				:loading="loading"
				aria-label="Atualizar atividade"
			/>
		</template>

		<div
			v-if="loading && !activityStats"
			class="user-activity__state"
			role="status"
			aria-label="Carregando atividade"
		>
			<div class="user-activity__skeleton">
				<BaseSkeleton
					v-for="index in 3"
					:key="index"
					height="4rem"
				/>
			</div>
		</div>
		<p
			v-else-if="!activityStats"
			class="user-activity__state"
		>
			Não foi possível carregar a atividade.
		</p>
		<div
			v-else
			id="user-activity-panel"
			role="tabpanel"
			aria-live="polite"
			class="user-activity__panel"
		>
			<dl class="user-activity__stats">
				<div
					v-for="row in rows"
					:key="row.label"
					class="user-activity__stat"
				>
					<dt>{{ row.label }}</dt>
					<dd>{{ row.value }}</dd>
				</div>
			</dl>
		</div>
	</BaseCard>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.user-activity {
	&__state {
		padding: $spacing-md;
		color: $text-muted;
		font-size: 0.875rem;
	}

	&__skeleton {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: $spacing-md;

		@media (max-width: 1024px) {
			grid-template-columns: 1fr;
		}
	}
	&__panel {
		outline: none;
	}

	&__stats {
		display: grid;
		grid-template-columns: repeat(6, minmax(200px, 1fr));
		gap: $spacing-md;

		@media (max-width: 1024px) {
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		}
	}

	&__stat {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: $spacing-xs;
		padding: $spacing-sm;
		border: 1px solid $border-card;
		border-radius: $radius-sm;

		dt {
			color: $text-secondary;
			font-size: 0.75rem;
		}

		dd {
			color: $text-primary;
			font-size: 0.9375rem;
			font-weight: 600;
			margin: 0;
		}
	}
}
</style>
