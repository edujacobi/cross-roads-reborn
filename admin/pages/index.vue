<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { RotateCw } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import {
	GetDashboardHistoryDocument,
	type GetDashboardHistoryQuery,
	GetDashboardStatsDocument,
	type GetDashboardStatsQuery,
} from "~/graphql/generated";
import DashboardStatusBox from "../components/Dashboard/DashboardStatusBox.vue";
import DashboardUserChart from "../components/Dashboard/DashboardUserChart.vue";
import DashboardUserHistory from "../components/Dashboard/DashboardUserHistory.vue";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Dashboard",
});

const { result: statsResult, loading: statsLoading, refetch: refetchStats } = useQuery(GetDashboardStatsDocument);

const {
	result: historyResult,
	loading: historyLoading,
	refetch: refetchHistory,
} = useQuery(GetDashboardHistoryDocument);

const stats = computed<GetDashboardStatsQuery["dashboardStats"] | undefined>(() => statsResult.value?.dashboardStats);
const history = computed<GetDashboardHistoryQuery["dashboardHistory"]>(
	() => historyResult.value?.dashboardHistory || [],
);

function refreshData() {
	refetchStats();
	refetchHistory();
}
</script>

<template>
	<main class="dashboard-page">
		<section class="page-title-row">
			<div>
				<h1 class="page-title">Dashboard</h1>
				<p class="page-subtitle text-secondary">Visão geral em tempo real da economia e jogadores</p>
			</div>

			<BaseButton
				variant="secondary"
				size="sm"
				@click="refreshData()"
			>
				<RotateCw
					:size="15"
					:class="{ 'spin-icon': statsLoading || historyLoading }"
					aria-hidden="true"
				/>
				Atualizar
			</BaseButton>
		</section>

		<section
			class="status-grid"
			aria-labelledby="player-status-heading"
		>
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

		<section
			class="vault-grid"
			aria-label="Valores dos cofres"
		>
			<BaseCard
				title="Cofre do Banco"
				icon="ui_elements/CentralBank.png"
				no-body
			>
				<template #actions>Cr$ {{ (stats?.bankVaultValue ?? 0).toLocaleString("pt-BR") }}</template>
			</BaseCard>
			<BaseCard
				title="Cofre do Cassino"
				icon="ui_elements/CasinoVault.png"
				no-body
			>
				<template #actions> Cr$ {{ (stats?.casinoVaultValue ?? 0).toLocaleString("pt-BR") }} </template>
			</BaseCard>
		</section>

		<DashboardUserChart
			:history="history"
			:current-stats="stats"
			:history-loading="historyLoading"
		/>

		<div class="details-row">
			<DashboardCountData
				:total-players="stats?.totalPlayers"
				:all-users="stats?.allUsers"
				:total-gangs="stats?.totalGangs"
				:english-count="stats?.englishCount"
				:portuguese-count="stats?.portugueseCount"
				:spanish-count="stats?.spanishCount"
			/>

			<!-- History Snapshots Card -->
			<DashboardUserHistory
				:history="history"
				:history-loading="historyLoading"
			/>
		</div>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.dashboard-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;
}

.page-title-row {
	@include flex-between;
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
	margin: $spacing-sm 0;
	font-size: 1rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.status-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	grid-auto-rows: 1fr;
	gap: $spacing-md;
}

.vault-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: $spacing-md;

	@media (max-width: 600px) {
		grid-template-columns: 1fr;
	}
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
