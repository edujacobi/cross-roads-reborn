<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { MapPin, Swords } from "lucide-vue-next";
import { computed, watch } from "vue";
import BaseBadge from "~/components/ui/BaseBadge.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseEmptyState from "~/components/ui/BaseEmptyState.vue";
import BaseTable from "~/components/ui/BaseTable.vue";
import BaseTableFooter from "~/components/ui/BaseTableFooter.vue";
import BaseTableSkeleton from "~/components/ui/BaseTableSkeleton.vue";
import RefreshButton from "~/components/ui/RefreshButton.vue";
import { imagePaths } from "~/constants/imagePaths";
import { GetUserHistoryDocument, type GetUserHistoryQuery } from "~/graphql/generated";
import { ClashType } from "../../../src/core/types/Robbery";

interface Props {
	userId: string;
}

const props = defineProps<Props>();

const { dateTime, relative } = useDateFormat();
const { formatMoney } = useMoneyFormat();
const { page, pageSize: limit, offset } = usePagination(1, 10);

const { result, loading, refetch } = useQuery(
	GetUserHistoryDocument,
	() => ({
		userId: props.userId,
		limit: limit.value,
		offset: offset.value,
	}),
	{
		fetchPolicy: "cache-and-network",
	},
);

watch(
	() => props.userId,
	() => {
		page.value = 1;
	},
);

const { getLocationImageUrl } = useLocation();

type HistoryEntry = GetUserHistoryQuery["userHistory"]["entries"][number];

const entries = computed<HistoryEntry[]>(() => result.value?.userHistory?.entries || []);
const total = computed(() => result.value?.userHistory?.total || 0);
const pages = computed(() => Math.ceil(total.value / limit.value) || 1);

function getClashTypeLabel(type: number): string {
	switch (type) {
		case ClashType.User:
		case ClashType.Location:
			return "Roubo";
		case ClashType.BeatUp:
			return "Espancamento";
		case ClashType.Investment:
			return "Ação em Gangue";
		default:
			return "Confronto";
	}
}

function getActionIcon(type: number): string {
	switch (type) {
		case ClashType.BeatUp:
			return imagePaths.situations.beatup;
		case ClashType.Investment:
			return imagePaths.situations.gangAction;
		default:
			return imagePaths.situations.robbery;
	}
}

function prevPage() {
	if (page.value > 1) {
		page.value--;
	}
}

function nextPage() {
	if (page.value < pages.value) {
		page.value++;
	}
}
</script>

<template>
	<BaseCard
		title="Histórico de confrontos"
		:icon="imagePaths.uiElements.react"
		class="user-history-card"
		no-padding-x
		no-padding-y
	>
		<template #actions>
			<RefreshButton
				@refresh="() => refetch()"
				:loading="loading"
				aria-label="Atualizar histórico"
			/>
		</template>

		<BaseTableSkeleton
			v-if="loading && entries.length === 0"
			:rows="limit"
			:columns="6"
			label="Carregando histórico de confrontos"
		/>

		<BaseEmptyState
			v-else-if="entries.length === 0"
			:icon="Swords"
		>
			<p>Este usuário não possui histórico de confrontos.</p>
		</BaseEmptyState>

		<BaseTable
			v-else
			class="user-history-card__table-wrapper"
		>
			<table class="user-history-table">
				<caption class="visually-hidden">
					Histórico de roubos e espancamentos do usuário
				</caption>
				<thead>
					<tr>
						<th scope="col">Atacante</th>
						<th scope="col">Tipo</th>
						<th scope="col">Alvo</th>
						<th scope="col">Resultado</th>
						<th scope="col">Quantia</th>
						<th
							scope="col"
							class="text-right"
						>
							Data / Hora
						</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="entry in entries"
						:key="entry.id"
					>
						<td>
							<div
								v-if="entry.attacker"
								class="history-user"
							>
								<NuxtLink
									:to="`/users/${entry.attacker.id}`"
									class="history-user__link"
									:class="{ 'history-user__link--current': entry.attackerId === userId }"
								>
									<LazyNuxtImg
										:src="entry.attacker.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'"
										alt=""
										width="22"
										height="22"
										class="user-avatar"
									/>
									<span class="history-user__name">{{ entry.attacker.nickname }}</span>
								</NuxtLink>
							</div>
							<span
								v-else
								class="history-user__unknown"
							>
								{{ entry.attackerId }}
							</span>
						</td>

						<td>
							<BaseBadge>
								<NuxtImg
									:src="getActionIcon(entry.type)"
									width="16"
									height="16"
									alt=""
									class="history-action__icon"
								/>
								{{ getClashTypeLabel(entry.type) }}
							</BaseBadge>
						</td>

						<td>
							<!-- ClashType.Location -->
							<div
								v-if="entry.type === ClashType.Location"
								class="history-target"
							>
								<NuxtImg
									v-if="entry.locationId !== null"
									:src="getLocationImageUrl(entry.locationId)"
									width="32"
									height="32"
									alt=""
									class="history-target__icon"
								/>
								<MapPin
									v-else
									:size="18"
									class="history-target__icon"
									aria-hidden="true"
								/>
								<span class="history-target__name">{{ entry.locationName || "Local" }}</span>
							</div>

							<!-- ClashType.Investment -->
							<div
								v-else-if="entry.type === ClashType.Investment"
								class="history-target"
							>
								<NuxtImg
									:src="imagePaths.situations.defendingInvestment"
									alt=""
									width="18"
									height="18"
								/>
								<span class="history-target__investment-name"> {{ entry.locationName || "Investimento" }} de </span>
								<NuxtLink
									v-if="entry.defender"
									:to="`/users/${entry.defender.id}`"
									class="history-user__link"
									:class="{ 'history-user__link--current': entry.defenderId === userId }"
								>
									<LazyNuxtImg
										:src="entry.defender.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'"
										alt=""
										width="32"
										height="32"
										class="user-avatar"
									/>
									<span class="history-user__name">{{ entry.defender.nickname }}</span>
								</NuxtLink>
								<span
									v-else
									class="history-user__unknown"
								>
									{{ entry.defenderId || "—" }}
								</span>
							</div>

							<!-- ClashType.User or ClashType.BeatUp -->
							<div
								v-else
								class="history-user"
							>
								<template v-if="entry.defender">
									<NuxtLink
										:to="`/users/${entry.defender.id}`"
										class="history-user__link"
										:class="{ 'history-user__link--current': entry.defenderId === userId }"
									>
										<LazyNuxtImg
											:src="entry.defender.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'"
											alt=""
											width="22"
											height="22"
											class="user-avatar"
										/>
										<span class="history-user__name">{{ entry.defender.nickname }}</span>
									</NuxtLink>
								</template>
								<span
									v-else
									class="history-user__unknown"
								>
									{{ entry.defenderId || "—" }}
								</span>
							</div>
						</td>

						<td>
							<BaseBadge :variant="entry.success ? 'success' : 'neutral'">
								{{ entry.success ? "Sucesso" : "Falha" }}
							</BaseBadge>
						</td>

						<td>
							<span
								v-if="entry.success && entry.type !== ClashType.BeatUp && entry.money > 0"
								class="history-money font-bold"
							>
								{{ formatMoney(entry.money) }}
							</span>
							<span
								v-else
								class="text-muted"
							>
								—
							</span>
						</td>

						<td class="text-right">
							<div class="history-time">
								<time
									:datetime="entry.createdAt"
									class="history-time__date"
								>
									{{ dateTime(entry.createdAt) }}
								</time>
								<small class="history-time__relative">{{ relative(entry.createdAt, true) }}</small>
							</div>
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
				label-item="confrontos"
				label-navigation="Navegação do histórico"
				:index="entries.length"
				:offset="offset"
				:total="total"
				:page="page"
				:pages="pages"
				@click-previous="prevPage"
				@click-next="nextPage"
			/>
		</template>
	</BaseCard>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.user-history-card {
	&__state {
		@include flex-center;
		flex-direction: column;
		gap: $spacing-sm;
		padding: $spacing-xl;
		color: $text-muted;
		font-size: 0.875rem;
	}

	&__table-wrapper {
		max-height: 50dvh;
		overflow-y: auto;
	}
}

.user-history-table {
	font-size: 0.85rem;

	.text-right {
		text-align: right;
	}

	.font-bold {
		font-weight: 700;
	}

	.text-muted {
		color: $text-muted;
	}
}

.history-time {
	display: flex;
	flex-direction: column;
	gap: 0.125rem;

	&__date {
		color: $text-secondary;
		font-weight: 500;
		white-space: nowrap;
	}

	&__relative {
		color: $text-muted;
		font-size: 0.75rem;
		white-space: nowrap;
	}
}

.history-user {
	display: inline-flex;
	align-items: center;
	gap: $spacing-xs;

	&__link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		color: $text-primary;
		text-decoration: none;
		font-weight: 500;
		@include transition-color;
		padding: $spacing-xs $spacing-md $spacing-xs $spacing-xs;
		border-radius: $radius-full;

		&:hover {
			background: $bg-card-hover;
		}

		&--current {
			pointer-events: none;
		}
	}

	&__name {
		white-space: nowrap;
	}

	&__unknown {
		color: $text-muted;
		font-style: italic;
	}
}

.user-avatar {
	width: 2rem;
	height: 2rem;
	aspect-ratio: 1;
	border-width: 3px;
}

.history-action {
	display: inline-flex;
	align-items: center;
	justify-content: center;

	&__icon {
		object-fit: contain;
	}
}

.history-target {
	display: inline-flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 0.375rem;

	&__icon {
		flex-shrink: 0;
		width: 2rem;
		object-fit: contain;
		color: $text-secondary;
	}

	&__name {
		color: $text-primary;
		font-weight: 500;
		white-space: nowrap;
	}

	&__investment-name {
		color: $text-secondary;
		white-space: nowrap;
	}
}

.history-money {
	white-space: nowrap;
	font-size: 1rem;
}
</style>
