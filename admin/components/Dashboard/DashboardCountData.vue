<script
	setup
	lang="ts"
>
import { Globe, Shield, Users } from "lucide-vue-next";
import BaseCard from "~/components/ui/BaseCard.vue";

interface Props {
	totalPlayers: number | undefined;
	totalGangs: number | undefined;
	portugueseCount: number | undefined;
	englishCount: number | undefined;
	spanishCount: number | undefined;
}
withDefaults(defineProps<Props>(), {
	totalPlayers: 0,
	totalGangs: 0,
	portugueseCount: 0,
	englishCount: 0,
	spanishCount: 0,
});
</script>

<template>
	<BaseCard class="count-card">
		<div class="count-list">
			<div class="count-item">
				<div class="count-label">
					<Users :size="16" />
					Jogadores
				</div>
				<span class="count-value">{{ totalPlayers ?? 0 }}</span>
			</div>

			<div class="count-item">
				<div class="count-label">
					<Globe :size="16" />
					Português
				</div>
				<span class="count-value">{{ portugueseCount ?? 0 }}</span>
			</div>

			<div class="count-item">
				<div class="count-label">
					<Globe :size="16" />
					Inglês
				</div>
				<span class="count-value">{{ englishCount ?? 0 }}</span>
			</div>

			<div class="count-item">
				<div class="count-label">
					<Globe :size="16" />
					Espanhol
				</div>
				<span class="count-value">{{ spanishCount ?? 0 }}</span>
			</div>

			<div class="count-item">
				<div class="count-label">
					<Shield :size="16" />
					Gangues
				</div>
				<span class="count-value">{{ totalGangs ?? 0 }}</span>
			</div>
		</div>
	</BaseCard>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.count-card {
	.count-list {
		display: flex;
		flex-direction: column;
		gap: 14px;

		.count-item {
			@include flex-between;
			padding: 10px 12px;
			background-color: $bg-input;
			border-radius: $radius-sm;
			border: 1px solid $border-subtle;

			.count-label {
				display: flex;
				align-items: center;
				gap: 8px;
				font-size: 0.875rem;
				color: $text-primary;
			}

			.count-value {
				font-size: 0.9375rem;
				font-weight: 700;
				color: $color-brand;
			}
		}
	}
}


</style>
