<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import {
	Beer,
	BicepsFlexed,
	Briefcase,
	Calendar,
	Coins,
	Compass,
	Globe,
	HeartPulse,
	Lock,
	RotateCw,
	Shield,
	Swords,
	Users,
} from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import { GET_DASHBOARD_HISTORY, GET_DASHBOARD_STATS } from "~/graphql/operations";

const { result: statsResult, loading: statsLoading, refetch: refetchStats } = useQuery(GET_DASHBOARD_STATS);

const { result: historyResult, loading: historyLoading, refetch: refetchHistory } = useQuery(GET_DASHBOARD_HISTORY);

const stats = computed(() => statsResult.value?.dashboardStats);
const history = computed(() => historyResult.value?.dashboardHistory || []);

function refreshData() {
	refetchStats();
	refetchHistory();
}
</script>

<template>
	<div class="dashboard-page">
		<div class="page-title-row">
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
		</div>

		<!-- Main Metric Cards -->
		<div class="metrics-grid">
			<div class="stat-card primary">
				<div class="stat-icon">
					<Users :size="24" />
				</div>
				<div class="stat-info">
					<span class="stat-label">Total de Jogadores</span>
					<span class="stat-value">{{ stats?.totalPlayers?.toLocaleString() || "..." }}</span>
				</div>
			</div>

			<div class="stat-card gold">
				<div class="stat-icon">
					<Shield :size="24" />
				</div>
				<div class="stat-info">
					<span class="stat-label">Total de Gangues</span>
					<span class="stat-value">{{ stats?.totalGangs?.toLocaleString() || "..." }}</span>
				</div>
			</div>
		</div>

		<!-- Detailed Status Grid -->
		<div class="section-title">
			<h3>Distribuição em Ações do Jogo</h3>
		</div>

		<div class="status-grid">
			<div class="status-box idle">
				<div class="status-box-header">
					<Beer :size="18" />
					Vadiando
				</div>
				<span class="status-box-count">{{ stats?.idleCount ?? 0 }}</span>
			</div>
			<div class="status-box working">
				<div class="status-box-header">
					<Briefcase :size="18" />
					Trabalhando
				</div>
				<span class="status-box-count">{{ stats?.jobCount ?? 0 }}</span>
			</div>
			<div class="status-box hospital">
				<div class="status-box-header">
					<HeartPulse :size="18" />
					Hospitalizados
				</div>
				<span class="status-box-count">{{ stats?.hospitalCount ?? 0 }}</span>
			</div>

			<div class="status-box prison">
				<div class="status-box-header">
					<Lock :size="18" />
					Presos
				</div>
				<span class="status-box-count">{{ stats?.prisonCount ?? 0 }}</span>
			</div>

			<div class="status-box scavenge">
				<div class="status-box-header">
					<Compass :size="18" />
					Vasculhando
				</div>
				<span class="status-box-count">{{ stats?.scavengeCount ?? 0 }}</span>
			</div>

			<div class="status-box casino">
				<div class="status-box-header">
					<Coins :size="18" />
					No Cassino
				</div>
				<span class="status-box-count">{{ stats?.casinoCount ?? 0 }}</span>
			</div>

			<div class="status-box robbery">
				<div class="status-box-header">
					<Swords :size="18" />
					Em Roubo
				</div>
				<span class="status-box-count">{{ stats?.robberyCount ?? 0 }}</span>
			</div>

			<div class="status-box beat-up">
				<div class="status-box-header">
					<BicepsFlexed :size="18" />
					Em Espancamento
				</div>
				<span class="status-box-count">{{ stats?.beatUpCount ?? 0 }}</span>
			</div>
		</div>

		<!-- Secondary Row: Languages and Snapshot Table -->
		<div class="details-row">
			<!-- Languages Card -->
			<BaseCard
				title="Distribuição por idioma"
				class="language-card"
			>
				<div class="language-list">
					<div class="lang-item">
						<div class="lang-label">
							<Globe :size="16" />
							Português
						</div>
						<span class="lang-count">{{ stats?.portugueseCount ?? 0 }}</span>
					</div>

					<div class="lang-item">
						<div class="lang-label">
							<Globe :size="16" />
							Inglês
						</div>
						<span class="lang-count">{{ stats?.englishCount ?? 0 }}</span>
					</div>

					<div class="lang-item">
						<div class="lang-label">
							<Globe :size="16" />
							Espanhol
						</div>
						<span class="lang-count">{{ stats?.spanishCount ?? 0 }}</span>
					</div>
				</div>
			</BaseCard>

			<!-- History Snapshots Card -->
			<BaseCard
				title="Histórico (últimos 30 dias)"
				class="history-card"
			>
				<div
					v-if="historyLoading"
					class="loading-box"
				>
					<p>Carregando histórico...</p>
				</div>

				<div
					v-else-if="history.length === 0"
					class="empty-box"
				>
					<Calendar :size="32" />
					<p>Nenhum snapshot de histórico gravado ainda.</p>
				</div>

				<div
					v-else
					class="table-container"
				>
					<table class="history-table">
						<thead>
							<tr>
								<th>Data</th>
								<th>Jogadores</th>
								<th>Gangues</th>
								<th>Hospital</th>
								<th>Prisão</th>
								<th>Trabalho</th>
								<th>Vasculho</th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="item in history"
								:key="item.id || item.date"
							>
								<td>{{ new Date(item.date).toLocaleDateString() }}</td>
								<td class="font-bold">{{ item.totalPlayers }}</td>
								<td>{{ item.totalGangs }}</td>
								<td class="text-hospital">{{ item.hospitalCount }}</td>
								<td class="text-prison">{{ item.prisonCount }}</td>
								<td class="text-working">{{ item.jobCount }}</td>
								<td class="text-scavenge">{{ item.scavengeCount }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</BaseCard>
		</div>
	</div>
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

.metrics-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 16px;

	.stat-card {
		@include card-surface;
		padding: 20px;
		display: flex;
		align-items: center;
		gap: 16px;

		.stat-icon {
			@include flex-center;
			width: 48px;
			height: 48px;
			border-radius: $radius-sm;
		}

		.stat-info {
			display: flex;
			flex-direction: column;

			.stat-label {
				font-size: 0.8125rem;
				color: $text-secondary;
			}

			.stat-value {
				font-size: 1.5rem;
				font-weight: 800;
				color: $text-primary;
			}
		}

		&.primary .stat-icon {
			background-color: rgba($color-info, 0.15);
			color: $color-info;
		}

		&.gold .stat-icon {
			background-color: rgba($color-gold, 0.15);
			color: $color-gold;
		}

		&.success .stat-icon {
			background-color: rgba($color-success, 0.15);
			color: $color-success;
		}
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

	.status-box {
		@include card-surface;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;

		.status-box-header {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 0.8125rem;
			font-weight: 600;
		}

		.status-box-count {
			font-size: 1.375rem;
			font-weight: 800;
			color: $text-primary;
		}

		&.idle {
			.status-box-header {
				color: #fff;
			}

			border-left: 3px solid #fff;
		}

		&.working {
			.status-box-header {
				color: $color-working;
			}

			border-left: 3px solid $color-working;
		}

		&.hospital {
			.status-box-header {
				color: $color-hospital;
			}

			border-left: 3px solid $color-hospital;
		}

		&.prison {
			.status-box-header {
				color: $color-prison;
			}

			border-left: 3px solid $color-prison;
		}

		&.scavenge {
			.status-box-header {
				color: $color-scavenge;
			}

			border-left: 3px solid $color-scavenge;
		}

		&.casino {
			.status-box-header {
				color: $color-casino;
			}

			border-left: 3px solid $color-casino;
		}

		&.beat-up {
			.status-box-header {
				color: $color-beatup;
			}

			border-left: 3px solid $color-beatup;
		}

		&.robbery {
			.status-box-header {
				color: $color-robbery;
			}

			border-left: 3px solid $color-robbery;
		}
	}
}

.details-row {
	display: grid;
	grid-template-columns: 320px 1fr;
	gap: 20px;

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
	}

	.language-card {
		.language-list {
			display: flex;
			flex-direction: column;
			gap: 14px;

			.lang-item {
				@include flex-between;
				padding: 10px 12px;
				background-color: $bg-input;
				border-radius: $radius-sm;
				border: 1px solid $border-subtle;

				.lang-label {
					display: flex;
					align-items: center;
					gap: 8px;
					font-size: 0.875rem;
					color: $text-primary;
				}

				.lang-count {
					font-size: 0.9375rem;
					font-weight: 700;
					color: $color-brand;
				}
			}
		}
	}

	.history-card {

		.loading-box,
		.empty-box {
			@include flex-center;
			flex-direction: column;
			gap: 10px;
			padding: 40px;
			color: $text-muted;
			font-size: 0.875rem;
		}

		.table-container {
			overflow-x: auto;
			@include scrollbar-custom;

			.history-table {
				width: 100%;
				border-collapse: collapse;
				font-size: 0.8125rem;

				th,
				td {
					padding: 10px 14px;
					text-align: left;
					border-bottom: 1px solid $border-subtle;
				}

				th {
					color: $text-muted;
					font-weight: 600;
					text-transform: uppercase;
					font-size: 0.75rem;
				}

				td {
					color: $text-secondary;
				}

				.font-bold {
					font-weight: 700;
					color: $text-primary;
				}

				.text-hospital {
					color: $color-hospital;
				}

				.text-prison {
					color: $color-prison;
				}

				.text-working {
					color: $color-working;
				}

				.text-scavenge {
					color: $color-scavenge;
				}
			}
		}
	}
}
</style>
