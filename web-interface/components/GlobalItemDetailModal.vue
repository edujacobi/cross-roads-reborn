<script
	setup
	lang="ts"
>
import { useApolloClient, useMutation, useQuery } from "@vue/apollo-composable";
import { Moon, Sun } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import { useItemDetailModal } from "~/composables/useItemDetailModal";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { useToast } from "~/composables/useToast";
import { imagePaths } from "~/constants/imagePaths";
import { GetItemDocument, GetMySkinBundleIdsDocument, SetOwnItemSkinDocument } from "~/graphql/generated";
import { ItemType } from "../../src/core/types/ItemType";

const route = useRoute();
const auth = useAuth();
const { handleOpenUpdate, closeItemModal, openItemModal } = useItemDetailModal();
const { client } = useApolloClient();
const { showToast } = useToast();

const itemId = computed(() => {
	const queryId = route.query.detailsItemId;
	return queryId === undefined || queryId === "" ? null : Number(queryId);
});
const isModalOpen = computed(() => itemId.value !== null && Number.isInteger(itemId.value));
const isOwnInventoryModal = computed(() => auth.user.value?.userId === String(route.query.detailsItemOwnerId ?? ""));

const { result, loading } = useQuery(
	GetItemDocument,
	() => ({ id: itemId.value }),
	() => ({
		enabled: isModalOpen.value,
		fetchPolicy: "cache-and-network",
	}),
);
const selectedItem = computed(() => (isModalOpen.value ? (result.value?.item ?? null) : null));
const {
	result: ownedSkinBundlesResult,
	loading: ownedSkinBundlesLoading,
	error: ownedSkinBundlesError,
} = useQuery(GetMySkinBundleIdsDocument, {}, () => ({
	enabled: isModalOpen.value && isOwnInventoryModal.value,
	fetchPolicy: "cache-and-network",
}));
const ownedSkinBundleIds = computed(
	() => new Set(ownedSkinBundlesResult.value?.mySkinBundles.map((bundle) => bundle.id) ?? []),
);
const { mutate: setOwnItemSkin, loading: settingSkin } = useMutation(SetOwnItemSkinDocument);
const pendingSkin = ref<{
	bundleId: number;
	bundleName: string;
	imagePath: string;
	itemId: number;
	itemName: string;
	ownerUserId: string;
} | null>(null);

watch(itemId, () => {
	pendingSkin.value = null;
});

function canActivateSkin(bundleId: number) {
	return (
		isOwnInventoryModal.value &&
		!ownedSkinBundlesLoading.value &&
		!ownedSkinBundlesError.value &&
		ownedSkinBundleIds.value.has(bundleId)
	);
}

async function requestSkinActivation(skin: { bundleId: number; bundleName: string; imagePath: string }) {
	const item = selectedItem.value;
	if (!item) return;

	const pendingSelection = {
		...skin,
		itemId: item.id,
		itemName: item.name,
		ownerUserId: String(route.query.detailsItemOwnerId),
	};

	try {
		await closeItemModal();
		pendingSkin.value = pendingSelection;
	} catch (caughtError: unknown) {
		showToast({ variant: "error", text: getErrorMessage(caughtError) });
	}
}

async function cancelSkinConfirmation() {
	const skin = pendingSkin.value;
	pendingSkin.value = null;
	if (!skin) return;

	try {
		await openItemModal({ id: skin.itemId }, skin.ownerUserId);
	} catch (caughtError: unknown) {
		showToast({ variant: "error", text: getErrorMessage(caughtError) });
	}
}

async function handleSkinConfirmationOpen(open: boolean) {
	if (!open) await cancelSkinConfirmation();
}

function getErrorMessage(caughtError: unknown) {
	return caughtError && typeof caughtError === "object" && "message" in caughtError
		? String(caughtError.message)
		: "Ocorreu um erro inesperado.";
}

async function confirmSkinActivation() {
	const skin = pendingSkin.value;
	if (!skin) return;

	try {
		const response = await setOwnItemSkin({ itemId: skin.itemId, bundleId: skin.bundleId });
		const skinResult = response?.data?.setOwnItemSkin;
		if (!skinResult?.success) {
			showToast({ variant: "error", text: skinResult?.message ?? "Não foi possível ativar a skin." });
			return;
		}

		pendingSkin.value = null;
		showToast({ variant: "success", text: skinResult.message });
		try {
			await client.refetchQueries({ include: ["GetUserInventory"] });
		} catch (caughtError: unknown) {
			showToast({
				variant: "warning",
				text: `Skin ativada, mas o inventário não foi atualizado: ${getErrorMessage(caughtError)}`,
			});
		}
	} catch (caughtError: unknown) {
		showToast({ variant: "error", text: getErrorMessage(caughtError) });
	}
}

const typeData: Record<
	number,
	{
		title: string;
		color: string;
	}
> = {
	[ItemType.Weapon]: {
		title: "Armas",
		color: "#ed4245",
	},
	[ItemType.Wearable]: {
		title: "Vestíveis",
		color: "#3498db",
	},
	[ItemType.Accessory]: {
		title: "Acessórios",
		color: "#9b59b6",
	},
	[ItemType.Consumable]: {
		title: "Consumíveis",
		color: "#57f287",
	},
	[ItemType.BeatUp]: {
		title: "Espancamento",
		color: "#ff8C00",
	},
};

const { formatMoney } = useMoneyFormat();
</script>

<template>
	<BaseModal
		:open="isModalOpen"
		title="Detalhes do Item"
		@update:open="handleOpenUpdate"
		@close="closeItemModal"
	>
		<div
			v-if="loading && !selectedItem"
			class="item-modal"
			aria-busy="true"
		>
			<header class="item-modal__header">
				<BaseSkeleton
					width="6rem"
					height="6rem"
				/>
				<div class="item-modal__header-meta">
					<BaseSkeleton
						width="12rem"
						height="1.5rem"
					/>
					<BaseSkeleton
						width="6rem"
						height="1.25rem"
					/>
					<BaseSkeleton width="10rem" />
				</div>
			</header>
			<section
				v-for="section in 3"
				:key="section"
				class="item-modal__section"
			>
				<BaseSkeleton
					width="8rem"
					height="0.85rem"
				/>
				<div class="item-modal__grid">
					<BaseSkeleton height="3.25rem" />
					<BaseSkeleton height="3.25rem" />
				</div>
			</section>
		</div>
		<p
			v-else-if="!selectedItem"
			class="item-tag"
		>
			Item não encontrado
		</p>
		<template v-else>
			<div class="item-modal">
				<header
					class="item-modal__header"
					:style="`--select-item-color: ${typeData[selectedItem.type].color}`"
				>
					<LazyNuxtImg
						class="item-modal__header-image"
						:src="selectedItem.defaultImagePath"
						:alt="selectedItem.name"
						width="80"
					/>
					<div class="item-modal__header-meta">
						<h2>{{ selectedItem.name }}</h2>
						<div class="item-modal__header-stats">
							<p class="item-modal__type-badge">{{ selectedItem.typeName }}</p>
							<span
								v-if="selectedItem.special.day || selectedItem.special.night"
								class="item"
							>
								<template v-if="selectedItem.special.day"><Sun :size="14" /> Somente dia</template>
								<template v-else> <Moon :size="14" />Somente noite</template>
							</span>
						</div>
						<p class="item-modal__header-muted">{{ selectedItem.userCount }} jogadores com este item</p>
					</div>
				</header>

				<template v-if="selectedItem.extra">
					<section class="item-modal__section">
						<h3 class="item-modal__section-title">Bônus</h3>
						<p class="item-tag">{{ selectedItem.extra }}</p>
					</section>
				</template>

				<section class="item-modal__section">
					<h3 class="item-modal__section-title">Estatísticas Base</h3>
					<div class="item-modal__grid">
						<div class="item-modal__stat-box">
							<span class="label">Ataque</span>
							<span class="value value--attr">
								<NuxtImg
									:src="imagePaths.attributes.attack"
									width="24"
									alt=""
								/>
								{{ selectedItem.attack }}
								ATK
							</span>
						</div>
						<div class="item-modal__stat-box">
							<span class="label">Defesa</span>
							<span class="value value--attr">
								<NuxtImg
									:src="imagePaths.attributes.defense"
									width="24"
									alt=""
								/>
								{{ selectedItem.defense }}
								DEF
							</span>
						</div>
					</div>
				</section>

				<section class="item-modal__section">
					<h3 class="item-modal__section-title">Modificadores</h3>
					<div class="item-modal__grid">
						<div class="item-modal__stat-box">
							<span class="label">Modificador de Ataque</span>
							<span class="value value--attr">
								<NuxtImg
									:src="imagePaths.attributes.defense"
									width="24"
									alt=""
								/>
								+{{ selectedItem.moreAttack }}
								ATK
							</span>
						</div>
						<div class="item-modal__stat-box">
							<span class="label">Modificador de Defesa</span>
							<span class="value value--attr">
								<NuxtImg
									:src="imagePaths.attributes.defense"
									width="24"
									alt=""
								/>
								+{{ selectedItem.moreDefense }}
								DEF
							</span>
						</div>
						<div class="item-modal__stat-box">
							<span class="label">Rouba grana</span>
							<span class="value">{{ selectedItem.moneyAttack }} (+{{ selectedItem.moreMoneyATK }})%</span>
						</div>
						<div class="item-modal__stat-box">
							<span class="label">Defende grana</span>
							<span class="value">{{ selectedItem.moneyDefense }} (+{{ selectedItem.moreMoneyDEF }})%</span>
						</div>
					</div>
				</section>

				<section class="item-modal__section">
					<h3 class="item-modal__section-title">Onde comprar</h3>
					<div class="item-modal__tags">
						<span
							class="item-tag"
							v-if="selectedItem.shop"
						>
							<NuxtImg
								:src="imagePaths.uiElements.shop"
								alt=""
								width="16"
							/>
							Loja: {{ formatMoney(selectedItem.price) }}
						</span>
						<span
							v-else-if="selectedItem.blackMarket"
							class="item-tag"
						>
							<NuxtImg
								:src="imagePaths.uiElements.blackMarket"
								alt=""
								width="16"
							/>
							Mercado Negro: {{ formatMoney(selectedItem.price) }}
						</span>
						<p
							v-else
							class="item-tag"
						>
							Não é possível comprar este item
						</p>
					</div>
				</section>

				<section
					v-if="selectedItem.skins.length > 0"
					class="item-modal__section"
				>
					<h3 class="item-modal__section-title">Skins Disponíveis</h3>
					<div class="item-modal__skins">
						<p
							v-if="isOwnInventoryModal && ownedSkinBundlesLoading"
							class="item-modal__skin-help"
							role="status"
						>
							Carregando suas skins...
						</p>
						<p
							v-else-if="isOwnInventoryModal && ownedSkinBundlesError"
							class="item-modal__skin-help"
							role="alert"
						>
							Não foi possível carregar suas skins: {{ ownedSkinBundlesError.message }}
						</p>
						<p
							v-else-if="isOwnInventoryModal"
							class="item-modal__skin-help"
						>
							Clique em uma skin adquirida para ativá-la neste item.
						</p>
						<button
							type="button"
							v-for="skin in selectedItem.skins"
							:key="skin.bundleId"
							class="skin-card"
							:class="{ 'skin-card--owned': canActivateSkin(skin.bundleId) }"
							:disabled="!canActivateSkin(skin.bundleId) || settingSkin"
							:aria-label="`Ativar skin ${skin.bundleName} para ${selectedItem.name}`"
							@click="requestSkinActivation(skin)"
						>
							<LazyNuxtImg
								class="skin-card__image"
								:src="skin.imagePath"
								:alt="skin.bundleName"
								width="48"
							/>
							<span class="skin-card__name">{{ skin.bundleName }}</span>
						</button>
					</div>
				</section>
			</div>
		</template>
	</BaseModal>

	<BaseModal
		:open="pendingSkin !== null"
		title="Confirmar ativação da skin"
		description="A skin será aplicada somente a este item."
		@update:open="handleSkinConfirmationOpen"
	>
		<div
			v-if="pendingSkin"
			class="item-modal__skin-confirmation"
		>
			<NuxtImg
				:src="pendingSkin.imagePath"
				:alt="pendingSkin.bundleName"
				width="72"
				height="72"
			/>
			<p>Ativar {{ pendingSkin.bundleName }} para {{ pendingSkin.itemName }}?</p>
		</div>
		<template #footer>
			<BaseButton
				variant="ghost"
				:disabled="settingSkin"
				@click="cancelSkinConfirmation"
			>
				Cancelar
			</BaseButton>
			<BaseButton
				:disabled="settingSkin"
				@click="confirmSkinActivation"
			>
				{{ settingSkin ? "Ativando..." : "Ativar skin" }}
			</BaseButton>
		</template>
	</BaseModal>
</template>

<style lang="scss">
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;
@use "sass:color";

/* Modal Styles */
.item-modal {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;

	&__header {
		display: flex;
		align-items: center;
		gap: $spacing-md;

		&-image {
			width: 6rem;
			height: 6rem;
			object-fit: contain;
			background-color: $bg-input;
			border-radius: $radius-sm;
			padding: $spacing-xs;
		}

		&-meta {
			display: flex;
			flex-direction: column;
			gap: $spacing-sm;

			h2 {
				font-size: $font-size-20;
				font-weight: $font-weight-bold;
				color: $text-primary;
				margin: 0;
			}
		}

		&-muted {
			font-size: 0.8rem;
			color: $text-muted;
		}

		&-stats {
			display: flex;
			align-items: center;
			gap: $spacing-md;

			.item {
				display: flex;
				font-size: $font-size-12;
				font-weight: $font-weight-semibold;
				align-items: center;
				gap: $spacing-xs;
				padding: 0;
			}
		}
	}

	&__type-badge {
		align-self: flex-start;
		font-size: $font-size-12;
		font-weight: $font-weight-semibold;
		padding: 2px 8px;
		background-color: color-mix(in lab, $bg-card 100%, var(--select-item-color) 15%);
		color: var(--select-item-color);
		border-radius: $radius-xs;
		margin: 0;
	}

	&__section {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;

		&-title {
			font-size: 0.85rem;
			font-weight: $font-weight-semibold;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: $text-secondary;
		}
	}

	&__grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: $spacing-sm;

		@container page (max-width: 480px) {
			grid-template-columns: 1fr;
		}
	}

	&__stat-box {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: $spacing-sm $spacing-md;
		background-color: $bg-input;
		border: 1px solid $border-subtle;
		border-radius: $radius-xs;

		.label {
			font-size: $font-size-12;
			color: $text-muted;
		}

		.value {
			display: flex;
			align-items: flex-end;
			font-size: $font-size-14;
			font-weight: $font-weight-semibold;

			&--attr {
				color: $color-attribute;
			}
		}
	}

	&__tags {
		display: flex;
		flex-wrap: wrap;
		gap: $spacing-sm;
	}

	&__skins {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
		gap: $spacing-sm;
	}

	&__skin-help {
		grid-column: 1 / -1;
		color: $text-secondary;
		font-size: $font-size-12;
	}

	&__skin-confirmation {
		display: flex;
		align-items: center;
		gap: $spacing-md;
		color: $text-primary;
	}
}

.item-tag {
	padding: $spacing-xs $spacing-sm;
	font-size: $font-size-12;
	font-weight: $font-weight-semibold;
	border-radius: $radius-xs;
	background-color: $bg-input;
	color: $text-primary;
	display: flex;
	align-items: center;
	gap: $spacing-sm;
}

.skin-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-xs;
	padding: $spacing-sm;
	width: 100%;
	background-color: $bg-input;
	border: 1px solid $border-subtle;
	border-radius: $radius-xs;
	color: inherit;
	font: inherit;
	text-align: inherit;
	cursor: default;

	&:disabled {
		opacity: 1;
	}

	&:focus-visible {
		outline: 2px solid $color-success;
		outline-offset: 2px;
	}

	&--owned {
		@include accent-surface($color-success);
		color: color.adjust($color-success, $lightness: 15%);
		cursor: pointer;

		&:hover:not(:disabled) {
			background-color: rgba($color-success, 0.3);
			border-color: $color-success;
		}
	}

	&__image {
		width: 3rem;
		height: 3rem;
		object-fit: contain;
	}

	&__name {
		font-size: $font-size-12;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		text-align: center;
	}
}
</style>
