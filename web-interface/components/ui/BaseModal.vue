<script
	setup
	lang="ts"
>
import { X } from "lucide-vue-next";
import {
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogOverlay,
	DialogPortal,
	DialogRoot,
	DialogTitle,
	DialogTrigger,
} from "radix-vue";
import type { ImagePath } from "~/constants/imagePaths";

interface Props {
	open?: boolean;
	title: string;
	description?: string;
	dismissible?: boolean;
	icon?: ImagePath;
	variant?: "robbery" | "beatup";
}

const props = withDefaults(defineProps<Props>(), {
	dismissible: true,
});
const emit = defineEmits<(e: "update:open", value: boolean) => void>();

function updateOpen(open: boolean) {
	if (props.dismissible) emit("update:open", open);
}
</script>

<template>
	<DialogRoot
		:open="open"
		@update:open="updateOpen"
	>
		<DialogTrigger as-child>
			<slot name="trigger" />
		</DialogTrigger>

		<DialogPortal>
			<DialogOverlay class="dialog-overlay" />
			<DialogContent
				class="dialog-content"
				:class="variant"
			>
				<div class="dialog-header">
					<div>
						<DialogTitle class="dialog-title">
							<NuxtImg
								v-if="icon"
								class="dialog-icon"
								:src="icon"
								alt=""
								width="30"
								height="30"
							/>
							{{ title }}
						</DialogTitle>
						<DialogDescription
							v-if="description"
							class="dialog-description"
						>
							{{ description }}
						</DialogDescription>
					</div>
					<DialogClose
						v-if="dismissible"
						class="dialog-close"
					>
						<X
							:size="18"
							aria-hidden="true"
						/>
						<span class="visually-hidden">Fechar</span>
					</DialogClose>
				</div>

				<div class="dialog-body">
					<slot />
				</div>

				<div
					v-if="$slots.footer"
					class="dialog-footer"
				>
					<slot name="footer" />
				</div>
			</DialogContent>
		</DialogPortal>
	</DialogRoot>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.dialog-overlay {
  position: fixed;
  inset: 0;
  background-color: $bg-overlay;
  backdrop-filter: blur(6px);
  z-index: 100;
  animation: overlay-in 0.2s ease-out;
  &[data-state="closed"] {
    animation: overlay-out 0.15s ease-in forwards;
  }
}

.dialog-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 32.5rem;
  max-height: 85vh;
  overflow-y: auto;
  @include card-surface;
  background-color: $bg-card;
  z-index: 101;
  padding: 0;
  animation: dialog-in 0.24s cubic-bezier(0.16, 1, 0.3, 1);
  &[data-state="closed"] {
    animation: dialog-out 0.16s ease-in forwards;
  }
  @include scrollbar-custom;

  .dialog-header {
    @include flex-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid $border-subtle;

    .dialog-title {
      font-size: $font-size-18;
      font-weight: $font-weight-bold;
      color: $text-primary;
		display: flex;
		align-items: center;
		gap: $spacing-sm;
    }

    .dialog-description {
      font-size: $font-size-14;
      color: $text-secondary;
      margin-top: $spacing-xs;
    }

    .dialog-close {
      background: transparent;
      border: none;
      color: $text-muted;
      cursor: pointer;
      padding: $spacing-xs;
      border-radius: $radius-xs;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all $transition-fast;

      &:hover {
        color: $text-primary;
        background-color: $bg-card-hover;
      }
    }
  }

  .dialog-body {
    padding: 1.5rem;
  }

  .dialog-footer {
    @include flex-between;
    padding: $spacing-md 1.5rem;
    border-top: 1px solid $border-subtle;
    background-color: $bg-medium;
    gap: 12px;

    // ponytail: stack dialog buttons on mobile
    @media (max-width: 480px) {
      flex-direction: column-reverse;

      > * {
        width: 100%;
      }
    }
  }

	&.robbery {
		border: 1px solid color-mix(in lab, $color-robbery 50%, $bg-card);
		background-color: color-mix(in lab, $color-robbery 10%, $bg-card);

		.dialog-header {
			border-bottom: 1px solid color-mix(in lab, $color-robbery 30%, $bg-card);
		}

		.dialog-footer {
			border-top: 1px solid color-mix(in lab, $color-robbery 30%, $bg-card);
		}
	}

	&.beatup {
		border: 1px solid color-mix(in lab, $color-beatup 50%, $bg-card);
		background-color: color-mix(in lab, $color-beatup 10%, $bg-card);

		.dialog-header {
			border-bottom: 1px solid color-mix(in lab, $color-beatup 30%, $bg-card);
		}

		.dialog-footer {
			border-top: 1px solid color-mix(in lab, $color-beatup 30%, $bg-card);
		}
	}
}

@keyframes overlay-in {
	from { opacity: 0; }
	to { opacity: 1; }
}

@keyframes overlay-out {
	to { opacity: 0; }
}

@keyframes dialog-in {
	from { opacity: 0; transform: translate(-50%, -47%) scale(0.97); }
	to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

@keyframes dialog-out {
	to { opacity: 0; transform: translate(-50%, -48%) scale(0.98); }
}
</style>
