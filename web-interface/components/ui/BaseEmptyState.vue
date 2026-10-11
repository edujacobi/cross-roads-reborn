<script
	setup
	lang="ts"
>
import type { Component } from "vue";

interface Props {
	icon?: Component;
	iconSize?: number;
}

withDefaults(defineProps<Props>(), {
	iconSize: 32,
});
</script>

<template>
	<div class="base-empty-state">
		<Component
			:is="icon"
			:size="iconSize"
			variant="solid"
			aria-hidden="true"
		/>
		<slot />
	</div>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.base-empty-state {
	padding: $spacing-lg;
	color: $text-muted;
	text-align: center;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-sm;
}
</style>
