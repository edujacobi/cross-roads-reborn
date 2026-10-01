<template>
	<div class="base-table">
		<slot />
	</div>
</template>

<style
	lang="scss"
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.base-table {
	overflow-x: auto;
	@include scrollbar-custom;

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;

		th,
		td {
			padding: 0.75rem $spacing-md;
			text-align: left;
			border-bottom: 1px solid $border-subtle;
			white-space: nowrap;
		}

		th {
			color: $text-muted;
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
		}

		td {
			color: $text-secondary;
		}
	}
}
</style>
