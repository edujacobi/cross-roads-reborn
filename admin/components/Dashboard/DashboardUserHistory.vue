<script
	setup
	lang="ts"
>
import { Calendar } from "lucide-vue-next";
import BaseCard from "~/components/ui/BaseCard.vue";
import type { DashboardHistoryDto } from "~/graphql/operations";

interface Props {
	history: DashboardHistoryDto[];
	historyLoading?: boolean;
}
defineProps<Props>();
</script>

<template>
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
						<th>Português</th>
						<th>Inglês</th>
						<th>Espanhol</th>
						<th>Gangues</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="item in history"
						:key="item.id || item.date"
					>
						<td>{{ new Date(item.date).toLocaleDateString() }}</td>
						<td class="font-bold">{{ item.totalPlayers }}</td>
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
		gap: 10px;
		padding: 40px;
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
</style>
