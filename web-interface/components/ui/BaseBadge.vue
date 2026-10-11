<script
	setup
	lang="ts"
>
interface Props {
	variant?: "developer" | "moderator" | "helper" | "vip" | "success" | "danger" | "warning" | "neutral";
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
@use "~/assets/scss/mixins" as *;
@use "sass:color";

.base-badge {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: 0.125rem $spacing-sm;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: $radius-full;
  text-transform: uppercase;
  letter-spacing: 0.04em;

  &.badge-developer {
    @include accent-surface($color-developer);
    color: color.adjust($color-developer, $lightness: 10%);
  }

  &.badge-moderator {
    @include accent-surface($color-moderator);
    color: color.adjust($color-moderator, $lightness: 15%);
  }

	&.badge-helper {
		@include accent-surface($color-helper);
		color: color.adjust($color-helper, $lightness: 15%);
	}

  &.badge-vip {
    background-color: rgba($color-vip, 0.2);
    color: color.adjust($color-vip, $lightness: 15%);
    border: 1px solid rgba($color-vip, 0.5);
  }

  &.badge-success {
    @include accent-surface($color-success);
    color: color.adjust($color-success, $lightness: 15%);
  }

  &.badge-danger {
    @include accent-surface($color-danger);
    color: color.adjust($color-danger, $lightness: 15%);
  }

  &.badge-warning {
    @include accent-surface($color-warning);
    color: color.adjust($color-warning, $lightness: 15%);
  }

  &.badge-neutral {
    background-color: rgba($border-subtle, 0.5);
    color: $text-secondary;
    border: 1px solid $border-subtle;
  }
}
</style>
