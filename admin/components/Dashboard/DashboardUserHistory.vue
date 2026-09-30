<script
	setup
	lang="ts"
>
import { Calendar } from "lucide-vue-next";
import BaseCard from "~/components/ui/BaseCard.vue";
import type { GetDashboardHistoryQuery } from "~/graphql/generated";

interface Props {
	history: GetDashboardHistoryQuery["dashboardHistory"];
	historyLoading?: boolean;
}
defineProps<Props>();
</script>

<template>
	<BaseCard
		title="Histórico"
		class="history-card"
		no-padding-x
		no-padding-y
	>
		<div
			v-if="historyLoading"
			class="loading-box"
			role="status"
		>
			<p>Carregando histórico...</p>
		</div>

		<div
			v-else-if="history.length === 0"
			class="empty-box"
		>
			<Calendar
				:size="32"
				aria-hidden="true"
			/>
			<p>Nenhum snapshot de histórico gravado ainda.</p>
		</div>

		<div
			v-else
			class="table-container"
		>
			<table class="history-table">
				<caption class="visually-hidden">
					Histórico de jogadores e gangues dos últimos 30 dias
				</caption>
				<thead>
					<tr>
						<th scope="col">Data</th>
						<th scope="col">Jogadores ativos</th>
						<th scope="col">Todos os usuários</th>
						<th scope="col">Português</th>
						<th scope="col">Inglês</th>
						<th scope="col">Espanhol</th>
						<th scope="col">Gangues</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="item in history"
						:key="item.id || item.date"
					>
						<td><time :datetime="item.date">{{ new Date(item.date).toLocaleDateString() }}</time></td>
						<td class="font-bold">{{ item.totalPlayers }}</td>
						<td>{{ item.allUsers ?? "—" }}</td>
						<td>{{ item.portugueseCount }}</td>
						<td>{{ item.englishCount }}</td>
						<td>{{ item.spanishCount }}</td>
						<td>{{ item.totalGangs }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</BaseCard>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.history-card {

	.loading-box,
	.empty-box {
		@include flex-center;
		flex-direction: column;
		gap: $spacing-sm;
		padding: $spacing-lg;
		color: $text-muted;
		font-size: 0.875rem;
	}

	.table-container {
		overflow-x: auto;
		max-height: 50dvh;
		@include scrollbar-custom;

		.history-table {
			width: 100%;
			border-collapse: collapse;
			font-size: 0.8125rem;

			th,
			td {
				padding: 0.625rem 0.875rem;
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
</style>
