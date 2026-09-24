<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { ChevronLeft, ChevronRight, Eye, Search, UserCheck } from "lucide-vue-next";
import BaseBadge from "~/components/ui/BaseBadge.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import { SearchUsersDocument, type SearchUsersQuery } from "~/graphql/generated";

const searchQuery = ref("");
const page = ref(1);
const limit = ref(15);

const offset = computed(() => (page.value - 1) * limit.value);

const { result, loading } = useQuery(
	SearchUsersDocument,
	() => ({
		search: searchQuery.value.trim() || undefined,
		limit: limit.value,
		offset: offset.value,
	}),
	{ debounce: 300 },
);

const users = computed<SearchUsersQuery["users"]["users"]>(() => result.value?.users?.users || []);
const total = computed(() => result.value?.users?.total || 0);
const totalPages = computed(() => Math.ceil(total.value / limit.value) || 1);

function handleSearch(val: string | number) {
	searchQuery.value = String(val);
	page.value = 1;
}

function prevPage() {
	if (page.value > 1) page.value--;
}

function nextPage() {
	if (page.value < totalPages.value) page.value++;
}
</script>

<template>
	<div class="users-page">
		<div class="page-title-row">
			<div>
				<h1 class="page-title">Gestão de Jogadores</h1>
				<p class="page-subtitle">Pesquise, visualize inventários e execute ações de moderação e administração.</p>
			</div>
		</div>

		<BaseCard class="users-card">
			<template #header>
				<div class="search-bar">
					<Search
						:size="18"
						class="search-icon"
					/>
					<BaseInput
						id="search-users"
						:model-value="searchQuery"
						placeholder="Buscar por Nickname ou ID..."
						@update:model-value="handleSearch"
					/>
				</div>
			</template>

			<div
				v-if="loading"
				class="loading-state"
			>
				<p>Buscando jogadores no banco de dados...</p>
			</div>

			<div
				v-else-if="users.length === 0"
				class="empty-state"
			>
				<UserCheck :size="36" />
				<p>Nenhum jogador encontrado com os critérios de busca.</p>
			</div>

			<div
				v-else
				class="table-wrapper"
			>
				<table class="users-table">
					<thead>
						<tr>
							<th>Jogador</th>
							<th>ID</th>
							<th>Classe</th>
							<th>Dinheiro</th>
							<th>Moedas Esp.</th>
							<th>Status</th>
							<th class="text-right">Ações</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="u in users"
							:key="u.id"
						>
							<td class="player-cell">
								<span class="nickname">{{ u.nickname || "(Sem Nick)" }}</span>
								<BaseBadge
									v-if="u.vipEternal"
									variant="vip"
								>
									<NuxtImg
										src="vip.png"
										width="14"
									/>
									VIP Eterno
								</BaseBadge>
								<BaseBadge
									v-else-if="u.isVip"
									variant="vip"
								>
									<NuxtImg
										src="vip.png"
										width="14"
									/>
									VIP
								</BaseBadge>
							</td>
							<td class="id-cell">{{ u.id }}</td>
							<td>{{ u.className }}</td>
							<td class="money-cell">Cr$ {{ u.money.toLocaleString() }}</td>
							<td class="coins-cell">{{ u.specialCoin.toLocaleString() }}</td>
							<td>
								<BaseBadge
									v-if="u.isInHospital"
									variant="danger"
								>
									<NuxtImg
										src="situations/hospital.png"
										width="16"
									/>
									Hospital
								</BaseBadge>
								<BaseBadge
									v-else-if="u.isInPrison"
									variant="danger"
								>
									<NuxtImg
										src="situations/prison.png"
										width="16"
									/>
									Preso
								</BaseBadge>
								<BaseBadge
									v-else-if="u.isWorking"
									variant="success"
								>
									<NuxtImg
										src="situations/job.png"
										width="16"
									/>
									Trabalhando
								</BaseBadge>
								<BaseBadge
									v-else
									variant="neutral"
								>
									<NuxtImg
										src="situations/idling.png"
										width="16"
									/>
									Vadiando
								</BaseBadge>
							</td>
							<td class="text-right">
								<NuxtLink :to="`/users/${u.id}`">
									<BaseButton
										variant="secondary"
										size="sm"
									>
										<Eye :size="14" />
										<span>Detalhes</span>
									</BaseButton>
								</NuxtLink>
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<template #footer>
				<div class="pagination-footer">
					<span class="pagination-info">
						Mostrando <strong>{{ users.length }}</strong> de <strong>{{ total }}</strong> jogadores
					</span>

					<div class="pagination-controls">
						<BaseButton
							variant="secondary"
							size="sm"
							:disabled="page <= 1"
							@click="prevPage()"
						>
							<ChevronLeft :size="16" />
							<span>Anterior</span>
						</BaseButton>

						<span class="page-indicator">Página {{ page }} de {{ totalPages }}</span>

						<BaseButton
							variant="secondary"
							size="sm"
							:disabled="page >= totalPages"
							@click="nextPage()"
						>
							<span>Próxima</span>
							<ChevronRight :size="16" />
						</BaseButton>
					</div>
				</div>
			</template>
		</BaseCard>
	</div>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.users-page {
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.page-title-row {
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

.search-bar {
	display: flex;
	align-items: center;
	gap: 12px;
	width: 100%;
	max-width: 450px;
	position: relative;

	.search-icon {
		position: absolute;
		left: 12px;
		color: $text-muted;
		pointer-events: none;
	}

	:deep(.base-input) {
		padding-left: 38px;
	}
}

.loading-state,
.empty-state {
	@include flex-center;
	flex-direction: column;
	gap: 12px;
	padding: 50px 20px;
	color: $text-muted;
	font-size: 0.875rem;
}

.table-wrapper {
	overflow-x: auto;
	@include scrollbar-custom;

	.users-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;

		th,
		td {
			padding: 12px 16px;
			text-align: left;
			border-bottom: 1px solid $border-subtle;
			white-space: nowrap;
		}

		th {
			color: $text-muted;
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
		}

		td {
			color: $text-secondary;
		}

		.player-cell {
			.nickname {
				font-weight: 600;
				margin-right: 0.5rem;
				color: $text-primary;
			}
		}

		.id-cell {
			font-family: monospace;
			font-size: 0.8125rem;
			color: $text-muted;
		}

		.money-cell {
			font-weight: 700;
			color: $color-success;
		}

		.coins-cell {
			font-weight: 700;
			color: $color-special;
		}

		.text-muted {
			color: $text-muted;
		}

		.text-right {
			text-align: right;
		}
	}
}

.pagination-footer {
	@include flex-between;
	width: 100%;

	.pagination-info {
		font-size: 0.8125rem;
		color: $text-secondary;

		strong {
			color: $text-primary;
		}
	}

	.pagination-controls {
		display: flex;
		align-items: center;
		gap: 12px;

		.page-indicator {
			font-size: 0.8125rem;
			color: $text-secondary;
		}
	}
}
</style>
