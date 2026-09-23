<script
	setup
	lang="ts"
>
import { Shield, Users } from "lucide-vue-next";

interface Props {
	userCount: number;
	gangCount: number;
}
withDefaults(defineProps<Props>(), {
	userCount: 0,
	gangCount: 0,
});
</script>

<template>
	<section class="metrics-grid">
		<div class="stat-card primary">
			<div class="stat-icon">
				<Users :size="24" />
			</div>
			<div class="stat-info">
				<span class="stat-label">Jogadores</span>
				<span class="stat-value">{{ userCount.toLocaleString() }}</span>
			</div>
		</div>

		<div class="stat-card gold">
			<div class="stat-icon">
				<Shield :size="24" />
			</div>
			<div class="stat-info">
				<span class="stat-label">Gangues</span>
				<span class="stat-value">{{ gangCount.toLocaleString() }}</span>
			</div>
		</div>
	</section>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.metrics-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 16px;

	.stat-card {
		@include card-surface;
		padding: 20px;
		display: flex;
		align-items: center;
		gap: 16px;

		.stat-icon {
			@include flex-center;
			width: 48px;
			height: 48px;
			border-radius: $radius-sm;
		}

		.stat-info {
			display: flex;
			flex-direction: column;

			.stat-label {
				font-size: 0.8125rem;
				color: $text-secondary;
			}

			.stat-value {
				font-size: 1.5rem;
				font-weight: 800;
				color: $text-primary;
			}
		}

		&.primary .stat-icon {
			background-color: rgba($color-info, 0.15);
			color: $color-info;
		}

		&.gold .stat-icon {
			background-color: rgba($color-gold, 0.15);
			color: $color-gold;
		}

		&.success .stat-icon {
			background-color: rgba($color-success, 0.15);
			color: $color-success;
		}
	}
}

</style>
