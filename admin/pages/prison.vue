<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
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
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { imagePaths } from "~/constants/imagePaths";
import {
	AttemptPrisonEscapeDocument,
	GetBribeCostDocument,
	GetMyPrisonStatusDocument,
	GetPrisonersDocument,
	PayBribePrisonDocument,
} from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Prisão",
});

const auth = useAuth();
const { distance } = useDateFormat();
const { getClassImageUrl, getClassName } = useClasses();
const { getSituationImageUrl, getSituationName } = useSituation();
const { showToast } = useToast();
// const { openItemModal } = useItemDetailModal();

const searchQuery = ref("");
const { page, pageSize: limit, offset, resetPage } = usePagination(1, 15);
const { sortColumn, sortDirection, toggleSort } = useSorting();

const {
	result,
	loading,
	refetch: refetchPrisoners,
} = useQuery(
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

const { result: bribeCostResult, refetch: refetchBribeCost } = useQuery(
	GetBribeCostDocument,
	{},
	{
		fetchPolicy: "network-only",
	},
);

const bribeCost = computed(() => bribeCostResult.value?.bribeCost || 0);

const { result: userStatusResult, refetch: refetchPrisonStatus } = useQuery(
	GetMyPrisonStatusDocument,
	{},
	{
		fetchPolicy: "network-only",
	},
);

const escapeHasTried = computed(() => userStatusResult.value?.myPrisonStatus?.escapeHasTried || false);
const escapeTime = computed(() => {
	const raw = userStatusResult.value?.myPrisonStatus?.escapeTime;
	return raw ? new Date(raw) : null;
});
const prisonHasPaidBribe = computed(() => userStatusResult.value?.myPrisonStatus?.prisonHasPaidBribe || false);

const entries = computed(() => result.value?.prisoners?.entries || []);
const total = computed(() => result.value?.prisoners?.total || 0);
const totalPages = computed(() => Math.ceil(total.value / limit.value) || 1);

const userSituationId = computed(() => auth.user?.value?.situationId ?? 0);
const userSituationName = computed(() => getSituationName(userSituationId.value));
const userSituationImage = computed(() => getSituationImageUrl(userSituationId.value));

const isUserImprisoned = computed(() => {
	const userId = auth.user?.value?.userId;
	if (!userId) return false;
	return entries.value.some((e) => e.id === userId);
});

const showEscapeModal = ref(false);
const showEscapeLoadingModal = ref(false);
const showEscapeResultModal = ref(false);
const escapeResultMessage = ref("");
const escapeResultSuccess = ref(false);
const showBribeModal = ref(false);
const isEscaping = ref(false);

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

async function onEscapeResult(success: boolean, message: string) {
	showEscapeLoadingModal.value = false;
	isEscaping.value = false;
	escapeResultMessage.value = message;
	escapeResultSuccess.value = success;
	showEscapeResultModal.value = true;
	await Promise.all([auth.fetchUser(), refetchPrisoners(), refetchPrisonStatus(), refetchBribeCost()]);
}

async function listenToEscapeSSE() {
	const config = useRuntimeConfig();
	const token = useAuth().token.value;
	if (!token) return;

	try {
		const response = await fetch(`${config.public.apiBaseUrl}/sse/escape-status`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			isEscaping.value = false;
			return;
		}

		const reader = response.body?.getReader();
		const decoder = new TextDecoder();
		let buffer = "";

		while (reader) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (line.startsWith("data: ")) {
					const data = JSON.parse(line.slice(6));
					if (data.type === "escape-ended") {
						await onEscapeResult(
							data.isWanted,
							data.message || (data.isWanted ? "Fuga bem-sucedida!" : "Fuga fracassada!"),
						);
						return;
					}
					if (data.type === "not-escaping") {
						isEscaping.value = false;
						return;
					}
				}
			}
		}
	} catch {
		isEscaping.value = false;
	}
}

async function handleEscape() {
	showEscapeModal.value = false;
	showEscapeLoadingModal.value = true;
	isEscaping.value = true;

	const res = await attemptEscape();
	if (res?.errors) {
		showEscapeLoadingModal.value = false;
		isEscaping.value = false;
		showToast({ text: "Erro ao tentar fugir.", variant: "error" });
		return;
	}
	if (!res?.data?.attemptPrisonEscape?.success) {
		showEscapeLoadingModal.value = false;
		isEscaping.value = false;
		showToast({ text: res?.data?.attemptPrisonEscape?.message || "Erro desconhecido.", variant: "error" });
		return;
	}

	// Listen to SSE for escape result
	listenToEscapeSSE();
}

async function recoverInterruptedEscape() {
	if (!escapeTime.value) return;

	showEscapeLoadingModal.value = true;
	isEscaping.value = true;

	const now = new Date();
	const timeDiff = escapeTime.value.getTime() - now.getTime();

	if (timeDiff > 0) {
		// Still escaping, listen to SSE
		listenToEscapeSSE();
	} else {
		// Escape should have ended already, refresh status
		isEscaping.value = false;
		showEscapeLoadingModal.value = false;
		await Promise.all([auth.fetchUser(), refetchPrisoners(), refetchPrisonStatus(), refetchBribeCost()]);
	}
}

onMounted(async () => {
	await new Promise<void>((resolve) => {
		const unwatch = watch(
			() => userStatusResult.value?.myPrisonStatus,
			(status) => {
				if (status) {
					unwatch();
					resolve();
				}
			},
			{ immediate: true },
		);
	});
	await recoverInterruptedEscape();
});

async function handleBribe() {
	const res = await payBribe();
	if (res?.errors) {
		showToast({ text: "Erro ao tentar subornar.", variant: "error" });
		return;
	}
	if (res?.data?.payBribePrison?.bribeAccepted) {
		showToast({ text: res?.data.payBribePrison.message, variant: "success" });
	} else {
		showToast({ text: res?.data?.payBribePrison?.message || "Erro desconhecido.", variant: "error" });
	}

	showBribeModal.value = false;
	await Promise.all([auth.fetchUser(), refetchPrisoners(), refetchPrisonStatus(), refetchBribeCost()]);
}

const { formatMoney } = useMoneyFormat();

function formatBribeCost() {
	if (bribeCost.value === 0) {
		return "...";
	}
	return formatMoney(bribeCost.value);
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
					:disabled="escapeHasTried || showEscapeLoadingModal || isEscaping"
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
					:disabled="prisonHasPaidBribe"
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
			class="escape-loading-modal"
			:open="showEscapeLoadingModal"
			title="Tentando fugir..."
			@update:open="showEscapeLoadingModal = $event"
		>
			<div class="escape-loading">
				<NuxtImg
					:src="imagePaths.uiElements.escape"
					width="100"
				/>
				<div class="escape-loading__spinner"></div>
			</div>
		</BaseModal>

		<BaseModal
			:open="showEscapeResultModal"
			:title="escapeResultSuccess ? 'Fuga bem-sucedida!' : 'Fuga fracassada'"
			@update:open="showEscapeResultModal = $event"
		>
			<p>{{ escapeResultMessage }}</p>
			<template #footer>
				<BaseButton
					variant="primary"
					@click="showEscapeResultModal = false"
				>
					Entendi
				</BaseButton>
			</template>
		</BaseModal>

		<BaseModal
			:open="showBribeModal"
			title="Subornar os guardas"
			@update:open="showBribeModal = $event"
		>
			<p>
				<em>
					Sabemos que você tem um certo dinheiro escondido aí... Nos dê <strong>{{ formatBribeCost() }}</strong> e
					deixaremos você sair de fininho.
				</em>
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

	&__situation-image {
		flex-shrink: 0;
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

.escape-loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-md;
	padding: $spacing-lg 0;

	&__spinner {
		width: 3rem;
		height: 3rem;
		border: 4px solid $border-subtle;
		border-top-color: $color-brand;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	&__text {
		font-size: 1rem;
		font-weight: 600;
		color: $text-primary;
		text-align: center;
	}
}

.escape-loading-modal :deep(.dialog-header) {
	display: none;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}
</style>
