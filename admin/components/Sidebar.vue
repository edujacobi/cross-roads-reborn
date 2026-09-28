<script
	setup
	lang="ts"
>
import { LayoutDashboard, LogOut, Users } from "lucide-vue-next";
import BaseBadge from "~/components/ui/BaseBadge.vue";
import { imagePaths } from "~/constants/imagePaths";

const auth = useAuth();
const route = useRoute();
</script>

<template>
	<aside
		class="sidebar"
		aria-label="Painel administrativo"
	>
		<div class="brand">
			<div class="brand-icon">
				<NuxtImg
					:src="imagePaths.brand.logo"
					class="img"
					alt=""
				/>
			</div>
			<div class="brand-text">
				<p class="brand-name">CROSS ROADS</p>
				<span>Painel Admin</span>
			</div>
		</div>

		<nav
			class="nav-links"
			aria-label="Navegação principal"
		>
			<NuxtLink
				to="/"
				:class="['nav-item', { active: route.path === '/' }]"
			>
				<LayoutDashboard
					:size="18"
					aria-hidden="true"
				/>
				Dashboard
			</NuxtLink>

			<NuxtLink
				to="/users"
				:class="['nav-item', { active: route.path.startsWith('/users') }]"
			>
				<Users
					:size="18"
					aria-hidden="true"
				/>
				Jogadores
			</NuxtLink>
		</nav>

		<div class="admin-profile">
			<NuxtImg
				:src="auth.user.value?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'"
				:alt="auth.user.value?.username ? `Avatar de ${auth.user.value.username}` : 'Avatar do administrador'"
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
				aria-label="Encerrar sessão"
				@click="auth.logout()"
			>
				<LogOut
					:size="18"
					aria-hidden="true"
				/>
			</button>
		</div>
	</aside>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.sidebar {
	width: 16.25rem;
	background-color: $bg-sidebar;
	border-right: 1px solid $border-subtle;
	display: flex;
	flex-direction: column;
	flex-shrink: 0;

	.brand {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 1.5rem 1.25rem;
		border-bottom: 1px solid $border-subtle;

		.brand-icon {
			@include flex-center;
			width: 2.5rem;
			height: 2.5rem;
			color: $color-brand;

			.img {
				max-width: 100%;
			}
		}

		.brand-text {
			.brand-name {
				font-size: 0.9375rem;
				font-weight: 800;
				letter-spacing: 0.05em;
				color: $text-primary;
				margin: 0;
			}

			span {
				font-size: 0.75rem;
				color: $text-muted;
			}
		}
	}

	.nav-links {
		flex: 1;
		padding: $spacing-md 0.75rem;
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;

		.nav-item {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 0.625rem 0.875rem;
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
		padding: $spacing-md;
		border-top: 1px solid $border-subtle;
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		background-color: rgba($bg-input, 0.5);

		.admin-avatar {
			width: 2.375rem;
			height: 2.375rem;
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
			padding: 0.375rem;
			border-radius: $radius-xs;
			transition: all 0.15s;

			&:hover {
				color: $color-danger;
				background-color: rgba($color-danger, 0.15);
			}
		}
	}
}
</style>
