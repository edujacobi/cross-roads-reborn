<script
	setup
	lang="ts"
>
export type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost";

interface Props {
	variant?: ButtonVariant;
	size?: "sm" | "md" | "lg";
	disabled?: boolean;
	type?: "button" | "submit" | "reset";
	to?: string;
}

withDefaults(defineProps<Props>(), {
	variant: "primary",
	size: "md",
	disabled: false,
	type: "button",
});
</script>

<template>
	<NuxtLink
		v-if="to"
		:to="to"
		:class="['base-button', `base-button--variant-${variant}`, `base-button--size-${size}`]"
	>
		<slot />
	</NuxtLink>
	<button
		v-else
		:type="type"
		:disabled="disabled"
		:class="['base-button', `base-button--variant-${variant}`, `base-button--size-${size}`]"
	>
		<slot />
	</button>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;
@use "sass:color";

.base-button {
	appearance: button;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  border: 1px solid transparent;
  cursor: pointer;
	touch-action: manipulation;
  outline: none;
  transition:
  	transform $transition-fast $motion-ease-out,
  	box-shadow $transition-fast ease,
  	background-color $transition-fast ease,
  	border-color $transition-fast ease,
  	color $transition-fast ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
  	@include focus-outline($color-brand, 3px);
  }

  &:active:not(:disabled) {
  	transform: translateY(1px) scale(0.985);
  }

  // Sizes
  &--size-sm {
    padding: 0.375rem 0.75rem;
    font-size: $font-size-12;
  }

  &--size-md {
    padding: $spacing-sm $spacing-md;
    font-size: $font-size-14;
  }

  &--size-lg {
    padding: 0.75rem 1.5rem;
    font-size: $font-size-16;
  }

  // Variants
  &--variant-primary {
    background-color: $color-brand;
  	border: none;
    color: #000;
  	box-shadow: inset 0 1px 0 hsl(none 0% 100% / 0.35),
				inset 0 3px 4px hsl(none 0% 100% / 0.25),
  				inset 0 -2px 0 hsl(none 0% 0% / 0.25),
				inset 0 -6px 8px hsl(none 0% 0% / 0.15);

    &:hover:not(:disabled) {
      background-color: color.adjust($color-brand, $lightness: 8%);
    }
  }

  &--variant-secondary {
    background-color: $bg-card-hover;
    border-color: $border-subtle;
    color: $text-primary;

    &:hover:not(:disabled) {
      background-color: color.adjust($bg-card-hover, $lightness: 6%);
      border-color: $border-focus;
    }
  }

  &--variant-danger {
    @include accent-surface($color-danger);
    color: color.adjust($color-danger, $lightness: 15%);

    &:hover:not(:disabled) {
      background-color: rgba($color-danger, 0.3);
      border-color: $color-danger;
    }
  }

  &--variant-success {
    @include accent-surface($color-success);
    color: color.adjust($color-success, $lightness: 15%);

    &:hover:not(:disabled) {
      background-color: rgba($color-success, 0.3);
      border-color: $color-success;
    }
  }

  &--variant-ghost {
    background-color: transparent;
    color: $text-secondary;

    &:hover:not(:disabled) {
      background-color: $bg-card-hover;
      color: $text-primary;
    }
  }
}
</style>
