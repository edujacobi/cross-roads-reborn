<script
	setup
	lang="ts"
>
import { useMutation, useQuery } from "@vue/apollo-composable";
import { ArrowLeft, Beer, Clock3 } from "lucide-vue-next";
import { computed, nextTick, ref } from "vue";
import HospitalIcon from "~/components/icons/HospitalIcon.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { useDateFormat } from "~/composables/useDateFormat";
import { useToast } from "~/composables/useToast";
import { DrinkAtBarDocument, GetBarStatusDocument } from "~/graphql/generated";
import { getDrinkCountMessages } from "../../src/core/types/Drinks";
import { getRandomItemFromArray } from "../../src/shared/utils";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Bar",
});

const { showToast } = useToast();
const router = useRouter();
const { distance } = useDateFormat();
const { result, loading, error, refetch } = useQuery(
	GetBarStatusDocument,
	{},
	{
		fetchPolicy: "cache-and-network",
	},
);
const { mutate: drinkAtBar, loading: drinking } = useMutation(DrinkAtBarDocument);
const status = computed(() => result.value?.barStatus);

const greet = getRandomItemFromArray([
	"campeão",
	"guerreiro",
	"meu bruxo",
	"meu amigo",
	"meu chapa",
	"cliente",
	"comparsa",
	"parceiro",
	"meu cupinxa",
]);

const barData = [
	{
		name: "Bar da Rua da Peixeira",
		image: "/images/bar/bar1.jpg",
	},
	{
		name: "Bar do Bairro do Limoeiro",
		image: "/images/bar/bar2.jpg",
	},
	{
		name: "Bar do Novaes",
		image: "/images/bar/bar3.jpg",
	},
	{
		name: "Bar do Jacó",
		image: "/images/bar/bar4.jpg",
	},
];

const barInfo = getRandomItemFromArray(barData);

const drinkHistory = ref<
	Array<{
		id: number;
		beverage: string | null;
		sensation: string | null;
		happyHour: boolean;
		hospitalized: boolean;
		hospitalTime: string | null;
		barmanMessages: string[];
	}>
>([]);
const drinkHistoryScroller = ref<HTMLDivElement | null>(null);
let drinkHistoryId = 0;

const barmanMessages = computed(() => drinkHistory.value[0]?.barmanMessages ?? []);

const buttonLabel = computed(() => {
	if (drinkHistory.value.length === 0) {
		return "Beber!";
	}
	return `Beber mais${drinkHistory.value.map((_d) => "!").join("")}`;
});

async function drink() {
	if (!status.value?.canDrink || drinking.value) return;

	try {
		const response = await drinkAtBar();
		const drinkResult = response?.data?.drinkAtBar;
		if (response?.errors?.length || !drinkResult?.success) {
			showToast({ text: drinkResult?.message ?? "Não foi possível beber agora.", variant: "error" });
			await refetch();
			return;
		}

		drinkHistory.value.unshift({
			...drinkResult,
			id: ++drinkHistoryId,
			barmanMessages: getDrinkCountMessages(drinkResult.drinkCount, greet, "Portuguese"),
		});
		await nextTick();
		if (drinkHistoryScroller.value) {
			drinkHistoryScroller.value.scrollTop = 0;
		}
		await refetch();
	} catch {
		showToast({ text: "Não foi possível beber agora. Tente novamente.", variant: "error" });
	}
}
</script>

<template>
	<main class="bar-page">
		<nav
			class="user-detail__nav-back"
			aria-label="Navegação do jogador"
		>
			<BaseButton
				variant="ghost"
				size="sm"
				@click="router.back()"
			>
				<ArrowLeft
					:size="16"
					aria-hidden="true"
				/>
				Voltar
			</BaseButton>
		</nav>
		<PageTitle :title="barInfo.name" />

		<BaseCard
			title="Bem-vindo ao bar"
			class="bar-page__card"
		>
			<template #actions>
				<p
					v-if="status?.happyHour"
					class="bar-page__happy-hour"
				>
					Happy Hour! Chance de entrar em coma alcoólico triplicada.
				</p>
				<p
					v-else
					class="bar-page__normal-hour"
				>
					Happy Hour acontece das 18h às 20h e durante os fins de semana (horário de Brasília).
				</p>
			</template>
			<NuxtImg
				:src="barInfo.image"
				alt="Imagem do bar"
				class="bar-page__image"
			/>
			<div>
				<div class="bar-page__welcome">
					<Beer
						:size="40"
						aria-hidden="true"
					/>
					<div>
						<p>Chega aí, {{ greet }}, gostaria de beber alguma coisa?</p>
					</div>
				</div>
				<p
					v-if="error"
					class="bar-page__error"
					role="alert"
				>
					Não foi possível carregar o estado do bar: {{ error.message }}
				</p>
				<p
					v-else-if="!status?.canDrink && !loading"
					class="bar-page__notice"
					role="status"
				>
					Você não pode beber enquanto está ocupado ou hospitalizado.
				</p>
				<div
					v-if="barmanMessages.length"
					class="bar-page__barman-messages"
					role="status"
				>
					<p
						v-for="(message, index) in barmanMessages"
						:key="index"
					>
						“{{ message }}”
					</p>
				</div>
				<div class="bar-page__actions">
					<BaseButton
						variant="primary"
						:disabled="loading || drinking || !status?.canDrink"
						@click="drink"
						size="lg"
					>
						<Beer
							:size="18"
							aria-hidden="true"
						/>
						{{ drinking ? "Servindo..." : buttonLabel }}
					</BaseButton>
				</div>
			</div>
		</BaseCard>

		<section class="bar-page__cards">
			<BaseCard title="Seu histórico">
				<dl class="bar-page__stats">
					<div>
						<dt>Bebidas nesta visita</dt>
						<dd>{{ status?.sessionDrinkCount ?? 0 }}</dd>
					</div>
					<div>
						<dt>Recorde normal</dt>
						<dd>{{ status?.normalRecord ?? "—" }}</dd>
					</div>
					<div>
						<dt>Recorde no Happy Hour</dt>
						<dd>{{ status?.happyHourRecord ?? "—" }}</dd>
					</div>
					<div>
						<dt>Comas alcoólicos</dt>
						<dd>{{ status?.drunkCount ?? "—" }}</dd>
					</div>
				</dl>
			</BaseCard>

			<BaseCard
				title="Histórico de bebidas"
				class="bar-page__drink-history"
				no-padding-x
				no-padding-y
			>
				<div
					ref="drinkHistoryScroller"
					class="bar-page__drink-list"
				>
					<article
						v-for="(drink, index) in drinkHistory"
						:key="drink.id"
						class="bar-page__drink"
					>
						<div>
							<strong>#{{ drinkHistory.length - index }}</strong>
							Você bebeu <strong>{{ drink.beverage }}</strong> e se sente
							<strong>{{ drink.sensation }}</strong>.
						</div>
						<span
							v-if="drink.happyHour"
							class="bar-page__time"
						>
							<Clock3
								:size="15"
								aria-hidden="true"
							/>
							Happy Hour
						</span>
						<span
							v-if="drink.hospitalized && drink.hospitalTime"
							class="bar-page__error"
						>
							<HospitalIcon
								:size="20"
								variant="solid"
							/>
							Você entrou em coma alcoólico e será curado em
							<time :datetime="drink.hospitalTime">
								{{ distance(new Date(), new Date(drink.hospitalTime)) }}
							</time>
						</span>
					</article>
				</div>
			</BaseCard>
		</section>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;
@use "sass:color";

.bar-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;
	margin: 0 auto;

	.base-button.variant-primary {
		background-color: $color-bar;
		color: $text-primary;

		&:hover:not(:disabled) {
			background-color: color.adjust($color-bar, $lightness: 8%);
		}
	}

	&__card {
		:deep(.card-body) {
			display: flex;
			gap: $spacing-lg;
			align-items: flex-end;
			flex-wrap: wrap;
		}
	}

	&__image {
		aspect-ratio: 1;
		height: 20rem;
		object-fit: cover;
		border-radius: $radius-md;
	}

	&__welcome,
	&__actions,
	&__time {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
	}

	&__time {
		gap: $spacing-sm;
		color: $color-brand;
	}

	&__welcome {
		color: $text-primary;

		svg {
			flex: 0 0 auto;
			color: $color-bar;
		}
	}

	&__happy-hour {
		color: $color-brand;
		font-weight: $font-weight-semibold;
	}

	&__normal-hour {
		color: $text-secondary;
		font-size: $font-size-14;
		font-weight: $font-weight-semibold;
	}

	&__actions {
		flex-wrap: wrap;
		margin-top: $spacing-lg;
	}

	&__cards {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: $spacing-md;

		@media (max-width: 700px) {
			grid-template-columns: 1fr;
		}
	}

	&__stats {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: $spacing-md;

		div {
			display: flex;
			flex-direction: column;
			gap: $spacing-xs;
		}

		dt {
			color: $text-muted;
			font-size: $font-size-12;
		}

		dd {
			margin: 0;
			font-size: $font-size-24;
			font-weight: $font-weight-semibold;
		}
	}

	&__drink-list {
		@include scrollbar-custom;
		max-height: 30dvh;
		overflow-y: auto;
		padding: 1.25rem 0;
	}

	&__notice,
	&__time {
		color: $text-secondary;
	}

	&__error {
		display: block;
		color: $color-danger;
	}

	&__barman-messages {
		color: $text-secondary;
		font-size: $font-size-14;
		font-style: italic;
		margin-top: $spacing-sm;
	}

	&__time {
		margin-top: $spacing-sm;
		font-size: $font-size-12;
	}

	&__drink {
		display: flex;
		flex-direction: column;
		animation: slide-in 300ms ease-out;
		gap: $spacing-xs;
		padding: $spacing-sm $spacing-md;

		svg {
			vertical-align: sub;
		}

		&:not(:last-child) {
			border-bottom: 1px solid $border-card;
		}
	}
}

@keyframes slide-in {
	from {
		opacity: 0;
		translate: -1rem 0;
		background-color: $color-bar;
	}
	to {
		opacity: 1;
		translate: 0 0;
		background-color: transparent;
	}
}
</style>
