<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, UserCheck } from "lucide-vue-next";
import BaseBadge from "~/components/ui/BaseBadge.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseEmptyState from "~/components/ui/BaseEmptyState.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseTable from "~/components/ui/BaseTable.vue";
import BaseTableFooter from "~/components/ui/BaseTableFooter.vue";
import BaseTableSkeleton from "~/components/ui/BaseTableSkeleton.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { imagePaths } from "~/constants/imagePaths";
import { SearchUsersDocument, type SearchUsersQuery } from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Jogadores",
});

const auth = useAuth();
const { dateTime, distance } = useDateFormat();
const searchQuery = ref("");
const { page, pageSize: limit, offset, resetPage } = usePagination(1, 15);
const { sortColumn, sortDirection, toggleSort } = useSorting();
const pageSubtitle = computed(() =>
	auth.hasAdminAccess.value
		? "Pesquise, visualize inventários e execute ações de moderação e administração"
		: "Pesquise e visualize os perfis dos jogadores",
);

const { result, loading } = useQuery(
	SearchUsersDocument,
	() => ({
		search: searchQuery.value.trim() || undefined,
		limit: limit.value,
		offset: offset.value,
		sortBy: sortColumn.value || undefined,
		sortOrder: sortDirection.value?.toUpperCase() || undefined,
	}),
	{ debounce: 300 },
);

const { getClassImageUrl, getClassName } = useClasses();
const { getSituationName, getSituationImageUrl } = useSituation();

const users = computed<SearchUsersQuery["users"]["users"]>(() => result.value?.users?.users || []);
const total = computed(() => result.value?.users?.total || 0);
const totalPages = computed(() => Math.ceil(total.value / limit.value) || 1);

function handleSearch(val: string | number) {
	searchQuery.value = String(val);
	resetPage();
}

function handleSort(column: string) {
	toggleSort(column);
	resetPage();
}

function prevPage() {
	if (!loading.value && page.value > 1) page.value--;
}

function nextPage() {
	if (!loading.value && page.value < totalPages.value) page.value++;
}
</script>

<template>
	<main class="users-page">
		<PageTitle
			title="Jogadores"
			:subtitle="pageSubtitle"
		/>

		<BaseCard
			class="users-card"
			no-padding-x
			no-padding-y
		>
			<template #header>
				<div class="users-page__search-bar">
					<Search
						:size="18"
						class="users-page__search-icon"
						aria-hidden="true"
					/>
					<BaseInput
						id="search-users"
						:model-value="searchQuery"
						aria-label="Buscar jogadores por nickname ou ID"
						type="search"
						placeholder="Buscar por Nickname ou ID..."
						@update:model-value="handleSearch"
					/>
				</div>
			</template>

			<BaseTableSkeleton
				v-if="loading"
				:rows="limit"
				:columns="auth.hasAdminAccess.value ? 7 : 5"
				label="Buscando jogadores no banco de dados"
			/>

			<BaseEmptyState
				v-else-if="users.length === 0"
				:icon="UserCheck"
				:icon-size="36"
			>
				<p>Nenhum jogador encontrado com os critérios de busca.</p>
			</BaseEmptyState>

			<BaseTable
				v-else
				:sort-column="sortColumn"
				:sort-direction="sortDirection"
				@sort="handleSort"
			>
				<table class="users-table">
					<caption class="visually-hidden">
						Lista de jogadores
					</caption>
					<thead>
						<tr>
							<th
								scope="col"
								class="sortable"
								@click="handleSort('nickname')"
							>
								<span class="sort-header-content">
									Jogador
									<span class="sort-icons">
										<ArrowUpDown
											v-if="sortColumn !== 'nickname'"
											:size="14"
											class="sort-icon unsorted"
										/>
										<ArrowUp
											v-else-if="sortDirection === 'asc'"
											:size="14"
											class="sort-icon asc"
										/>
										<ArrowDown
											v-else
											:size="14"
											class="sort-icon desc"
										/>
									</span>
								</span>
							</th>
							<th
								v-if="auth.hasAdminAccess.value"
								scope="col"
								class="sortable"
								@click="handleSort('id')"
							>
								<span class="sort-header-content">
									ID
									<span class="sort-icons">
										<ArrowUpDown
											v-if="sortColumn !== 'id'"
											:size="14"
											class="sort-icon unsorted"
										/>
										<ArrowUp
											v-else-if="sortDirection === 'asc'"
											:size="14"
											class="sort-icon asc"
										/>
										<ArrowDown
											v-else
											:size="14"
											class="sort-icon desc"
										/>
									</span>
								</span>
							</th>
							<th scope="col">Grupo</th>
							<th scope="col">Classe</th>
							<th scope="col">Status</th>
							<th
								v-if="auth.hasAdminAccess.value"
								scope="col"
								class="sortable"
								@click="handleSort('createdAt')"
							>
								<span class="sort-header-content">
									Criação
									<span class="sort-icons">
										<ArrowUpDown
											v-if="sortColumn !== 'createdAt'"
											:size="14"
											class="sort-icon unsorted"
										/>
										<ArrowUp
											v-else-if="sortDirection === 'asc'"
											:size="14"
											class="sort-icon asc"
										/>
										<ArrowDown
											v-else
											:size="14"
											class="sort-icon desc"
										/>
									</span>
								</span>
							</th>
							<th
								v-if="auth.hasAdminAccess.value"
								scope="col"
								class="sortable"
								@click="handleSort('updatedAt')"
							>
								<span class="sort-header-content">
									Última atualização
									<span class="sort-icons">
										<ArrowUpDown
											v-if="sortColumn !== 'updatedAt'"
											:size="14"
											class="sort-icon unsorted"
										/>
										<ArrowUp
											v-else-if="sortDirection === 'asc'"
											:size="14"
											class="sort-icon asc"
										/>
										<ArrowDown
											v-else
											:size="14"
											class="sort-icon desc"
										/>
									</span>
								</span>
							</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="u in users"
							:key="u.id"
							class="clickable-row"
							tabindex="0"
							@click="navigateTo(`/users/${u.id}`)"
							@keydown.enter.prevent="navigateTo(`/users/${u.id}`)"
						>
							<th
								scope="row"
								class="player-cell"
							>
								<div class="player-cell-content">
									<NuxtImg
										:class="['profile-img', 'user-avatar', `user-avatar--${u.avatarDecoration}`]"
										:src="u.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'"
										:alt="u.nickname ? `Avatar de ${u.nickname}` : 'Avatar do jogador'"
										width="32"
										height="32"
									/>
									<span class="nickname">{{ u.nickname || "(Sem Nick)" }}</span>
									<BaseBadge
										v-if="u.isVip"
										variant="vip"
									>
										<NuxtImg
											:src="imagePaths.badges.vip"
											width="14"
											alt=""
										/>
										VIP
									</BaseBadge>
								</div>
							</th>
							<td
								v-if="auth.hasAdminAccess.value"
								class="id-cell"
							>
								{{ u.id }}
							</td>
							<td>
								<BaseBadge
									v-if="u.isDeveloper"
									variant="developer"
								>
									Desenvolvedor
								</BaseBadge>
								<BaseBadge
									v-else-if="u.isModerator"
									variant="moderator"
								>
									Moderador
								</BaseBadge>
								<BaseBadge
									v-else-if="u.isHelper"
									variant="helper"
								>
									Ajudante
								</BaseBadge>
								<BaseBadge
									v-else
									variant="neutral"
								>
									Jogador
								</BaseBadge>
							</td>
							<td class="class-cell">
								<BaseBadge variant="neutral">
									<NuxtImg
										:src="getClassImageUrl(u.class)"
										width="16"
										alt=""
									/>
									{{ getClassName(u.class) }}
								</BaseBadge>
							</td>
							<td>
								<BaseBadge variant="neutral">
									<NuxtImg
										:src="getSituationImageUrl(u.situationId)"
										width="16"
										alt=""
									/>
									{{ getSituationName(u.situationId) }}
								</BaseBadge>
							</td>
							<td v-if="auth.hasAdminAccess.value">
								<time :datetime="u.createdAt">{{ dateTime(u.createdAt) }}</time>
							</td>
							<td v-if="auth.hasAdminAccess.value">
								<time :datetime="u.updatedAt">
									{{ distance(u.updatedAt, new Date()) }}
								</time>
							</td>
						</tr>
					</tbody>
				</table>
			</BaseTable>

			<template #footer>
				<BaseTableFooter
					label-item="jogadores"
					label-navigation="Paginação de jogadores"
					:index="users.length"
					:offset="offset"
					:total="total"
					:page="page"
					:pages="totalPages"
					@click-previous="prevPage()"
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

.users-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;

	&__search-bar {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		max-width: 28.125rem;
		position: relative;

		// ponytail: expand search on mobile screens
		@media (max-width: $bp-mobile) {
			max-width: 100%;
		}

		&__search-icon {
			position: absolute;
			left: 12px;
			color: $text-muted;
			pointer-events: none;
		}

		:deep(.base-input) {
			padding-left: 2.375rem;
		}
	}
}

.users-table {
		th.sortable {
		cursor: pointer;
		user-select: none;
		@include transition-color;

		&:hover {
			color: $text-primary;
		}

		&:focus-visible {
			@include focus-outline;
		}

		.sort-header-content {
			display: inline-flex;
			align-items: center;
			gap: 6px;
		}

		.sort-icons {
			display: inline-flex;
			align-items: center;
			margin-left: 2px;
		}

		.sort-icon {
			opacity: 0.35;
			@include transition-opacity;

			&.unsorted {
				opacity: 0.35;
			}

			&.asc,
			&.desc {
				opacity: 1;
				color: $color-special;
			}
		}

		&:hover .sort-icon.unsorted {
			opacity: 0.7;
		}
	}

	.clickable-row {
		@include row-hover;
	}

	.player-cell-content {
		display: flex;
		align-items: center;
		gap: $spacing-sm;

		.nickname {
			font-weight: 600;
			color: $text-primary;
		}

		.profile-img {
			@include flex-center;
			@include avatar-placeholder;
			color: $bg-input;
		}

		.user-avatar {
			border-width: 2px;
		}
	}

	.player-cell {
		color: $text-secondary;
		font-size: inherit;
		font-weight: 400;
		text-transform: none;
	}

	.id-cell {
		font-family: monospace;
		font-size: 0.8125rem;
		color: $text-muted;
	}

}
</style>
