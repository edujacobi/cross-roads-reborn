<script
	setup
	lang="ts"
>
import type { Chart as ChartInstance } from "chart.js";
import { Chart } from "chart.js/auto";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import type { GetDashboardHistoryQuery, GetDashboardStatsQuery } from "~/graphql/generated";

interface Props {
	history: GetDashboardHistoryQuery["dashboardHistory"];
	currentStats?: GetDashboardStatsQuery["dashboardStats"];
	historyLoading?: boolean;
}

const props = defineProps<Props>();
const canvas = ref<HTMLCanvasElement | null>(null);
let chart: ChartInstance<"line"> | undefined;

function updateChart() {
	if (!canvas.value || props.historyLoading || (props.history.length === 0 && !props.currentStats)) return;
	if (chart && chart.canvas !== canvas.value) {
		chart.destroy();
		chart = undefined;
	}

	const history = [...props.history].reverse();
	if (props.currentStats) {
		history.push({ ...props.currentStats, id: null });
	}
	const labels = history.map(({ date }) =>
		date === props.currentStats?.date
			? "Agora"
			: new Date(date).toLocaleDateString(undefined, { month: "numeric", day: "numeric" }),
	);
	const datasets = [
		{
			label: "Jogadores ativos",
			data: history.map(({ totalPlayers }) => totalPlayers),
			borderColor: "#57f287",
			backgroundColor: "#57f287",
		},
		{
			label: "Todos os usuários",
			data: history.map(({ allUsers }) => allUsers),
			borderColor: "#f9fafb",
			backgroundColor: "#f9fafb",
			spanGaps: false,
		},
		{
			label: "Português",
			data: history.map(({ portugueseCount }) => portugueseCount),
			borderColor: "#06b6d4",
			backgroundColor: "#06b6d4",
			spanGaps: false,
		},
		{
			label: "Inglês",
			data: history.map(({ englishCount }) => englishCount),
			borderColor: "#e54747",
			backgroundColor: "#e54747",
			spanGaps: false,
		},
		{
			label: "Espanhol",
			data: history.map(({ spanishCount }) => spanishCount),
			borderColor: "#ff8C00",
			backgroundColor: "#ff8C00",
			spanGaps: false,
		},
		{
			label: "Gangues ativas",
			data: history.map(({ totalGangs }) => totalGangs),
			borderColor: "#8C55FF",
			backgroundColor: "#8C55FF",
			spanGaps: false,
		},
	];

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
		title="Jogadores nos últimos 30 dias"
		class="user-chart-card"
	>
		<p
			v-if="historyLoading"
			class="chart-message"
			role="status"
		>
			Carregando histórico...
		</p>
		<p
			v-else-if="history.length === 0 && !currentStats"
			class="chart-message"
		>
			Nenhum snapshot de histórico gravado ainda.
		</p>
		<div
			v-else
			class="chart-container"
		>
			<canvas
				ref="canvas"
				role="img"
				aria-label="Gráfico de jogadores ativos e total de usuários nos últimos 30 dias"
			/>
		</div>
	</BaseCard>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.chart-message {
	padding: $spacing-lg;
	color: $text-muted;
	text-align: center;
}

.chart-container {
	position: relative;
	width: 100%;
	height: clamp(220px, 32vw, 360px);
}
</style>
