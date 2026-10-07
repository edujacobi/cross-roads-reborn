<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { ChevronDown, CreditCard, Minus, Plus, ShoppingBasket, X } from "lucide-vue-next";
import { computed, onMounted, onUnmounted, ref } from "vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { useAuth } from "~/composables/useAuth";
import { useItemDetailModal } from "~/composables/useItemDetailModal";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { useToast } from "~/composables/useToast";
import { imagePaths } from "~/constants/imagePaths";
import {
	BuyItemDocument,
	GetBlackMarketOpenDocument,
	GetItemsDocument,
	type GetItemsQuery,
	GetUserInventoryDocument,
	GetUserProfileDocument
} from "~/graphql/generated";
import { BundleId, ItemId } from "../../src/core/types/Ids";
import { ItemType } from "../../src/core/types/ItemType";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Loja",
});

type Item = GetItemsQuery["items"][number];

const { user: authUser } = useAuth();
const { format: formatMoney, formatPlain } = useMoneyFormat();
const { showToast } = useToast();
const { openItemModal } = useItemDetailModal();

const { result: itemsResult, loading: itemsLoading, error: itemsError } = useQuery(GetItemsDocument);
const allShopItems = computed(() => {
	const all = itemsResult.value?.items ?? [];
	return all.filter((item) => item.shop || item.blackMarket);
});

const { result: blackMarketResult, loading: blackMarketLoading } = useQuery(GetBlackMarketOpenDocument);
const blackMarketOpen = computed(() => blackMarketResult.value?.blackMarketOpen ?? false);

const shopItems = computed(() => allShopItems.value.toSorted((a, b) => {
		if (a.blackMarket && !b.blackMarket) return 1;
		if (!a.blackMarket && b.blackMarket) return -1;
		return a.id - b.id;
	}
));

const userId = computed(() => authUser.value?.userId ?? "");
const { result: profileResult, loading: profileLoading, refetch: refetchProfile } = useQuery(
	GetUserProfileDocument,
	() => ({ id: userId.value }),
	{
		enabled: !!userId.value,
	},
);
const userMoney = computed(() => profileResult.value?.user?.money ?? 0);

const { result: inventoryResult, loading: inventoryLoading, refetch: refetchInventory } = useQuery(
	GetUserInventoryDocument,
	() => ({ id: userId.value }),
	{
		enabled: !!userId.value,
	},
);
const userItems = computed(() => inventoryResult.value?.user?.items ?? []);

const { mutate: buyItem, loading: buying } = useMutation(BuyItemDocument);

interface CartItem {
	itemId: number;
	name: string;
	price: number;
	units: number;
	type: number;
	imageUrl: string;
}

const cartItems = ref<Map<number, CartItem>>(new Map());
const cartOpen = ref(false);
const lastFocusedElement = ref<HTMLElement | null>(null);

const cartItemCount = computed(() => {
	let count = 0;
	for (const [, item] of cartItems.value) {
		count += item.units;
	}
	return count;
});

const cartTotal = computed(() => {
	let total = 0;
	for (const [, item] of cartItems.value) {
		total += item.price * item.units;
	}
	return total;
});

const canAfford = computed(() => cartItemCount.value > 0 && cartTotal.value <= userMoney.value && !buying.value);

function getUserItemHours(itemId: number): number {
	const ui = userItems.value.find((i) => i.id === itemId);
	if (!ui?.remainingTime) return 0;
	const remaining = new Date(ui.remainingTime);
	const now = new Date();
	const diffMs = remaining.getTime() - now.getTime();
	return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
}

function getUserItemQuantity(itemId: number): number {
	const ui = userItems.value.find((i) => i.id === itemId);
	return ui?.quantity ?? 0;
}

const MAX_UNITS = 20;
const MAX_HOURS = 360;
const HOURS_PER_BUY = 72;

function getMaxUnits(itemId: number, itemType: ItemType): number {
	if (itemType === ItemType.Consumable) {
		const currentQty = getUserItemQuantity(itemId);
		const remaining = MAX_UNITS - currentQty;
		return Math.max(0, remaining);
	}
	else {
		const currentHours = getUserItemHours(itemId);
		if (currentHours >= MAX_HOURS) return 0;
		const remainingHours = MAX_HOURS - currentHours;
		return Math.floor(remainingHours / HOURS_PER_BUY);
	}
}

function getOwnershipText(item: Item): string {
	if (item.type === ItemType.Consumable) {
		const qty = getUserItemQuantity(item.id);
		if (qty > 0) return `${qty}/${MAX_UNITS}`;
		return `0/${MAX_UNITS}`;
	}
	else {
		const hours = getUserItemHours(item.id);
		return `${hours}h/${MAX_HOURS}h`;
	}
}

function getItemImage(itemId: number, bundleId: number = 0): string {
	let filename = `${itemId}_${ItemId[itemId]}.png`;
	if (bundleId !== 0) filename = `${itemId}_${ItemId[itemId]}_${BundleId[bundleId]}.png`;
	return `/images/items/${filename}`;
}

function getUserItemSkin(itemId: number): number {
	const ui = userItems.value.find((i) => i.id === itemId);
	return ui?.skin ?? 0;
}

interface ItemCardState {
	inCart: boolean;
	cartUnits: number;
	maxUnits: number;
	isDisabled: boolean;
	disabledReason: "limit" | "blackmarket" | null;
	addButtonLabel: string;
	addButtonAriaLabel: string;
	plusButtonDisabled: boolean;
}

function getItemCardState(item: Item): ItemCardState {
	const inCart = cartItems.value.has(item.id);
	const cartUnits = cartItems.value.get(item.id)?.units ?? 0;
	const maxUnits = getMaxUnits(item.id, item.type);
	const blackMarketClosed = item.blackMarket && !blackMarketOpen.value;
	const isDisabled = maxUnits <= 0 || blackMarketClosed;

	let disabledReason: "limit" | "blackmarket" | null = null;
	let addButtonLabel = "Adicionar";
	let addButtonAriaLabel = `Adicionar ${item.name} ao carrinho`;

	if (blackMarketClosed) {
		disabledReason = "blackmarket";
		addButtonLabel = "Indisponível";
		addButtonAriaLabel = "Mercado Negro fechado";
	}
	else if (maxUnits <= 0) {
		disabledReason = "limit";
		addButtonLabel = "Limite";
		addButtonAriaLabel = "Limite atingido";
	}

	const inCartMax = Math.min(maxUnits, 10);
	const plusButtonDisabled = cartUnits >= inCartMax;

	return {
		inCart,
		cartUnits,
		maxUnits,
		isDisabled,
		disabledReason,
		addButtonLabel,
		addButtonAriaLabel,
		plusButtonDisabled,
	};
}

function addToCart(item: Item) {
	const maxUnits = getMaxUnits(item.id, item.type);
	if (maxUnits <= 0) return;

	const current = cartItems.value.get(item.id);
	if (current) {
		const newUnits = Math.min(current.units + 1, maxUnits);
		cartItems.value.set(item.id, { ...current, units: newUnits });
	}
	else {
		cartItems.value.set(item.id, {
			itemId: item.id,
			name: item.name,
			price: item.price,
			units: 1,
			type: item.type,
			imageUrl: getItemImage(item.id, getUserItemSkin(item.id))
		});
	}
}

function removeFromCart(itemId: number) {
	cartItems.value.delete(itemId);
}

function updateCartUnits(itemId: number, delta: number) {
	const cartItem = cartItems.value.get(itemId);
	if (!cartItem) return;

	const shopItem = shopItems.value.find((i) => i.id === itemId);
	if (!shopItem) return;

	const maxUnits = getMaxUnits(shopItem.id, shopItem.type);
	const inCartMax = Math.min(maxUnits, 10);
	const newUnits = Math.max(0, cartItem.units + delta);
	const clampedUnits = Math.min(newUnits, inCartMax);

	if (clampedUnits <= 0) {
		removeFromCart(itemId);
	}
	else {
		cartItems.value.set(itemId, { ...cartItem, units: clampedUnits });
	}
}

function clearCart() {
	cartItems.value.clear();
}

async function confirmPurchase() {
	if (cartItemCount.value === 0 || cartTotal.value > userMoney.value) return;

	const cartArray = Array.from(cartItems.value.values());
	let successCount = 0;
	let failMessages: string[] = [];
	const purchasedItemIds = new Set<number>();

	for (const cartItem of cartArray) {
		try {
			const res = await buyItem({
				itemId: cartItem.itemId,
				units: cartItem.units,
			});

			if (res?.data?.buyItem?.success) {
				successCount += cartItem.units;
				purchasedItemIds.add(cartItem.itemId);
			}
			else {
				failMessages.push(res?.data?.buyItem?.message ?? "Erro desconhecido");
			}
		}
		catch (e: unknown) {
			failMessages.push(getErrorMessage(e));
		}
	}

	if (successCount > 0) {
		for (const itemId of purchasedItemIds) {
			removeFromCart(itemId);
		}
		await refetchProfile();
		await refetchInventory();

		if (failMessages.length > 0) {
			showToast({
				variant: "warning",
				text: `Compra parcial: ${successCount} unidade(s) comprada(s). ${failMessages.join(" ")}`,
			});
		}
		else {
			showToast({
				variant: "success",
				text: `Compra realizada! ${successCount} unidade(s) adquirida(s).`,
			});
		}
	}
	else {
		showToast({
			variant: "error",
			text: failMessages.join(" ") || "Falha na compra.",
		});
	}
}

function toggleCart() {
	if (cartOpen.value) {
		cartOpen.value = false;
		if (lastFocusedElement.value) {
			lastFocusedElement.value.focus();
		}
	}
	else {
		lastFocusedElement.value = document.activeElement as HTMLElement | null;
		cartOpen.value = true;
	}
}

function handleKeyDown(e: KeyboardEvent) {
	if (e.key === "Escape" && cartOpen.value) {
		toggleCart();
	}
}

function getErrorMessage(error: unknown): string {
	const hasMessage = error && typeof error === "object" && "message" in error;
	return hasMessage ? String(error.message) : "Erro inesperado.";
}

onMounted(() => {
	window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
	window.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
	<main class="shop-page">
		<PageTitle
			:title="blackMarketOpen ? 'Mercado Negro' : 'Loja'"
			subtitle="Navegue pelos itens disponíveis e adicione ao carrinho para comprar."
		/>

		<div
			v-if="itemsLoading || profileLoading || inventoryLoading || blackMarketLoading"
			class="shop-page__state"
		>
			<p>Carregando loja...</p>
		</div>

		<div
			v-else-if="itemsError"
			class="shop-page__state shop-page__state--error"
		>
			<p>Erro ao carregar os itens: {{ itemsError.message }}</p>
		</div>

		<div
			v-else
			class="shop-page__layout"
		>
			<section class="shop-page__items">
				<div class="shop-page__grid">
					<div
						v-for="item in shopItems"
						:key="item.id"
						class="shop-item-card"
						:class="{
							'shop-item-card--black-market': item.blackMarket,
							'shop-item-card--disabled': item.blackMarket && !blackMarketOpen
						}"
					>
						<LazyNuxtImg
							class="shop-item-card__image"
							:src="getItemImage(item.id, getUserItemSkin(item.id))"
							:alt="`Mais informações de ${item.name}`"
							:title="`Mais informações de ${item.name}`"
							width="56"
							@click="openItemModal(item)"
						/>
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
								<span class="shop-item-card__ownership">{{ getOwnershipText(item) }}</span>
								<span class="shop-item-card__price">
									Cr$
									<span class="shop-item-card__price--value">
										{{ formatPlain(item.price) }}
									</span>
								</span>
							</div>

 						<div class="shop-item-card__actions">
 							<BaseButton
 								v-if="!getItemCardState(item).inCart"
 								type="button"
 								variant="secondary"
 								size="sm"
 								:disabled="getItemCardState(item).isDisabled"
 								:aria-label="getItemCardState(item).addButtonAriaLabel"
 								@click="addToCart(item)"
 								:title="item.blackMarket && !blackMarketOpen ? 'O Mercado Negro é aberto aos domingos, sábados e sextas após as 18h' : null"
 							>
 								<ShoppingBasket
 									v-if="getItemCardState(item).disabledReason === null"
 									:size="16"
 								/>
 								{{ getItemCardState(item).addButtonLabel }}
 							</BaseButton>

 							<div
 								v-else-if="!(item.blackMarket && !blackMarketOpen)"
 								class="shop-item-card__quantity"
 							>
 								<button
 									type="button"
 									class="shop-item-card__qty-btn"
 									aria-label="Remover unidade"
 									@click="updateCartUnits(item.id, -1)"
 								>
 									<Minus :size="14" />
 								</button>
 								<span class="shop-item-card__qty-value">{{ getItemCardState(item).cartUnits }}</span>
 								<button
 									type="button"
 									class="shop-item-card__qty-btn"
 									:disabled="getItemCardState(item).plusButtonDisabled"
 									aria-label="Adicionar unidade"
 									@click="updateCartUnits(item.id, 1)"
 								>
 									<Plus :size="14" />
 								</button>
 							</div>
 						</div>
						</div>
					</div>
				</div>
			</section>

			<aside
				class="shop-page__cart"
				:class="{ 'shop-page__cart--open': cartOpen }"
				aria-label="Carrinho de compras"
			>
				<div class="shop-page__cart-header">
					<div class="shop-page__cart-title">
						<ShoppingBasket :size="20" />
						<h2>Carrinho</h2>
						<span
							v-if="cartItemCount > 0"
							class="shop-page__cart-badge"
						>
							{{ cartItemCount }}
						</span>
					</div>
					<button
						type="button"
						class="shop-page__cart-close"
						aria-label="Fechar carrinho"
						@click="toggleCart"
					>
						<ChevronDown :size="20" />
					</button>
				</div>

				<div class="shop-page__cart-body">
					<div
						v-if="cartItemCount === 0"
						class="shop-page__cart-empty"
					>
						<p>Seu carrinho está vazio.</p>
					</div>

					<ul
						v-else
						class="shop-page__cart-list"
					>
						<li
							v-for="[, item] in cartItems"
							:key="item.itemId"
							class="shop-page__cart-item"
						>
							<div class="shop-page__cart-item-info">
								<span class="shop-page__cart-item-name">
									<LazyNuxtImg
										:src="item.imageUrl"
										width="20"
										height="20"
										alt=""
									/>
									{{ item.name }}
								</span>
								<span class="shop-page__cart-item-price">{{ formatMoney(item.price * item.units) }}</span>
							</div>
							<div class="shop-page__cart-item-controls">
								<div class="shop-page__cart-quantity">
									<button
										type="button"
										class="shop-page__cart-qty-btn"
										aria-label="Remover unidade"
										@click="updateCartUnits(item.itemId, -1)"
									>
										<Minus :size="14" />
									</button>
									<span class="shop-page__cart-qty-value">{{ item.units }}</span>
									<button
										type="button"
										class="shop-page__cart-qty-btn"
										aria-label="Adicionar unidade"
										@click="updateCartUnits(item.itemId, 1)"
										:disabled="item.units >= Math.min(getMaxUnits(item.itemId, item.type), 10)"
									>
										<Plus :size="14" />
									</button>
								</div>
								<button
									type="button"
									class="shop-page__cart-remove"
									aria-label="Remover {{ item.name }} do carrinho"
									@click="removeFromCart(item.itemId)"
								>
									<X :size="16" />
								</button>
							</div>
						</li>
					</ul>
				</div>

				<div class="shop-page__cart-footer">
					<div
						class="shop-page__cart-total"
						role="status"
						aria-live="polite"
					>
						<span class="shop-page__cart-total-label">Total</span>
						<span class="shop-page__cart-total-value" :class="{'insufficient': !canAfford && cartItemCount > 0}">{{ formatMoney(cartTotal) }}</span>
					</div>

					<div class="shop-page__cart-money">
						<span class="shop-page__cart-money-label">Seu saldo</span>
						<span class="shop-page__cart-money-value">{{ formatMoney(userMoney) }}</span>
					</div>

					<div class="shop-page__confirm-btn">
						<BaseButton
							type="button"
							variant="primary"
							size="lg"
							:disabled="!canAfford"
							:aria-label="cartItemCount === 0 ? 'Carrinho vazio' : !canAfford ? 'Saldo insuficiente' : 'Confirmar compra'"
							@click="confirmPurchase"
						>
							<CreditCard :size="18" />
							{{ buying ? "Comprando..." : "Confirmar compra" }}
						</BaseButton>
					</div>

					<BaseButton
						variant="ghost"
						size="sm"
						v-if="cartItemCount > 0"
						aria-label="Limpar carrinho"
						@click="clearCart"
					>
						Limpar carrinho
					</BaseButton>
				</div>
			</aside>

			<button
				type="button"
				class="shop-page__cart-toggle"
				:aria-label="cartOpen ? 'Fechar carrinho' : 'Abrir carrinho'"
				:aria-expanded="cartOpen"
				@click="toggleCart"
			>
				<ShoppingBasket :size="24" />
				<span
					v-if="cartItemCount > 0"
					class="shop-page__cart-toggle-badge"
				>
					{{ cartItemCount }}
				</span>
			</button>
		</div>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "sass:color";
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.shop-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;

	&__state {
		@include flex-center;
		padding: 3.75rem 1.25rem;
		color: $text-secondary;

		&--error {
			color: #f04d48;
		}
	}

	&__layout {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: $spacing-lg;
		position: relative;
		container-name: shop;
		container-type: inline-size;

		@media (max-width: 1024px) {
			grid-template-columns: 1fr;
		}
	}

	&__items {
		min-width: 0;
	}

	&__grid {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: $spacing-sm;

		@container shop (width < 1300px) {
			grid-template-columns: repeat(5, minmax(0, 1fr));
		}

		@container shop (width < 1100px) {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}

		@container shop (width < 900px) {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		@container shop (width < 500px) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	&__cart {
		position: sticky;
		top: $spacing-lg;
		max-height: calc(100dvh - 200px);
		display: flex;
		flex-direction: column;
		background-color: $bg-card;
		border: 1px solid $border-card;
		border-radius: $radius-md;
		overflow: hidden;

		@media (max-width: 1024px) {
			position: fixed;
			top: 30dvh;
			left: calc(50% - 160px);
			bottom: 0;
			width: 320px;
			max-width: 85vw;
			max-height: 100vh;
			border-radius: $radius-md $radius-md 0 0 ;
			transform: translateY(100%);
			transition: transform 0.2s ease;
			z-index: 100;
			box-shadow: $shadow-lg;

			&--open {
				transform: translateY(0);
			}
		}

		&-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: $spacing-md;
			border-bottom: 1px solid $border-card;
		}

		&-title {
			display: flex;
			align-items: center;
			gap: $spacing-sm;
			font-size: 1rem;
			font-weight: 600;
			color: $text-primary;

			h2 {
				margin: 0;
				font-size: inherit;
				font-weight: inherit;
			}
		}

		&-badge {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			min-width: 1.25rem;
			height: 1.25rem;
			//background-color: color-mix(in lab, $bg-card 100%, $color-danger 50%);
			//color: $color-danger;
			//border: $color-danger 1px solid;
			//border-radius: $radius-xs;
			background-color:$color-danger;
			color: $text-primary;
			border-radius: $radius-full;
			font-size: 0.7rem;
			font-weight: 700;
			font-variant: tabular-nums;
		}

		&-close {
			display: none;
			background: none;
			border: none;
			color: $text-secondary;
			cursor: pointer;
			padding: $spacing-xs;
			border-radius: $radius-sm;
			transition: color 0.2s ease, background-color 0.2s ease;

			&:hover {
				color: $text-primary;
				background-color: $bg-input;
			}

			@media (max-width: 1024px) {
				display: block;
			}
		}

		&-body {
			flex: 1;
			overflow-y: auto;
			padding: $spacing-md;
		}

		&-empty {
			text-align: center;
			color: $text-secondary;
			font-size: 0.875rem;
			padding: $spacing-lg 0;
		}

		&-list {
			list-style: none;
			padding: 0;
			margin: 0;
			display: flex;
			flex-direction: column;
			//gap: $spacing-sm;
		}

		&-item {
			display: flex;
			flex-direction: column;
			gap: $spacing-xs;
			padding: $spacing-sm;
			//background-color: $bg-input;
			//border-radius: $radius-sm;
			border-bottom: 1px solid $border-subtle;
			//&:after {
			//	content: '';
			//	margin-top: $spacing-sm;
			//	display: block;
			//	height: 1px;
			//	margin-bottom: $spacing-sm;
			//	background-color: $border-subtle;
			//}
		}

		&-item-info {
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		&-item-name {
			display: flex;
			gap: $spacing-xs;
			font-size: 0.875rem;
			font-weight: 600;
			color: $text-primary;
		}

		&-item-price {
			font-size: 0.8125rem;
			font-weight: 600;
			color: $color-brand;
		}

		&-item-controls {
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		&-quantity {
			display: flex;
			align-items: center;
			gap: $spacing-xs;
		}

		&-qty-btn {
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

		&-qty-value {
			min-width: 1.5rem;
			text-align: center;
			font-size: 0.875rem;
			font-weight: 600;
			color: $text-primary;
		}

		&-remove {
			background: none;
			border: none;
			color: $text-secondary;
			cursor: pointer;
			padding: $spacing-xs;
			border-radius: $radius-sm;
			transition: color 0.2s ease;

			&:hover {
				color: #f04d48;
			}
		}

		&-footer {
			padding: $spacing-md;
			border-top: 1px solid $border-subtle;
			display: flex;
			flex-direction: column;
			gap: $spacing-sm;
		}

		&-total {
			display: flex;
			justify-content: space-between;
			align-items: center;
			font-size: 1rem;
			font-weight: 700;
		}

		&-total-label {
			color: $text-primary;
		}

		&-total-value {
			font-size: 1.125rem;
			color: $color-brand;

			&.insufficient {
				color: $color-danger;
			}
		}

		&-money {
			display: flex;
			justify-content: space-between;
			align-items: center;
			font-size: 0.8125rem;
		}

		&-money-label {
			color: $text-secondary;
		}

		&-money-value {
			color: $text-primary;
			font-weight: 600;
		}

		&-clear {
			background: none;
			border: none;
			color: $text-secondary;
			cursor: pointer;
			font-size: 0.8125rem;
			text-align: center;
			padding: $spacing-xs;
			transition: color 0.2s ease;

			&:hover {
				color: #f04d48;
			}
		}
	}

	&__confirm-btn {
		width: 100%;

		.base-button {
			width: 100%;
		}
	}

	&__cart-toggle {
		@include flex-center;
		display: none;
		position: fixed;
		bottom: 1rem;
		left: calc(50% - 2rem);
		width: 4rem;
		height: 4rem;
		background-color: $bg-sidebar;
		color: $text-primary;
		border: 1px solid $border-subtle;
		border-radius: $radius-full;
		cursor: pointer;
		box-shadow: $shadow-lg;
		z-index: 2;
		transition: transform 0.2s ease;

		&:hover {
			transform: scale(1.05);
		}

		@media (max-width: 1024px) {
			display: flex;
		}

		&-badge {
			position: absolute;
			top: -0.25rem;
			right: -0.25rem;
			min-width: 1.5rem;
			height: 1.5rem;
			display: flex;
			align-items: center;
			justify-content: center;
			background-color: #f04d48;
			color: white;
			border-radius: 999px;
			font-size: 0.75rem;
			font-weight: 700;
		}
	}
}

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
		opacity: 0.4;
		pointer-events: none;

		.shop-item-card__image {
			filter: grayscale(1);
		}
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
		gap: $spacing-xs;
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
	.shop-page__cart,
	.shop-item-card,
	.shop-page__cart-toggle {
		transition: none !important;
	}
}
</style>
