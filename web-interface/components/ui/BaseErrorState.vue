<template>
	<div
		class="base-error-state"
		role="alert"
	>
		<slot />
	</div>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.base-error-state {
	padding: $spacing-lg;
	color: $color-danger;
	text-align: center;
}
</style>
