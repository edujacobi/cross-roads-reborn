<script
	setup
	lang="ts"
>
import ValidationChecklist from "~/components/ui/ValidationChecklist.vue";

interface Props {
	id: string;
	modelValue?: string | number;
	label?: string;
	ariaLabel?: string;
	placeholder?: string;
	type?: string;
	inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
	disabled?: boolean;
	required?: boolean;
	step?: string | number;
	minlength?: number;
	maxlength?: number;
	min?: number;
	max?: number;
	rules?: Record<string, { label: string; validate: (value: string) => boolean }>;
}

defineOptions({ inheritAttrs: false });
defineProps<Props>();
defineEmits<(e: "update:modelValue", value: string | number) => void>();
</script>

<template>
	<div class="base-input-wrapper">
		<label
			v-if="label"
			:for="id"
			class="input-label"
		>
			{{ label }}
		</label>

		<div class="input-field">
			<span
				v-if="$slots.leading"
				class="input-leading"
				aria-hidden="true"
			>
				<slot name="leading" />
			</span>
			<input
				v-bind="$attrs"
				:id="id"
				:type="type || 'text'"
				:value="modelValue"
				:placeholder="placeholder"
				:inputmode="inputMode"
				:disabled="disabled"
				:required="required"
				:step="step"
				:aria-label="ariaLabel"
				:aria-describedby="[ $attrs['aria-describedby'], rules ? `${id}-rules` : null ].filter(Boolean).join(' ') || undefined"
				:minlength="minlength"
				:maxlength="maxlength"
				:min="min"
				:max="max"
				class="base-input"
				:class="{ 'base-input--leading': $slots.leading }"
				@input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
			>
		</div>
		<ValidationChecklist
			v-if="rules"
			:id="`${id}-rules`"
			:value="String(modelValue ?? '')"
			:rules="rules"
		/>
	</div>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.base-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  width: 100%;

  .input-label {
    font-size: $font-size-12;
    font-weight: $font-weight-medium;
    color: $text-secondary;
  }

  .base-input {
    width: 20rem;
	  max-width: 100%;
    padding: 0.625rem 0.875rem;
    background-color: $bg-input;
    border: 1px solid $border-subtle;
    border-radius: $radius-sm;
    color: $text-primary;
    outline: none;
    transition: border-color $transition-fast ease-in-out;

    &::placeholder {
      color: $text-muted;
    }

    &:focus {
      border-color: $color-brand;
    }

    &:focus-visible {
      @include focus-outline($color-brand, 2px);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &--leading {
      padding-left: 2.375rem;
    }
  }

  .input-field {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-leading {
    position: absolute;
    left: 0.75rem;
    display: flex;
    color: $text-muted;
    pointer-events: none;
  }
}
</style>
