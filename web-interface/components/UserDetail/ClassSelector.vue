<script
	setup
	lang="ts"
>
import { useId } from "vue";
import { ClassId } from "../../../src/core/types/Ids";

defineProps<{
	modelValue: ClassId | null;
	currentClass?: number;
	required?: boolean;
	label?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [value: ClassId] }>();
const id = useId();
const classes = [ClassId.Attorney, ClassId.Entrepreneur, ClassId.Hobo, ClassId.Thief];
const { getClassName, getClassImageUrl, getClassDescription, getClassModifiers } = useClasses();
</script>

<template>
	<fieldset class="class-selector">
		<legend v-if="label">{{ label }}</legend>
		<div class="class-options">
			<div
				v-for="classId in classes"
				:key="classId"
			>
				<input
					:id="`${id}-${classId}`"
					class="class-option__input"
					type="radio"
					:name="id"
					:checked="modelValue === classId"
					:required="required"
					@change="emit('update:modelValue', classId)"
				>
				<label
					class="class-option"
					:for="`${id}-${classId}`"
				>
					<NuxtImg
						class="option-image"
						:src="getClassImageUrl(classId)"
						width="80"
						alt=""
					/>
					<span class="option-name">{{ getClassName(classId) }}</span>
					<span
						v-if="classId === currentClass"
						class="option-current"
						>Atual</span
					>
					<span
						v-if="classId === modelValue"
						class="option-selected"
						>Selecionada</span
					>
				</label>
			</div>
		</div>
		<template v-if="modelValue !== null">
			<p class="class-description">{{ getClassDescription(modelValue) }}</p>
			<ul class="class-modifiers">
				<li
					v-for="modifier in getClassModifiers(modelValue)"
					:key="modifier.label"
					:class="{ 'class-modifier--negative': !modifier.isPositive }"
				>
					{{ modifier.isPositive ? "+" : "-" }}{{ modifier.percentage }}% {{ modifier.label }}
				</li>
			</ul>
		</template>
	</fieldset>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "sass:color";

.class-selector {
	min-width: 0;
	margin: 0;
	padding: 0;
	border: 0;

	legend {
		margin-bottom: $spacing-xs;
		color: $text-secondary;
		font-size: $font-size-12;
		font-weight: $font-weight-medium;
	}
}

.class-options {
	display: grid;
	gap: $spacing-md;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	width: 100%;

	@media (max-width: 540px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

.class-option__input {
	position: absolute;
	clip-path: inset(50%);
	overflow: hidden;
	width: 1px;
	height: 1px;
	margin: -1px;
	padding: 0;
	border: 0;
	white-space: nowrap;

	&:checked + .class-option {
		border-color: $color-success;
		color: $color-success;
		background-color: color-mix(in lab, $bg-card 100%, $color-success 10%);
	}

	&:focus-visible + .class-option {
		outline: 2px solid $color-brand;
		outline-offset: 2px;
	}
}

.class-option {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
	padding: $spacing-md;
	flex-direction: column;
	height: 100%;
	min-width: 0;
	border-radius: $radius-sm;
	border: 1px solid $border-card;
	color: $text-primary;
	cursor: pointer;
}

.option-image { max-width: 100%; }
.option-name { font-size: 0.85rem; }
.option-current, .option-selected { font-size: 0.7rem; }
.option-current { color: $text-secondary; }

.class-description {
	margin: $spacing-sm 0 0;
	color: $text-secondary;
	font-size: $font-size-14;
}

.class-modifiers {
	display: flex;
	flex-direction: column;
	gap: $spacing-sm;
	margin: $spacing-sm 0 0;
	padding-left: 0.5rem;
	color: color.adjust($color-success, $lightness: 10%);
	font-size: $font-size-14;
	list-style: none;

	li:before { content: '▲'; margin-right: 0.5rem; }
}

.class-modifier--negative {
	color: color.adjust($color-danger, $lightness: 10%);
	&:before { content: '▼' !important; }
}
</style>
