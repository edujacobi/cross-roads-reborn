<script
	setup
	lang="ts"
>
interface Props {
	width?: string;
	height?: string;
	circle?: boolean;
}

withDefaults(defineProps<Props>(), {
	width: "100%",
	height: "1rem",
	circle: false,
});
</script>

<template>
	<span
		class="base-skeleton"
		:class="{ 'base-skeleton--circle': circle }"
		:style="{ width, height }"
		aria-hidden="true"
	></span>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.base-skeleton {
	display: block;
	flex: 0 0 auto;
	border-radius: $radius-xs;
	background: linear-gradient(90deg, $bg-input 25%, $border-card 50%, $bg-input 75%);
	background-size: 200% 100%;
	animation: skeleton-shimmer 1.5s ease-in-out infinite;

	&--circle {
		border-radius: $radius-full;
	}
}

@keyframes skeleton-shimmer {
	to {
		background-position-x: -200%;
	}
}

@media (prefers-reduced-motion: reduce) {
	.base-skeleton {
		animation: none;
	}
}
</style>
