<script
	setup
	lang="ts"
>
import { Activity, LayoutDashboard, LogOut, Users } from "lucide-vue-next";
import BaseBadge from "~/components/ui/BaseBadge.vue";

const auth = useAuth();
const route = useRoute();

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
	>
		<div class="spinner" />
		<p>Carregando painel administrativo...</p>
	</div>

	<div
		v-else-if="auth.isAuthenticated.value"
		class="admin-layout"
	>
		<!-- Sidebar -->
		<aside class="sidebar">
			<div class="brand">
				<div class="brand-icon">
					<NuxtImg
						src="brand/CrossRoadsLogo.png"
						class="img"
					/>
				</div>
				<div class="brand-text">
					<h2>CROSS ROADS</h2>
					<span>Painel Admin</span>
				</div>
			</div>

			<nav class="nav-links">
				<NuxtLink
					to="/"
					:class="['nav-item', { active: route.path === '/' }]"
				>
					<LayoutDashboard :size="18" />
					Dashboard
				</NuxtLink>

				<NuxtLink
					to="/users"
					:class="['nav-item', { active: route.path.startsWith('/users') }]"
				>
					<Users :size="18" />
					Jogadores
				</NuxtLink>
			</nav>

			<!-- User Info & Logout at Bottom -->
			<div class="admin-profile">
				<NuxtImg
					:src="auth.user.value?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'"
					alt="Avatar"
					class="admin-avatar"
				/>
				<div class="admin-details">
					<span class="admin-name">{{ auth.user.value?.username }}</span>
					<BaseBadge :variant="auth.isDeveloper.value ? 'developer' : 'moderator'">
						{{ auth.user.value?.role }}
					</BaseBadge>
				</div>
				<button
					type="button"
					class="logout-btn"
					title="Encerrar sessão"
					@click="auth.logout()"
				>
					<LogOut :size="18" />
				</button>
			</div>
		</aside>

		<!-- Main Content Area -->
		<div class="main-content-wrapper">
			<header class="top-header">
				<div class="header-status">
					<Activity
						:size="16"
						class="pulse-icon"
					/>
					Servidor Ativo
				</div>

				<div class="header-role-indicator">
					<span
						v-if="auth.isDeveloper.value"
						class="role-hint dev"
					>
						Permissão: Leitura & Escrita
					</span>
					<span
						v-else
						class="role-hint mod"
					>
						Permissão: Apenas Leitura
					</span>
				</div>
			</header>

			<main class="page-content">
				<slot />
			</main>
		</div>
	</div>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;
@use "sass:color";

.loading-screen {
	@include flex-center;
	flex-direction: column;
	height: 100vh;
	gap: 16px;
	color: $text-secondary;

	.spinner {
		width: 40px;
		height: 40px;
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

.sidebar {
	width: 260px;
	background-color: $bg-sidebar;
	border-right: 1px solid $border-subtle;
	display: flex;
	flex-direction: column;
	flex-shrink: 0;

	.brand {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 24px 20px;
		border-bottom: 1px solid $border-subtle;

		.brand-icon {
			@include flex-center;
			width: 40px;
			height: 40px;
			color: $color-brand;

			.img {
				max-width: 100%;
			}
		}

		.brand-text {
			h2 {
				font-size: 0.9375rem;
				font-weight: 800;
				letter-spacing: 0.05em;
				color: $text-primary;
			}

			span {
				font-size: 0.75rem;
				color: $text-muted;
			}
		}
	}

	.nav-links {
		flex: 1;
		padding: 16px 12px;
		display: flex;
		flex-direction: column;
		gap: 4px;

		.nav-item {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 10px 14px;
			border-radius: $radius-sm;
			font-size: 0.875rem;
			font-weight: 500;
			color: $text-secondary;
			transition: all 0.15s ease-in-out;

			&:hover {
				background-color: $bg-card-hover;
				color: $text-primary;
			}

			&.active {
				background-color: rgba($color-brand, 0.12);
				color: $color-brand;
				font-weight: 600;
			}
		}
	}

	.admin-profile {
		padding: 16px;
		border-top: 1px solid $border-subtle;
		display: flex;
		align-items: center;
		gap: 10px;
		background-color: rgba($bg-input, 0.5);

		.admin-avatar {
			width: 38px;
			height: 38px;
			border-radius: 50%;
			border: 1px solid $border-subtle;
		}

		.admin-details {
			flex: 1;
			overflow: hidden;

			.admin-name {
				display: block;
				font-size: 0.8125rem;
				font-weight: 600;
				color: $text-primary;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}

		.logout-btn {
			background: transparent;
			border: none;
			color: $text-muted;
			cursor: pointer;
			padding: 6px;
			border-radius: $radius-xs;
			transition: all 0.15s;

			&:hover {
				color: $color-danger;
				background-color: rgba($color-danger, 0.15);
			}
		}
	}
}

.main-content-wrapper {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.top-header {
	height: 60px;
	background-color: $bg-sidebar;
	border-bottom: 1px solid $border-subtle;
	@include flex-between;
	padding: 0 28px;

	.header-status {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.8125rem;
		color: $color-success;

		.pulse-icon {
			animation: pulse 2s infinite;
		}
	}

	.role-hint {
		font-size: 0.75rem;
		padding: 4px 10px;
		border-radius: $radius-full;
		font-weight: 500;

		&.dev {
			background-color: rgba($color-developer, 0.15);
			color: color.adjust($color-developer, $lightness: 15%);
		}

		&.mod {
			background-color: rgba($color-moderator, 0.15);
			color: color.adjust($color-moderator, $lightness: 20%);
		}
	}
}

@keyframes pulse {

	0%,
	100% {
		opacity: 1;
	}

	50% {
		opacity: 0.4;
	}
}

.page-content {
	flex: 1;
	overflow-y: auto;
	padding: 28px;
	@include scrollbar-custom;
}
</style>
