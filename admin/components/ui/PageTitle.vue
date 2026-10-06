<script
	setup
	lang="ts"
>
interface Props {
	title?: string;
	subtitle?: string;
}

defineProps<Props>();
</script>

<template>
	<section class="page-title-row">
		<div>
			<h1 class="page-title">{{ title }}</h1>
			<p class="page-subtitle text-secondary">{{ subtitle }}</p>
		</div>
		<div v-if="$slots.actions">
			<slot name="actions" />
		</div>
	</section>
</template>

<style
	scoped
	lang="scss"
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.page-title-row {
	@include flex-between;
	gap: $spacing-md;

	@media (max-width: $bp-mobile) {
		align-items: flex-start;
		flex-direction: column;
	}
}
</style>
