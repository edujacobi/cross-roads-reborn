<script
	setup
	lang="ts"
>
import { AlertTriangle, CheckCircle2, Info, OctagonAlert, X } from "lucide-vue-next";
import { onBeforeUnmount, watch } from "vue";

const { toasts, dismissToast } = useToast();
const defaultIcons = {
	neutral: Info,
	success: CheckCircle2,
	warning: AlertTriangle,
	error: OctagonAlert,
};
const timers = new Map<number, ReturnType<typeof setTimeout>>();

watch(
	toasts,
	(currentToasts) => {
		const currentIds = new Set(currentToasts.map((toast) => toast.id));

		for (const [id, timer] of timers) {
			if (!currentIds.has(id)) {
				clearTimeout(timer);
				timers.delete(id);
			}
		}

		for (const toast of currentToasts) {
			if (toast.duration > 0 && !timers.has(toast.id)) {
				timers.set(
					toast.id,
					setTimeout(() => dismissToast(toast.id), toast.duration),
				);
			}
		}
	},
	{ immediate: true, deep: true },
);

onBeforeUnmount(() => {
	for (const timer of timers.values()) clearTimeout(timer);
	timers.clear();
});
</script>

<template>
	<div class="toast-container">
		<TransitionGroup name="toast">
			<div
				v-for="toast in toasts"
				:key="toast.id"
				class="toast"
				:class="`toast--${toast.variant}`"
				:role="toast.variant === 'error' ? 'alert' : 'status'"
				:aria-live="toast.variant === 'error' ? 'assertive' : 'polite'"
			>
				<NuxtImg
					v-if="toast.image"
					class="toast__image"
					:src="toast.image"
					alt=""
				/>
				<component
					:is="toast.icon || defaultIcons[toast.variant]"
					v-else
					:size="20"
					class="toast__icon"
					aria-hidden="true"
				/>
				<p class="toast__text">{{ toast.text }}</p>
				<button
					class="toast__close"
					type="button"
					aria-label="Fechar notificação"
					@click="dismissToast(toast.id)"
				>
					<X
						:size="16"
						aria-hidden="true"
					/>
				</button>
			</div>
		</TransitionGroup>
	</div>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "sass:color";

.toast-container {
	position: fixed;
	top: $spacing-lg;
	right: $spacing-lg;
	z-index: 1000;
	display: flex;
	flex-direction: column;
	gap: $spacing-sm;
	width: min(24rem, calc(100vw - #{$spacing-lg * 2}));
	pointer-events: none;
}

.toast {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
	padding: $spacing-md;
	border: 1px solid $border-subtle;
	border-radius: $radius-sm;
	background: $bg-card;
	color: $text-primary;
	box-shadow: $shadow-lg;
	pointer-events: auto;

	&--success {
		border-color:  color-mix(in lab, $bg-card 100%, $color-success 75%);
		background: color-mix(in lab, $bg-card 100%, $color-success 15%);
	}

	&--warning {
		border-color: color-mix(in lab, $bg-card 100%, $color-warning 75%);
		background: color-mix(in lab, $bg-card 100%, $color-warning 15%)
	}

	&--error {
		border-color: color-mix(in lab, $bg-card 100%, $color-danger 75%);
		background: color-mix(in lab, $bg-card 100%, $color-danger 15%)
	}

	&__icon {
		flex: none;
		color: $text-secondary;
	}

	&--success &__icon {
		color: $color-success;
	}

	&--warning &__icon {
		color: $color-warning;
	}

	&--error &__icon {
		color: $color-danger;
	}

	&__image {
		width: 1.25rem;
		height: 1.25rem;
		object-fit: contain;
		flex: none;
	}

	&__text {
		flex: 1;
		margin: 0;
		font-size: 0.875rem;
		overflow-wrap: anywhere;
	}

	&__close {
		display: inline-flex;
		flex: none;
		align-items: center;
		justify-content: center;
		padding: $spacing-xs;
		border: 0;
		border-radius: $radius-xs;
		background: transparent;
		color: $text-secondary;
		cursor: pointer;

		&:hover {
			background: $bg-card-hover;
			color: $text-primary;
		}

		&:focus-visible {
			outline: 2px solid $color-brand;
			outline-offset: 2px;
		}
	}
}

.toast-enter-active,
.toast-leave-active,
.toast-move {
	transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
	opacity: 0;
	transform: translateX(1rem);
}

.toast-leave-active {
	position: absolute;
	right: 0;
	left: 0;
}
</style>
