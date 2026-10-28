<script setup>
import { defineAsyncComponent } from "vue";
import BaseButton from "~/components/ui/BaseButton.vue";

const MultiplayerDefenderPrompt = defineAsyncComponent(
	() => import("~/components/Multiplayer/MultiplayerDefenderPrompt.vue"),
);
const updateAvailable = ref(false);

useNuxtApp().hook("app:manifest:update", () => {
	updateAvailable.value = true;
});

const { isPaused, prefersReducedMotion, isDocumentHidden } = useMotionPreferences(true);
const shellClasses = computed(() => [
	isPaused.value && "motion-paused",
	prefersReducedMotion.value && "motion-reduced",
	isDocumentHidden.value && "document-hidden",
]);

useHead({
	titleTemplate: (titleChunk) => {
		return titleChunk ? `${titleChunk} - Cross Roads` : "Cross Roads";
	},
});
</script>
<template>
	<div
		id="app-shell"
		:class="shellClasses"
	>
		<div
			v-if="updateAvailable"
			class="app-update-notice"
			role="status"
			aria-live="polite"
		>
			<span>Uma nova versão da interface está disponível.</span>
			<BaseButton
				size="sm"
				@click="reloadNuxtApp()"
			>
				Atualizar agora
			</BaseButton>
		</div>
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
		<MultiplayerDefenderPrompt />
		<UiToastContainer />
	</div>
</template>

<style lang="scss">
@use "~/assets/scss/variables" as *;

#app-shell {
	min-height: 100%;
	display: flex;
	flex-direction: column;
}

.app-update-notice {
	position: fixed;
	top: $spacing-lg;
	left: 50%;
	z-index: 1100;
	display: flex;
	align-items: center;
	gap: $spacing-md;
	width: max-content;
	max-width: calc(100vw - #{$spacing-lg * 2});
	padding: $spacing-sm $spacing-md;
	border: 1px solid $border-subtle;
	border-radius: $radius-sm;
	background: $bg-card;
	color: $text-primary;
	box-shadow: $shadow-lg;
	transform: translateX(-50%);

	@media (max-width: $bp-mobile) {
		flex-wrap: wrap;
		justify-content: center;
	}
}
</style>
