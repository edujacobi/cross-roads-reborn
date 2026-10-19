<script
	setup
	lang="ts"
>
import { useApolloClient, useMutation, useQuery } from "@vue/apollo-composable";
import { differenceInHours, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Maximize, Minimize, Package, Paintbrush } from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import RefreshButton from "~/components/ui/RefreshButton.vue";
import { useItemDetailModal } from "~/composables/useItemDetailModal";
import { useToast } from "~/composables/useToast";
import { imagePaths } from "~/constants/imagePaths";
import { localStorageKeys } from "~/constants/localStorageKeys";
import {
	GetMySkinBundlesDocument,
	type GetMySkinBundlesQuery,
	GetUserInventoryDocument,
	type GetUserInventoryQuery,
	SetOwnBundleSkinDocument,
} from "~/graphql/generated";
import { BundleId, ItemId } from "../../../src/core/types/Ids";
import { ItemType } from "../../../src/core/types/ItemType";

const props = defineProps<{ userId: string }>();
const auth = useAuth();
const canChangeSkins = computed(() => auth.user.value?.userId === props.userId);
const { openItemModal } = useItemDetailModal();
const { client } = useApolloClient();
const { showToast } = useToast();
const skinBundleDialogOpen = ref(false);
const pendingBundle = ref<GetMySkinBundlesQuery["mySkinBundles"][number] | null>(null);

const { result, loading, error, refetch } = useQuery(GetUserInventoryDocument, () => ({ id: props.userId }), {
	fetchPolicy: "cache-and-network",
});
const items = computed(() => result.value?.user?.items ?? []);
const {
	result: skinBundlesResult,
	loading: skinBundlesLoading,
	error: skinBundlesError,
} = useQuery(
	GetMySkinBundlesDocument,
	{},
	{
		enabled: skinBundleDialogOpen,
		fetchPolicy: "cache-and-network",
	},
);
const skinBundles = computed(() => skinBundlesResult.value?.mySkinBundles ?? []);
const { mutate: setOwnBundleSkin, loading: applyingBundle } = useMutation(SetOwnBundleSkinDocument);

const isCompactInventory = ref(false);
const inventoryStorage = useLocalStorage(localStorageKeys.compactInventory);

onMounted(() => {
	isCompactInventory.value = inventoryStorage.get() === "true";
});

function toggleCompactInventory() {
	isCompactInventory.value = !isCompactInventory.value;
	inventoryStorage.set(String(isCompactInventory.value));
}

function openSkinBundleDialog() {
	pendingBundle.value = null;
	skinBundleDialogOpen.value = true;
}

watch(canChangeSkins, (canChange) => {
	if (!canChange) handleSkinBundleDialogOpen(false);
});

function requestBundleActivation(bundle: GetMySkinBundlesQuery["mySkinBundles"][number]) {
	pendingBundle.value = bundle;
	skinBundleDialogOpen.value = false;
}

function handleSkinBundleDialogOpen(open: boolean) {
	skinBundleDialogOpen.value = open;
}

function handleConfirmationOpen(open: boolean) {
	if (!open) pendingBundle.value = null;
}

function getErrorMessage(caughtError: unknown) {
	return caughtError && typeof caughtError === "object" && "message" in caughtError
		? String(caughtError.message)
		: "Ocorreu um erro inesperado.";
}

async function confirmBundleActivation() {
	const bundle = pendingBundle.value;
	if (!bundle) return;

	try {
		const response = await setOwnBundleSkin({ bundleId: bundle.id });
		const bundleResult = response?.data?.setOwnBundleSkin;
		if (!bundleResult?.success) {
			showToast({ variant: "error", text: bundleResult?.message ?? "Não foi possível aplicar o pacote de skins." });
			return;
		}

		pendingBundle.value = null;
		skinBundleDialogOpen.value = false;
		showToast({ variant: "success", text: bundleResult.message });
		try {
			await client.refetchQueries({ include: ["GetUserInventory"] });
		} catch (caughtError: unknown) {
			showToast({
				variant: "warning",
				text: `Pacote aplicado, mas o inventário não foi atualizado: ${getErrorMessage(caughtError)}`,
			});
		}
	} catch (caughtError: unknown) {
		showToast({ variant: "error", text: getErrorMessage(caughtError) });
	}
}

function getItemStatusClasses(item: NonNullable<GetUserInventoryQuery["user"]>["items"][number]) {
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
				v-if="canChangeSkins"
				variant="ghost"
				size="sm"
				@click="openSkinBundleDialog"
			>
				<Paintbrush
					:size="16"
					aria-hidden="true"
				/>
				Alterar skins
			</BaseButton>
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
			<RefreshButton
				@refresh="() => refetch()"
				:loading="loading"
				aria-label="Atualizar inventário"
			/>
		</template>

		<BaseModal
			:open="skinBundleDialogOpen"
			title="Alterar skins por pacote"
			description="Escolha um pacote adquirido para aplicar suas skins a todos os itens correspondentes."
			@update:open="handleSkinBundleDialogOpen"
		>
			<p
				v-if="skinBundlesLoading"
				class="user-inventory__skin-state"
				role="status"
			>
				Carregando seus pacotes de skins...
			</p>
			<p
				v-else-if="skinBundlesError"
				class="user-inventory__skin-state"
				role="alert"
			>
				Não foi possível carregar seus pacotes: {{ skinBundlesError.message }}
			</p>
			<p
				v-else-if="skinBundles.length === 0"
				class="user-inventory__skin-state"
			>
				Você ainda não possui pacotes de skins.
			</p>
			<div
				v-else
				class="user-inventory__skin-bundles"
			>
				<article
					v-for="bundle in skinBundles"
					:key="bundle.id"
					class="user-inventory__skin-bundle"
				>
					<header>
						<h3>{{ bundle.name }}</h3>
						<p>{{ bundle.skins.length }} {{ bundle.skins.length === 1 ? "item" : "itens" }}</p>
					</header>
					<ul
						class="user-inventory__skin-preview-list"
						:aria-label="`Skins incluídas no pacote ${bundle.name}`"
					>
						<li
							v-for="skin in bundle.skins"
							:key="skin.itemId"
						>
							<NuxtImg
								:src="skin.imagePath"
								:alt="skin.name"
								width="52"
								height="52"
								loading="lazy"
							/>
							<span>{{ skin.name }}</span>
						</li>
					</ul>
					<BaseButton
						variant="secondary"
						:disabled="applyingBundle"
						@click="requestBundleActivation(bundle)"
					>
						Aplicar pacote
					</BaseButton>
				</article>
			</div>
		</BaseModal>

		<BaseModal
			:open="pendingBundle !== null"
			title="Confirmar troca de skin"
			description="As skins deste pacote serão ativadas para todos os itens correspondentes."
			@update:open="handleConfirmationOpen"
		>
			<p v-if="pendingBundle">Aplicar o pacote {{ pendingBundle.name }}?</p>
			<template #footer>
				<BaseButton
					variant="ghost"
					:disabled="applyingBundle"
					@click="pendingBundle = null; skinBundleDialogOpen = true"
				>
					Cancelar
				</BaseButton>
				<BaseButton
					:disabled="applyingBundle"
					@click="confirmBundleActivation"
				>
					{{ applyingBundle ? "Aplicando..." : "Confirmar" }}
				</BaseButton>
			</template>
		</BaseModal>

		<div
			v-if="error && items.length === 0"
			class="user-inventory__empty"
			role="alert"
		>
			<p>Não foi possível carregar o inventário.</p>
		</div>
		<div
			v-else-if="loading && items.length === 0"
			class="user-inventory__empty"
			role="status"
			aria-label="Carregando inventário"
		>
			<div class="user-inventory__skeleton">
				<BaseSkeleton
					v-for="index in 4"
					:key="index"
					height="6rem"
				/>
			</div>
		</div>
		<div
			v-else-if="items.length === 0"
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
				:data-popover-text="isCompactInventory ? item.name : undefined"
				data-popover-direction="top"
			>
				<button
					type="button"
					class="user-inventory__item"
					:class="{ 'user-inventory__item--compact': isCompactInventory }"
					@click="openItemModal(item, props.userId)"
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
				</button>
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
@use "sass:color";

.user-inventory {
	&__empty {
		@include flex-center;
		flex-direction: column;
		gap: $spacing-sm;
		padding: $spacing-lg;
		color: $text-muted;
		font-size: $font-size-14;
	}

	&__skeleton {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: $spacing-sm;
		width: 100%;

		@media (max-width: 1024px) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		@media (max-width: 540px) {
			grid-template-columns: 1fr;
		}
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
		transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
		cursor: pointer;
		width: 100%;

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

		&:hover,
		&:focus-visible {
			background-color: color.adjust($bg-input, $lightness: 5%);
			border-color:  color.adjust($border-subtle, $lightness: 5%);
			transform: translateY(-2px);
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
		font-size: $font-size-14;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		margin: 0;
	}

	&__skin-state {
		padding: $spacing-md;
		color: $text-secondary;
		text-align: center;
	}

	&__skin-bundles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
		gap: $spacing-md;
	}

	&__skin-bundle {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: $spacing-md;
		padding: $spacing-md;
		border: 1px solid $border-card;
		border-radius: $radius-md;
		background: $bg-card;

		header {
			display: flex;
			align-items: flex-start;
			justify-content: space-between;
			gap: $spacing-sm;

			h3 {
				font-size: $font-size-16;
				font-weight: $font-weight-bold;
			}

			p {
				color: $text-secondary;
				font-size: $font-size-12;
			}
		}

		> .base-button {
			width: 100%;
			margin-top: auto;
		}
	}

	&__skin-preview-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(4.25rem, 1fr));
		gap: $spacing-sm;
		list-style: none;
		margin: 0;
		padding: 0;

		li {
			display: flex;
			min-width: 0;
			flex-direction: column;
			align-items: center;
			gap: $spacing-xs;
			color: $text-secondary;
			font-size: $font-size-12;
			text-align: center;

			img {
				object-fit: contain;
			}
		}
	}

	&__item-quantity {
		font-size: $font-size-12;
		font-weight: $font-weight-semibold;
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
