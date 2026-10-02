<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { format, formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, UserCheck } from "lucide-vue-next";
import BaseBadge from "~/components/ui/BaseBadge.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseInput from "~/components/ui/BaseInput.vue";
import BaseTable from "~/components/ui/BaseTable.vue";
import BaseTableFooter from "~/components/ui/BaseTableFooter.vue";
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
const searchQuery = ref("");
const page = ref(1);
const limit = ref(15);
const pageSubtitle = computed(() =>
	auth.hasAdminAccess.value
		? "Pesquise, visualize inventários e execute ações de moderação e administração"
		: "Pesquise e visualize os perfis dos jogadores",
);

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

const { getClassImageUrl, getClassName } = useClasses();
const { getSituationName, getSituationImageUrl } = useSituation();

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
				<div class="search-bar">
					<Search
						:size="18"
						class="search-icon"
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

			<div
				v-if="loading"
				class="loading-state"
				role="status"
			>
				<p>Buscando jogadores no banco de dados...</p>
			</div>

			<div
				v-else-if="users.length === 0"
				class="empty-state"
			>
				<UserCheck
					:size="36"
					aria-hidden="true"
				/>
				<p>Nenhum jogador encontrado com os critérios de busca.</p>
			</div>

			<BaseTable v-else>
				<table class="users-table">
					<caption class="visually-hidden">
						Lista de jogadores
					</caption>
					<thead>
						<tr>
							<th scope="col">Jogador</th>
							<th
								v-if="auth.hasAdminAccess.value"
								scope="col"
							>
								ID
							</th>
							<th scope="col">Grupo</th>
							<th scope="col">Classe</th>
							<th scope="col">Status</th>
							<th
								v-if="auth.hasAdminAccess.value"
								scope="col"
							>
								Criação
							</th>
							<th
								v-if="auth.hasAdminAccess.value"
								scope="col"
							>
								Última atualização
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
										v-if="u.vipEternal"
										variant="vip"
									>
										<NuxtImg
											:src="imagePaths.badges.vip"
											width="14"
											alt=""
										/>
										VIP Eterno
									</BaseBadge>
									<BaseBadge
										v-else-if="u.isVip"
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
								<time :datetime="u.createdAt">{{ format(u.createdAt, "dd/MM/yyyy hh:mm") }}</time>
							</td>
							<td v-if="auth.hasAdminAccess.value">
								<time :datetime="u.updatedAt">
									{{ formatDistance(u.updatedAt, new Date(), { locale: ptBR }) }}
								</time>
							</td>
						</tr>
					</tbody>
				</table>
			</BaseTable>

			<template #footer>
				<BaseTableFooter
					:labels="{
						item: 'jogadores',
						navigation: 'Paginação de jogadores',
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

.users-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;
}

.search-bar {
	display: flex;
	align-items: center;
	gap: 12px;
	width: 100%;
	max-width: 28.125rem;
	position: relative;

	// ponytail: expand search on mobile screens
	@media (max-width: 600px) {
		max-width: 100%;
	}

	.search-icon {
		position: absolute;
		left: 12px;
		color: $text-muted;
		pointer-events: none;
	}

	:deep(.base-input) {
		padding-left: 2.375rem;
	}
}

.loading-state,
.empty-state {
	@include flex-center;
	flex-direction: column;
	gap: 12px;
	padding: 3.125rem 1.25rem;
	color: $text-muted;
	font-size: 0.875rem;
}

.users-table {
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

		.nickname {
			font-weight: 600;
			color: $text-primary;
		}

		.profile-img {
			@include flex-center;
			width: 2rem;
			height: 2rem;
			border-radius: 50%;
			background-color: rgba($bg-input, 0.15);
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

</style>
