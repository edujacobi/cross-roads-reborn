<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { Moon, Sun } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { imagePaths } from "~/constants/imagePaths";
import { GetItemsDocument, type GetItemsQuery } from "~/graphql/generated";
import { ItemType } from "../../src/core/types/ItemType";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Itens",
});

type Item = GetItemsQuery["items"][number];

const { result, loading, error } = useQuery(GetItemsDocument);

const items = computed(() => result.value?.items ?? []);

const selectedItem = ref<Item | null>(null);

const typeOrder = [ItemType.Weapon, ItemType.Wearable, ItemType.Accessory, ItemType.Consumable, ItemType.BeatUp];

const typeData: Record<
	number,
	{
		title: string;
		description: string;
		color: string;
		showAtkDef: boolean;
		showMoreAtkDef: boolean;
		showExtra: boolean;
	}
> = {
	[ItemType.Weapon]: {
		title: "Armas",
		description: "Armas são usadas para aumentar seu ATK e DEF, possibilitando novos trabalhos e alvos de roubo",
		color: "#ed4245",
		showAtkDef: true,
		showMoreAtkDef: false,
		showExtra: false,
	},
	[ItemType.Wearable]: {
		title: "Vestíveis",
		description: "Vestíveis aumentam seu ATK e DEF atual e podem acumular com outros",
		color: "#3498db",
		showAtkDef: false,
		showMoreAtkDef: true,
		showExtra: false,
	},
	[ItemType.Accessory]: {
		title: "Acessórios",
		description: "Acessórios não aumentam ATK nem DEF, mas fornecem bônus especiais",
		color: "#9b59b6",
		showAtkDef: false,
		showMoreAtkDef: false,
		showExtra: true,
	},
	[ItemType.Consumable]: {
		title: "Consumíveis",
		description: "Consumíveis aumentam seu ATK ou DEF, mas gastam uma unidade ao serem utilizados",
		color: "#57f287",
		showAtkDef: false,
		showMoreAtkDef: true,
		showExtra: false,
	},
	[ItemType.BeatUp]: {
		title: "Espancamento",
		description: "Itens de espancamento aumentam seu ATK, mas somente em espancamentos",
		color: "#ff8C00",
		showAtkDef: false,
		showMoreAtkDef: true,
		showExtra: false,
	},
};

const itemChunks = computed(() => {
	const groups: {
		type: number;
		title: string;
		items: Item[];
		color: string;
		description: string;
		showAtkDef: boolean;
		showMoreAtkDef: boolean;
		showExtra: boolean;
	}[] = [];

	for (const typeId of typeOrder) {
		const filtered = items.value.filter((item) => item.type === typeId);
		if (filtered.length > 0) {
			groups.push({
				type: typeId,
				title: typeData[typeId].title || "Outros",
				items: filtered,
				color: typeData[typeId].color || "#fff",
				description: typeData[typeId].description || "",
				showAtkDef: typeData[typeId].showAtkDef,
				showMoreAtkDef: typeData[typeId].showMoreAtkDef,
				showExtra: typeData[typeId].showExtra,
			});
		}
	}

	return groups;
});

const route = useRoute();
const router = useRouter();

const isItemModalOpen = ref(false);

function openItemModal(item: Item) {
	selectedItem.value = item;
	isItemModalOpen.value = true;
	if (String(route.query.id) !== String(item.id)) {
		router.replace({ query: { ...route.query, id: item.id } });
	}
}

function closeItemModal() {
	isItemModalOpen.value = false;
	selectedItem.value = null;
	if (route.query.id !== undefined) {
		const query = { ...route.query };
		delete query.id;
		router.replace({ query });
	}
}

function handleOpenUpdate(open: boolean) {
	if (!open) {
		closeItemModal();
	}
}

watch(
	[items, () => route.query.id],
	([newItems, queryId]) => {
		if (newItems.length === 0) return;

		if (queryId !== undefined && queryId !== null && queryId !== "") {
			const itemIdNum = Number(queryId);
			const found = newItems.find((item) => item.id === itemIdNum);
			if (found) {
				selectedItem.value = found;
				isItemModalOpen.value = true;
			} else {
				closeItemModal();
			}
		} else {
			isItemModalOpen.value = false;
			selectedItem.value = null;
		}
	},
	{ immediate: true },
);

function formatMoney(amount: number) {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
		maximumFractionDigits: 0,
	})
		.format(amount)
		.replace("R$", "Cr$");
}
</script>

<template>
	<main class="items-page">
		<PageTitle
			title="Itens"
			subtitle="Catálogo e estatísticas de todos os itens do jogo."
		/>

		<div
			v-if="loading"
			class="items-page__state"
		>
			<p>Carregando itens...</p>
		</div>

		<div
			v-else-if="error"
			class="items-page__state items-page__state--error"
		>
			<p>Erro ao carregar os itens: {{ error.message }}</p>
		</div>

		<div
			v-else-if="items.length === 0"
			class="items-page__state"
		>
			<p>Nenhum item encontrado.</p>
		</div>

		<div
			v-else
			class="items-page__chunks"
		>
			<section
				v-for="chunk in itemChunks"
				:key="chunk.type"
				class="items-chunk"
				:style="`--item-hover-color: ${chunk.color}`"
			>
				<div class="items-chunk__header">
					<h2 class="items-chunk__title">{{ chunk.title }}</h2>
					<p class="items-chunk__description">{{ chunk.description }}</p>
				</div>

				<div class="items-grid">
					<button
						v-for="item in chunk.items"
						:key="item.id"
						type="button"
						class="item-card"
						:aria-label="`Ver detalhes de ${item.name}`"
						@click="openItemModal(item)"
					>
						<LazyNuxtImg
							class="item-card__image"
							:src="item.defaultImagePath"
							:alt="item.name"
							width="56"
						/>
						<div class="item-card__info">
							<h3 class="item-card__name">{{ item.name }}</h3>
							<!-- ATK / DEF -->
							<div
								class="item-card__stats"
								v-if="chunk.showAtkDef"
							>
								<span class="item-card__stat">
									<NuxtImg
										:src="imagePaths.attributes.attack"
										width="20"
										alt=""
									/>
									{{ item.attack }}
									ATK
								</span>
								<span class="item-card__stat">
									<NuxtImg
										:src="imagePaths.attributes.defense"
										width="20"
										alt=""
									/>
									{{ item.defense }}
									DEF
								</span>
							</div>

							<!-- More ATK / More DEF -->
							<div
								class="item-card__stats"
								v-if="chunk.showMoreAtkDef"
							>
								<span class="item-card__stat">
									<NuxtImg
										:src="imagePaths.attributes.attack"
										width="20"
										alt=""
									/>
									+{{ item.moreAttack }}
									ATK
								</span>
								<span class="item-card__stat">
									<NuxtImg
										:src="imagePaths.attributes.defense"
										width="20"
										alt=""
									/>
									+{{ item.moreDefense }}
									DEF
								</span>
							</div>

							<!-- Extra -->
							<div
								class="item-card__stats"
								v-if="chunk.showExtra"
							>
								<span class="item-card__stat">
									{{ item.extra }}
								</span>
							</div>
						</div>
					</button>
				</div>
			</section>
		</div>

		<BaseModal
			:open="isItemModalOpen && !!selectedItem"
			title="Detalhes do Item"
			@close="closeItemModal"
			@update:open="handleOpenUpdate"
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
							width="64"
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
							<div class="item-modal__stat-box">
								<span class="label">Preço</span>
								<span class="value">{{ formatMoney(selectedItem.price) }}</span>
							</div>
							<div class="item-modal__stat-box">
								<span class="label">Jogadores com o Item</span>
								<span class="value">{{ selectedItem.userCount }}</span>
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
								Loja
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
								Mercado Negro
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
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "sass:color";
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.items-page {
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

	&__chunks {
		display: flex;
		flex-direction: column;
		gap: $spacing-lg;
	}
}

.items-chunk {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
	container-name: page;
	container-type: inline-size;

	&__title {
		font-size: 1.25rem;
		font-weight: 700;
		color: $text-primary;
		padding-bottom: $spacing-xs;
		margin: 0;
	}

	&__description {
		font-size: 0.85rem;
		color: $text-secondary;
	}
}

.items-grid {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: $spacing-sm;

	@container page (width < 1024px) {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	@container page (width < 768px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@container page (width < 540px) {
		grid-template-columns: 1fr
	}
}

.item-card {
	padding: 0.875rem;
	background-color: $bg-input;
	border: 1px solid $border-subtle;
	border-radius: $radius-sm;
	display: flex;
	align-items: center;
	gap: $spacing-md;
	cursor: pointer;
	text-align: left;
	font: inherit;
	color: inherit;
	transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.15s ease;

	&:hover,
	&:focus-visible {
		background-color: color-mix(in lab, $bg-card 100%, var(--item-hover-color) 10%);
		border-color: var(--item-hover-color);
		transform: translateY(-2px);
		outline: none;
	}

	&__image {
		width: 4rem;
		height: 4rem;
		flex: 0 0 4rem;
		object-fit: contain;
		padding: $spacing-xs;
	}

	&__info {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		flex-grow: 1;
	}

	&__name {
		font-size: 0.9375rem;
		font-weight: 600;
		color: $text-primary;
		line-break: anywhere;
	}

	&__stats {
		display: flex;
		gap: $spacing-sm;
		font-size: 0.75rem;
		font-weight: 600;
	}

	&__stat {
		color: $color-attribute;
		display: flex;
		align-items: center;

		&--atk {
			color: #f04d48;
		}
		&--def {
			color: #3b82f6;
		}
	}
}

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
			width: 4.5rem;
			height: 4.5rem;
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

		@media (max-width: 480px) {
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
