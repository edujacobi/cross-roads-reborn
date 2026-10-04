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
		:class="['base-button', `variant-${variant}`, `size-${size}`]"
	>
		<slot />
	</NuxtLink>
	<button
		v-else
		:type="type"
		:disabled="disabled"
		:class="['base-button', `variant-${variant}`, `size-${size}`]"
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
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  font-weight: 600;
  border-radius: $radius-sm;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  outline: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  // Sizes
  &.size-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }

  &.size-md {
    padding: $spacing-sm $spacing-md;
    font-size: 0.875rem;
  }

  &.size-lg {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }

  // Variants
  &.variant-primary {
    background-color: $color-brand;
    color: #000;

    &:hover:not(:disabled) {
      background-color: color.adjust($color-brand, $lightness: 8%);
    }
  }

  &.variant-secondary {
    background-color: $bg-card-hover;
    border-color: $border-subtle;
    color: $text-primary;

    &:hover:not(:disabled) {
      background-color: color.adjust($bg-card-hover, $lightness: 6%);
      border-color: $border-focus;
    }
  }

  &.variant-danger {
    @include accent-surface($color-danger);
    color: color.adjust($color-danger, $lightness: 15%);

    &:hover:not(:disabled) {
      background-color: rgba($color-danger, 0.3);
      border-color: $color-danger;
    }
  }

  &.variant-success {
    @include accent-surface($color-success);
    color: color.adjust($color-success, $lightness: 15%);

    &:hover:not(:disabled) {
      background-color: rgba($color-success, 0.3);
      border-color: $color-success;
    }
  }

  &.variant-ghost {
    background-color: transparent;
    color: $text-secondary;

    &:hover:not(:disabled) {
      background-color: $bg-card-hover;
      color: $text-primary;
    }
  }
}
</style>
