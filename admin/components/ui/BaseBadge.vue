<script setup lang="ts">
interface Props {
  variant?: "developer" | "moderator" | "vip" | "success" | "danger" | "warning" | "neutral";
}

withDefaults(defineProps<Props>(), {
  variant: "neutral",
});
</script>

<template>
  <span :class="['base-badge', `badge-${variant}`]">
    <slot />
  </span>
</template>

<style lang="scss" scoped>
.base-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: $radius-full;
  text-transform: uppercase;
  letter-spacing: 0.04em;

  &.badge-developer {
    background-color: rgba($color-developer, 0.15);
    color: lighten($color-developer, 10%);
    border: 1px solid rgba($color-developer, 0.4);
  }

  &.badge-moderator {
    background-color: rgba($color-moderator, 0.15);
    color: lighten($color-moderator, 15%);
    border: 1px solid rgba($color-moderator, 0.4);
  }

  &.badge-vip {
    background-color: rgba($color-vip, 0.2);
    color: lighten($color-vip, 15%);
    border: 1px solid rgba($color-vip, 0.5);
  }

  &.badge-success {
    background-color: rgba($color-success, 0.15);
    color: lighten($color-success, 15%);
    border: 1px solid rgba($color-success, 0.4);
  }

  &.badge-danger {
    background-color: rgba($color-danger, 0.15);
    color: lighten($color-danger, 15%);
    border: 1px solid rgba($color-danger, 0.4);
  }

  &.badge-warning {
    background-color: rgba($color-warning, 0.15);
    color: lighten($color-warning, 15%);
    border: 1px solid rgba($color-warning, 0.4);
  }

  &.badge-neutral {
    background-color: rgba($border-subtle, 0.5);
    color: $text-secondary;
    border: 1px solid $border-subtle;
  }
}
</style>
