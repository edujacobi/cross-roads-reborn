<script
	setup
	lang="ts"
>
import {
	CalendarDays,
	CalendarSync,
	ChevronLeft,
	Crown,
	LayoutDashboard,
	LogOut,
	Menu,
	ScrollText,
	Trophy,
	Users,
	X,
} from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import { imagePaths } from "~/constants/imagePaths";
import { localStorageKeys } from "~/constants/localStorageKeys";

const auth = useAuth();
const route = useRoute();
const sidebarStorage = useLocalStorage(localStorageKeys.sidebarCollapsed);
const mobileMenu = ref<HTMLInputElement | null>(null);
const isLogoutModalOpen = ref(false);
const isCollapsed = ref(false);

onMounted(() => {
	isCollapsed.value = sidebarStorage.get() === "true";
});

const navigationGroups = computed(() => [
	{
		title: "",
		links: [
			{
				label: "Rankings",
				to: { name: "rankings" },
				icon: Trophy,
				activeRouteNames: ["rankings"],
			},
		],
	},
	{
		title: "Moderação",
		links: [
			{
				label: "Dashboard",
				to: { name: "admin-dashboard" },
				icon: LayoutDashboard,
				activeRouteNames: ["admin-dashboard"],
			},
			{
				label: "Jogadores",
				to: { name: "admin-users" },
				icon: Users,
				activeRouteNames: ["admin-users", "admin-users-id"],
			},
			{
				label: "Eventos",
				to: { name: "admin-events" },
				icon: CalendarDays,
				activeRouteNames: ["admin-events"],
			},
			{
				label: "Temporada",
				to: { name: "admin-season" },
				icon: CalendarSync,
				activeRouteNames: ["admin-season"],
			},
			{
				label: "VIPs",
				to: { name: "admin-vips" },
				icon: Crown,
				activeRouteNames: ["admin-vips"],
			},
			{
				label: "Auditoria",
				to: { name: "admin-audit-log" },
				icon: ScrollText,
				activeRouteNames: ["admin-audit-log"],
			},
		],
	},
]);

function openLogoutModal() {
	if (mobileMenu.value) {
		mobileMenu.value.checked = false;
	}

	isLogoutModalOpen.value = true;
}

function toggleCollapsed() {
	isCollapsed.value = !isCollapsed.value;
	sidebarStorage.set(String(isCollapsed.value));
}

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
		:class="['sidebar', { 'sidebar--collapsed': isCollapsed }]"
		aria-label="Painel administrativo"
	>
		<div class="brand">
			<div class="brand-icon">
				<NuxtImg
					:src="imagePaths.brand.logo"
					class="img"
					alt="CROSS ROADS"
					width="112"
					height="50"
					loading="eager"
					fetchpriority="high"
				/>
			</div>
			<button
				type="button"
				class="collapse-toggle"
				:aria-label="isCollapsed ? 'Expandir menu' : 'Recolher menu'"
				:title="isCollapsed ? 'Expandir menu' : 'Recolher menu'"
				:aria-expanded="!isCollapsed"
				aria-controls="admin-sidebar"
				@click="toggleCollapsed"
			>
				<component
					:is="ChevronLeft"
					:class="{ 'collapse-icon--collapsed': isCollapsed }"
					:size="18"
					aria-hidden="true"
				/>
			</button>
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
			<div
				v-for="group in navigationGroups"
				:key="group.title ?? 'default'"
				:class="['nav-group', { 'nav-group--titled': group.title }]"
			>
				<h2
					v-if="group.title"
					class="nav-group-title"
				>
					{{ group.title }}
				</h2>
				<NuxtLink
					v-for="item in group.links"
					:key="item.label"
					:to="item.to"
					:class="['nav-item', { active: item.activeRouteNames.some((name) => name === route.name) }]"
					:aria-label="item.label"
					:title="item.label"
				>
					<component
						:is="item.icon"
						:size="18"
						aria-hidden="true"
					/>
					<span class="nav-label">{{ item.label }}</span>
				</NuxtLink>
			</div>
		</nav>

		<div class="admin-profile">
			<NuxtLink
				:to="`/admin/users/${user?.id}`"
				class="admin-info"
				:aria-label="user?.username ? `Perfil de ${user.username}` : 'Perfil do administrador'"
			>
				<LazyNuxtImg
					:src="user?.avatarUrl"
					:class="['admin-avatar', 'user-avatar', `user-avatar--${user?.avatarDecoration}`]"
					alt=""
				/>
				<div class="admin-details">
					<span class="admin-name">{{ user?.username }}</span>
					<p class="admin-role">
						<NuxtImg
							:src="user?.role.image"
							class="img-role"
							width="16"
							height="16"
							alt=""
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
				@click="openLogoutModal"
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
	position: relative;
	transition: width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

	.brand {
		flex-shrink: 0;
		@include flex-center;
		padding: 1.5rem 1.25rem;
		border-bottom: 1px solid $border-subtle;

		.brand-icon {
			@include flex-center;
			max-width: 7rem;
			height: 2.5rem;
			color: $color-brand;
			transition: max-width 0.3s ease, opacity 0.2s ease, transform 0.3s ease;

			.img {
				width: 7rem;
				max-width: none;
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

	.collapse-toggle {
		@include flex-center;
		position: absolute;
		top: 50%;
		right: 0;
		z-index: 1;
		width: 2rem;
		height: 2rem;
		padding: 0;
		color: $text-primary;
		background: $bg-sidebar;
		border: 1px solid $border-subtle;
		border-radius: $radius-full;
		cursor: pointer;
		transform: translate(50%, -50%);
		transition: color 0.15s ease, background-color 0.15s ease;

		&:hover {
			color: $color-brand;
			background-color: $bg-card-hover;
		}

		&:focus-visible {
			outline: 2px solid $color-brand;
			outline-offset: 2px;
		}

		.collapse-icon--collapsed {
			transform: rotate(180deg);
		}

		svg {
			transition: transform 0.3s ease;
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

		.nav-group {
			display: flex;
			flex-direction: column;
			gap: $spacing-xs;
		}

		.nav-group--titled {
			margin-top: $spacing-md;
			padding-top: $spacing-md;
			border-top: 1px solid $border-subtle;
		}

		.nav-group-title {
			padding: 0.25rem 0.875rem 0.5rem;
			color: $text-muted;
			font-size: 0.6875rem;
			font-weight: 700;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			white-space: nowrap;
			transition: opacity 0.2s ease, max-height 0.3s ease;
		}

		.nav-item {
			display: grid;
			grid-template-columns: 18px minmax(0, 1fr);
			align-items: center;
			gap: 12px;
			padding: 0.625rem 0.875rem;
			border-radius: $radius-sm;
			font-size: 0.875rem;
			font-weight: 500;
			color: $text-secondary;
			transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out, grid-template-columns 0.3s ease, gap 0.3s ease, padding 0.3s ease;

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

		.nav-label {
			max-width: 10rem;
			overflow: hidden;
			white-space: nowrap;
			transition: max-width 0.3s ease, opacity 0.2s ease, transform 0.3s ease;
		}
	}

	.admin-profile {
		flex-shrink: 0;
		border-top: 1px solid $border-subtle;
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		padding: $spacing-sm;
		justify-content: flex-start;
		background-color: rgba($bg-input, 0.5);

		.admin-info {
			display: flex;
			flex: 1;
			min-width: 0;
			gap: $spacing-sm;
			border-radius: $radius-sm;
			padding: $spacing-sm 1rem $spacing-sm $spacing-sm;
			transition: background-color 0.15s;

			&:hover {
				background-color: $border-subtle;
			}
		}

		.admin-avatar {
			width: 2.375rem;
			height: 2.375rem;
			border-radius: 50%;
			border-width: 2px;
			flex: 0 0 auto;
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
			min-width: 0;
			max-width: 10rem;
			overflow: hidden;
			transition: max-width 0.3s ease, opacity 0.2s ease;

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

		.collapse-toggle {
			display: none;
		}
	}

	@media (min-width: 769px) {
		&.sidebar--collapsed {
			width: 4.5rem;

			.brand {
				justify-content: center;

				.brand-icon {
					max-width: 0;
					transform: scale(0.45);
				}
			}

			.nav-links {
				padding-right: 0.75rem;
				padding-left: 0.75rem;

				.nav-group-title {
					max-height: 0;
					padding: 0;
					opacity: 0;
					overflow: hidden;
				}

				.nav-item {
					grid-template-columns: 18px minmax(0, 0fr);
					gap: 0;
					justify-content: center;
					padding-right: 0.5625rem;
					padding-left: 0.5625rem;
				}

				.nav-label {
					max-width: 0;
					opacity: 0;
					transform: translateX(-0.5rem);
				}
			}

			.admin-profile {
				.admin-info{
					padding: 0.5rem;
				}
				.admin-details {
					max-width: 0;
					opacity: 0;
				}

				.logout-btn {
					display: none;
				}
			}
		}
	}

	@media (prefers-reduced-motion: reduce) {
		transition: none;

		* {
			transition-duration: 0.01ms !important;
		}
	}
}

.mobile-menu-toggle {
	display: none;
	position: fixed;
	top: 0;
	left: 0;
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
