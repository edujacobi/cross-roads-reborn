<script
	setup
	lang="ts"
>
defineProps<{
	id: string;
	value: string;
	rules: Record<string, { label: string; validate: (value: string) => boolean }>;
}>();
</script>

<template>
	<ul
		:id="id"
		class="validation-checklist"
	>
		<li
			v-for="(rule, key) in rules"
			:key="key"
			class="validation-checklist__rule"
			:class="value ? (rule.validate(value) ? 'validation-checklist__rule--valid' : 'validation-checklist__rule--invalid') : ''"
		>
			<span aria-hidden="true">{{ value ? (rule.validate(value) ? "✓" : "✕") : "•" }}</span>
			<span
				v-if="value"
				class="validation-checklist__status"
			>
				{{ rule.validate(value) ? "Atendido:" : "Não atendido:" }}
			</span>
			{{ rule.label }}
		</li>
	</ul>
</template>

<style
	lang="scss"
	scoped
>
@use "~/assets/scss/variables" as *;
@use "sass:color";

.validation-checklist {
	display: flex;
	flex-direction: column;
	gap: $spacing-xs;
	margin: 0;
	padding: 0;
	color: $text-secondary;
	font-size: $font-size-12;
	list-style: none;

	&__rule {
		display: flex;
		gap: $spacing-sm;

		&--valid { color: color.adjust($color-success, $lightness: 10%); }
		&--invalid { color: color.adjust($color-danger, $lightness: 10%); }
	}

	&__status {
		position: absolute;
		clip-path: inset(50%);
		overflow: hidden;
		width: 1px;
		height: 1px;
		white-space: nowrap;
	}
}
</style>
