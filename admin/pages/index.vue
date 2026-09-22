<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { RotateCw } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import {
	type DashboardHistoryDto,
	type DashboardStatsDto,
	GET_DASHBOARD_HISTORY,
	GET_DASHBOARD_STATS,
} from "~/graphql/operations";
import DashboardMainMetrics from "../components/Dashboard/DashboardMainMetrics.vue";
import DashboardStatusBox from "../components/Dashboard/DashboardStatusBox.vue";
import DashboardUserHistory from "../components/Dashboard/DashboardUserHistory.vue";
import DashboardUserLanguages from "../components/Dashboard/DashboardUserLanguages.vue";

const { result: statsResult, loading: statsLoading, refetch: refetchStats } = useQuery(GET_DASHBOARD_STATS);

const { result: historyResult, loading: historyLoading, refetch: refetchHistory } = useQuery(GET_DASHBOARD_HISTORY);

const stats = computed<DashboardStatsDto>(() => statsResult.value?.dashboardStats);
const history = computed<DashboardHistoryDto[]>(() => historyResult.value?.dashboardHistory || []);

function refreshData() {
	refetchStats();
	refetchHistory();
}
</script>

<template>
	<main class="dashboard-page">
		<section class="page-title-row">
			<div>
				<h1 class="page-title">Dashboard & Métricas</h1>
				<p class="page-subtitle">Visão geral em tempo real da economia e jogadores do Cross Roads.</p>
			</div>

			<BaseButton
				variant="secondary"
				size="sm"
				@click="refreshData()"
			>
				<RotateCw
					:size="15"
					:class="{ 'spin-icon': statsLoading || historyLoading }"
				/>
				Atualizar
			</BaseButton>
		</section>

		<DashboardMainMetrics
			:user-count="stats?.totalPlayers"
			:gang-count="stats?.totalGangs"
		/>

		<section class="section-title">
			<h3>Distribuição em Ações do Jogo</h3>
		</section>

		<section class="status-grid">
			<DashboardStatusBox
				variant="idle"
				:value="stats?.idleCount"
			/>
			<DashboardStatusBox
				variant="working"
				:value="stats?.jobCount"
			/>
			<DashboardStatusBox
				variant="scavenge"
				:value="stats?.scavengeCount"
			/>
			<DashboardStatusBox
				variant="casino"
				:value="stats?.casinoCount"
			/>
			<DashboardStatusBox
				variant="hospital"
				:value="stats?.hospitalCount"
			/>
			<DashboardStatusBox
				variant="prison"
				:value="stats?.prisonCount"
			/>
			<DashboardStatusBox
				variant="robbery"
				:value="stats?.robberyCount"
			/>
			<DashboardStatusBox
				variant="beatup"
				:value="stats?.beatUpCount"
			/>
		</section>

		<section class="details-row">
			<DashboardUserLanguages
				:english-count="stats?.englishCount"
				:portuguese-count="stats?.portugueseCount"
				:spanish-count="stats?.spanishCount"
			/>

			<!-- History Snapshots Card -->
			<DashboardUserHistory
				:history="history"
				:history-loading="historyLoading"
			/>
		</section>
	</main>
</template>

<style
	lang="scss"
	scoped
>
.dashboard-page {
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.page-title-row {
	@include flex-between;

	.page-title {
		font-size: 1.5rem;
		font-weight: 800;
		color: $text-primary;
	}

	.page-subtitle {
		font-size: 0.875rem;
		color: $text-secondary;
		margin-top: 4px;
	}
}

.spin-icon {
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.section-title {
	margin-top: 8px;

	h3 {
		font-size: 1rem;
		font-weight: 700;
		color: $text-secondary;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
}

.status-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	grid-auto-rows: 1fr;
	gap: 14px;
}

.details-row {
	display: grid;
	grid-template-columns: 320px 1fr;
	gap: 20px;

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
	}

}
</style>
