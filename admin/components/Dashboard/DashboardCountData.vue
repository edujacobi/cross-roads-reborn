<script
	setup
	lang="ts"
>
import { Globe, Shield, Users } from "lucide-vue-next";
import BaseCard from "~/components/ui/BaseCard.vue";

interface Props {
	totalPlayers: number | undefined;
	allUsers: number | undefined;
	totalGangs: number | undefined;
	portugueseCount: number | undefined;
	englishCount: number | undefined;
	spanishCount: number | undefined;
}
withDefaults(defineProps<Props>(), {
	totalPlayers: 0,
	allUsers: 0,
	totalGangs: 0,
	portugueseCount: 0,
	englishCount: 0,
	spanishCount: 0,
});
</script>

<template>
	<BaseCard class="count-card">
		<dl class="count-list">
			<div class="count-item">
				<dt class="count-label">
					<Users
						:size="16"
						aria-hidden="true"
					/>
					Jogadores ativos
				</dt>
				<dd class="count-value">{{ totalPlayers ?? 0 }}</dd>
			</div>

			<div class="count-item">
				<dt class="count-label">
					<Users
						:size="16"
						aria-hidden="true"
					/>
					Todos os usuários
				</dt>
				<dd class="count-value">{{ allUsers ?? 0 }}</dd>
			</div>

			<div class="count-item">
				<dt class="count-label">
					<Globe
						:size="16"
						aria-hidden="true"
					/>
					Português
				</dt>
				<dd class="count-value">{{ portugueseCount ?? 0 }}</dd>
			</div>

			<div class="count-item">
				<dt class="count-label">
					<Globe
						:size="16"
						aria-hidden="true"
					/>
					Inglês
				</dt>
				<dd class="count-value">{{ englishCount ?? 0 }}</dd>
			</div>

			<div class="count-item">
				<dt class="count-label">
					<Globe
						:size="16"
						aria-hidden="true"
					/>
					Espanhol
				</dt>
				<dd class="count-value">{{ spanishCount ?? 0 }}</dd>
			</div>

			<div class="count-item">
				<dt class="count-label">
					<Shield
						:size="16"
						aria-hidden="true"
					/>
					Gangues
				</dt>
				<dd class="count-value">{{ totalGangs ?? 0 }}</dd>
			</div>
		</dl>
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
		gap: $spacing-md;

		.count-item {
			@include flex-between;
			padding: 0.625rem 0.75rem;
			background-color: $bg-input;
			border-radius: $radius-sm;
			border: 1px solid $border-subtle;

			.count-value {
				margin: 0;
			}

			.count-label {
				display: flex;
				align-items: center;
				gap: $spacing-sm;
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
