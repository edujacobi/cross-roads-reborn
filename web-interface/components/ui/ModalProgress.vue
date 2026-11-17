<script
	setup
	lang="ts"
>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { timedProgress } from "~/utils/timedProgress";

const props = defineProps<{
	endTime?: string | null;
	color: "robbery" | "beatup" | "scavenge" | "prison";
}>();

const now = ref(Date.now());
const startTime = ref(now.value);
let animationFrame: number;

watch(
	() => props.endTime,
	() => {
		now.value = Date.now();
		startTime.value = now.value;
	},
	{ immediate: true },
);

const progress = computed(() => timedProgress(props.endTime, startTime.value, now.value));

onMounted(() => {
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const updateProgress = () => {
		const currentTime = Date.now();
		if (!reducedMotion.matches || currentTime - now.value >= 1_000) now.value = currentTime;
		animationFrame = requestAnimationFrame(updateProgress);
	};
	animationFrame = requestAnimationFrame(updateProgress);
});
onUnmounted(() => {
	cancelAnimationFrame(animationFrame);
});
</script>

<template>
	<progress
		class="modal-progress"
		:class="color"
		:value="progress"
		aria-label="Progresso da ação"
	/>
</template>

<style
	scoped
	lang="scss"
>
@use "~/assets/scss/variables" as *;

.modal-progress {
	display: block;
	width: 100%;
	height: 4px;
	accent-color: var(--progress-color);

	&.robbery { --progress-color: #{$color-robbery}; }
	&.beatup { --progress-color: #{$color-beatup}; }
	&.scavenge { --progress-color: #{$color-scavenge}; }
	&.prison { --progress-color: #{$color-prison}; }

	&:not(:indeterminate) {
		appearance: none;
		border: 0;
		background: $border-card;
	}
	&:not(:indeterminate)::-webkit-progress-bar { background: $border-card; }
	&:not(:indeterminate)::-webkit-progress-value { background: var(--progress-color); }
	&:not(:indeterminate)::-moz-progress-bar { background: var(--progress-color); }
}
</style>
