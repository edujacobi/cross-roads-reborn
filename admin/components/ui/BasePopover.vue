<script
	setup
	lang="ts"
>
interface Props {
	/** Tooltip text displayed on hover */
	text: string;
	position: "top" | "bottom" | "left" | "right";
}

defineProps<Props>();
</script>

<template>
	<div
		class="popover"
		:data-text="text"
		:class="position"
	>
		<slot />
	</div>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.popover {
	position: relative;
	width: 100%;

	&:hover::after {
		content: attr(data-text);
		position: absolute;
		padding: 0.25rem 0.5rem;
		background-color: $bg-card;
		color: $text-primary;
		border: 1px solid $border-card;
		border-radius: $radius-sm;
		font-size: 0.6875rem;
		font-weight: 600;
		white-space: nowrap;
		pointer-events: none;
		z-index: 10;
		box-shadow: $shadow-sm;
	}

	&.top:hover::after {
		bottom: calc(100% + 0.5rem);
		left: 50%;
		transform: translateX(-50%);
	}

	&.bottom:hover::after {
		top: calc(100% + 0.5rem);
		left: 50%;
		transform: translateX(-50%);
	}

	&.left:hover::after {
		top: 50%;
		right: calc(100% + 0.5rem);
		transform: translateY(-50%);
	}

	&.right:hover::after {
		top: 50%;
		left: calc(100% + 0.5rem);
		transform: translateY(-50%);
	}

}
</style>
