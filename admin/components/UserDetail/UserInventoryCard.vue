<script
	setup
	lang="ts"
>
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Package } from "lucide-vue-next";
import BaseCard from "~/components/ui/BaseCard.vue";
import type { UserDetail } from "~/types/userDetail";
import { BundleId, ItemId } from "../../../src/core/types/Ids";
import { ItemType } from "../../../src/core/types/ItemType";

defineProps<{ items: UserDetail["items"] }>();

function getItemImage(itemId: ItemId, bundleId: BundleId = 0) {
	let filename = `${itemId}_${ItemId[itemId]}.png`;
	if (bundleId !== 0) filename = `${itemId}_${ItemId[itemId]}_${BundleId[bundleId]}.png`;
	return `items/${filename}`;
}
</script>

<template>
	<BaseCard
		title="Inventário"
		icon="ui_elements/inventory"
		class="user-inventory"
	>
		<div
			v-if="items.length === 0"
			class="user-inventory__empty"
		>
			<Package
				:size="32"
				aria-hidden="true"
			/>
			<p>O jogador não possui itens no inventário.</p>
		</div>

		<ul
			v-else
			class="user-inventory__items"
		>
			<li
				v-for="item in items"
				:key="item.id"
				class="user-inventory__item"
			>
				<NuxtImg
					class="user-inventory__item-image"
					:src="getItemImage(item.id, item.skin)"
					alt=""
				/>
				<div class="user-inventory__item-header">
					<h3 class="user-inventory__item-name">{{ item.name }}</h3>
					<span
						v-if="item.type === ItemType.Consumable"
						class="user-inventory__item-quantity"
					>
						{{ item.quantity }}
						un
					</span>
					<span
						v-else-if="item.remainingTime"
						class="user-inventory__item-quantity"
					>
						{{ formatDistanceToNow(new Date(item.remainingTime), { locale: ptBR }) }}
					</span>
				</div>
			</li>
		</ul>
	</BaseCard>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.user-inventory {
	&__empty {
		@include flex-center;
		flex-direction: column;
		gap: $spacing-sm;
		padding: $spacing-lg;
		color: $text-muted;
		font-size: 0.875rem;
	}

	&__items {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
		gap: $spacing-sm;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	&__item {
		padding: 0.875rem;
		background-color: $bg-input;
		border: 1px solid $border-subtle;
		border-radius: $radius-sm;
		display: flex;
		flex-direction: column;

		&-image {
			padding: $spacing-sm;
		}
	}


	&__item-header {
		@include flex-between;
		flex-direction: column;
		gap: $spacing-xs;
		align-items: start;
		flex-grow: 1;
	}

	&__item-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: $text-primary;
		margin: 0;
	}

	&__item-quantity {
		font-size: 0.75rem;
		font-weight: 700;
		color: $color-brand;
		background-color: rgba($color-brand, 0.15);
		padding: 0.125rem 0.375rem;
		border-radius: $radius-xs;
	}
}
</style>
