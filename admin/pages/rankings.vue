<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import { type ImagePath, imagePaths } from "~/constants/imagePaths";
import { GetTopUsersDocument, UserRanking } from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Rankings",
});

const rankings: {
	type: UserRanking;
	label: string;
	valueLabel: string;
	countLabel?: string;
	image: ImagePath;
	isMoney: boolean;
}[] = [
	{ type: UserRanking.Money, label: "Grana", valueLabel: "Saldo", image: imagePaths.badges.top1Money, isMoney: true },
	{
		type: UserRanking.Gamblers,
		label: "Apostadores",
		valueLabel: "Ganhos no cassino",
		countLabel: "Vitórias",
		image: imagePaths.badges.topCasinoWR,
		isMoney: true,
	},
	{
		type: UserRanking.Spenders,
		label: "Gastadores",
		valueLabel: "Gastos nas lojas",
		countLabel: "Compras",
		image: imagePaths.badges.topSpender,
		isMoney: true,
	},
	{
		type: UserRanking.Thieves,
		label: "Ladrões",
		valueLabel: "Valor roubado",
		countLabel: "Roubos",
		image: imagePaths.badges.topRobberyProfit,
		isMoney: true,
	},
	{
		type: UserRanking.Workers,
		label: "Trabalhadores",
		valueLabel: "Total recebido",
		countLabel: "Trabalhos",
		image: imagePaths.badges.topJobs,
		isMoney: true,
	},
	{
		type: UserRanking.Drunkers,
		label: "Bêbados",
		valueLabel: "Bebidas no Happy Hour",
		countLabel: "Vezes bêbado",
		image: imagePaths.situations.idling,
		isMoney: false,
	},
	{
		type: UserRanking.Beaters,
		label: "Espancadores",
		valueLabel: "Espancamentos",
		countLabel: "Vezes espancado",
		image: imagePaths.badges.topBeatUp,
		isMoney: false,
	},
	{
		type: UserRanking.Scavengers,
		label: "Vasculhadores",
		valueLabel: "Itens encontrados",
		countLabel: "Tentativas",
		image: imagePaths.badges.topScavenge,
		isMoney: false,
	},
	{
		type: UserRanking.Hospital,
		label: "Doentes",
		valueLabel: "Tratamentos pagos",
		countLabel: "Tratamentos",
		image: imagePaths.badges.topHospital,
		isMoney: true,
	},
	{
		type: UserRanking.Bribers,
		label: "Subornadores",
		valueLabel: "Subornos pagos",
		countLabel: "Subornos",
		image: imagePaths.badges.topBribery,
		isMoney: true,
	},
	{
		type: UserRanking.Escapers,
		label: "Fujões",
		valueLabel: "Fugas",
		countLabel: "Prisões",
		image: imagePaths.badges.topEscapes,
		isMoney: false,
	},
	{
		type: UserRanking.Investors,
		label: "Investidores",
		valueLabel: "Lucro de investimentos",
		image: imagePaths.badges.topInvestments,
		isMoney: true,
	},
];

const auth = useAuth();
const activeRanking = ref(rankings[0]);
const page = ref(1);
const pageSize = 10;
const offset = computed(() => (page.value - 1) * pageSize);
const { result, loading, error, refetch } = useQuery(GetTopUsersDocument, {
	ranking: activeRanking.value.type,
	limit: pageSize,
	offset: 0,
});

const entries = computed(() => result.value?.topUsers.entries ?? []);
const total = computed(() => result.value?.topUsers.total ?? 0);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));
const firstResult = computed(() => (total.value > 0 ? offset.value + 1 : 0));
const lastResult = computed(() => Math.min(offset.value + entries.value.length, total.value));

watch(totalPages, (lastPage) => {
	if (page.value > lastPage) page.value = lastPage;
});

async function selectRanking(ranking: (typeof rankings)[number]) {
	activeRanking.value = ranking;
	await loadPage(1, ranking);
}

async function loadPage(targetPage: number, ranking = activeRanking.value) {
	page.value = targetPage;
	await refetch({
		ranking: ranking.type,
		limit: pageSize,
		offset: (targetPage - 1) * pageSize,
	});
}

function formatValue(value: number): string {
	const formatted = Math.floor(value).toLocaleString("pt-BR").replace(/,/g, ".");
	return activeRanking.value.isMoney ? `Cr$ ${formatted}` : formatted;
}

function previousPage() {
	if (page.value > 1) void loadPage(page.value - 1);
}

function nextPage() {
	if (page.value < totalPages.value) void loadPage(page.value + 1);
}
</script>

<template>
	<div class="rankings-page">
		<section class="page-title-row">
			<div>
				<h1 class="page-title">Rankings</h1>
				<p class="page-subtitle text-secondary">Veja os melhores jogadores em cada categoria</p>
			</div>
		</section>

		<nav
			class="ranking-tabs"
			aria-label="Tipos de ranking"
		>
			<BaseButton
				v-for="ranking in rankings"
				:key="ranking.type"
				class="ranking-tab"
				:variant="activeRanking.type === ranking.type ? 'success' : 'secondary'"
				:class="{ active: activeRanking.type === ranking.type }"
				:aria-pressed="activeRanking.type === ranking.type"
				@click="selectRanking(ranking)"
			>
				<NuxtImg
					:src="ranking.image"
					width="16"
				/>
				{{ ranking.label }}
			</BaseButton>
		</nav>

		<BaseCard :title="`Top ${activeRanking.label}`">
			<div
				v-if="loading"
				class="state-message"
				role="status"
			>
				Carregando ranking...
			</div>
			<div
				v-else-if="error"
				class="state-message error-message"
				role="alert"
			>
				Não foi possível carregar este ranking.
			</div>
			<div
				v-else-if="entries.length === 0"
				class="state-message"
			>
				<Trophy
					:size="32"
					aria-hidden="true"
				/>
				Nenhum jogador neste ranking.
			</div>
			<div
				v-else
				class="table-wrapper"
			>
				<table class="rankings-table">
					<caption class="visually-hidden">
						Ranking de {{ activeRanking.label }}
					</caption>
					<thead>
						<tr>
							<th scope="col">Jogador</th>
							<th scope="col">{{ activeRanking.valueLabel }}</th>
							<th
								v-if="activeRanking.countLabel"
								scope="col"
							>
								{{ activeRanking.countLabel }}
							</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="(entry, index) in entries"
							:key="entry.id"
							:class="{ 'current-user': entry.id === auth.user.value?.userId }"
						>
							<th
								scope="row"
								class="player-cell"
							>
								<div class="player-content">
									<span class="rank-cell">{{ offset + index + 1 }}</span>
									<NuxtImg
										class="player-avatar"
										:src="entry.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'"
										alt=""
									/>
									<span class="player-name">{{ entry.nickname }}</span>
									<span
										v-if="entry.id === auth.user.value?.userId"
										class="current-user-label"
									>
										Você
									</span>
								</div>
							</th>
							<td class="value-cell">{{ formatValue(entry.value) }}</td>
							<td v-if="activeRanking.countLabel">
								{{ entry.count?.toLocaleString("pt-BR") ?? "—" }}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<template
				v-if="total > 0"
				#footer
			>
				<div class="pagination-footer">
					<span class="pagination-info">
						Mostrando <strong>{{ firstResult }}-{{ lastResult }}</strong> de <strong>{{ total }}</strong> jogadores
					</span>
					<nav
						class="pagination-controls"
						aria-label="Paginação do ranking"
					>
						<BaseButton
							variant="secondary"
							size="sm"
							:disabled="page <= 1"
							@click="previousPage()"
						>
							<ChevronLeft
								:size="16"
								aria-hidden="true"
							/>
							Anterior
						</BaseButton>
						<span
							class="page-indicator"
							aria-live="polite"
						>
							Página {{ page }} de {{ totalPages }}
						</span>
						<BaseButton
							variant="secondary"
							size="sm"
							:disabled="page >= totalPages"
							@click="nextPage()"
						>
							Próxima
							<ChevronRight
								:size="16"
								aria-hidden="true"
							/>
						</BaseButton>
					</nav>
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

.rankings-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;
}

.ranking-tabs {
	display: flex;
	gap: $spacing-xs;
	overflow-x: auto;
	padding-bottom: $spacing-xs;
	@include scrollbar-custom;
}

.table-wrapper {
	overflow-x: auto;
	@include scrollbar-custom;
}

.rankings-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.875rem;

	th,
	td {
		padding: 0.75rem $spacing-md;
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

	tbody th {
		font-size: inherit;
		text-transform: none;
	}

	td {
		color: $text-secondary;
	}

	tr.current-user {
		background-color: rgba($color-brand, 0.1);
		box-shadow: inset 3px 0 $color-brand;
	}
}

.rank-cell {
	color: $text-muted !important;
	font-variant-numeric: tabular-nums;
	margin-right: $spacing-md;
}

.player-content {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
}

.player-avatar {
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	background-color: rgba($bg-input, 0.15);
}

.player-name {
	color: $text-primary;
	font-weight: 600;
}

.current-user-label {
	padding: 0.125rem 0.375rem;
	border-radius: $radius-xs;
	background-color: rgba($color-brand, 0.15);
	color: $color-brand;
	font-size: 0.6875rem;
	font-weight: 600;
	text-transform: uppercase;
}

.value-cell {
	font-weight: 600;
	font-variant-numeric: tabular-nums;
}

.pagination-footer {
	@include flex-between;
	gap: $spacing-md;

	@media (max-width: 640px) {
		flex-direction: column;
		text-align: center;
	}
}

.pagination-info,
.page-indicator {
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
}

.state-message {
	@include flex-center;
	flex-direction: column;
	gap: $spacing-sm;
	min-height: 9rem;
	color: $text-muted;
	text-align: center;
}

.error-message {
	color: $color-danger;
}
</style>
