<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import { computed } from "vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { useItemDetailModal } from "~/composables/useItemDetailModal";
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

const { openItemModal } = useItemDetailModal();

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

</style>
