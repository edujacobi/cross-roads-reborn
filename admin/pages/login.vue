<script
	setup
	lang="ts"
>
import { AlertTriangle, ArrowLeft } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import { imagePaths } from "~/constants/imagePaths";

definePageMeta({
	layout: false,
});

useHead({
	title: "Login",
});

const route = useRoute();
const auth = useAuth();

const errorMessage = computed(() => {
	if (route.query.error) {
		return decodeURIComponent(String(route.query.error));
	}
	return null;
});

onMounted(async () => {
	await auth.initAuth();
	if (auth.isAuthenticated.value) {
		navigateTo(auth.hasAdminAccess.value ? "/admin/dashboard" : "/users");
	}
});
</script>

<template>
	<main class="login-container">
		<article class="login-card">
			<div class="brand-logo">
				<NuxtImg
					:src="imagePaths.brand.logo"
					class="img"
					alt="CROSS ROADS REBORN"
				/>
			</div>

			<p class="subtitle">Interface web</p>

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

			<aside class="info-box">
				<p>
					Entre com Discord para acessar os perfis dos jogadores. Membros
					<strong class="dev">Desenvolvedores</strong>, <strong class="mod">Moderadores</strong> e
					<strong class="helper">Ajudantes</strong>
					também podem acessar as ferramentas administrativas.
				</p>
			</aside>

			<div class="button-row">
				<BaseButton
					variant="primary"
					size="lg"
					class="discord-login-btn"
					@click="auth.loginWithDiscord()"
				>
					<svg
						class="discord-icon"
						viewBox="0 0 24 24"
						fill="currentColor"
						width="20"
						height="20"
						aria-hidden="true"
					>
						<path
							d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
						/>
					</svg>
					Entrar com Discord
				</BaseButton>
				<BaseButton
					to="/"
					variant="secondary"
					size="lg"
				>
					<ArrowLeft
						:size="16"
						aria-hidden="true"
					/>
					Voltar
				</BaseButton>
			</div>
		</article>
	</main>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;
@use "sass:color";

.login-container {
	@include flex-center;
	min-height: 100vh;
	background: radial-gradient(circle at center, #171b26 0%, $bg-main 70%);
	padding: 1.5rem;
}

.login-card {
	width: 100%;
	max-width: 27.5rem;
	@include card-surface;
	background-color: $bg-card;
	padding: 2.5rem $spacing-lg;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	box-shadow: $shadow-lg;

	// ponytail: compact padding on mobile devices
	@media (max-width: 480px) {
		padding: 1.5rem 1rem;
	}

	.brand-logo {
		@include flex-center;
		margin-bottom: 1.25rem;

		.img {
			max-width: 50%;
		}
	}

	.subtitle {
		font-size: 0.875rem;
		color: $text-secondary;
		margin-top: 0.375rem;
		margin-bottom: 1.5rem;
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
		font-size: 0.8125rem;
		text-align: left;
		margin-bottom: 1.25rem;
	}

	.info-box {
		width: 100%;
		padding: 0.875rem $spacing-md;
		background-color: $bg-input-field;
		border: 1px solid $border-subtle;
		border-radius: $radius-sm;
		font-size: 0.8125rem;
		color: $text-muted;
		margin-bottom: $spacing-lg;
		line-height: 1.5;

		.dev {
			color: $color-developer;
		}
		.mod {
			color: $color-moderator;
		}
		.helper {
			color: $color-helper;
		}
	}

	.button-row{
		display: flex;
		align-items: stretch;
		gap: $spacing-sm;
		flex-direction: column;
		width: 100%;
	}

	.discord-login-btn {
		width: 100%;
		background-color: #5865f2;
		color: #fff;
		border-color: #4752c4;

		&:hover {
			background-color: color.adjust(#5865f2, $lightness: 5%) !important;
		}

		.discord-icon {
			fill: currentColor;
		}
	}
}
</style>
