<script
	setup
	lang="ts"
>
import { ArrowLeft } from "lucide-vue-next";
import CasinoBetGame from "~/components/Casino/CasinoBetGame.vue";
import CasinoHorseRaceGame from "~/components/Casino/CasinoHorseRaceGame.vue";
import CasinoLotteryGame from "~/components/Casino/CasinoLotteryGame.vue";
import BaseCard from "~/components/ui/BaseCard.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { casinoGames, isCasinoGameSlug } from "~/constants/casinoGames";

definePageMeta({
	middleware: "auth",
});

const route = useRoute();
const game = computed(() => {
	const slug = route.params.game;
	return isCasinoGameSlug(slug) ? casinoGames[slug] : undefined;
});

useHead({
	title: () => game.value?.title ?? "Jogo do cassino",
});
</script>

<template>
	<main
		v-if="game"
		class="casino-game-page"
	>
		<NuxtLink
			to="/casino"
			class="casino-game-page__back"
		>
			<ArrowLeft
				:size="16"
				aria-hidden="true"
			/>
			Voltar ao cassino
		</NuxtLink>

		<PageTitle
			:title="game.title"
			:subtitle="game.summary"
		/>

		<BaseCard class="casino-game-page__info">
			<!--			<div class="casino-game-page__images">-->
			<!--				<NuxtImg-->
			<!--					v-for="image in game.images"-->
			<!--					:key="image.src"-->
			<!--					:src="image.src"-->
			<!--					:alt="image.alt"-->
			<!--					width="100"-->
			<!--					height="100"-->
			<!--				/>-->
			<!--			</div>-->
			<div class="casino-game-page__sections">
				<section
					v-for="section in game.sections"
					:key="section.title"
				>
					<h2>{{ section.title }}</h2>
					<p>{{ section.description }}</p>
				</section>
			</div>
		</BaseCard>
		<CasinoLotteryGame v-if="route.params.game === 'lottery'" />
		<CasinoBetGame v-else-if="route.params.game === 'bet'" />
		<CasinoHorseRaceGame v-else-if="route.params.game === 'horserace'" />
	</main>

	<main
		v-else
		class="casino-game-page"
	>
		<PageTitle
			title="Jogo não encontrado"
			subtitle="Esse jogo não está disponível no cassino."
		/>
		<NuxtLink
			to="/casino"
			class="casino-game-page__back"
		>
			<ArrowLeft
				:size="16"
				aria-hidden="true"
			/>
			Voltar ao cassino
		</NuxtLink>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.casino-game-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;

	&__info {
		border: 1px solid rgba($color-gold, 0.2);
		background:
			linear-gradient(145deg, rgba(#173528, 0.44), transparent 55%),
			$bg-card;
		box-shadow: 0 14px 36px rgba(0, 0, 0, 0.18);

		:deep(.card-title) {
			color: #fff0cb;
		}
	}

	&__back {
		display: inline-flex;
		align-items: center;
		align-self: flex-start;
		gap: $spacing-xs;
		padding: $spacing-sm $spacing-md;
		border: 1px solid $border-card;
		border-radius: $radius-full;
		background: rgba($bg-card, 0.8);
		color: #d7d1bf;
		font-size: $font-size-14;
		transition: color $transition-fast ease, border-color $transition-fast ease, transform $transition-fast ease;

		&:hover {
			transform: translateX(-2px);
			border-color: rgba($color-gold, 0.5);
			color: $color-gold;
		}

		&:focus-visible {
			outline: 2px solid $color-brand;
			outline-offset: 3px;
			border-radius: 2px;
		}
	}

	&__sections {
		display: grid;
		gap: $spacing-lg;

		h2 {
			color: $color-gold;
			margin-bottom: $spacing-xs;
			font-size: $font-size-16;
			font-weight: $font-weight-semibold;
		}

		p {
			color: $text-secondary;
			line-height: 1.6;
		}
	}

	&__images {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: $spacing-md;
		margin-bottom: $spacing-lg;

		img {
			height: 10rem;
			object-fit: contain;
			padding: $spacing-md;
			border: 1px solid rgba($color-gold, 0.15);
			border-radius: $radius-md;
			background:
				radial-gradient(ellipse at center, rgba($color-casino, 0.16), transparent 64%),
				rgba($bg-input, 0.55);
		}
	}

}
</style>
