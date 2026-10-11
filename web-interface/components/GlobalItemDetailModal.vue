<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { Moon, Sun } from "lucide-vue-next";
import { watch } from "vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import { useItemDetailModal } from "~/composables/useItemDetailModal";
import { useMoneyFormat } from "~/composables/useMoneyFormat";
import { imagePaths } from "~/constants/imagePaths";
import { GetItemsDocument, type GetItemsQuery } from "~/graphql/generated";
import { ItemType } from "../../src/core/types/ItemType";

type Item = GetItemsQuery["items"][number];

const route = useRoute();
const { selectedItem, isModalOpen, handleOpenUpdate, closeItemModal } = useItemDetailModal();

const { result } = useQuery(GetItemsDocument);

// Resolve the selected item from the query parameter using fetched items
watch(
	[result, () => route.query.detailsItemId],
	([newResult, queryId]) => {
		if (!newResult || newResult.items.length === 0) return;

		if (queryId !== undefined && queryId !== null && queryId !== "") {
			const itemIdNum = Number(queryId);
			const found = newResult.items.find((item: Item) => item.id === itemIdNum);
			if (found) {
				selectedItem.value = found;
				isModalOpen.value = true;
			}
		}
	},
	{ immediate: true },
);

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
		:open="isModalOpen && !!selectedItem"
		title="Detalhes do Item"
		@update:open="handleOpenUpdate"
		@close="closeItemModal"
	>
		<template v-if="selectedItem">
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
						<div
							v-for="skin in selectedItem.skins"
							:key="skin.bundleId"
							class="skin-card"
						>
							<LazyNuxtImg
								class="skin-card__image"
								:src="skin.imagePath"
								:alt="skin.bundleName"
								width="48"
							/>
							<span class="skin-card__name">{{ skin.bundleName }}</span>
						</div>
					</div>
				</section>
			</div>
		</template>
	</BaseModal>
</template>

<style lang="scss">
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

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
				font-size: 1.25rem;
				font-weight: 700;
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
				font-size: 0.8125rem;
				font-weight: 600;
				align-items: center;
				gap: $spacing-xs;
				padding: 0;
			}
		}
	}

	&__type-badge {
		align-self: flex-start;
		font-size: 0.75rem;
		font-weight: 600;
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
			font-weight: 600;
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
			font-size: 0.75rem;
			color: $text-muted;
		}

		.value {
			display: flex;
			align-items: flex-end;
			font-size: 0.9375rem;
			font-weight: 600;

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
}

.item-tag {
	padding: $spacing-xs $spacing-sm;
	font-size: 0.8125rem;
	font-weight: 600;
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
	background-color: $bg-input;
	border: 1px solid $border-subtle;
	border-radius: $radius-xs;

	&__image {
		width: 3rem;
		height: 3rem;
		object-fit: contain;
	}

	&__name {
		font-size: 0.75rem;
		font-weight: 600;
		color: $text-primary;
		text-align: center;
	}
}
</style>
