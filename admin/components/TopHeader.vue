<script
	setup
	lang="ts"
>
import { Activity } from "lucide-vue-next";

const auth = useAuth();
</script>

<template>
	<header class="top-header">
		<div class="header-status">
			<Activity
				:size="16"
				class="pulse-icon"
				aria-hidden="true"
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
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;
@use "sass:color";

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
</style>
