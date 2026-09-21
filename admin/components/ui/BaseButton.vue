<script setup lang="ts">
interface Props {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
  disabled: false,
  type: "button",
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="['base-button', `variant-${variant}`, `size-${size}`]"
  >
    <slot />
  </button>
</template>

<style lang="scss" scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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
    padding: 6px 12px;
    font-size: 0.8125rem;
  }

  &.size-md {
    padding: 8px 16px;
    font-size: 0.875rem;
  }

  &.size-lg {
    padding: 12px 24px;
    font-size: 1rem;
  }

  // Variants
  &.variant-primary {
    background-color: $color-brand;
    color: #000;

    &:hover:not(:disabled) {
      background-color: lighten($color-brand, 8%);
    }
  }

  &.variant-secondary {
    background-color: $bg-card-hover;
    border-color: $border-subtle;
    color: $text-primary;

    &:hover:not(:disabled) {
      background-color: lighten($bg-card-hover, 6%);
      border-color: $border-focus;
    }
  }

  &.variant-danger {
    background-color: rgba($color-danger, 0.15);
    border-color: rgba($color-danger, 0.4);
    color: lighten($color-danger, 15%);

    &:hover:not(:disabled) {
      background-color: rgba($color-danger, 0.3);
      border-color: $color-danger;
    }
  }

  &.variant-success {
    background-color: rgba($color-success, 0.15);
    border-color: rgba($color-success, 0.4);
    color: lighten($color-success, 15%);

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
