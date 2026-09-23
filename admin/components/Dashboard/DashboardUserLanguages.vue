<script
	setup
	lang="ts"
>
import { Globe } from "lucide-vue-next";
import BaseCard from "~/components/ui/BaseCard.vue";

interface Props {
	portugueseCount: number;
	englishCount: number;
	spanishCount: number;
}
withDefaults(defineProps<Props>(), {
	portugueseCount: 0,
	englishCount: 0,
	spanishCount: 0,
});
</script>

<template>
	<BaseCard
		title="Distribuição por idioma"
		class="language-card"
	>
		<div class="language-list">
			<div class="lang-item">
				<div class="lang-label">
					<Globe :size="16" />
					Português
				</div>
				<span class="lang-count">{{ portugueseCount ?? 0 }}</span>
			</div>

			<div class="lang-item">
				<div class="lang-label">
					<Globe :size="16" />
					Inglês
				</div>
				<span class="lang-count">{{ englishCount ?? 0 }}</span>
			</div>

			<div class="lang-item">
				<div class="lang-label">
					<Globe :size="16" />
					Espanhol
				</div>
				<span class="lang-count">{{ spanishCount ?? 0 }}</span>
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

.language-card {
	.language-list {
		display: flex;
		flex-direction: column;
		gap: 14px;

		.lang-item {
			@include flex-between;
			padding: 10px 12px;
			background-color: $bg-input;
			border-radius: $radius-sm;
			border: 1px solid $border-subtle;

			.lang-label {
				display: flex;
				align-items: center;
				gap: 8px;
				font-size: 0.875rem;
				color: $text-primary;
			}

			.lang-count {
				font-size: 0.9375rem;
				font-weight: 700;
				color: $color-brand;
			}
		}
	}
}


</style>
