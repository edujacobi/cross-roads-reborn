<script
	setup
	lang="ts"
>
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

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "sass:color";

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
    color: color.adjust($color-developer, $lightness: 10%);
    border: 1px solid rgba($color-developer, 0.4);
  }

  &.badge-moderator {
    background-color: rgba($color-moderator, 0.15);
    color: color.adjust($color-moderator, $lightness: 15%);
    border: 1px solid rgba($color-moderator, 0.4);
  }

  &.badge-vip {
    background-color: rgba($color-vip, 0.2);
    color: color.adjust($color-vip, $lightness: 15%);
    border: 1px solid rgba($color-vip, 0.5);
  }

  &.badge-success {
    background-color: rgba($color-success, 0.15);
    color: color.adjust($color-success, $lightness: 15%);
    border: 1px solid rgba($color-success, 0.4);
  }

  &.badge-danger {
    background-color: rgba($color-danger, 0.15);
    color: color.adjust($color-danger, $lightness: 15%);
    border: 1px solid rgba($color-danger, 0.4);
  }

  &.badge-warning {
    background-color: rgba($color-warning, 0.15);
    color: color.adjust($color-warning, $lightness: 15%);
    border: 1px solid rgba($color-warning, 0.4);
  }

  &.badge-neutral {
    background-color: rgba($border-subtle, 0.5);
    color: $text-secondary;
    border: 1px solid $border-subtle;
  }
}
</style>
