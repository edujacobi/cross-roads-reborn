<script
	setup
	lang="ts"
>
import type { ImagePath } from "~/constants/imagePaths";

interface Props {
	title?: string;
	subtitle?: string;
	icon?: ImagePath;
	noBody?: boolean;
	noPaddingX?: boolean;
	noPaddingY?: boolean;
}

defineProps<Props>();
</script>

<template>
	<div class="base-card">
		<div
			v-if="title || $slots.header"
			class="card-header"
			:class="{'no-body': noBody}"
		>
			<div>
				<h2
					v-if="title"
					class="card-title"
				>
					<NuxtImg
						v-if="icon"
						class="card-icon"
						:src="icon"
						alt=""
						width="26"
						height="26"
					/>
					{{ title }}
				</h2>
				<p
					v-if="subtitle"
					class="card-subtitle"
				>
					{{ subtitle }}
				</p>
			</div>
			<slot name="header" />
			<div
				v-if="$slots.actions"
				class="card-actions"
			>
				<slot name="actions" />
			</div>
		</div>
		<div
			class="card-body"
			:class="{
			'card-body__no-padding-x': noPaddingX,
			'card-body__no-padding-y': noPaddingY
		}"
			v-if="!noBody"
		>
			<slot />
		</div>
		<div
			v-if="$slots.footer"
			class="card-footer"
		>
			<slot name="footer" />
		</div>
	</div>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.base-card {
	@include card-surface;
	overflow: hidden;
	display: flex;
	flex-direction: column;

	.card-header {
		@include flex-between;
		padding: $spacing-md 1.25rem;
		gap: $spacing-sm;

		// ponytail: wrap card header when title and actions overflow
		@media (max-width: 540px) {
			flex-wrap: wrap;
			gap: $spacing-sm;
		}

		&:not(.no-body){
			border-bottom: 1px solid $border-subtle;
		}

		.card-title {
			font-size: 1rem;
			font-weight: 600;
			color: $text-primary;
			display: flex;
			align-items: center;
			gap: $spacing-sm;
		}

		.card-subtitle {
			font-size: 0.8125rem;
			color: $text-secondary;
			margin-top: 0.125rem;
		}
	}

	.card-body {
		padding: 1.25rem;
		flex: 1;

		&__no-padding-x {
			padding-inline: 0
		}

		&__no-padding-y {
			padding-block: 0;
		}
	}

	.card-footer {
		padding: 0.75rem 1.25rem;
		border-top: 1px solid $border-subtle;
		background-color: rgba($bg-input, 0.5);
	}
}
</style>
