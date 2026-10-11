<script
	setup
	lang="ts"
>
import type { Chart as ChartInstance } from "chart.js";
import { Chart } from "chart.js/auto";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import type { GetDashboardHistoryQuery, GetDashboardStatsQuery } from "~/graphql/generated";
import { ClassId } from "../../../src/core/types/Ids";

interface Props {
	history: GetDashboardHistoryQuery["dashboardHistory"];
	currentStats?: GetDashboardStatsQuery["dashboardStats"];
	historyLoading?: boolean;
	statsLoading?: boolean;
}

const props = defineProps<Props>();
const canvas = ref<HTMLCanvasElement | null>(null);
const { getClassImageUrl, getClassName } = useClasses();
const classIds = [
	ClassId.Thief,
	// ClassId.Assassin,
	ClassId.Entrepreneur,
	ClassId.Hobo,
	ClassId.Attorney,
	// ClassId.Mafioso,
];
const classColors = ["#AF0000", "#FFEF9A", "#0086A4", "#653BFF", "#8b5cf6", "#06b6d4"];
let chart: ChartInstance<"line"> | undefined;

const selectedClasses = computed(() => [...(props.currentStats?.classCounts ?? [])].sort((a, b) => b.count - a.count));
const totalSelected = computed(() => selectedClasses.value.reduce((total, item) => total + item.count, 0));

function updateChart() {
	if (!canvas.value || props.historyLoading || (!props.history.length && !props.currentStats)) return;
	if (chart && chart.canvas !== canvas.value) {
		chart.destroy();
		chart = undefined;
	}

	const snapshots = [...props.history].reverse().map(({ date, classCounts }) => ({ date, classCounts }));
	if (props.currentStats) {
		snapshots.push({ date: props.currentStats.date, classCounts: props.currentStats.classCounts });
	}
	const labels = snapshots.map(({ date }, index) =>
		props.currentStats && index === snapshots.length - 1
			? "Agora"
			: new Date(date).toLocaleDateString(undefined, { month: "numeric", day: "numeric" }),
	);
	const datasets = classIds.map((classId, index) => ({
		label: getClassName(classId),
		data: snapshots.map(({ classCounts: counts }) =>
			counts === null ? null : (counts.find((item) => item.classId === classId)?.count ?? 0),
		),
		borderColor: classColors[index],
		backgroundColor: classColors[index],
		spanGaps: false,
	}));

	if (!chart) {
		chart = new Chart(canvas.value, {
			type: "line",
			data: { labels, datasets },
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: { mode: "index", intersect: false },
				plugins: {
					legend: {
						labels: { color: "#9ca3af", usePointStyle: true },
					},
				},
				scales: {
					x: {
						ticks: { color: "#6b7280", maxTicksLimit: 30 },
						grid: { color: "#21283a" },
					},
					y: {
						beginAtZero: true,
						ticks: { color: "#6b7280", precision: 0 },
						grid: { color: "#21283a" },
					},
				},
			},
		});
		return;
	}

	chart.data.labels = labels;
	chart.data.datasets = datasets;
	chart.update();
}

watch(() => [props.history, props.currentStats, props.historyLoading], updateChart, { deep: true, flush: "post" });
onMounted(updateChart);
onBeforeUnmount(() => chart?.destroy());
</script>

<template>
	<BaseCard
		title="Classes selecionadas"
		subtitle="Distribuição atual e histórico dos últimos 30 dias"
		class="class-distribution-card"
	>
		<p
			v-if="statsLoading && !currentStats"
			class="card-message"
			role="status"
		>
			Carregando classes...
		</p>
		<div
			v-else-if="selectedClasses.length"
			class="class-list"
		>
			<div
				v-for="item in selectedClasses"
				:key="item.classId"
				class="class-item"
			>
				<NuxtImg
					:src="getClassImageUrl(item.classId)"
					alt=""
					width="36"
					height="36"
				/>
				<div class="class-details">
					<span>{{ getClassName(item.classId) }}</span>
					<strong>{{ item.count.toLocaleString("pt-BR") }}</strong>
				</div>
				<span class="class-percentage">
					{{ totalSelected ? ((item.count / totalSelected) * 100).toFixed(1) : "0.0" }}%
				</span>
			</div>
		</div>
		<p
			v-else-if="currentStats"
			class="card-message"
		>
			Nenhum jogador selecionou uma classe.
		</p>

		<p
			v-if="historyLoading"
			class="card-message"
			role="status"
		>
			Carregando histórico...
		</p>
		<p
			v-else-if="history.length === 0 && !currentStats"
			class="card-message"
		>
			Nenhum histórico de classes disponível.
		</p>
		<div
			v-else-if="!historyLoading && (currentStats || history.length)"
			class="chart-container"
		>
			<canvas
				ref="canvas"
				role="img"
				aria-label="Histórico da distribuição de jogadores por classe nos últimos 30 dias"
			/>
		</div>
	</BaseCard>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.class-list {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: $spacing-sm;
	margin-bottom: $spacing-md;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 425px) {
		grid-template-columns: 1fr;
	}
}

.class-item {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
	min-width: 0;
	padding: $spacing-sm;
	border: 1px solid $border-subtle;
	border-radius: 8px;

	img {
		flex: 0 0 auto;
		object-fit: contain;
	}
}

.class-details {
	display: flex;
	flex: 1;
	flex-direction: column;
	min-width: 0;
	gap: 0.125rem;
	color: $text-secondary;
	font-size: 0.8125rem;

	strong {
		color: $text-primary;
		font-size: 1rem;
	}
}

.class-percentage {
	color: $text-muted;
	font-size: 0.75rem;
}

.chart-container {
	position: relative;
	width: 100%;
	height: clamp(220px, 32vw, 360px);
}

.card-message {
	padding: $spacing-md;
	color: $text-muted;
	text-align: center;
}
</style>
