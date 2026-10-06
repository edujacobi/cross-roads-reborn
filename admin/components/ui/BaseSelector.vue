<script
	setup
	lang="ts"
>
import { ChevronDown } from "lucide-vue-next";

export interface SelectorOption {
	label: string;
	value: string;
	imagePath?: string;
}

interface Props {
	id: string;
	modelValue?: string;
	label?: string;
	placeholder?: string;
	options: SelectorOption[];
	disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: undefined,
	label: undefined,
	placeholder: "Selecione...",
	disabled: false,
});

const emit = defineEmits<(e: "update:modelValue", value: string) => void>();

const isOpen = ref(false);
const focusedIndex = ref(-1);
const triggerRef = ref<HTMLButtonElement | null>(null);
const listboxRef = ref<HTMLDivElement | null>(null);

const selectedOption = computed(() => props.options.find((o) => o.value === props.modelValue));
const selectedLabel = computed(() => selectedOption.value?.label || props.placeholder);

function toggle() {
	if (props.disabled) return;
	isOpen.value = !isOpen.value;
}

function close() {
	isOpen.value = false;
	focusedIndex.value = -1;
	triggerRef.value?.focus();
}

function selectOption(value: string) {
	emit("update:modelValue", value);
	close();
}

function handleOptionKeydown(e: KeyboardEvent, value: string) {
	if (e.key === "Enter" || e.key === " ") {
		e.preventDefault();
		selectOption(value);
	}
}

function handleKeyDown(e: KeyboardEvent) {
	if (props.disabled) return;

	if (!isOpen.value) {
		if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			toggle();
		}
		return;
	}

	switch (e.key) {
		case "ArrowDown":
			e.preventDefault();
			focusedIndex.value = (focusedIndex.value + 1) % props.options.length;
			break;
		case "ArrowUp":
			e.preventDefault();
			focusedIndex.value = (focusedIndex.value - 1 + props.options.length) % props.options.length;
			break;
		case "Home":
			e.preventDefault();
			focusedIndex.value = 0;
			break;
		case "End":
			e.preventDefault();
			focusedIndex.value = props.options.length - 1;
			break;
		case "Enter":
		case " ":
			e.preventDefault();
			if (focusedIndex.value >= 0 && focusedIndex.value < props.options.length) {
				selectOption(props.options[focusedIndex.value].value);
			}
			break;
		case "Escape":
			e.preventDefault();
			close();
			break;
	}
}

function handleClickOutside(e: MouseEvent) {
	const target = e.target as Node;
	if (
		listboxRef.value &&
		!listboxRef.value.contains(target) &&
		triggerRef.value &&
		!triggerRef.value.contains(target)
	) {
		close();
	}
}

onMounted(() => document.addEventListener("click", handleClickOutside));
onUnmounted(() => document.removeEventListener("click", handleClickOutside));

watch(isOpen, (open) => {
	if (open) {
		focusedIndex.value = props.options.findIndex((o) => o.value === props.modelValue);
		if (focusedIndex.value === -1) focusedIndex.value = 0;
	}
});
</script>

<template>
	<div
		class="base-selector"
		:class="{ 'is-disabled': disabled, 'is-open': isOpen }"
	>
		<label
			v-if="label"
			:for="id"
			class="selector-label"
		>
			{{ label }}
		</label>

		<div
			class="selector-wrapper"
			role="combobox"
			:aria-expanded="isOpen"
			aria-haspopup="true"
			:aria-controls="`${id}-listbox`"
			tabindex="-1"
		>
			<button
				:id="id"
				ref="triggerRef"
				type="button"
				:disabled="disabled"
				class="selector-trigger"
				@click="toggle"
				@keydown="handleKeyDown"
			>
				<span class="selector-trigger-content">
					<NuxtImg
						v-if="selectedOption?.imagePath"
						:src="selectedOption.imagePath"
						alt=""
						width="20"
						height="20"
						class="selector-trigger-image"
					/>
					<span class="selector-trigger-label">{{ selectedLabel }}</span>
				</span>
				<ChevronDown
					:size="16"
					class="selector-chevron"
					:class="{ 'is-open': isOpen }"
					aria-hidden="true"
				/>
			</button>

			<div
				v-if="isOpen"
				:id="`${id}-listbox`"
				ref="listboxRef"
				class="selector-dropdown"
				role="listbox"
			>
				<div
					v-for="(option, index) in options"
					:key="option.value"
					role="option"
					:aria-selected="option.value === modelValue"
					tabindex="-1"
					class="selector-option"
					:class="{ 'is-selected': option.value === modelValue, 'is-focused': index === focusedIndex }"
					@click="selectOption(option.value)"
					@keydown="(e) => handleOptionKeydown(e, option.value)"
					@mouseenter="focusedIndex = index"
				>
					<NuxtImg
						v-if="option.imagePath"
						:src="option.imagePath"
						alt=""
						width="20"
						height="20"
						class="selector-option-image"
					/>
					<span class="selector-option-label">{{ option.label }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;
@use "sass:color";

.base-selector {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: $spacing-sm;

	@media (max-width: $bp-mobile) {
		flex-direction: column;
		align-items: flex-start;
		flex-grow: 1;
	}

	&.is-disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.selector-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: $text-secondary;
		text-align: right;

		@media (max-width: $bp-mobile) {
			text-align: left;
			margin-top: $spacing-sm;
		}
	}

	.selector-wrapper {
		position: relative;
		flex-shrink: 0;
		min-width: 15rem;

		@media (max-width: $bp-mobile) {
			min-width: 100%;
		}
	}

	.selector-trigger {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $spacing-sm;
		padding: 0.625rem 0.875rem;
		background-color: $bg-card-hover;
		border: 1px solid $border-subtle;
		border-radius: $radius-sm;
		color: $text-primary;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		outline: none;
		@include transition-all;

		&:hover:not(:disabled) {
			background-color: color.adjust($bg-card-hover, $lightness: 6%);
			border-color: $border-focus;
		}

		&:focus-visible {
			@include focus-outline;
		}

		&:disabled {
			cursor: not-allowed;
		}

		.selector-trigger-content {
			display: flex;
			align-items: center;
			gap: $spacing-sm;
			min-width: 0;

			.selector-trigger-label {
				@include truncate;
			}

			.selector-trigger-image {
				flex-shrink: 0;
			}
		}

		.selector-chevron {
			flex-shrink: 0;
			transition: transform $transition-fast ease-in-out;

			&.is-open {
				transform: rotate(180deg);
			}
		}
	}

	.selector-dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		z-index: 50;
		max-height: 12.5rem;
		overflow-y: auto;
		background-color: $bg-card;
		border: 1px solid $border-card;
		border-radius: $radius-sm;
		box-shadow: $shadow-md;
		padding: 0;
		margin: 0;
		list-style: none;
		@include scrollbar-custom;
	}

	.selector-option {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		padding: 0.5rem 0.875rem;
		cursor: pointer;
		outline: none;
		color: $text-secondary;
		@include transition-bg;

		&:hover,
		&.is-focused {
			background-color: $bg-hover;
		}

		&.is-selected {
			color: $text-primary;
			font-weight: 600;
		}

		&:focus-visible {
			@include focus-outline;
		}

		.selector-option-image {
			flex-shrink: 0;
		}

		.selector-option-label {
			@include truncate;
			font-size: 0.85rem;
		}
	}
}
</style>
