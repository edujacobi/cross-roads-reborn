<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { UserCheck } from "lucide-vue-next";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseEmptyState from "~/components/ui/BaseEmptyState.vue";
import BaseErrorState from "~/components/ui/BaseErrorState.vue";
import BaseTable from "~/components/ui/BaseTable.vue";
import BaseTableFooter from "~/components/ui/BaseTableFooter.vue";
import BaseTableSkeleton from "~/components/ui/BaseTableSkeleton.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { SearchUsersDocument, type SearchUsersQuery } from "~/graphql/generated";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "VIPs",
});

const { page, pageSize, offset } = usePagination(1, 15);
const { distance } = useDateFormat();
const { result, loading, error } = useQuery(SearchUsersDocument, () => ({
	vipOnly: true,
	limit: pageSize.value,
	offset: offset.value,
}));
const users = computed<SearchUsersQuery["users"]["users"]>(() => result.value?.users.users ?? []);
const total = computed(() => result.value?.users.total ?? 0);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));

function prevPage() {
	if (page.value > 1) page.value--;
}

function nextPage() {
	if (page.value < totalPages.value) page.value++;
}

function remainingVipTime(vipTime: string | null): string {
	return vipTime ? distance(vipTime, new Date()) : "—";
}
</script>

<template>
	<main class="vips-page">
		<PageTitle
			title="VIPs"
			subtitle="Lista de jogadores com VIP ativo e o tempo restante"
		/>

		<BaseCard
			title="Jogadores VIP"
			no-padding-x
			no-padding-y
		>
			<BaseTableSkeleton
				v-if="loading"
				:rows="pageSize"
				:columns="3"
				label="Carregando jogadores VIP"
			/>
			<BaseErrorState v-else-if="error"> Não foi possível carregar os jogadores VIP. </BaseErrorState>
			<BaseEmptyState
				v-else-if="users.length === 0"
				:icon="UserCheck"
			>
				Nenhum VIP ativo encontrado.
			</BaseEmptyState>
			<BaseTable v-else>
				<table class="vips-table">
					<caption class="visually-hidden">
						Jogadores VIP ativos
					</caption>
					<thead>
						<tr>
							<th scope="col">Jogador</th>
							<th scope="col">ID</th>
							<th scope="col">Tempo restante</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="vip in users"
							:key="vip.id"
							class="clickable-row"
							tabindex="0"
							@click="navigateTo(`/users/${vip.id}`)"
							@keydown.enter.prevent="navigateTo(`/users/${vip.id}`)"
						>
							<th
								scope="row"
								class="player-cell"
							>
								<div class="player-cell-content">
									<NuxtImg
										class="profile-img"
										:src="vip.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'"
										:alt="vip.nickname ? `Avatar de ${vip.nickname}` : 'Avatar do jogador'"
									/>
									<span>{{ vip.nickname || "(Sem Nick)" }}</span>
								</div>
							</th>
							<td class="id-cell">{{ vip.id }}</td>
							<td>{{ vip.vipEternal ? "Eterno" : remainingVipTime(vip.vipTime) }}</td>
						</tr>
					</tbody>
				</table>
			</BaseTable>

			<template #footer>
				<BaseTableFooter
					:labels="{


						item: 'VIPs',


						navigation: 'Paginação de VIPs',


					}"
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

.vips-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;
}

.vips-table {
	.player-cell {
		color: $text-secondary;
		font-size: inherit;
		font-weight: 400;
		text-transform: none;
	}

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

	.player-cell-content {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		color: $text-primary;
		font-weight: 600;
	}

	.profile-img {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		border: 1px solid rgba($bg-input, 0.3);
	}

	.id-cell {
		font-family: monospace;
		font-size: 0.8125rem;
		color: $text-muted;
	}
}

.list-state {
	@include flex-center;
	gap: $spacing-sm;
	padding: 3rem 1.25rem;
	color: $text-muted;
	font-size: 0.875rem;
}

.error-state {
	color: $color-danger;
}

</style>
