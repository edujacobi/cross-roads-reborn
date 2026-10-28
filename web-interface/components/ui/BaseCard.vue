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
			v-if="title || subtitle || $slots.header"
			class="base-card__header"
			:class="{ 'base-card__header--no-body': noBody }"
		>
			<div
				v-if="title || subtitle"
				class="base-card__title-wrapper"
			>
				<h2
					v-if="title"
					class="base-card__title"
				>
					<NuxtImg
						v-if="icon"
						class="base-card__icon"
						:src="icon"
						alt=""
						width="26"
						height="26"
					/>
					{{ title }}
				</h2>
				<p
					v-if="subtitle"
					class="base-card__subtitle"
				>
					{{ subtitle }}
				</p>
			</div>
			<slot name="header" />
			<div
				v-if="$slots.actions"
				class="base-card__actions"
			>
				<slot name="actions" />
			</div>
		</div>
		<div
			class="base-card__body"
			:class="{
				'base-card__body--no-padding-x': noPaddingX,
				'base-card__body--no-padding-y': noPaddingY,
			}"
			v-if="!noBody"
		>
			<slot />
		</div>
		<div
			v-if="$slots.footer"
			class="base-card__footer"
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
	transition: border-color $transition-normal ease, box-shadow $transition-normal ease;

	&:has(.base-selector.is-open) {
		overflow: visible;
	}

	&__header {
		@include flex-between;
		padding: $spacing-md 1.25rem;
		gap: $spacing-sm;
		flex-wrap: wrap;

		&:not(.base-card__header--no-body) {
			border-bottom: 1px solid $border-subtle;
		}
	}

	&__title-wrapper {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		flex: 1 1 12rem;
		min-width: 0;
	}

	&__title {
		font-size: $font-size-16;
		font-weight: $font-weight-semibold;
		color: $text-primary;
		display: flex;
		align-items: center;
		gap: $spacing-sm;
	}

	&__subtitle {
		font-size: $font-size-12;
		color: $text-secondary;
		margin-top: 0.125rem;
	}

	&__body {
		padding: 1.25rem;
		flex: 1;

		&--no-padding-x {
			padding-inline: 0;
		}

		&--no-padding-y {
			padding-block: 0;
		}
	}

	&__actions {
		display: flex;
		flex: 0 1 auto;
		align-items: center;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: $spacing-sm;
		margin-left: auto;
	}

	&__footer {
		padding: 0.75rem 1.25rem;
		border-top: 1px solid $border-subtle;
		background-color: $bg-card-header;
	}
}
</style>
