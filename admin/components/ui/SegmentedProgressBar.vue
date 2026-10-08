<script
	setup
	lang="ts"
>
import BasePopover from "~/components/ui/BasePopover.vue";

interface Props {
	/** Current value (hours for time-based, count for quantity-based) */
	value: number;
	/** Maximum value (360 for time-based, 20 for quantity-based) */
	max: number;
	/** Number of segments (5 for time-based, 20 for quantity-based) */
	segments: number;
	/** Accessibility label for screen readers */
	label: string;
	/** Hover tooltip text (e.g., "72h/360h" or "14/20 un") */
	popover: string;
}

const props = defineProps<Props>();

const filledPercentage = computed(() => {
	if (props.max <= 0) return 0;
	return Math.min(100, (props.value / props.max) * 100);
});
</script>

<template>
	<BasePopover
		:text="popover"
		position="top"
	>
		<div
			class="segmented-progress"
			role="progressbar"
			:aria-valuenow="value"
			:aria-valuemin="0"
			:aria-valuemax="max"
			:aria-label="label"
		>
			<div class="segmented-progress__track">
				<div
					class="segmented-progress__fill"
					:style="{ width: `${filledPercentage}%` }"
				/>
				<div class="segmented-progress__segments">
					<div
						v-for="i in segments"
						:key="i"
						class="segmented-progress__segment"
					/>
				</div>
			</div>
		</div>
	</BasePopover>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;

.segmented-progress {
	width: 100%;
	min-width: 6rem;
	position: relative;
	cursor: default;

	&__track {
		position: relative;
		height: 0.375rem;
		background-color: $bg-main;
		border-radius: $radius-full;
		overflow: visible;
	}

	&__fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background-color: $border-focus;
		border-radius: $radius-full;
		transition: width 0.3s ease;
	}

	&__segments {
		position: absolute;
		top: 0;
		left: 0;
		display: flex;
		width: 100%;
		height: 100%;

		.segmented-progress__segment {
			flex: 1;
			border-right: 2px solid $bg-card;
			background-color: transparent;

			&:last-child {
				border-right: none;
			}
		}
	}
}
</style>
