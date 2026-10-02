<script
	setup
	lang="ts"
>
import { computed, ref } from "vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseTable from "~/components/ui/BaseTable.vue";
import type { GetDashboardItemPopularityQuery } from "~/graphql/generated";
import { ItemId } from "../../../src/core/types/Ids";

type DashboardItem = GetDashboardItemPopularityQuery["dashboardItemPopularity"][number];

interface Props {
	items: DashboardItem[];
	loading?: boolean;
}

const props = defineProps<Props>();
const sortBy = ref<"userCount" | "itemId">("userCount");

const sortedItems = computed(() =>
	[...props.items].sort((first, second) =>
		sortBy.value === "itemId"
			? first.itemId - second.itemId
			: second.userCount - first.userCount || first.itemId - second.itemId,
	),
);

function getItemImage(itemId: number) {
	const id = itemId as ItemId;
	return `/images/items/${id}_${ItemId[id]}.png`;
}
</script>

<template>
	<BaseCard
		title="Itens mais usados"
		subtitle="Jogadores ativos que possuem cada item"
		class="item-popularity-card"
	>
		<template #actions>
			<label class="sort-control">
				Ordenar por
				<select v-model="sortBy">
					<option value="userCount">Quantidade de usuários</option>
					<option value="itemId">ID do item</option>
				</select>
			</label>
		</template>

		<p
			v-if="loading"
			class="card-message"
			role="status"
		>
			Carregando itens...
		</p>
		<p
			v-else-if="items.length === 0"
			class="card-message"
		>
			Nenhum item encontrado.
		</p>
		<BaseTable
			v-else
			class="table-container"
		>
			<table>
				<thead>
					<tr>
						<th scope="col">Item</th>
						<th scope="col">Usuários</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="item in sortedItems"
						:key="item.itemId"
					>
						<td class="item-name">
							<span class="item-id">{{ item.itemId }}</span>
							<NuxtImg
								:src="getItemImage(item.itemId)"
								alt=""
								width="32"
								height="32"
							/>
							{{ item.name }}
						</td>
						<td class="user-count">{{ item.userCount.toLocaleString("pt-BR") }}</td>
					</tr>
				</tbody>
			</table>
		</BaseTable>
	</BaseCard>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.sort-control {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
	color: $text-secondary;
	font-size: 0.8125rem;

	select {
		padding: 0.4rem 0.6rem;
		border: 1px solid $border-subtle;
		border-radius: 6px;
		background: $bg-card-hover;
		color: $text-primary;
	}
}

.item-name {
	display: flex;
	align-items: center;
	gap: $spacing-sm;

	.item-id {
		font-family: monospace;
		margin-right: $spacing-sm;
		color: $text-muted;
	}

	img {
		flex: 0 0 auto;
		object-fit: contain;
	}
}

.table-container {
	max-height: 50dvh;
	overflow-y: auto;
}

.user-count {
	font-weight: 700;
	color: $text-primary;
}

.card-message {
	padding: $spacing-lg;
	color: $text-muted;
	text-align: center;
}
</style>
