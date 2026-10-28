<script
	setup
	lang="ts"
>
import { useQuery } from "@vue/apollo-composable";
import {
	CalendarDays,
	CalendarSync,
	ChevronLeft,
	Crown,
	LayoutDashboard,
	LogOut,
	Menu,
	Package,
	Scroll,
	ScrollText,
	Users,
	X,
} from "lucide-vue-next";
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
import BaseModal from "~/components/ui/BaseModal.vue";
import { useFallbackUserImage } from "~/composables/useFallbackImage";
import { hasUnreadUpdates } from "~/composables/useUnreadUpdates";
import { imagePaths } from "~/constants/imagePaths";
import { localStorageKeys } from "~/constants/localStorageKeys";
import { GetBlackMarketOpenDocument, GetUserGangDocument } from "~/graphql/generated";
import { SituationId } from "../../src/core/types/Ids";

const auth = useAuth();
const route = useRoute();
const sidebarStorage = useLocalStorage(localStorageKeys.sidebarCollapsed);
const mobileMenu = ref<HTMLInputElement | null>(null);
const isLogoutModalOpen = ref(false);
const isCollapsed = ref(false);
const hasNew = hasUnreadUpdates();
const { getSituationName, getSituationImageUrl } = useSituation();

const { result: blackMarketResult } = useQuery(GetBlackMarketOpenDocument);
const blackMarketOpen = computed(() => blackMarketResult.value?.blackMarketOpen ?? false);
const currentUserGangId = computed(() => auth.user.value?.gangId ?? null);
const { result: currentUserGangResult } = useQuery(
	GetUserGangDocument,
	() => ({ id: auth.user.value?.userId ?? "" }),
	{
		enabled: computed(() => currentUserGangId.value !== null),
		fetchPolicy: "cache-and-network",
	},
);
const currentUserGang = computed(() => {
	const gang = currentUserGangResult.value?.user?.gang;
	return gang?.id === currentUserGangId.value ? gang : null;
});

onMounted(() => {
	isCollapsed.value = sidebarStorage.get() === "true";
});

const navigationGroups = computed(() => [
	{
		title: "",
		links: [
			{
				label: "Jogadores",
				to: { name: "users" },
				icon: Users,
				activeRouteNames: ["users", "users-id"],
			},
			{
				label: "Rankings",
				to: { name: "rankings" },
				icon: TrophyIcon,
				size: 20,
				activeRouteNames: ["rankings"],
			},
			{
				label: "Itens",
				to: { name: "items" },
				icon: Package,
				activeRouteNames: ["items"],
			},
			{
				label: "Loja",
				to: { name: "shop" },
				icon: ShopIcon,
				size: 20,
				activeRouteNames: ["shop"],
				blackMarketBadge: true,
			},
			{
				label: "Loja especial",
				to: { name: "specialshop" },
				icon: SpecialShopIcon,
				size: 20,
				activeRouteNames: ["specialshop"],
			},
			{
				label: "Cassino",
				to: { name: "casino" },
				icon: CasinoIcon,
				size: 20,
				activeRouteNames: ["casino", "casino-game"],
			},
			{
				label: "Trabalhos",
				to: { name: "jobs" },
				icon: JobsIcon,
				size: 20,
				activeRouteNames: ["jobs"],
			},
			{
				label: "Investimentos",
				to: { name: "investments" },
				icon: InvestmentIcon,
				size: 20,
				activeRouteNames: ["investments"],
			},
			{
				label: "Vasculhar",
				to: { name: "scavenge" },
				icon: ScavengeIcon,
				size: 20,
				activeRouteNames: ["scavenge"],
			},
			{
				label: "Roubar",
				to: { name: "rob" },
				icon: RobberyIcon,
				size: 20,
				activeRouteNames: ["rob"],
			},
			{
				label: "Hospital",
				to: { name: "hospital" },
				icon: HospitalIcon,
				size: 20,
				activeRouteNames: ["hospital"],
			},
			{
				label: "Prisão",
				to: { name: "prison" },
				icon: PrisonIcon,
				size: 20,
				activeRouteNames: ["prison"],
			},
			{
				label: currentUserGang.value?.name ?? "Gangues",
				to: currentUserGangId.value !== null ? `/gangs/${currentUserGangId.value}` : { name: "gangs" },
				icon: GangIcon,
				size: 20,
				activeRouteNames: ["gangs", "gangs-id"],
			},
			{
				label: "Atualizações",
				to: { name: "updates" },
				icon: Scroll,
				activeRouteNames: ["updates"],
				hasNewBadge: true,
			},
		],
	},
	...(auth.hasAdminAccess.value
		? [
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
						...(auth.canWrite.value
							? [
									{
										label: "Auditoria",
										to: { name: "admin-audit-log" },
										icon: ScrollText,
										activeRouteNames: ["admin-audit-log"],
									},
								]
							: []),
					],
				},
			]
		: []),
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

	if (!authUser) {
		return;
	}

	return {
		id: authUser.userId,
		username: authUser.username,
		avatarUrl: authUser.avatar || useFallbackUserImage(authUser.userId),
		avatarDecoration: authUser.avatarDecoration || "default",
		situationText: getSituationName(authUser.situationId),
		situationImageUrl: getSituationImageUrl(authUser.situationId),
		isDead: authUser.situationId === SituationId.Dead,
	};
});
</script>

<template>
	<input
		id="mobile-menu-toggle"
		ref="mobileMenu"
		class="sidebar__mobile-menu-toggle"
		type="checkbox"
		aria-label="Menu de navegação"
		aria-controls="user-sidebar"
	>
	<!-- biome-ignore lint/a11y/noLabelWithoutControl: External labels toggle the CSS-controlled checkbox. -->
	<label
		for="mobile-menu-toggle"
		class="sidebar__mobile-menu-open"
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
		class="sidebar__backdrop"
		aria-hidden="true"
	/>
	<aside
		id="user-sidebar"
		:class="['sidebar', { 'sidebar--collapsed': isCollapsed }]"
		aria-label="Painel do usuário"
	>
		<div class="sidebar__brand">
			<NuxtLink
				to="/me"
				class="sidebar__brand-link"
				aria-label="Início"
			>
				<div class="sidebar__brand-icon">
					<NuxtImg
						:src="imagePaths.brand.logo"
						class="sidebar__brand-image"
						alt="CROSS ROADS"
						width="112"
						height="50"
						loading="eager"
						fetchpriority="high"
					/>
				</div>
			</NuxtLink>
			<button
				type="button"
				class="sidebar__collapse-toggle"
				:aria-label="isCollapsed ? 'Expandir menu' : 'Recolher menu'"
				:data-popover-text="isCollapsed ? 'Expandir menu' : 'Recolher menu'"
				data-popover-direction="top"
				:aria-expanded="!isCollapsed"
				aria-controls="user-sidebar"
				@click="toggleCollapsed"
			>
				<component
					:is="ChevronLeft"
					:class="['sidebar__collapse-icon', { 'sidebar__collapse-icon--collapsed': isCollapsed }]"
					:size="18"
					aria-hidden="true"
				/>
			</button>
			<!-- biome-ignore lint/a11y/noLabelWithoutControl: External labels toggle the CSS-controlled checkbox. -->
			<label
				for="mobile-menu-toggle"
				class="sidebar__mobile-menu-close"
				aria-hidden="true"
			>
				<X
					:size="24"
					aria-hidden="true"
				/>
			</label>
		</div>

		<nav
			class="sidebar__nav-links"
			aria-label="Navegação principal"
		>
			<div
				v-for="group in navigationGroups"
				:key="group.title ?? 'default'"
				:class="['sidebar__nav-group', { 'sidebar__nav-group--titled': group.title }]"
			>
				<h2
					v-if="group.title"
					class="sidebar__nav-group-title"
				>
					{{ group.title }}
				</h2>
				<NuxtLink
					v-for="item in group.links"
					:key="item.label"
					:to="item.to"
					:class="[
						'sidebar__nav-item',
						{ 'sidebar__nav-item--active': item.activeRouteNames.some((name) => name === route.name) },
					]"
					:aria-label="item.label"
					:data-popover-text="isCollapsed ? item.label : undefined"
					data-popover-direction="right"
				>
					<component
						:is="item.icon"
						:size="item.size ?? 18"
						aria-hidden="true"
						variant="solid"
					/>
					<div class="sidebar__nav-label">
						<p>{{ item.label }}</p>
						<span
							v-if="item.hasNewBadge && hasNew"
							class="sidebar__nav-item-badge sidebar__nav-item-badge--new"
						>
							NOVO
						</span>
						<span
							v-if="item.blackMarketBadge && blackMarketOpen"
							class="sidebar__nav-item-badge sidebar__nav-item-badge--blackmarket"
						>
							Mercado Negro
						</span>
					</div>
				</NuxtLink>
			</div>
		</nav>

		<div
			class="sidebar__user-profile"
			v-if="user"
		>
			<NuxtLink
				data-popover-text="Meu inventário"
				data-popover-direction="top"
				:to="`/users/${user.id}`"
				class="sidebar__user-info"
				:aria-label="user.username ? `Perfil de ${user.username}` : 'Perfil do usuário'"
			>
				<UserPicture
					:image-url="user.avatarUrl ?? useFallbackUserImage(user.id)"
					:decoration="user.avatarDecoration"
					image-class="sidebar__user-avatar"
					lazy
				/>
				<div class="sidebar__user-details">
					<span class="sidebar__user-name">{{ user.username }}</span>
					<NuxtLink
						v-if="user.isDead"
						to="/cemetery"
						class="sidebar__user-situation"
					>
						<NuxtImg
							:src="user.situationImageUrl"
							class="sidebar__situation-image"
							width="16"
							height="16"
							alt=""
						/>
						{{ user.situationText }}
					</NuxtLink>
					<p
						v-else
						class="sidebar__user-situation"
					>
						<NuxtImg
							:src="user.situationImageUrl"
							class="sidebar__situation-image"
							width="16"
							height="16"
							alt=""
						/>
						{{ user.situationText }}
					</p>
				</div>
			</NuxtLink>
			<button
				type="button"
				class="sidebar__logout-button"
				data-popover-text="Encerrar sessão"
				data-popover-direction="top"
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
		@update:open="isLogoutModalOpen = $event"
	>
		<p>Tem certeza de que deseja sair da sua conta?</p>
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
	transition: width $transition-slow cubic-bezier(0.2, 0.8, 0.2, 1);

	.sidebar__brand {
		flex-shrink: 0;
		@include flex-center;
		padding: 1.5rem 1.25rem;
		border-bottom: 1px solid $border-subtle;

		.sidebar__brand-link {
			display: flex;
			flex: 1;
			min-width: 0;
			justify-content: center;
			text-decoration: none;
		}

		.sidebar__brand-icon {
			@include flex-center;
			max-width: 7rem;
			height: 2.5rem;
			object-fit: contain;
			color: $color-brand;
			transition: max-width $transition-slow ease, opacity $transition-normal ease, transform $transition-slow ease;

			.sidebar__brand-image {
				width: 7rem;
				max-width: none;
			}
		}

		.sidebar__mobile-menu-close {
			display: none;
			margin-left: auto;
			color: $text-secondary;
			cursor: pointer;

			@media (max-width: $bp-tablet) {
				display: flex;
			}
		}
	}

	.sidebar__collapse-toggle {
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
		transition: color $transition-fast ease, background-color $transition-fast ease;

		&:hover {
			color: $color-brand;
			background-color: $bg-card-hover;
		}

		&:focus-visible {
			@include focus-outline($color-brand, 2px);
		}

		.sidebar__collapse-icon--collapsed {
			transform: rotate(180deg);
		}

		svg {
			transition: transform $transition-slow ease;
		}
	}

	.sidebar__nav-links {
		flex: 1;
		min-height: 0;
		padding: $spacing-md 0.75rem;
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		overflow-y: auto;
		overflow-x: hidden;
		overscroll-behavior: contain;
		@include scrollbar-custom;

		.sidebar__nav-group {
			display: flex;
			flex-direction: column;
			gap: $spacing-xs;
		}

		.sidebar__nav-group--titled {
			margin-top: $spacing-md;
			padding-top: $spacing-md;
			border-top: 1px solid $border-subtle;
		}

		.sidebar__nav-group-title {
			padding: 0.25rem 0.875rem 0.5rem;
			color: $text-muted;
			font-size: $font-size-12;
			font-weight: $font-weight-bold;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			white-space: nowrap;
			transition: opacity $transition-normal ease, max-height $transition-slow ease;
		}

		.sidebar__nav-item {
			display: grid;
			grid-template-columns: 18px minmax(0, 1fr);
			align-items: center;
			gap: 12px;
			padding: 0.625rem 0.875rem;
			border-radius: $radius-sm;
			font-size: $font-size-14;
			font-weight: $font-weight-medium;
			color: $text-secondary;
			transition: background-color $transition-fast ease-in-out, color $transition-fast ease-in-out, grid-template-columns $transition-slow ease, gap $transition-slow ease, padding $transition-slow ease;

			&:hover {
				background-color: $bg-card-hover;
				color: $text-primary;
			}

			&--active {
				background-color: rgba($color-brand, 0.12);
				color: $color-brand;
				font-weight: $font-weight-semibold;
			}

			&:has(.sidebar__nav-item-badge) {
				grid-template-columns: 18px minmax(0, 1fr);
			}
		}

		.sidebar__nav-label {
			white-space: nowrap;
			transition: max-width $transition-slow ease, opacity $transition-normal ease, transform $transition-slow ease;
			display: flex;
			justify-content: space-between;
		}

		.sidebar__nav-item-badge {
			display: flex;
			align-items: center;
			padding: $spacing-xs $spacing-sm;
			margin-left: auto;
			font-size: 0.6rem;
			font-weight: $font-weight-bold;
			letter-spacing: 0.05em;
			color: $text-primary;
			border-radius: $radius-full;
			line-height: 0;
			white-space: nowrap;

			&--new {
				background-color: $color-danger;
				box-shadow: 0 0 16px 0 $color-danger;
			}

			&--blackmarket {
				background-color: $color-success;
				box-shadow: 0 0 16px 0 $color-success;
			}
		}
	}

	.sidebar__user-profile {
		flex-shrink: 0;
		border-top: 1px solid $border-subtle;
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		padding: $spacing-sm;
		justify-content: flex-start;
		background-color: $bg-card-header;

		.sidebar__user-info {
			display: flex;
			flex: 1;
			min-width: 0;
			gap: $spacing-sm;
			border-radius: $radius-sm;
			padding: $spacing-sm 1rem $spacing-sm $spacing-sm;
			transition: background-color $transition-fast;

			&:hover {
				background-color: $border-subtle;
			}
		}

		.sidebar__user-situation {
			color: $text-secondary;
			font-size: 0.85rem;
			display: flex;
			align-items: center;
			gap: $spacing-xs;

			.sidebar__situation-image {
				width: 16px;
			}
		}

		.sidebar__user-details {
			flex: 1;
			min-width: 0;
			max-width: 10rem;
			overflow: hidden;
			transition: max-width $transition-slow ease, opacity $transition-normal ease;

			.sidebar__user-name {
				display: block;
				font-size: $font-size-12;
				font-weight: $font-weight-semibold;
				color: $text-primary;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}

		.sidebar__logout-button {
			@include flex-center;
			background: transparent;
			border: none;
			color: $text-muted;
			cursor: pointer;
			padding: 0.375rem;
			border-radius: $radius-xs;
			transition: all $transition-fast;
			margin-right: 0.25rem;

			&:hover {
				color: $color-danger;
				background-color: rgba($color-danger, 0.15);
			}
		}
	}

	@media (max-width: $bp-tablet) {
		position: fixed;
		inset: 0;
		z-index: 1000;
		width: 80%;
		height: 100dvh;
		border-right: none;
		border-left: 1px solid $border-subtle;
		transform: translateX(125%);
		visibility: hidden;
		transition: transform $transition-slow ease-in-out, visibility $transition-slow;

		.sidebar__collapse-toggle {
			display: none;
		}
	}

	@media (min-width: 769px) {
		&.sidebar--collapsed {
			width: 4.5rem;

			.sidebar__brand {
				justify-content: center;

				.sidebar__brand-icon {
					max-width: 0;
					transform: scale(0.45);
				}
			}

			.sidebar__nav-links {
				padding-right: 0.75rem;
				padding-left: 0.75rem;

				.sidebar__nav-group-title {
					max-height: 0;
					padding: 0;
					opacity: 0;
					overflow: hidden;
				}

				.sidebar__nav-item {
					grid-template-columns: 18px minmax(0, 0fr);
					gap: 0;
					justify-content: center;
					padding-right: 0.5625rem;
					padding-left: 0.5625rem;
				}

				.sidebar__nav-label {
					max-width: 0;
					opacity: 0;
					transform: translateX(-0.5rem);
				}
			}

			.sidebar__user-profile {
				.sidebar__user-info {
					padding: 0.5rem;
				}

				.sidebar__user-details {
					max-width: 0;
					opacity: 0;
				}

				.sidebar__logout-button {
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

.sidebar__mobile-menu-toggle {
	display: none;
	position: fixed;
	top: 0;
	left: 0;
	width: 1px;
	height: 1px;
	opacity: 0;

	@media (max-width: $bp-tablet) {
		display: block;
	}

	&:focus-visible + .sidebar__mobile-menu-open {
		@include focus-outline($color-brand, 3px);
	}

	&:checked ~ .sidebar__mobile-menu-open {
		display: none;
	}

	&:checked ~ .sidebar__backdrop {
		display: block;
	}

	&:checked ~ .sidebar {
		transform: translateX(25%);
		visibility: visible;
	}
}

:global(body:has(.sidebar__mobile-menu-toggle:checked)) {
	overflow: hidden;
}

.sidebar__backdrop {
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

.sidebar__mobile-menu-open {
	display: none;
	cursor: pointer;

	@media (max-width: $bp-tablet) {
		@include flex-center;
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 100;
		width: 4rem;
		height: 4rem;
		color: $text-primary;
		background-color: $bg-sidebar;
		border: 1px solid $border-subtle;
		border-radius: $radius-full;
		box-shadow: $shadow-lg;
		cursor: pointer;
		transition: transform 0.2s ease;

		&:hover {
			transform: scale(1.05);
		}
	}
}
</style>
