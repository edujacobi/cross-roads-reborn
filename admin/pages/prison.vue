<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-vue-next";
import { computed, ref } from "vue";
import PrisonIcon from "~/components/icons/PrisonIcon.vue";
import BaseBadge from "~/components/ui/BaseBadge.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseEmptyState from "~/components/ui/BaseEmptyState.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import BaseTable from "~/components/ui/BaseTable.vue";
import BaseTableFooter from "~/components/ui/BaseTableFooter.vue";
import BaseTableSkeleton from "~/components/ui/BaseTableSkeleton.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { imagePaths } from "~/constants/imagePaths";
import { AttemptPrisonEscapeDocument, GetPrisonersDocument, PayBribePrisonDocument } from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Prisão",
});

const auth = useAuth();
const { distance } = useDateFormat();
const { getClassImageUrl, getClassName } = useClasses();
const { showToast } = useToast();
// const { openItemModal } = useItemDetailModal();

const searchQuery = ref("");
const { page, pageSize: limit, offset, resetPage } = usePagination(1, 15);
const { sortColumn, sortDirection, toggleSort } = useSorting();

const { result, loading } = useQuery(
	GetPrisonersDocument,
	() => ({
		search: searchQuery.value.trim() || undefined,
		limit: limit.value,
		offset: offset.value,
		sortBy: sortColumn.value || undefined,
		sortOrder: sortDirection.value?.toUpperCase() || undefined,
	}),
	{ debounce: 300 },
);

const { mutate: attemptEscape, loading: escaping } = useMutation(AttemptPrisonEscapeDocument, {
	fetchPolicy: "network-only",
});
const { mutate: payBribe, loading: bribing } = useMutation(PayBribePrisonDocument, {
	fetchPolicy: "network-only",
});

const entries = computed(() => result.value?.prisoners?.entries || []);
const total = computed(() => result.value?.prisoners?.total || 0);
const totalPages = computed(() => Math.ceil(total.value / limit.value) || 1);

const isUserImprisoned = computed(() => {
	const userId = auth.user?.value?.userId;
	if (!userId) return false;
	return entries.value.some((e) => e.id === userId);
});

const showEscapeModal = ref(false);
const showBribeModal = ref(false);

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

async function handleEscape() {
	const res = await attemptEscape();
	if (res?.errors) {
		showToast({ text: "Erro ao tentar fugir.", variant: "error" });
		return;
	}
	if (res?.data?.attemptPrisonEscape?.success) {
		showToast({ text: res?.data.attemptPrisonEscape.message, variant: "success" });
		showEscapeModal.value = false;
	} else {
		showToast({ text: res?.data?.attemptPrisonEscape?.message || "Erro desconhecido.", variant: "error" });
	}
}

async function handleBribe() {
	const res = await payBribe();
	if (res?.errors) {
		showToast({ text: "Erro ao tentar subornar.", variant: "error" });
		return;
	}
	if (res?.data?.payBribePrison?.bribeAccepted) {
		showToast({ text: res?.data.payBribePrison.message, variant: "success" });
		showBribeModal.value = false;
	} else {
		showToast({ text: res?.data?.payBribePrison?.message || "Erro desconhecido.", variant: "error" });
	}
}
</script>

<template>
	<main class="prison-page">
		<PageTitle
			title="Prisão"
			subtitle="Ao tentar roubar alguém e falhar, você será preso por um tempo determinado pelo seu ATK."
		/>

		<BaseCard class="info-card">
			<template #header>
				<div class="info-card__header">Você está vadiando</div>
			</template>
			<div class="info-card__content">
				<div class="info-card__section">
					<p>
						Estar preso limita muitas de suas ações no jogo, como trabalhar, investir, apostar, vasculhar, e claro,
						roubar.
					</p>
				</div>
				<div class="info-card__section">
					<h3>Fugir</h3>
					<p>
						Você tem 20% (50% se possuir uma Jetpack) de chance de fugir da prisão!
						<!--						<span class="info-card__section-icon" @click="openItemModal({id: 17})">-->
						<!--							<NuxtImg src="images/items/17_Jetpack.png" alt="" width="20"/>-->
						<!--							Jetpack-->
						<!--						</span>-->
					</p>
				</div>
				<div class="info-card__section">
					<h3>Subornar</h3>
					<p>
						Os guardas são gananciosos, e quanto maior o seu ATK, mais eles pedirão! Eles também podem recusar seu
						suborno, mas ficarão com seu dinheiro.
					</p>
				</div>
			</div>
			<template
				v-if="isUserImprisoned"
				#actions
			>
				<BaseButton
					variant="secondary"
					:loading="escaping"
					@click="showEscapeModal = true"
				>
					<NuxtImg
						:src="imagePaths.uiElements.escape"
						width="16"
					/>
					Fugir
				</BaseButton>
				<BaseButton
					variant="secondary"
					:loading="bribing"
					@click="showBribeModal = true"
				>
					<NuxtImg
						:src="imagePaths.badges.topBribery"
						width="16"
					/>
					Subornar
				</BaseButton>
			</template>
		</BaseCard>

		<BaseCard
			title="Prisioneiros"
			class="table-card"
			no-padding-x
			no-padding-y
		>
			<template #header>
				<div class="prison-page__search-bar">
					<Search
						:size="18"
						class="prison-page__search-icon"
						aria-hidden="true"
					/>
					<BaseInput
						id="search-prison"
						:model-value="searchQuery"
						aria-label="Buscar prisioneiros por nickname ou ID"
						type="search"
						placeholder="Buscar por Nickname ou ID..."
						@update:model-value="handleSearch"
					/>
				</div>
			</template>

			<BaseTableSkeleton
				v-if="loading"
				:rows="limit"
				:columns="4"
				label="Buscando prisioneiros"
			/>

			<BaseEmptyState
				v-else-if="entries.length === 0"
				:icon="PrisonIcon"
				:icon-size="36"
			>
				<p>Nenhum jogador preso no momento.</p>
			</BaseEmptyState>

			<BaseTable
				v-else
				:sort-column="sortColumn"
				:sort-direction="sortDirection"
				@sort="handleSort"
			>
				<table class="prison-table">
					<caption class="visually-hidden">
						Lista de jogadores presos
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
								scope="col"
								class="sortable"
								@click="handleSort('prisonTime')"
							>
								<span class="sort-header-content">
									Solta em
									<span class="sort-icons">
										<ArrowUpDown
											v-if="sortColumn !== 'prisonTime'"
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
								scope="col"
								class="sortable"
								@click="handleSort('robberyFailureCount')"
							>
								<span class="sort-header-content">
									Vezes preso
									<span class="sort-icons">
										<ArrowUpDown
											v-if="sortColumn !== 'robberyFailureCount'"
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
								scope="col"
								class="sortable"
								@click="handleSort('escapeCount')"
							>
								<span class="sort-header-content">
									Fugas
									<span class="sort-icons">
										<ArrowUpDown
											v-if="sortColumn !== 'escapeCount'"
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
									<NuxtImg
										:class="['profile-img', 'user-avatar', `user-avatar--${entry.avatarDecoration}`]"
										:src="entry.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'"
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
								<time :datetime="entry.prisonTime">
									{{ distance(entry.prisonTime, new Date()) }}
								</time>
							</td>
							<td>
								{{ entry.robberyFailureCount }}
							</td>
							<td>
								{{ entry.escapeCount }}
							</td>
						</tr>
					</tbody>
				</table>
			</BaseTable>

			<template #footer>
				<BaseTableFooter
					label-item="prisioneiros"
					label-navigation="Paginação de prisioneiros"
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

		<BaseModal
			:open="showEscapeModal"
			title="Tentar fugir"
			@update:open="showEscapeModal = $event"
		>
			<p>
				Tem certeza que deseja tentar fugir da prisão? Você tem uma chance de sucesso, mas se falhar, ficará preso por
				mais tempo.
			</p>
			<template #footer>
				<BaseButton
					variant="secondary"
					@click="showEscapeModal = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="primary"
					:loading="escaping"
					@click="handleEscape"
				>
					<NuxtImg
						:src="imagePaths.uiElements.escape"
						width="16"
					/>
					Fugir
				</BaseButton>
			</template>
		</BaseModal>

		<BaseModal
			:open="showBribeModal"
			title="Subornar os guardas"
			@update:open="showBribeModal = $event"
		>
			<p>
				<!--				<em-->
				<!--					>Sabemos que você tem um certo dinheiro escondido aí... Nos dê {{ getBribeCost() }} e deixaremos você sair de-->
				<!--					fininho.</em-->
				<!--				>-->
			</p>
			<template #footer>
				<BaseButton
					variant="secondary"
					@click="showBribeModal = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="primary"
					:loading="bribing"
					@click="handleBribe"
				>
					<NuxtImg
						:src="imagePaths.badges.topBribery"
						width="16"
					/>
					Subornar
				</BaseButton>
			</template>
		</BaseModal>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.prison-page {
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

.info-card {
	&__header {
		display: flex;
		align-items: center;
		gap: $spacing-sm;

		p {
			font-size: 0.8rem;
			font-weight: 600;
			color: $text-primary;
		}
	}

	&__content {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
	}

	&__section {
		h3 {
			font-size: 0.9375rem;
			font-weight: 600;
			color: $text-primary;
			margin-bottom: $spacing-xs;
		}

		p {
			font-size: 0.875rem;
			color: $text-secondary;
			line-height: 1.5;
			display: flex;
			align-items: center;
		}

		span {
			margin-left: $spacing-xs;
			display: inline-flex;
			align-items: center;
			gap: $spacing-sm;
			background-color: $bg-input;
			padding: 0.2rem 0.75rem;
			border-radius: $radius-xs;
			font-size: 0.8125rem;
			font-weight: 500;
			color: $text-primary;
			cursor: pointer;
			border: 1px solid transparent;

			&:hover {
				border: 1px solid $border-card;
			}
		}
	}
}

.prison-table {
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
}
</style>
