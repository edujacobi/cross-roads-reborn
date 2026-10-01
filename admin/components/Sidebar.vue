<script
	setup
	lang="ts"
>
import { CalendarDays, CalendarSync, LayoutDashboard, LogOut, Menu, Trophy, Users, X } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import { imagePaths } from "~/constants/imagePaths";

const auth = useAuth();
const route = useRoute();
const mobileMenu = ref<HTMLInputElement | null>(null);
const isLogoutModalOpen = ref(false);

watch(
	() => route.path,
	() => {
		if (mobileMenu.value) {
			mobileMenu.value.checked = false;
		}
	},
);

const user = computed(() => {
	const authUser = auth.user.value;
	const mapRole = {
		DEVELOPER: {
			description: "Desenvolvedor",
			image: "/images/badges/Developer.png",
		},
		MODERATOR: {
			description: "Moderador",
			image: "/images/badges/Moderator.png",
		},
		HELPER: {
			description: "Ajudante",
			image: "/images/badges/Helper.png",
		},
	};

	if (!authUser) {
		return;
	}

	return {
		id: authUser.userId,
		username: authUser.username,
		avatarUrl: authUser.avatar || "https://cdn.discordapp.com/embed/avatars/0.png",
		avatarDecoration: authUser.avatarDecoration || "default",
		role: mapRole[authUser.role],
	};
});
</script>

<template>
	<input
		id="mobile-menu-toggle"
		ref="mobileMenu"
		class="mobile-menu-toggle"
		type="checkbox"
		aria-label="Menu de navegação"
		aria-controls="admin-sidebar"
	>
	<!-- biome-ignore lint/a11y/noLabelWithoutControl: External labels toggle the CSS-controlled checkbox. -->
	<label
		for="mobile-menu-toggle"
		class="mobile-menu-open"
		aria-hidden="true"
	>
		<Menu
			:size="24"
			aria-hidden="true"
		/>
	</label>
	<!-- biome-ignore lint/a11y/noLabelWithoutControl: External labels toggle the CSS-controlled checkbox. -->
	<label
		for="mobile-menu-toggle"
		class="sidebar-backdrop"
		aria-hidden="true"
	/>
	<aside
		id="admin-sidebar"
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
			<!-- biome-ignore lint/a11y/noLabelWithoutControl: External labels toggle the CSS-controlled checkbox. -->
			<label
				for="mobile-menu-toggle"
				class="mobile-menu-close"
				aria-hidden="true"
			>
				<X
					:size="24"
					aria-hidden="true"
				/>
			</label>
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

			<NuxtLink
				to="/events"
				:class="['nav-item', { active: route.path.startsWith('/events') }]"
			>
				<CalendarDays
					:size="18"
					aria-hidden="true"
				/>
				Eventos
			</NuxtLink>

			<NuxtLink
				to="/season"
				:class="['nav-item', { active: route.path === '/season' }]"
			>
				<CalendarSync
					:size="18"
					aria-hidden="true"
				/>
				Temporada
			</NuxtLink>

			<NuxtLink
				to="/rankings"
				:class="['nav-item', { active: route.path.startsWith('/rankings') }]"
			>
				<Trophy
					:size="18"
					aria-hidden="true"
				/>
				Rankings
			</NuxtLink>
		</nav>

		<div class="admin-profile">
			<NuxtLink
				:to="`/users/${user?.id}`"
				class="admin-info"
				aria-label="Meu inventário"
			>
				<NuxtImg
					:src="user?.avatarUrl"
					:class="['admin-avatar', 'user-avatar', `user-avatar--${user?.avatarDecoration}`]"
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
				@click="isLogoutModalOpen = true"
			>
				<LogOut
					:size="18"
					aria-hidden="true"
				/>
			</button>
		</div>
	</aside>

	<BaseModal
		:open="isLogoutModalOpen"
		title="Encerrar sessão"
		description="Tem certeza de que deseja sair da sua conta?"
		@update:open="isLogoutModalOpen = $event"
	>
		<template #footer>
			<BaseButton
				variant="secondary"
				@click="isLogoutModalOpen = false"
			>
				Cancelar
			</BaseButton>
			<BaseButton
				variant="danger"
				@click="auth.logout()"
			>
				Sair
			</BaseButton>
		</template>
	</BaseModal>
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
		flex-shrink: 0;
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

		.mobile-menu-close {
			display: none;
			margin-left: auto;
			color: $text-secondary;
			cursor: pointer;

			@media (max-width: 768px) {
				display: flex;
			}
		}
	}

	.nav-links {
		flex: 1;
		min-height: 0;
		padding: $spacing-md 0.75rem;
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		overflow-y: auto;
		overscroll-behavior: contain;

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
		flex-shrink: 0;
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
			border-width: 2px;
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

	@media (max-width: 768px) {
		position: fixed;
		inset: 0;
		z-index: 1000;
		width: 80%;
		height: 100dvh;
		border-right: none;
		border-left:  1px solid $border-subtle;
		transform: translateX(125%);
		visibility: hidden;
		transition: transform 0.3s ease-in-out, visibility 0.3s;
	}
}

.mobile-menu-toggle {
	display: none;
	position: absolute;
	width: 1px;
	height: 1px;
	opacity: 0;

	@media (max-width: 768px) {
		display: block;
	}

	&:focus-visible + .mobile-menu-open {
		outline: 2px solid $color-brand;
		outline-offset: 3px;
	}

	&:checked ~ .mobile-menu-open {
		display: none;
	}

	&:checked ~ .sidebar-backdrop {
		display: block;
	}

	&:checked ~ .sidebar {
		transform: translateX(25%);
		visibility: visible;
	}
}

:global(body:has(.mobile-menu-toggle:checked)) {
	overflow: hidden;
}

.sidebar-backdrop {
	display: none;
	position: fixed;
	inset: 0;
	z-index: 999;
	width: 100%;
	height: 100%;
	border: 0;
	background-color: rgba(0, 0, 0, 0.25);
	backdrop-filter: blur(4px);
	-webkit-backdrop-filter: blur(4px);
	cursor: pointer;
}

.mobile-menu-open {
	display: none;
	cursor: pointer;

	@media (max-width: 768px) {
		@include flex-center;
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 1001;
		width: 4rem;
		height: 4rem;
		color: $text-primary;
		background-color: $bg-sidebar;
		border: 1px solid $border-subtle;
		border-radius: $radius-full;
		box-shadow: $shadow-lg;
		cursor: pointer;
	}
}
</style>
