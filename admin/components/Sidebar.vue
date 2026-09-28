<script
	setup
	lang="ts"
>
import { LayoutDashboard, LogOut, Users } from "lucide-vue-next";
import { imagePaths } from "~/constants/imagePaths";

const auth = useAuth();
const route = useRoute();

const user = computed(() => {
	const authUser = auth.user.value;
	const mapRole = {
		["DEVELOPER"]: {
			description: "Desenvolvedor",
			image: "/images/badges/Developer.png",
		},
		["MODERATOR"]: {
			description: "Moderador",
			image: "/images/badges/Moderator.png",
		},
	};

	if (!authUser) {
		return;
	}

	return {
		id: authUser.userId,
		username: authUser.username,
		avatarUrl: authUser.avatar || "https://cdn.discordapp.com/embed/avatars/0.png",
		imageAlt: authUser.username ? `Avatar de ${authUser.username}` : "Avatar do administrador",
		role: mapRole[authUser.role],
	};
});
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
					alt="CROSS ROADS"
				/>
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
			<NuxtLink
				:to="'/users/' + user?.id"
				class="admin-info"
			>
				<NuxtImg
					:src="user?.avatarUrl"
					:alt="user?.imageAlt"
					class="admin-avatar"
				/>
				<div class="admin-details">
					<span class="admin-name">{{ user?.username }}</span>
					<p class="admin-role">
						<NuxtImg
							:src="user?.role.image"
							class="img-role"
						/>
						{{ user?.role.description }}
					</p>
				</div>
			</NuxtLink>
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
@use "sass:color";

.sidebar {
	width: 16.25rem;
	background-color: $bg-sidebar;
	border-right: 1px solid $border-subtle;
	display: flex;
	flex-direction: column;
	flex-shrink: 0;

	.brand {
		@include flex-center;
		padding: 1.5rem 1.25rem;
		border-bottom: 1px solid $border-subtle;

		.brand-icon {
			@include flex-center;
			width: 7rem;
			height: 2.5rem;
			color: $color-brand;

			.img {
				max-width: 100%;
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
		border-top: 1px solid $border-subtle;
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		padding: $spacing-sm;
		justify-content: space-between;
		background-color: rgba($bg-input, 0.5);

		.admin-info {
			display: flex;
			gap: $spacing-sm;
			border-radius: $radius-sm;
			padding: $spacing-sm 1rem $spacing-sm $spacing-sm;
			transition: all 0.15s;

			&:hover {
				background-color: $border-subtle;
			}
		}

		.admin-avatar {
			width: 2.375rem;
			height: 2.375rem;
			border-radius: 50%;
			border: 1px solid $border-subtle;
		}

		.admin-role {
			color: $text-secondary;
			font-size: 0.85rem;
			display: flex;
			align-items: center;
			gap: $spacing-xs;

			.img-role {
				width: 16px;
			}
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
			@include flex-center;
			background: transparent;
			border: none;
			color: $text-muted;
			cursor: pointer;
			padding: 0.375rem;
			border-radius: $radius-xs;
			transition: all 0.15s;
			margin-right: 0.25rem;

			&:hover {
				color: $color-danger;
				background-color: rgba($color-danger, 0.15);
			}
		}
	}

	// ponytail: horizontal navbar layout on mobile with scrollable nav options and fixed profile
	@media (max-width: 768px) {
		width: 100%;
		flex-direction: row;
		align-items: center;
		border-right: none;
		border-bottom: 1px solid $border-subtle;

		.brand {
			flex-shrink: 0;
			padding: 0.75rem 1rem;
			border-bottom: none;

			.brand-icon {
				width: 5rem;
				height: 2rem;
			}
		}

		.nav-links {
			flex: 1;
			min-width: 0;
			flex-direction: row;
			overflow-x: auto;
			overflow-y: hidden;
			padding: 0.5rem;
			gap: 0.25rem;
			@include scrollbar-custom;

			.nav-item {
				flex-shrink: 0;
				white-space: nowrap;
				padding: 0.5rem 0.75rem;
				font-size: 0.8125rem;
			}
		}

		.admin-profile {
			flex-shrink: 0;
			border-top: none;
			padding: 0.5rem 0.75rem;
			background-color: transparent;

			.admin-info {
				padding: 0.25rem;
			}

			.admin-details {
				display: none;
			}
		}
	}

	@media (max-width: 520px) {
		.brand {
			padding: 0.5rem;

			.brand-icon {
				width: 3.75rem;
			}
		}

		.nav-links {
			padding: 0.25rem;

			.nav-item {
				padding: 0.375rem 0.5rem;
				gap: 6px;
			}
		}

		.admin-profile {
			padding: 0.25rem 0.5rem;
		}
	}
}
</style>
