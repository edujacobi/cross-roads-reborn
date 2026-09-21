<script setup lang="ts">
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "radix-vue";
import { X } from "lucide-vue-next";

interface Props {
  open?: boolean;
  title: string;
  description?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
}>();
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogTrigger as-child>
      <slot name="trigger" />
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent class="dialog-content">
        <div class="dialog-header">
          <div>
            <DialogTitle class="dialog-title">{{ title }}</DialogTitle>
            <DialogDescription v-if="description" class="dialog-description">
              {{ description }}
            </DialogDescription>
          </div>
          <DialogClose class="dialog-close">
            <X :size="18" />
          </DialogClose>
        </div>

        <div class="dialog-body">
          <slot />
        </div>

        <div v-if="$slots.footer" class="dialog-footer">
          <slot name="footer" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style lang="scss" scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background-color: $bg-overlay;
  backdrop-filter: blur(6px);
  z-index: 100;
  animation: fadeIn 0.2s ease-out;
}

.dialog-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 520px;
  max-height: 85vh;
  overflow-y: auto;
  @include card-surface;
  background-color: $bg-card;
  z-index: 101;
  padding: 0;
  animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  @include scrollbar-custom;

  .dialog-header {
    @include flex-between;
    padding: 20px 24px;
    border-bottom: 1px solid $border-subtle;

    .dialog-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: $color-brand;
    }

    .dialog-description {
      font-size: 0.875rem;
      color: $text-secondary;
      margin-top: 4px;
    }

    .dialog-close {
      background: transparent;
      border: none;
      color: $text-muted;
      cursor: pointer;
      padding: 4px;
      border-radius: $radius-xs;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;

      &:hover {
        color: $text-primary;
        background-color: $bg-card-hover;
      }
    }
  }

  .dialog-body {
    padding: 24px;
  }

  .dialog-footer {
    @include flex-between;
    padding: 16px 24px;
    border-top: 1px solid $border-subtle;
    background-color: rgba($bg-input, 0.4);
    gap: 12px;
  }
}
</style>
