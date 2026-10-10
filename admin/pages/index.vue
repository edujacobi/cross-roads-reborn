<script
	setup
	lang="ts"
>
import { Coins, LogIn, Swords, UsersRound } from "lucide-vue-next";
import { onMounted, onUnmounted, ref } from "vue";
import GangIcon from "~/components/icons/GangIcon.vue";
import HospitalIcon from "~/components/icons/HospitalIcon.vue";
import JobsIcon from "~/components/icons/JobsIcon.vue";
import PrisonIcon from "~/components/icons/PrisonIcon.vue";
import ShopIcon from "~/components/icons/ShopIcon.vue";
import TrophyIcon from "~/components/icons/TrophyIcon.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import { imagePaths } from "~/constants/imagePaths";

definePageMeta({
	layout: false,
});

const glowX = ref(0);
const glowY = ref(0);

const handleMouseMove = (e: MouseEvent) => {
	glowX.value = e.clientX;
	glowY.value = e.clientY;
};

onMounted(() => {
	window.addEventListener("mousemove", handleMouseMove);
});

onUnmounted(() => {
	window.removeEventListener("mousemove", handleMouseMove);
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
	<div
		class="mouse-glow"
		:style="{ left: `${glowX}px`, top: `${glowY}px` }"
	/>
	<main class="game-home">
		<header class="game-home__header">
			<NuxtImg
				:src="imagePaths.brand.logo"
				alt="Cross Roads Reborn"
				width="60"
			/>
			<BaseButton
				to="/login"
				variant="secondary"
				size="sm"
			>
				<LogIn :size="16" />
				Entrar
			</BaseButton>
		</header>

		<section class="game-home__hero">
			<p class="game-home__eyebrow">RPG multiplayer</p>
			<h1>Uma cidade. Mil maneiras de chegar ao topo.</h1>
			<p class="game-home__intro">
				Construa sua história em Cross Roads Reborn: trabalhe, acumule riquezas, enfrente rivais e forme alianças em um
				mundo movido pelas escolhas dos jogadores.
			</p>
		</section>

		<section
			class="game-home__features"
			aria-label="Sobre o jogo"
		>
			<article class="game-feature">
				<Coins
					:size="24"
					aria-hidden="true"
				/>
				<h2>Construa sua fortuna</h2>
				<p>Trabalhe, invista, explore e administre seu dinheiro para avançar na economia do jogo.</p>
			</article>

			<article class="game-feature">
				<Swords
					:size="24"
					aria-hidden="true"
				/>
				<h2>Encare desafios</h2>
				<p>Escolha sua classe, equipe-se e dispute espaço em combates, apostas e outras atividades.</p>
			</article>

			<article class="game-feature">
				<UsersRound
					:size="24"
					aria-hidden="true"
				/>
				<h2>Jogue em comunidade</h2>
				<p>Crie ou participe de uma gangue, colabore com outros jogadores e dispute rankings.</p>
			</article>
		</section>

		<p class="game-home__features-description">Saiba o que é possível em Cross Roads Reborn:</p>

		<section
			class="game-home__features"
			aria-label="Características do jogo"
		>
			<article class="game-feature">
				<JobsIcon
					:size="26"
					variant="solid"
					aria-hidden="true"
				/>
				<h2>Escolha seu emprego</h2>
				<p>De açougueiro a espião, cada profissão oferece ganhos garantidos diferentes.</p>
			</article>

			<article class="game-feature">
				<PrisonIcon
					:size="26"
					variant="solid"
					aria-hidden="true"
				/>
				<h2>Cumpra pena</h2>
				<p>Erros têm consequência: fique na prisão ou tente fugir, por sua conta e risco.</p>
			</article>

			<article class="game-feature">
				<HospitalIcon
					:size="26"
					variant="solid"
					aria-hidden="true"
				/>
				<h2>Sem plano de saúde</h2>
				<p>Recupere sua saúde no hospital após brigas ou acidentes para continuar jogando.</p>
			</article>

			<article class="game-feature">
				<ShopIcon
					:size="26"
					variant="solid"
					aria-hidden="true"
				/>
				<h2>Leve itens</h2>
				<p>Compre armas e acessórios para se equipar e se liberar novos alvos.</p>
			</article>

			<article class="game-feature">
				<GangIcon
					:size="26"
					variant="solid"
					aria-hidden="true"
				/>
				<h2>Gangues</h2>
				<p>Forme sua gangue e domine a cidade com seus aliados.</p>
			</article>

			<article class="game-feature">
				<TrophyIcon
					:size="26"
					variant="solid"
					aria-hidden="true"
				/>
				<h2>Rankings</h2>
				<p>Dispute o topo das classificações por riqueza, combates e influência.</p>
			</article>
		</section>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.game-home {
	width: min(68rem, 100%);
	margin: 0 auto;
	padding: clamp(1.25rem, 4vw, 3rem);

	&__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $spacing-md;
		flex-wrap: wrap;

		//@media (max-width: 425px){
		//	flex-direction: column;
		//}
	}

	&__hero {
		max-width: 48rem;
		margin: clamp(4rem, 12vh, 8rem) 0 $spacing-xl;
	}

	&__eyebrow {
		margin-bottom: $spacing-sm;
		color: $color-brand;
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	h1 {
		max-width: 42rem;
		font-size: clamp(2.5rem, 7vw, 4.5rem);
		font-weight: 800;
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
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: $spacing-md;

		@media (max-width: 700px) {
			grid-template-columns: 1fr;
		}
	}

	&__features-description {
		margin: $spacing-xl 0 $spacing-lg;
		font-size: 1rem;
		font-weight: 600;
		color: $text-secondary;
	}
}

.game-feature {
	padding: $spacing-lg;
	background: $bg-card;
	border: 1px solid $border-card;
	border-radius: $radius-md;

	svg {
		margin-bottom: $spacing-md;
		color: $color-brand;
	}

	h2 {
		margin-bottom: $spacing-sm;
		font-size: 1rem;
		font-weight: 700;
	}

	p {
		color: $text-secondary;
		font-size: 0.875rem;
		line-height: 1.6;
	}
}

.mouse-glow {
	position: fixed;
	top: 0;
	left: 0;
	width: 400px;
	height: 400px;
	margin-left: -200px;
	margin-top: -200px;
	pointer-events: none;
	background: radial-gradient(circle, rgba(34, 197, 94, 0.12) 0%, transparent 70%);
	z-index: 0;
	transition: left 0.05s ease-out, top 0.05s ease-out;
}
</style>
