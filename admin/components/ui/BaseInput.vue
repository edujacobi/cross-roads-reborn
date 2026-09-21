<script setup lang="ts">
interface Props {
  modelValue?: string | number;
  label?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}

defineProps<Props>();
defineEmits<{
  (e: "update:modelValue", value: string | number): void;
}>();
</script>

<template>
  <div class="base-input-wrapper">
    <label v-if="label" class="input-label">{{ label }}</label>
    <input
      :type="type || 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="base-input"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<style lang="scss" scoped>
.base-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;

  .input-label {
    font-size: 0.8125rem;
    font-weight: 500;
    color: $text-secondary;
  }

  .base-input {
    width: 100%;
    padding: 10px 14px;
    background-color: $bg-input;
    border: 1px solid $border-subtle;
    border-radius: $radius-sm;
    color: $text-primary;
    outline: none;
    transition: border-color 0.15s ease-in-out;

    &::placeholder {
      color: $text-muted;
    }

    &:focus {
      border-color: $color-brand;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>
