<script
	setup
	lang="ts"
>
import { Coins } from "lucide-vue-next";
import BaseCard from "~/components/ui/BaseCard.vue";
import PageTitle from "~/components/ui/PageTitle.vue";
import { casinoGames } from "~/constants/casinoGames";

definePageMeta({
	middleware: "auth",
});

useHead({
	title: "Cassino",
});

const games = Object.entries(casinoGames).map(([slug, game]) => ({
	slug,
	...game,
}));
</script>

<template>
	<main class="casino-page">
		<PageTitle
			title="Cassino"
			subtitle="Antro da perdição! Aposte, ganhe, perca, quebre a banca!"
		/>

		<p class="casino-page__intro">Conheça os jogos do cassino e teste sua sorte.</p>

		<section
			class="casino-page__games"
			aria-label="Jogos do cassino"
		>
			<BaseCard
				v-for="game in games"
				:key="game.slug"
				:title="game.title"
				:subtitle="game.summary"
				class="casino-page__game"
			>
				<template
					v-if="'availableOnWeb' in game && !game.availableOnWeb"
					#header
				>
					<span class="casino-page__badge">Em breve</span>
				</template>
				<NuxtImg
					class="casino-page__image"
					:src="game.image.src"
					:alt="game.image.alt"
					width="640"
					height="320"
					sizes="sm:100vw md:50vw lg:33vw"
				/>
				<template #actions>
					<NuxtLink
						:to="`/casino/${game.slug}`"
						class="casino-page__link"
					>
						{{ "availableOnWeb" in game ? "Ver detalhes" : "Jogar" }}
						<Coins
							:size="16"
							aria-hidden="true"
						/>
					</NuxtLink>
				</template>
			</BaseCard>
		</section>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.casino-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;

	&__intro {
		color: $text-secondary;
		line-height: 1.6;
	}

	&__games {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
		gap: $spacing-md;
	}

	&__game {
		min-width: 0;
	}

	&__image {
		width: 100%;
		height: 12rem;
		object-fit: contain;
		padding: $spacing-md;
		background: $bg-card-header;
	}

	&__link {
		display: inline-flex;
		align-items: center;
		gap: $spacing-xs;
		color: $color-brand;
		font-size: 0.875rem;
		font-weight: 600;
		white-space: nowrap;

		&:focus-visible {
			outline: 2px solid $color-brand;
			outline-offset: 3px;
			border-radius: 2px;
		}
	}

	&__badge {
		padding: $spacing-xs $spacing-sm;
		color: $text-muted;
		border: 1px solid $border-subtle;
		border-radius: $radius-full;
		font-size: 0.75rem;
		font-weight: 600;
	}
}
</style>
