<script
	setup
	lang="ts"
>
import { Minus, Plus } from "lucide-vue-next";
import ShopIcon from "~/components/icons/ShopIcon.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import SegmentedProgressBar from "~/components/ui/SegmentedProgressBar.vue";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { imagePaths } from "~/constants/imagePaths";
import type { GetItemsQuery } from "~/graphql/generated";
import type { ItemCardState } from "~/pages/shop.vue";
import { ItemType } from "../../src/core/types/ItemType";

const { formatPlain } = useMoneyFormat();

type Item = GetItemsQuery["items"][number];

const props = withDefaults(
	defineProps<{
		item: Item;
		cardState: ItemCardState;
		isBlackMarket?: boolean;
		isDisabled?: boolean;
		getItemImage: (itemId: number, bundleId?: number) => string;
		getUserItemSkin: (itemId: number) => number;
		getOwnershipLabel: (item: Item) => string;
		getOwnershipTitle: (item: Item) => string;
		getUserItemQuantity: (itemId: number) => number;
		getUserItemHours: (itemId: number) => number;
		openItemModal: (item: Item) => void;
		addToCart: (item: Item) => void;
		updateCartUnits: (itemId: number, delta: number) => void;
		maxUnits: number;
		maxHours: number;
	}>(),
	{
		isBlackMarket: false,
		isDisabled: false,
	},
);

const emit = defineEmits<{
	clickAddToCart: [item: Item];
	clickUpdateUnits: [itemId: number, delta: number];
}>();

function handleAddToCart(item: Item) {
	props.addToCart(item);
	emit("clickAddToCart", item);
}

function handleUpdateUnits(itemId: number, delta: number) {
	props.updateCartUnits(itemId, delta);
	emit("clickUpdateUnits", itemId, delta);
}
</script>

<template>
	<div
		class="shop-item-card"
		:class="{
			'shop-item-card--black-market': isBlackMarket,
			'shop-item-card--disabled': isDisabled
		}"
	>
		<span
			:data-popover-text="`Mais informações de ${item.name}`"
			data-popover-direction="bottom"
		>
			<LazyNuxtImg
				class="shop-item-card__image"
				:src="getItemImage(item.id, getUserItemSkin(item.id))"
				:alt="`Mais informações de ${item.name}`"
				width="56"
				tabindex="0"
				@click="openItemModal(item)"
				@keydown.enter.prevent="openItemModal(item)"
				@keydown.space.prevent="openItemModal(item)"
			/>
		</span>
		<div class="shop-item-card__info">
			<h3 class="shop-item-card__name">{{ item.name }}</h3>

			<div
				class="shop-item-card__stats"
				v-if="item.type === ItemType.Weapon"
			>
				<span class="shop-item-card__stat">
					<NuxtImg
						:src="imagePaths.attributes.attack"
						width="20"
						alt=""
					/>
					{{ item.attack }}
				</span>
				<span class="shop-item-card__stat">
					<NuxtImg
						:src="imagePaths.attributes.defense"
						width="20"
						alt=""
					/>
					{{ item.defense }}
				</span>
			</div>

			<div
				class="shop-item-card__stats"
				v-else-if="item.type !== ItemType.Accessory"
			>
				<span class="shop-item-card__stat">
					<NuxtImg
						:src="imagePaths.attributes.attack"
						width="20"
						alt=""
					/>
					+{{ item.moreAttack }}
				</span>
				<span class="shop-item-card__stat">
					<NuxtImg
						:src="imagePaths.attributes.defense"
						width="20"
						alt=""
					/>
					+{{ item.moreDefense }}
				</span>
			</div>

			<div
				class="shop-item-card__stats"
				v-else-if="item.extra"
			>
				<span class="shop-item-card__stat">{{ item.extra }}</span>
			</div>

			<div class="shop-item-card__meta">
				<SegmentedProgressBar
					:value="item.type === ItemType.Consumable ? getUserItemQuantity(item.id) : getUserItemHours(item.id)"
					:max="item.type === ItemType.Consumable ? maxUnits : maxHours"
					:segments="item.type === ItemType.Consumable ? 20 : 5"
					:label="getOwnershipLabel(item)"
					:popover="getOwnershipTitle(item)"
				/>
				<span class="shop-item-card__price">
					Cr$
					<span class="shop-item-card__price--value">
						{{ formatPlain(item.price) }}
					</span>
				</span>
			</div>

			<div class="shop-item-card__actions">
				<BaseButton
					v-if="!cardState.inCart"
					type="button"
					variant="secondary"
					size="sm"
					:disabled="cardState.isDisabled"
					:aria-label="cardState.addButtonAriaLabel"
					@click="handleAddToCart(item)"
				>
					<ShopIcon
						v-if="cardState.disabledReason === null"
						variant="solid"
						:size="18"
					/>
					{{ cardState.addButtonLabel }}
				</BaseButton>

				<div
					v-else
					class="shop-item-card__quantity"
				>
					<button
						type="button"
						class="shop-item-card__qty-btn"
						aria-label="Remover unidade"
						@click="handleUpdateUnits(item.id, -1)"
					>
						<Minus :size="14" />
					</button>
					<span class="shop-item-card__qty-value">
						{{ cardState.cartUnits }}
					</span>
					<button
						type="button"
						class="shop-item-card__qty-btn"
						:disabled="cardState.plusButtonDisabled"
						aria-label="Adicionar unidade"
						@click="handleUpdateUnits(item.id, 1)"
					>
						<Plus :size="14" />
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.shop-item-card {
	padding: 0.875rem;
	background-color: $bg-card;
	border: 1px solid $border-card;
	border-radius: $radius-sm;
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
	position: relative;
	overflow: hidden;

	&--black-market {
		$color-black-market: #5136b3;
		border-color: $color-black-market;
		background: linear-gradient(115deg, $bg-card, color-mix(in lab, $bg-card 100%, $color-black-market 40%));

		.shop-item-card__price {
			color: color-mix(in lab, $text-primary 100%, $color-black-market 70%);
		}
	}

	&--disabled {
		opacity: 0.5;

		.shop-item-card__image {
			filter: grayscale(0.5);
		}
	}

	&--skeleton {
		pointer-events: none;
		border: none;
	}

	&__image {
		width: 100%;
		height: 6rem;
		flex: 0 0 6rem;
		object-fit: contain;
		padding: $spacing-sm;
		border-radius: $radius-sm;
		border: 1px solid transparent;
		transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
		cursor: pointer;

		&:hover,
		&:focus-visible {
			background-color: $bg-input;
			border-color: $border-card;
			transform: translateY(-2px);
			outline: none;
		}
	}

	&__info {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		flex-grow: 1;
		min-width: 0;
	}

	&__name {
		font-size: 0.9375rem;
		font-weight: 600;
		color: $text-primary;
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow: hidden;
		max-height: 1lh;
	}

	&__stats {
		display: flex;
		flex-wrap: wrap;
		gap: $spacing-xs;
		font-size: 0.75rem;
		font-weight: 600;
	}

	&__stat {
		color: $color-attribute;
		display: flex;
		align-items: center;
	}

	&__meta {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		font-size: 0.75rem;
		gap: $spacing-xs;
	}

	&__price {
		font-weight: 700;
		color: $color-brand;

		&--value {
			font-size: 1rem;
		}
	}

	&__ownership {
		color: $text-secondary;
		font-size: 0.6875rem;
	}

	&__actions {
		margin-top: auto;
		display: flex;
		flex-direction: column;
	}

	&__quantity {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $spacing-xs;
	}

	&__qty-btn {
		width: 1.75rem;
		height: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: $bg-card;
		border: 1px solid $border-subtle;
		border-radius: $radius-sm;
		color: $text-primary;
		cursor: pointer;
		transition: background-color 0.2s ease;

		&:hover {
			background-color: $bg-hover;
		}

		&:disabled {
			opacity: 0.4;
			cursor: not-allowed;
		}
	}

	&__qty-value {
		min-width: 1.25rem;
		text-align: center;
		font-size: 0.8125rem;
		font-weight: 600;
		color: $text-primary;
	}
}

@media (prefers-reduced-motion: reduce) {
	.shop-item-card {
		transition: none !important;
	}
}
</style>
