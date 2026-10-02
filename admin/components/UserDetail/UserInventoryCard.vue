<script
	setup
	lang="ts"
>
import { differenceInHours, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Maximize, Minimize, Package } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import { imagePaths } from "~/constants/imagePaths";
import { localStorageKeys } from "~/constants/localStorageKeys";
import type { UserDetail } from "~/types/userDetail";
import { BundleId, ItemId } from "../../../src/core/types/Ids";
import { ItemType } from "../../../src/core/types/ItemType";

defineProps<{ items: UserDetail["items"] }>();

const isCompactInventory = ref(false);
const inventoryStorage = useLocalStorage(localStorageKeys.compactInventory);

onMounted(() => {
	isCompactInventory.value = inventoryStorage.get() === "true";
});

function toggleCompactInventory() {
	isCompactInventory.value = !isCompactInventory.value;
	inventoryStorage.set(String(isCompactInventory.value));
}

function getItemStatusClasses(item: UserDetail["items"][number]) {
	const classes: string[] = [];

	if (item.type === ItemType.Consumable) {
		if (item.quantity <= 2) classes.push("user-inventory__item-quantity--alert");
		if (item.quantity <= 1) classes.push("user-inventory__item-quantity--danger");
	} else if (item.remainingTime) {
		const hoursRemaining = differenceInHours(new Date(item.remainingTime), Date.now());
		if (hoursRemaining < 24) classes.push("user-inventory__item-quantity--alert");
		if (hoursRemaining < 12) classes.push("user-inventory__item-quantity--danger");
	}

	return classes;
}

function getItemImage(itemId: ItemId, bundleId: BundleId = 0) {
	let filename = `${itemId}_${ItemId[itemId]}.png`;
	if (bundleId !== 0) filename = `${itemId}_${ItemId[itemId]}_${BundleId[bundleId]}.png`;
	return `/images/items/${filename}`;
}
</script>

<template>
	<BaseCard
		title="Inventário"
		:icon="imagePaths.uiElements.inventory"
		class="user-inventory"
	>
		<template #actions>
			<BaseButton
				variant="ghost"
				size="sm"
				:aria-pressed="isCompactInventory"
				@click="toggleCompactInventory"
			>
				<Maximize
					:size="16"
					aria-hidden="true"
					v-if="isCompactInventory"
				/>
				<Minimize
					:size="16"
					aria-hidden="true"
					v-else
				/>
				{{ isCompactInventory ? "Visualização detalhada" : "Visualização compacta" }}
			</BaseButton>
		</template>

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
			:class="{ 'user-inventory__items--compact': isCompactInventory }"
		>
			<li
				v-for="item in items"
				:key="item.id"
				class="user-inventory__item"
				:class="{ 'user-inventory__item--compact': isCompactInventory }"
				:title="isCompactInventory ? item.name : ''"
			>
				<LazyNuxtImg
					class="user-inventory__item-image"
					:src="getItemImage(item.id, item.skin)"
					alt=""
				/>
				<span
					v-show="isCompactInventory"
					class="user-inventory__item-status user-inventory__item-quantity"
					:class="getItemStatusClasses(item)"
					aria-hidden="true"
				/>
				<div
					class="user-inventory__item-header"
					v-if="!isCompactInventory"
				>
					<h3 class="user-inventory__item-name">{{ item.name }}</h3>
					<span
						v-if="item.type === ItemType.Consumable"
						class="user-inventory__item-quantity"
						:class="getItemStatusClasses(item)"
					>
						{{ item.quantity }}
						un
					</span>
					<span
						v-else-if="item.remainingTime"
						class="user-inventory__item-quantity"
						:class="getItemStatusClasses(item)"
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
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: $spacing-sm;
		list-style: none;
		margin: 0;
		padding: 0;

		// ponytail: responsive columns for inventory items
		@media (max-width: 1024px) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		@media (max-width: 540px) {
			grid-template-columns: 1fr;
		}

		&--compact {
			grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		}
	}

	&__item {
		padding: 0.875rem;
		background-color: $bg-input;
		border: 1px solid $border-subtle;
		border-radius: $radius-sm;
		display: flex;
		align-items: center;
		gap: $spacing-md;

		&-image {
			width: 4rem;
			height: 4rem;
			flex: 0 0 4rem;
			object-fit: contain;
			padding: $spacing-xs;
		}

		&--compact {
			position: relative;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			aspect-ratio: 1;
		}
	}

	&__item-status {
		position: absolute;
		bottom: $spacing-md;
		left: $spacing-md;
		z-index: 1;
	}

	&__item-header {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
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
		font-weight: 600;
		color: $text-secondary;
		display: flex;
		gap: $spacing-xs;

		&--alert, &--danger {
			&::before {
				content: '';
				display: block;
				width: 20px;
				height: 20px;
				background-size: contain;
			}
		}

		&--alert {
			color: #E0AC00;
			&::before {
				background-image: url("public/images/ui_elements/infoWarning.png");
			}
		}

		&--danger {
			color: #F04D48;
			&::before {
				background-image: url("public/images/ui_elements/infoDanger.png");
			}
		}
	}
}
</style>
