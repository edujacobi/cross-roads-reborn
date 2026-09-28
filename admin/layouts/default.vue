<script
	setup
	lang="ts"
>
import Sidebar from "~/components/Sidebar.vue";
import TopHeader from "~/components/TopHeader.vue";

const auth = useAuth();
onMounted(() => {
	auth.initAuth();
});

watch(
	() => [auth.loading.value, auth.isAuthenticated.value],
	([loading, authenticated]) => {
		if (!loading && !authenticated) {
			navigateTo("/login");
		}
	},
	{ immediate: true },
);
</script>

<template>
	<div
		v-if="auth.loading.value"
		class="loading-screen"
		role="status"
	>
		<div
			class="spinner"
			aria-hidden="true"
		/>
		<p>Carregando painel administrativo...</p>
	</div>

	<div
		v-else-if="auth.isAuthenticated.value"
		class="admin-layout"
	>
		<Sidebar />

		<!-- Main Content Area -->
		<div class="main-content-wrapper">
			<div class="page-content">
				<slot />
			</div>
		</div>
	</div>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.loading-screen {
	@include flex-center;
	flex-direction: column;
	height: 100vh;
	gap: $spacing-md;
	color: $text-secondary;

	.spinner {
		width: 2.5rem;
		height: 2.5rem;
		border: 3px solid $border-subtle;
		border-top-color: $color-brand;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.admin-layout {
	display: flex;
	height: 100vh;
	overflow: hidden;
}

.main-content-wrapper {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.page-content {
	flex: 1;
	overflow-y: auto;
	padding: $spacing-lg;
	@include scrollbar-custom;
}
</style>
