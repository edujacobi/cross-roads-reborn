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
	<div class="callback-container">
		<div class="callback-card">
			<div
				v-if="!error"
				class="loading-state"
			>
				<div class="spinner" />
				<h2>Autenticando...</h2>
				<p>Validando permissões e conectando ao Cross Roads Admin.</p>
			</div>

			<div
				v-else
				class="error-state"
			>
				<h2>Erro na Autenticação</h2>
				<p>{{ error }}</p>
				<span>Redirecionando para o login em instantes...</span>
			</div>
		</div>
	</div>
</template>

<style
	lang="scss"
	scoped
>
.callback-container {
	@include flex-center;
	min-height: 100vh;
	background-color: $bg-main;
}

.callback-card {
	@include card-surface;
	padding: 40px;
	text-align: center;
	max-width: 400px;
	width: 90%;

	.spinner {
		width: 48px;
		height: 48px;
		border: 3px solid $border-subtle;
		border-top-color: $color-brand;
		border-radius: 50%;
		margin: 0 auto 20px;
		animation: spin 0.8s linear infinite;
	}

	h2 {
		font-size: 1.125rem;
		font-weight: 700;
		color: $text-primary;
		margin-bottom: 8px;
	}

	p {
		font-size: 0.875rem;
		color: $text-secondary;
	}

	.error-state {
		h2 {
			color: $color-danger;
		}

		span {
			display: block;
			font-size: 0.75rem;
			color: $text-muted;
			margin-top: 16px;
		}
	}
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}
</style>
