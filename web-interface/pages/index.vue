<script
	setup
	lang="ts"
>
import { Coins, LogIn, Swords, UsersRound } from "lucide-vue-next";
import { onMounted, onUnmounted, ref, watch } from "vue";
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
const glowElement = ref<HTMLDivElement | null>(null);
const { motionEnabled } = useMotionPreferences();
let pointerFrame = 0;

const handleMouseMove = (e: MouseEvent) => {
	glowX.value = e.clientX;
	glowY.value = e.clientY;
	if (!pointerFrame) {
		pointerFrame = requestAnimationFrame(() => {
			if (glowElement.value) {
				glowElement.value.style.transform = `translate3d(${glowX.value}px, ${glowY.value}px, 0)`;
			}
			pointerFrame = 0;
		});
	}
};

function syncPointerGlow(enabled: boolean) {
	const supportsPointerGlow = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
	if (enabled && supportsPointerGlow) {
		window.addEventListener("mousemove", handleMouseMove, { passive: true });
		return;
	}
	window.removeEventListener("mousemove", handleMouseMove);
	if (pointerFrame) cancelAnimationFrame(pointerFrame);
	pointerFrame = 0;
}

watch(motionEnabled, syncPointerGlow);
onMounted(() => syncPointerGlow(motionEnabled.value));
onUnmounted(() => {
	window.removeEventListener("mousemove", handleMouseMove);
	if (pointerFrame) cancelAnimationFrame(pointerFrame);
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
		<div
			ref="glowElement"
			class="mouse-glow ambient-motion"
			aria-hidden="true"
		/>
		<header class="game-home__header motion-reveal">
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

		<section class="game-home__hero motion-reveal">
			<p class="game-home__eyebrow">RPG multiplayer</p>
			<h1>Uma cidade. Mil maneiras de chegar ao topo.</h1>
			<p class="game-home__intro">
				Construa sua história em Cross Roads Reborn: trabalhe, acumule riquezas, enfrente rivais e forme alianças em um
				mundo movido pelas escolhas dos jogadores.
			</p>
		</section>

		<section
			class="game-home__features motion-reveal"
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
			class="game-home__features motion-reveal"
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
@use "~/assets/scss/mixins" as *;

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
		right: -12rem;
		width: min(70vw, 48rem);
		aspect-ratio: 1;
		border-radius: 50%;
		background: radial-gradient(circle, rgba($color-brand, 0.11), rgba($color-special, 0.035) 42%, transparent 70%);
		filter: blur(12px);
		pointer-events: none;
		animation: landing-drift 16s ease-in-out infinite alternate;
	}

	> :not(.game-home__ambience, .mouse-glow) {
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

	&__hero {
		max-width: 48rem;
		margin: clamp(4rem, 12vh, 8rem) 0 $spacing-xl;
	}

	&__eyebrow {
		margin-bottom: $spacing-sm;
		color: $color-brand;
		font-size: $font-size-12;
		font-weight: $font-weight-bold;
		letter-spacing: 0.1em;
		text-transform: uppercase;
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
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: $spacing-md;

		@media (max-width: 700px) {
			grid-template-columns: 1fr;
		}
	}

	&__features-description {
		margin: $spacing-xl 0 $spacing-lg;
		font-size: $font-size-16;
		font-weight: $font-weight-semibold;
		color: $text-secondary;
	}
}

.game-feature {
	padding: $spacing-lg;
	background: $bg-card;
	border: 1px solid $border-card;
	border-radius: $radius-md;
	transition: transform $transition-normal $motion-ease-out, border-color $transition-normal ease, box-shadow $transition-normal ease;

	@media (hover: hover) and (pointer: fine) {
		&:hover {
			border-color: rgba($color-brand, 0.42);
			box-shadow: 0 0 20px rgba($color-brand, 0.08);
		}
	}

	svg {
		margin-bottom: $spacing-md;
		color: $color-brand;
	}

	h2 {
		margin-bottom: $spacing-sm;
		font-size: $font-size-16;
		font-weight: $font-weight-bold;
	}

	p {
		color: $text-secondary;
		font-size: $font-size-14;
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
	background: radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%);
	z-index: 0;
	will-change: transform;
}

.motion-reveal {
	animation: reveal-up 0.5s $motion-ease-out both;
}

.game-home__features .game-feature {
	animation: reveal-up 0.5s $motion-ease-out both;

	@for $index from 1 through 6 {
		&:nth-child(#{$index}) {
			animation-delay: #{$index * 35}ms;
		}
	}
}

@keyframes landing-drift {
	from { transform: translate3d(-2%, -1%, 0) scale(0.96); }
	to { transform: translate3d(2%, 2%, 0) scale(1.04); }
}
</style>
