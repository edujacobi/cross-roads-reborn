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

		<BaseCard :title="game.title">
			<div class="casino-game-page__images">
				<NuxtImg
					v-for="image in game.images"
					:key="image.src"
					:src="image.src"
					:alt="image.alt"
					width="640"
					height="320"
					sizes="sm:100vw md:50vw"
				/>
			</div>
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

	&__back {
		display: inline-flex;
		align-items: center;
		align-self: flex-start;
		gap: $spacing-xs;
		color: $text-secondary;
		font-size: 0.875rem;

		&:hover {
			color: $text-primary;
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
			margin-bottom: $spacing-xs;
			font-size: 1rem;
			font-weight: 600;
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
			width: min(100%, 18rem);
			height: 12rem;
			object-fit: contain;
		}
	}

}
</style>
