<script
	setup
	lang="ts"
>
import { AlertTriangle } from "@lucide/vue";
import { onMounted } from "vue";
import BeatUpIcon from "~/components/icons/BeatUpIcon.vue";
import CasinoIcon from "~/components/icons/CasinoIcon.vue";
import GangIcon from "~/components/icons/GangIcon.vue";
import HospitalIcon from "~/components/icons/HospitalIcon.vue";
import InvestmentIcon from "~/components/icons/InvestmentIcon.vue";
import JobsIcon from "~/components/icons/JobsIcon.vue";
import PrisonIcon from "~/components/icons/PrisonIcon.vue";
import RobberyIcon from "~/components/icons/RobberyIcon.vue";
import ScavengeIcon from "~/components/icons/ScavengeIcon.vue";
import ShopIcon from "~/components/icons/ShopIcon.vue";
import SpecialShopIcon from "~/components/icons/SpecialShopIcon.vue";
import TrophyIcon from "~/components/icons/TrophyIcon.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import { imagePaths } from "~/constants/imagePaths";

definePageMeta({
	layout: false,
});

const route = useRoute();
const auth = useAuth();

const errorMessage = computed(() => {
	return typeof route.query.error === "string" ? route.query.error : null;
});

const featureGroups = [
	{
		title: "Economia e equipamentos",
		features: [
			{
				icon: JobsIcon,
				title: "Escolha seu emprego",
				description: "De açougueiro a espião, cada profissão oferece ganhos garantidos diferentes.",
			},
			{
				icon: InvestmentIcon,
				title: "Invista seu dinheiro",
				description: "Aplique seus recursos para fazer seu patrimônio crescer.",
			},
			{
				icon: ShopIcon,
				title: "Leve itens",
				description: "Compre armas e acessórios para se equipar e se liberar novos alvos.",
			},
			{
				icon: SpecialShopIcon,
				title: "Personalize seu estilo",
				description: "Use skins e customizações para deixar seu personagem com a sua cara.",
			},
		],
	},
	{
		title: "Riscos na cidade",
		features: [
			{
				icon: RobberyIcon,
				title: "Planeje roubos",
				description: "Busque recompensas em roubos, mas cuidado com as consequências.",
			},
			{
				icon: BeatUpIcon,
				title: "Entre em brigas",
				description: "Enfrente outros jogadores em combates e prove sua força.",
			},
			{
				icon: ScavengeIcon,
				title: "Vasculhe a cidade",
				description: "Procure itens e recursos úteis para sua jornada.",
			},
		],
	},
	{
		title: "Recuperação e fuga",
		features: [
			{
				icon: HospitalIcon,
				title: "Sem plano de saúde",
				description: "Recupere sua saúde no hospital após brigas ou acidentes para continuar jogando.",
			},
			{
				icon: PrisonIcon,
				title: "Cumpra pena",
				description: "Erros têm consequência: fique na prisão ou tente fugir, por sua conta e risco.",
			},
		],
	},
	{
		title: "Gangues e competição",
		features: [
			{
				icon: GangIcon,
				title: "Jogue em equipe",
				description: "Forme sua gangue e domine a cidade com seus aliados.",
			},
			{
				icon: TrophyIcon,
				title: "Conquiste o topo",
				description: "Dispute o ranking das classificações por riqueza, combates e influência.",
			},
			{
				icon: CasinoIcon,
				title: "Arrisque no cassino",
				description: "Teste sua sorte em jogos de cassino e tente multiplicar seus ganhos.",
			},
		],
	},
];

onMounted(async () => {
	await auth.initAuth();
	if (auth.isAuthenticated.value) {
		await navigateTo(auth.hasAdminAccess.value ? "/admin/dashboard" : "/me");
	}
});

useSeoMeta({
	title: "Início",
	titleTemplate: "%s | Cross Roads Reborn",
	description:
		"Construa sua história em Cross Roads Reborn, um RPG multiplayer de economia, combate e alianças. Trabalhe, invista, enfrente rivais e dispute rankings.",
	ogTitle: "Cross Roads Reborn | RPG multiplayer",
	ogDescription:
		"Trabalhe, invista, enfrente rivais e forme alianças em Cross Roads Reborn, um RPG multiplayer movido pelas escolhas dos jogadores.",
	ogType: "website",
	ogLocale: "pt_BR",
	ogSiteName: "Cross Roads Reborn",
	twitterCard: "summary",
	robots: "index, follow",
});
</script>

<template>
	<main class="game-home">
		<div
			class="game-home__ambience ambient-motion"
			aria-hidden="true"
		/>
		<header class="game-home__header">
			<NuxtImg
				:src="imagePaths.brand.logo"
				alt="Cross Roads Reborn"
				width="60"
			/>
			<BaseButton
				variant="secondary"
				size="sm"
				@click="auth.loginWithDiscord()"
			>
				<svg
					class="discord-icon"
					viewBox="0 0 24 24"
					fill="currentColor"
					width="14"
					height="14"
					aria-hidden="true"
				>
					<path
						d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
					/>
				</svg>
				Entrar com Discord
			</BaseButton>
		</header>

		<div
			v-if="errorMessage"
			class="error-banner"
			role="alert"
		>
			<AlertTriangle
				:size="18"
				aria-hidden="true"
			/>
			<span>{{ errorMessage }}</span>
		</div>

		<section class="game-home__hero motion-reveal">
			<div class="game-home__hero-copy">
				<h1>Uma cidade. Mil maneiras de chegar ao topo.</h1>
				<p class="game-home__intro">
					Construa sua história em Cross Roads Reborn: trabalhe, acumule riquezas, enfrente rivais e forme alianças em
					um mundo movido pelas escolhas dos jogadores.
				</p>
			</div>
			<NuxtImg
				class="game-home__hero-image"
				:src="imagePaths.gangBases.bikeclub2x"
				alt="Interior da base Bikeclub"
				width="1024"
				height="576"
				sizes="sm:100vw md:45vw lg:36rem"
				fetchpriority="high"
				:modifiers="{ fit: 'cover' }"
			/>
		</section>

		<div class="game-home__features">
			<section
				v-for="group in featureGroups"
				:key="group.title"
				class="game-home__feature-group"
			>
				<h2>{{ group.title }}</h2>
				<ul>
					<li
						v-for="feature in group.features"
						:key="feature.title"
						class="game-feature"
					>
						<component
							:is="feature.icon"
							:size="22"
							variant="solid"
							aria-hidden="true"
						/>
						<div>
							<h3>{{ feature.title }}</h3>
							<p>{{ feature.description }}</p>
						</div>
					</li>
				</ul>
			</section>
		</div>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;
@use "sass:color";

.game-home {
	position: relative;
	isolation: isolate;
	width: min(68rem, 100%);
	margin: 0 auto;
	padding: clamp(1.25rem, 4vw, 3rem);

	&__ambience {
		position: absolute;
		z-index: -1;
		top: -10rem;
		right: $spacing-xl;
		width: min(70vw, 48rem);
		aspect-ratio: 1;
		border-radius: 50%;
		background: radial-gradient(circle, rgba($color-brand, 0.11), rgba($color-special, 0.035) 42%, transparent 70%);
		filter: blur(12px);
		pointer-events: none;
		animation: landing-drift 16s ease-in-out infinite alternate;
	}

	> :not(.game-home__ambience) {
		position: relative;
		z-index: 1;
	}

	&__header {
		@include flex-between;
		gap: $spacing-md;
		flex-wrap: wrap;

		//@media (max-width: 425px){
		//	flex-direction: column;
		//}
	}

	.error-banner {
		width: 100%;
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		padding: 0.75rem $spacing-md;
		@include accent-surface($color-danger);
		border-radius: $radius-sm;
		color: color.adjust($color-danger, $lightness: 15%);
		font-size: $font-size-12;
		text-align: left;
		margin-top: 1.25rem;
	}

	&__hero {
		display: grid;
		grid-template-columns: minmax(0, 1.15fr) minmax(18rem, 0.85fr);
		align-items: center;
		gap: clamp($spacing-lg, 5vw, 4rem);
		margin: clamp(4rem, 12vh, 8rem) 0 $spacing-xl;

		@media (max-width: $bp-tablet) {
			grid-template-columns: 1fr;
		}
	}

	&__hero-image {
		display: block;
		width: 100%;
		aspect-ratio: 16 / 10;
		border: 1px solid $border-card;
		border-radius: $radius-md;
		object-fit: cover;
	}

	h1 {
		max-width: 42rem;
		font-size: clamp(2.5rem, 7vw, 4.5rem);
		font-weight: $font-weight-extrabold;
		line-height: 1.05;
	}

	&__intro {
		max-width: 38rem;
		margin-top: $spacing-md;
		color: $text-secondary;
		font-size: clamp(1rem, 2vw, 1.125rem);
		line-height: 1.7;
	}

	&__features {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		column-gap: $spacing-xl;
		row-gap: $spacing-lg;

		@media (max-width: $bp-tablet) {
			grid-template-columns: 1fr;
		}
	}

	&__feature-group {
		padding-top: $spacing-md;
		border-top: 1px solid $border-subtle;

		h2 {
			margin-bottom: $spacing-md;
			font-size: $font-size-20;
		}

		ul {
			display: grid;
			gap: $spacing-md;
			list-style: none;
		}
	}
}

.game-feature {
	display: grid;
	grid-template-columns: auto minmax(0, 1fr);
	align-items: start;
	gap: $spacing-sm;

	svg {
		margin-top: 0.125rem;
		color: $color-brand;
	}

	h3 {
		margin-bottom: $spacing-sm;
		font-size: $font-size-16;
		font-weight: $font-weight-bold;
	}

	p {
		color: $text-secondary;
		font-size: $font-size-16;
		line-height: 1.6;
	}
}

.motion-reveal {
	animation: reveal-up 0.5s $motion-ease-out both;
}

@keyframes landing-drift {
	from { transform: translate3d(-2%, -1%, 0) scale(0.96); }
	to { transform: translate3d(2%, 2%, 0) scale(1.04); }
}
</style>
