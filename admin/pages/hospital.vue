<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-vue-next";
import { computed, ref } from "vue";
// biome-ignore lint/correctness/noUnusedImports: HospitalIcon is used in template
import HospitalIcon from "~/components/icons/HospitalIcon.vue";
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
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { imagePaths } from "~/constants/imagePaths";
import {
	GetHospitalizedUsersDocument,
	GetPrivateHospitalCostDocument,
	PayPrivateHospitalDocument,
} from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Hospital",
});

const auth = useAuth();
const { distance } = useDateFormat();
const { getClassImageUrl, getClassName } = useClasses();
const { showToast } = useToast();
const { getSituationImageUrl, getSituationName } = useSituation();

const searchQuery = ref("");
const { page, pageSize: limit, offset, resetPage } = usePagination(1, 15);
const { sortColumn, sortDirection, toggleSort } = useSorting();

const {
	result,
	loading,
	refetch: refetchHospitalized,
} = useQuery(
	GetHospitalizedUsersDocument,
	() => ({
		search: searchQuery.value.trim() || undefined,
		limit: limit.value,
		offset: offset.value,
		sortBy: sortColumn.value || undefined,
		sortOrder: sortDirection.value?.toUpperCase() || undefined,
	}),
	{ debounce: 300 },
);

const { mutate: payPrivate, loading: payingPrivate } = useMutation(PayPrivateHospitalDocument, {
	fetchPolicy: "network-only",
});

const { result: privateCostResult, refetch: refetchPrivateCost } = useQuery(
	GetPrivateHospitalCostDocument,
	{},
	{
		fetchPolicy: "network-only",
	},
);

const privateHospitalCost = computed(() => privateCostResult.value?.privateHospitalCost || 0);

const entries = computed(() => result.value?.hospitalizedUsers?.entries || []);
const total = computed(() => result.value?.hospitalizedUsers?.total || 0);
const totalPages = computed(() => Math.ceil(total.value / limit.value) || 1);

const userSituationId = computed(() => auth.user?.value?.situationId ?? 0);
const userSituationName = computed(() => getSituationName(userSituationId.value));
const userSituationImage = computed(() => getSituationImageUrl(userSituationId.value));

const isUserHospitalized = computed(() => {
	const userId = auth.user?.value?.userId;
	if (!userId) return false;
	return entries.value.some((e) => e.id === userId);
});

const showPrivateModal = ref(false);
const { formatMoney } = useMoneyFormat();

function formatPrivateCost() {
	if (privateHospitalCost.value === 0) {
		return "...";
	}
	return formatMoney(privateHospitalCost.value);
}

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

async function handlePayPrivate() {
	const res = await payPrivate();
	if (res?.errors) {
		showToast({ text: "Erro ao pagar tratamento particular.", variant: "error" });
		return;
	}
	if (res?.data?.payPrivateHospital?.success) {
		showToast({ text: res?.data?.payPrivateHospital.message, variant: "success" });
		showPrivateModal.value = false;
		await Promise.all([auth.fetchUser(), refetchHospitalized(), refetchPrivateCost()]);
	} else {
		showToast({ text: res?.data?.payPrivateHospital?.message || "Erro desconhecido.", variant: "error" });
	}
}
</script>

<template>
	<main class="hospital-page">
		<PageTitle
			title="Hospital"
			subtitle="Público, Gratuito e de Qualidade!"
		/>

		<BaseCard class="info-card">
			<template #header>
				<div class="info-card__header">
					Você está
					<NuxtImg
						:src="userSituationImage"
						class="info-card__situation-image"
						alt=""
						width="28"
						height="28"
					/>
					{{ userSituationName }}
				</div>
			</template>
			<div class="info-card__content">
				<div class="info-card__section">
					<p>Usuários hospitalizados possuem -5 DEF e defendem -5% grana.</p>
				</div>
				<div class="info-card__section">
					<h3>Serviço público</h3>
					<p>Infelizmente não temos mais leitos livres, então você precisará esperar no corredor até ser atendido.</p>
				</div>
				<div class="info-card__section">
					<h3>Atendimento particular</h3>
					<p>Caso você pague uma certa quantia, poderemos tratá-lo mais rapidamente!</p>
				</div>
			</div>
			<template
				v-if="isUserHospitalized"
				#actions
			>
				<BaseButton
					variant="secondary"
					:loading="payingPrivate"
					@click="showPrivateModal = true"
				>
					<NuxtImg
						:src="imagePaths.badges.topHospital"
						width="16"
					/>
					Pagar particular
				</BaseButton>
			</template>
		</BaseCard>

		<BaseCard
			class="table-card"
			title="Hospitalizados"
			no-padding-x
			no-padding-y
		>
			<template #header>
				<div class="hospital-page__search-bar">
					<Search
						:size="18"
						class="hospital-page__search-icon"
						aria-hidden="true"
					/>
					<BaseInput
						id="search-hospital"
						:model-value="searchQuery"
						aria-label="Buscar hospitalizados por nickname ou ID"
						type="search"
						placeholder="Buscar por Nickname ou ID..."
						@update:model-value="handleSearch"
					/>
				</div>
			</template>

			<BaseTableSkeleton
				v-if="loading"
				:rows="limit"
				:columns="3"
				label="Buscando hospitalizados"
			/>

			<BaseEmptyState
				v-else-if="entries.length === 0"
				:icon="HospitalIcon"
				:icon-size="36"
			>
				<p>Nenhum jogador hospitalizado no momento.</p>
			</BaseEmptyState>

			<BaseTable
				v-else
				:sort-column="sortColumn"
				:sort-direction="sortDirection"
				@sort="handleSort"
			>
				<table class="hospital-table">
					<caption class="visually-hidden">
						Lista de jogadores hospitalizados
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
								@click="handleSort('hospitalTime')"
							>
								<span class="sort-header-content">
									Curado em
									<span class="sort-icons">
										<ArrowUpDown
											v-if="sortColumn !== 'hospitalTime'"
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
								@click="handleSort('hospitalCount')"
							>
								<span class="sort-header-content">
									Hospitalizações
									<span class="sort-icons">
										<ArrowUpDown
											v-if="sortColumn !== 'hospitalCount'"
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
								<time :datetime="entry.hospitalTime">
									{{ distance(entry.hospitalTime, new Date()) }}
								</time>
							</td>
							<td>
								{{ entry.hospitalCount }}
							</td>
						</tr>
					</tbody>
				</table>
			</BaseTable>

			<template #footer>
				<BaseTableFooter
					label-item="hospitalizados"
					label-navigation="Paginação de hospitalizados"
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
			:open="showPrivateModal"
			title="Pagar tratamento particular"
			@update:open="showPrivateModal = $event"
		>
			<p>
				<em> Seu tratamento custará <strong>{{ formatPrivateCost() }}</strong> e será somente uma injeçãozinha.</em>
			</p>
			<template #footer>
				<BaseButton
					variant="secondary"
					@click="showPrivateModal = false"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					variant="primary"
					:loading="payingPrivate"
					@click="handlePayPrivate"
				>
					Confirmar
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

.hospital-page {
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
		}
	}
}

.hospital-table {
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
