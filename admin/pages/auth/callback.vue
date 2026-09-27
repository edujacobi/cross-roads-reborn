<script
	setup
	lang="ts"
>
definePageMeta({
	layout: false,
});

const route = useRoute();
const auth = useAuth();
const error = ref<string | null>(null);

onMounted(async () => {
	const token = route.query.token as string;
	if (!token) {
		error.value = "Nenhum token fornecido na resposta de autenticação.";
		setTimeout(() => navigateTo("/login"), 3000);
		return;
	}

	try {
		await auth.setToken(token);
		navigateTo("/");
	} catch (err) {
		error.value = `Falha ao processar token de autenticação: ${err}`;
		setTimeout(() => navigateTo("/login"), 3000);
	}
});
</script>

<template>
	<main class="callback-container">
		<article class="callback-card">
			<div
				v-if="!error"
				class="loading-state"
				role="status"
			>
				<div
					class="spinner"
					aria-hidden="true"
				/>
				<h1>Autenticando...</h1>
				<p>Validando permissões e conectando ao Cross Roads Admin.</p>
			</div>

			<div
				v-else
				class="error-state"
				role="alert"
			>
				<h1>Erro na Autenticação</h1>
				<p>{{ error }}</p>
				<p>Redirecionando para o login em instantes...</p>
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

.callback-container {
	@include flex-center;
	min-height: 100vh;
	background-color: $bg-main;
}

.callback-card {
	@include card-surface;
	padding: 2.5rem;
	text-align: center;
	max-width: 25rem;
	width: 90%;

	.spinner {
		width: 3rem;
		height: 3rem;
		border: 3px solid $border-subtle;
		border-top-color: $color-brand;
		border-radius: 50%;
		margin: 0 auto 1.25rem;
		animation: spin 0.8s linear infinite;
	}

	h1 {
		font-size: 1.125rem;
		font-weight: 700;
		color: $text-primary;
		margin-bottom: $spacing-sm;
		margin-top: 0;
	}

	p {
		font-size: 0.875rem;
		color: $text-secondary;
	}

	.error-state {
		h1 {
			color: $color-danger;
		}

		p:last-child {
			display: block;
			font-size: 0.75rem;
			color: $text-muted;
			margin-top: $spacing-md;
		}
	}
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}
</style>
