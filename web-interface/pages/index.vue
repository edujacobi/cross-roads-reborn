<script
	setup
	lang="ts"
>
import { AlertTriangle } from "@lucide/vue";
import { onMounted, onUnmounted, ref, watch } from "vue";
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

const glowX = ref(0);
const glowY = ref(0);
const glowElement = ref<HTMLDivElement | null>(null);
const { motionEnabled } = useMotionPreferences();
let pointerFrame = 0;

const route = useRoute();
const auth = useAuth();

const errorMessage = computed(() => {
	return typeof route.query.error === "string" ? route.query.error : null;
});

onMounted(async () => {
	await auth.initAuth();
	if (auth.isAuthenticated.value) {
		await navigateTo(auth.hasAdminAccess.value ? "/admin/dashboard" : "/me");
	}
});

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
			<p class="game-home__eyebrow">RPG multiplayer</p>
			<h1>Uma cidade. Mil maneiras de chegar ao topo.</h1>
			<p class="game-home__intro">
				Construa sua história em Cross Roads Reborn: trabalhe, acumule riquezas, enfrente rivais e forme alianças em um
				mundo movido pelas escolhas dos jogadores.
			</p>
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
				<h2>Jogue em equipe</h2>
				<p>Forme sua gangue e domine a cidade com seus aliados.</p>
			</article>

			<article class="game-feature">
				<TrophyIcon
					:size="26"
					variant="solid"
					aria-hidden="true"
				/>
				<h2>Conquiste o topo</h2>
				<p>Dispute o ranking das classificações por riqueza, combates e influência.</p>
			</article>

			<article class="game-feature">
				<CasinoIcon
					:size="26"
					variant="solid"
					aria-hidden="true"
				/>
				<h2>Arrisque no cassino</h2>
				<p>Teste sua sorte em jogos de cassino e tente multiplicar seus ganhos.</p>
			</article>

			<article class="game-feature">
				<InvestmentIcon
					:size="26"
					variant="solid"
					aria-hidden="true"
				/>
				<h2>Invista seu dinheiro</h2>
				<p>Aplique seus recursos para fazer seu patrimônio crescer.</p>
			</article>

			<article class="game-feature">
				<RobberyIcon
					:size="26"
					variant="solid"
					aria-hidden="true"
				/>
				<h2>Planeje roubos</h2>
				<p>Busque recompensas em roubos, mas cuidado com as consequências.</p>
			</article>

			<article class="game-feature">
				<BeatUpIcon
					:size="26"
					variant="solid"
					aria-hidden="true"
				/>
				<h2>Entre em brigas</h2>
				<p>Enfrente outros jogadores em combates e prove sua força.</p>
			</article>

			<article class="game-feature">
				<ScavengeIcon
					:size="26"
					variant="solid"
					aria-hidden="true"
				/>
				<h2>Vasculhe a cidade</h2>
				<p>Procure itens e recursos úteis para sua jornada.</p>
			</article>

			<article class="game-feature">
				<SpecialShopIcon
					:size="26"
					variant="solid"
					aria-hidden="true"
				/>
				<h2>Personalize seu estilo</h2>
				<p>Use skins e customizações para deixar seu personagem com a sua cara.</p>
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

	@for $index from 1 through 12 {
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
