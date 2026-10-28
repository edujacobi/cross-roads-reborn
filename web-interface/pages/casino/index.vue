<script
	setup
	lang="ts"
>
import CasinoIcon from "~/components/icons/CasinoIcon.vue";
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

		<div class="casino-page__banner ambient-motion">
			<div class="casino-page__banner-icon">
				<CasinoIcon
					:size="120"
					variant="solid"
				/>
			</div>
			<div class="casino-page__banner-content">
				<span class="casino-page__eyebrow">Cassino Cross Roads</span>
				<p class="casino-page__intro">Aposte com estratégia. Vença com sorte.</p>
			</div>
		</div>
		<section
			class="casino-page__games"
			aria-label="Jogos do cassino"
		>
			<div
				v-for="(game, index) in games"
				:key="game.slug"
				class="casino-page__game"
				:class="{ 'casino-page__game--unavailable': 'availableOnWeb' in game && !game.availableOnWeb }"
				:style="{ '--game-index': Math.min(index, 4) }"
			>
				<template v-if="'availableOnWeb' in game && !game.availableOnWeb">
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
				<div class="casino-page__game-body">
					<h2 class="casino-page__game-title">
						{{ game.title }}
					</h2>
					<p class="casino-page__game-summary">
						{{ game.summary }}
					</p>
					<NuxtLink
						:to="`/casino/${game.slug}`"
						class="casino-page__game-link"
					>
						<CasinoIcon
							:size="18"
							variant="solid"
						/>
						{{ "availableOnWeb" in game ? "Ver detalhes" : "Jogar" }}
					</NuxtLink>
				</div>
			</div>
		</section>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.casino-page {
	display: flex;
	flex-direction: column;
	gap: $spacing-lg;

	&__intro {
		color: $text-primary;
		font-size: clamp(1.2rem, 3vw, 1.8rem);
		font-weight: $font-weight-bold;
		letter-spacing: -0.03em;
		line-height: 1.25;
	}

	&__banner {
		display: flex;
		align-items: center;
		gap: $spacing-lg;
		position: relative;
		overflow: hidden;
		padding: clamp($spacing-lg, 5vw, 3.5rem);
		border: 1px solid rgba($color-gold, 0.22);
		border-radius: $radius-lg;
		background:
			linear-gradient(
				110deg,
				rgba($color-gold, 0.2),
				rgba($color-casino, 0.22),
				rgba($color-brand, 0.18),
				rgba($color-gold, 0.2)
			),
			#10131c;
		background-size: 250% 100%;
		animation: casino-banner-gradient 12s ease infinite;

		@media (max-width: $bp-tablet) {
			padding: clamp($spacing-lg, 5vw, 2rem);
		}

		@media (max-width: $bp-mobile) {
			gap: $spacing-md;
		}

		&::after {
			position: absolute;
			inset: 0;
			border: 1px solid rgba($color-gold, 0.08);
			border-radius: inherit;
			content: "";
			pointer-events: none;
		}
	}

	&__banner-icon {
		display: grid;
		flex: 0 0 auto;
		place-items: center;
		color: $color-gold;
		filter: drop-shadow(0 0 18px rgba($color-gold, 0.3));
		animation: casino-icon-pulse 3s ease-in-out infinite;
	}

	&__banner.ambient-motion &__banner-icon {
		animation-play-state: running;
	}

	&__eyebrow {
		display: block;
		margin-bottom: $spacing-sm;
		color: $color-gold;
		font-size: $font-size-12;
		font-weight: $font-weight-extrabold;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	&__games {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
		gap: $spacing-md;
	}

	&__game {
		position: relative;
		min-width: 0;
		border: 1px solid rgba($color-gold, 0.16);
		background: linear-gradient(155deg, rgba(#19392c, 0.65), $bg-card 55%);
		transition: transform $transition-normal ease, border-color $transition-normal ease, box-shadow $transition-normal ease;
		border-radius: $radius-lg;
		display: flex;
		overflow: hidden;
		animation: reveal-up 0.45s $motion-ease-out both;
		animation-delay: calc(var(--game-index) * 40ms);

		@media (hover: hover) and (pointer: fine) {
			&:not(.casino-page__game--unavailable):hover {
				transform: translateY(-3px);
				border-color: rgba($color-gold, 0.5);
				box-shadow: 0 14px 34px rgba(0, 0, 0, 0.35), 0 0 22px rgba($color-gold, 0.2);
			}
		}

		&-body {
			padding: $spacing-md;
			display: flex;
			flex-direction: column;
			gap: $spacing-md;
		}

		&-title {
			color: #fff3d3;
			font-size: $font-size-16;
		}

		&-summary {
			line-height: 1.5;
			font-size: 0.9rem;
		}

		&-link {
			width: 100%;
			@include flex-center;
			gap: $spacing-xs;
			padding: $spacing-sm $spacing-md;
			border: 1px solid rgba($color-gold, 0.35);
			border-radius: $radius-sm;
			background: rgba($color-gold, 0.09);
			color: #ffe6a1;
			transition: background $transition-fast ease, border-color $transition-fast ease;
			margin-top: auto;

			&:hover {
				border-color: $color-gold;
				background: rgba($color-gold, 0.17);
			}
		}

		&--unavailable {
			opacity: 0.5;
		}
	}

	&__image {
		max-width: 30%;
		height: 100%;
		object-fit: scale-down;
		padding: $spacing-lg $spacing-xs;
		border-right: 1px solid rgba($color-gold, 0.16);
		background:
			radial-gradient(ellipse at center, rgba($color-gold, 0.09), transparent 80%),
			linear-gradient(180deg, rgba(#071b13, 0.45), rgba($bg-input, 0.8));
	}

	&__badge {
		position: absolute;
		top: $spacing-sm;
		left: $spacing-sm;
		padding: $spacing-xs $spacing-sm;
		color: #ffe6a1;
		border: 1px solid rgba($color-gold, 0.45);
		border-radius: $radius-full;
		background: rgba($color-gold, 0.1);
		font-size: $font-size-12;
		font-weight: $font-weight-semibold;
	}
}

@keyframes casino-banner-gradient {
	0%,
	100% {
		background-position: 0% 50%;
	}
	50% {
		background-position: 100% 50%;
	}
}

@keyframes casino-icon-pulse {
	0%,
	100% {
		transform: scale(1) rotate(-3deg);
	}
	50% {
		transform: scale(1.08) rotate(3deg);
	}
}

@media (prefers-reduced-motion: reduce) {
	.casino-page__banner,
	.casino-page__banner-icon {
		animation: none;
	}

	.casino-page__game {
		animation: none;
	}
}
</style>
