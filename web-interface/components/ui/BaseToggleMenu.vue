<script
	setup
	lang="ts"
>
import { X } from "lucide-vue-next";

const props = defineProps<{
	menuId: string;
	menuLabel: string;
	toggleLabel: string;
	openLabel: string;
	closeLabel: string;
	scrollable?: boolean;
}>();

const isOpen = defineModel<boolean>("open", { required: true });
</script>

<template>
	<div class="base-toggle-menu">
		<section
			v-show="isOpen"
			:id="props.menuId"
			class="base-toggle-menu__menu"
			:class="{ 'base-toggle-menu__menu--scrollable': props.scrollable }"
			:aria-label="props.menuLabel"
		>
			<slot />
		</section>

		<button
			type="button"
			class="base-toggle-menu__toggle"
			:aria-label="isOpen ? props.closeLabel : props.openLabel"
			:aria-controls="props.menuId"
			:aria-expanded="isOpen"
			@click="isOpen = !isOpen"
		>
			<X
				v-if="isOpen"
				:size="24"
				aria-hidden="true"
			/>
			<slot
				v-else
				name="icon"
			/>
			<span class="base-toggle-menu__label">{{ props.toggleLabel }}</span>
		</button>
	</div>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.base-toggle-menu {
	position: relative;
	display: flex;
	align-items: center;

	@media (max-width: 850px) {
		display: contents;
	}

	&__menu {
		@include scrollbar-custom();
		position: fixed;
		bottom: 4.5rem;
		z-index: 21;
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		width: min(20rem, calc(100vw - 2rem));
		box-sizing: border-box;
		padding: $spacing-sm;
		border: 1px solid $border-card;
		border-radius: $radius-md;
		background-color: $bg-card;
		box-shadow: $shadow-lg;
		left: 50%;
		transform: translateX(-50%);

		:deep(.base-button) {
			width: 100%;
		}

		&--scrollable {
			max-height: calc(100dvh - 7rem);
			overflow-y: auto;
		}

		@media (min-width: 851px) {
			position: absolute;
			bottom: calc(100% + $spacing-sm);
		}
	}

	&__toggle {
		@include flex-center;
		width: 4rem;
		height: 4rem;
		border: 1px solid $border-subtle;
		border-radius: $radius-full;
		background-color: $bg-sidebar;
		color: $text-primary;
		box-shadow: $shadow-lg;
		cursor: pointer;
		transition: transform 0.2s ease;

		&:hover {
			transform: scale(1.05);
		}

		&:focus-visible {
			outline: 2px solid $border-focus;
			outline-offset: 2px;
		}

		@media (min-width: 426px) {
			width: auto;
			padding: 0 1.25rem;
			gap: $spacing-sm;
		}
	}

	&__label {
		font-weight: $font-weight-semibold;

		@media (max-width: 1024px) {
			font-size: $font-size-14;
		}

		@media (max-width: 768px) {
			display: none;
		}
	}
}
</style>
