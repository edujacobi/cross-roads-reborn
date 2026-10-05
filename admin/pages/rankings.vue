<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { Trophy } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseEmptyState from "~/components/ui/BaseEmptyState.vue";
import BaseErrorState from "~/components/ui/BaseErrorState.vue";
import BaseTable from "~/components/ui/BaseTable.vue";
import BaseTableFooter from "~/components/ui/BaseTableFooter.vue";
import BaseTableSkeleton from "~/components/ui/BaseTableSkeleton.vue";
import { type ImagePath, imagePaths } from "~/constants/imagePaths";
import { GetTopGangsDocument, GetTopUsersDocument, UserRanking } from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Rankings",
});

interface RankingList {
	type: UserRanking | "GANGS";
	label: string;
	valueLabel: string;
	countLabel?: string;
	image: ImagePath;
	isMoney: boolean;
}

const rankings: RankingList[] = [
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
const gangRanking: RankingList = {
	type: "GANGS",
	label: "Gangues",
	valueLabel: "Nível",
	image: imagePaths.badges.topGang,
	isMoney: false,
};
const rankingOptions = [...rankings, gangRanking];

const auth = useAuth();
const { format: formatMoney } = useMoneyFormat();
const activeRanking = ref<RankingList>(rankings[0]);
const { page, pageSize, offset } = usePagination(1, 10);
const {
	result: userResult,
	loading: userLoading,
	error: userError,
	refetch: refetchUsers,
} = useQuery(GetTopUsersDocument, {
	ranking: rankings[0].type as UserRanking,
	limit: pageSize.value,
	offset: 0,
});
const {
	result: gangResult,
	loading: gangLoading,
	error: gangError,
	refetch: refetchGangs,
} = useQuery(GetTopGangsDocument, { limit: pageSize.value, offset: 0 });

const entries = computed(() => userResult.value?.topUsers.entries ?? []);
const gangs = computed(() => gangResult.value?.topGangs.entries ?? []);
const isGangRanking = computed(() => activeRanking.value.type === "GANGS");
const loading = computed(() => (isGangRanking.value ? gangLoading.value : userLoading.value));
const error = computed(() => (isGangRanking.value ? gangError.value : userError.value));
const total = computed(() =>
	isGangRanking.value ? (gangResult.value?.topGangs.total ?? 0) : (userResult.value?.topUsers.total ?? 0),
);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));
watch(totalPages, (lastPage) => {
	if (page.value > lastPage) page.value = lastPage;
});

async function selectRanking(ranking: RankingList) {
	activeRanking.value = ranking;
	await loadPage(1, ranking);
}

async function loadPage(targetPage: number, ranking = activeRanking.value) {
	page.value = targetPage;
	const variables = { limit: pageSize.value, offset: (targetPage - 1) * pageSize.value };
	if (ranking.type === "GANGS") {
		await refetchGangs(variables);
	} else {
		await refetchUsers({ ...variables, ranking: ranking.type });
	}
}

function formatValue(value: number): string {
	const formatted = Math.floor(value).toLocaleString("pt-BR").replace(/,/g, ".");
	return activeRanking.value.isMoney ? formatMoney(formatted) : formatted;
}

function previousPage() {
	if (page.value > 1) void loadPage(page.value - 1);
}

function nextPage() {
	if (page.value < totalPages.value) void loadPage(page.value + 1);
}
</script>

<template>
	<main class="rankings-page">
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
				v-for="ranking in rankingOptions"
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
					alt=""
				/>
				{{ ranking.label }}
			</BaseButton>
		</nav>

		<BaseCard
			:title="`Top ${activeRanking.label}`"
			no-padding-x
			no-padding-y
		>
			<BaseTableSkeleton
				v-if="loading"
				:rows="pageSize"
				:columns="isGangRanking ? 4 : activeRanking.countLabel ? 3 : 2"
				label="Carregando ranking"
			/>
			<BaseErrorState v-else-if="error">
				Não foi possível carregar este ranking.
			</BaseErrorState>
			<BaseEmptyState
				v-else-if="isGangRanking ? gangs.length === 0 : entries.length === 0"
				:icon="Trophy"
			>
				{{ isGangRanking ? "Nenhuma gangue neste ranking." : "Nenhum jogador neste ranking." }}
			</BaseEmptyState>
			<BaseTable v-else>
				<table
					v-if="isGangRanking"
					class="rankings-table"
				>
					<caption class="visually-hidden">
						Ranking de {{ activeRanking.label }}
					</caption>
					<thead>
						<tr>
							<th scope="col">Gangue</th>
							<th scope="col">Acrônimo</th>
							<th scope="col">Nível</th>
							<th scope="col">Experiência</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="(gang, index) in gangs"
							:key="gang.id"
							:class="{ 'current-user': gang.id === gangResult?.topGangs.currentUserGangId }"
							:style="{ '--highlight-color': gangResult?.topGangs.currentUserGangColor ?? '#89999A' }"
						>
							<th
								scope="row"
								class="player-cell"
							>
								<div class="player-content">
									<span class="rank-cell">{{ offset + index + 1 }}</span>
									<LazyNuxtImg
										class="player-avatar"
										:src="gang.imageUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'"
										alt=""
									/>
									<span class="player-name">{{ gang.name }}</span>
									<span
										v-if="gang.id === gangResult?.topGangs.currentUserGangId"
										class="current-user-label"
									>
										{{ gang.memberRole }}
									</span>
								</div>
							</th>
							<td>{{ gang.acronym }}</td>
							<td class="value-cell">{{ gang.level }}</td>
							<td>{{ gang.experience.toLocaleString("pt-BR") }}</td>
						</tr>
					</tbody>
				</table>
				<table
					v-else
					class="rankings-table"
				>
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
							class="clickable-row"
							tabindex="0"
							:class="{ 'current-user': entry.id === auth.user.value?.userId }"
							:style="{ '--highlight-color': entry.gangColor ?? '#89999A' }"
							@click="navigateTo(`/users/${entry.id}`)"
							@keydown.enter.prevent="navigateTo(`/users/${entry.id}`)"
						>
							<th
								scope="row"
								class="player-cell"
							>
								<div class="player-content">
									<span class="rank-cell">{{ offset + index + 1 }}</span>
									<LazyNuxtImg
										:class="['player-avatar', 'user-avatar', `user-avatar--${entry.avatarDecoration}`]"
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
									<span
										v-if="entry.gangName"
										class="gang-name-label"
										:style="{ '--gang-color': entry.gangColor ?? '#89999A' }"
									>
										{{ entry.gangName }}
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
			</BaseTable>

			<template
				v-if="total > 0"
				#footer
			>
				<BaseTableFooter
					:labels="{


						item: isGangRanking ? 'gangues' : 'jogadores',


						navigation: 'Paginação do ranking',


					}"
					:index="isGangRanking ? gangs.length : entries.length"
					:offset="offset"
					:total="total"
					:page="page"
					:pages="totalPages"
					@click-previous="previousPage()"
					@click-next="nextPage()"
				/>
			</template>
		</BaseCard>
	</main>
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

.rankings-table {
	.clickable-row {
		cursor: pointer;

		&:hover,
		&:focus-visible {
			background-color: rgba($bg-input, 0.12);
		}

		&:focus-visible {
			outline: 2px solid $color-special;
			outline-offset: -2px;
		}
	}

	tr.current-user,
	tr.gang-colored {
		background-color: color-mix(in srgb, var(--highlight-color) 14%, transparent);
		box-shadow: inset 3px 0 var(--highlight-color);
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
	gap: $spacing-md;

	@media (max-width: 768px){
		gap: $spacing-sm;
	}
}

.player-avatar {
	width: 3rem;
	height: 3rem;
	border-radius: 50%;
	background-color: rgba($bg-input, 0.15);
	border-width: 3px;

	@media (max-width: 768px){
		width: 2rem;
		height: 2rem;
		border-width: 2px;
	}
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

.gang-name-label {
	padding: 0.125rem 0.5rem;
	border-radius: $radius-full;
	background-color: color-mix(in srgb, var(--gang-color) 20%, transparent);
	color: var(--gang-color);
	border: 1px solid color-mix(in srgb, var(--gang-color) 35%, transparent);
	font-size: 0.6875rem;
	font-weight: 600;
}

.value-cell {
	font-weight: 600;
	font-variant-numeric: tabular-nums;
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
