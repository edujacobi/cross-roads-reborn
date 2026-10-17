<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { Search, Skull } from "lucide-vue-next";
import { computed, ref } from "vue";
import BaseBadge from "~/components/ui/BaseBadge.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseEmptyState from "~/components/ui/BaseEmptyState.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseTable from "~/components/ui/BaseTable.vue";
import BaseTableFooter from "~/components/ui/BaseTableFooter.vue";
import BaseTableSkeleton from "~/components/ui/BaseTableSkeleton.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { useFallbackUserImage } from "~/composables/useFallbackImage";
import { GetDeadUsersDocument } from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Cemitério",
});

const { distance } = useDateFormat();
const { getClassImageUrl, getClassName } = useClasses();
const searchQuery = ref("");
const { page, pageSize: limit, offset, resetPage } = usePagination(1, 15);
const { result, loading } = useQuery(GetDeadUsersDocument);

const deadUsers = computed(() => {
	const search = searchQuery.value.trim().toLocaleLowerCase();
	const users = result.value?.deadUsers ?? [];

	return search
		? users.filter((user) => user.nickname.toLocaleLowerCase().includes(search) || user.id.includes(search))
		: users;
});
const entries = computed(() => deadUsers.value.slice(offset.value, offset.value + limit.value));
const total = computed(() => deadUsers.value.length);
const totalPages = computed(() => Math.ceil(total.value / limit.value) || 1);

function handleSearch(value: string | number) {
	searchQuery.value = String(value);
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
	<main class="cemetery-page">
		<PageTitle
			title="Cemitério"
			subtitle="50% de chance de estarem em um lugar melhor."
		/>

		<BaseCard
			title="Morte"
			subtitle="Ao morrer, o jogador perde todo o dinheiro e seu trabalho, caso estiver em um. Enquanto morto, não recebe dinheiro de investimentos."
		>
			<div class="cemetery-page__warning">
				<h3>Banidos</h3>
				<p>Jogadores mortos foram banidos do jogo e não podem usar comando algum. Você não quer estar aqui.</p>
			</div>
		</BaseCard>

		<BaseCard
			class="table-card"
			title="Aqui jazem..."
			no-padding-x
			no-padding-y
		>
			<template #header>
				<div class="cemetery-page__search-bar">
					<Search
						:size="18"
						class="cemetery-page__search-icon"
						aria-hidden="true"
					/>
					<BaseInput
						id="search-cemetery"
						:model-value="searchQuery"
						aria-label="Buscar mortos por nickname ou ID"
						type="search"
						placeholder="Buscar por Nickname ou ID..."
						@update:model-value="handleSearch"
					/>
				</div>
			</template>

			<BaseTableSkeleton
				v-if="loading"
				:rows="limit"
				:columns="2"
				label="Buscando jogadores mortos"
			/>

			<BaseEmptyState
				v-else-if="entries.length === 0"
				:icon="Skull"
				:icon-size="36"
			>
				<p>{{ searchQuery ? "Nenhum jogador encontrado." : "O cemitério está vazio! Não há jogadores mortos." }}</p>
			</BaseEmptyState>

			<BaseTable v-else>
				<table class="cemetery-table">
					<caption class="visually-hidden">
						Lista de jogadores mortos
					</caption>
					<thead>
						<tr>
							<th scope="col">Jogador</th>
							<th scope="col">Ressuscitará</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="entry in entries"
							:key="entry.id"
							class="clickable-row"
							tabindex="0"
							@click="navigateTo(`/users/${entry.id}`)"
							@keydown.enter.prevent="navigateTo(`/users/${entry.id}`)"
						>
							<th
								scope="row"
								class="player-cell"
							>
								<div class="player-cell-content">
									<UserPicture
										:image-url="entry.avatarUrl || useFallbackUserImage(entry.id)"
										:decoration="entry.avatarDecoration || 'default'"
										image-class="profile-img"
										:alt="entry.nickname ? `Avatar de ${entry.nickname}` : 'Avatar do jogador'"
										width="32"
										height="32"
									/>
									<span class="nickname">{{ entry.nickname || "(Sem Nick)" }}</span>
									<BaseBadge variant="neutral">
										<NuxtImg
											:src="getClassImageUrl(entry.class)"
											width="16"
											alt=""
										/>
										{{ getClassName(entry.class) }}
									</BaseBadge>
								</div>
							</th>
							<td>
								<time :datetime="entry.deadUntil">
									{{ distance(entry.deadUntil, new Date()) }}
								</time>
							</td>
						</tr>
					</tbody>
				</table>
			</BaseTable>

			<template #footer>
				<BaseTableFooter
					label-item="mortos"
					label-navigation="Paginação de jogadores mortos"
					:index="entries.length"
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

.cemetery-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;

	&__warning {
		h3 {
			font-size: 1rem;
			font-weight: 600;
			color: $text-primary;
			margin-bottom: $spacing-xs;
		}

		p {
			font-size: 0.8125rem;
			color: $text-secondary;
			line-height: 1.5;
		}
	}

	&__search-bar {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		max-width: 28.125rem;
		position: relative;

		@media (max-width: $bp-mobile) {
			max-width: 100%;
		}

		:deep(.base-input) {
			padding-left: 2.375rem;
		}
	}

	&__search-icon {
		position: absolute;
		left: 12px;
		color: $text-muted;
		pointer-events: none;
	}
}

.cemetery-table {
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
}
</style>
