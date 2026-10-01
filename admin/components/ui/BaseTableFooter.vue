<script
	setup
	lang="ts"
>
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";

interface Props {
	labels: {
		item: string;
		navigation: string;
	};
	index: number;
	offset: number;
	total: number;
	page: number;
	pages: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
	clickPrevious: [];
	clickNext: [];
}>();

const firstItem = computed(() => (props.total > 0 ? props.offset + 1 : 0));
const lastItem = computed(() => Math.min(props.offset + props.index, props.total));
</script>

<template>
	<div class="base-pagination">
		<span class="base-pagination__info">
			Mostrando
			<strong>{{ firstItem }}-{{ lastItem }}</strong>
			de
			<strong>{{ total }}</strong>
			{{ labels.item }}
		</span>

		<nav
			class="base-pagination__controls"
			:aria-label="labels.navigation"
		>
			<BaseButton
				variant="secondary"
				size="sm"
				:disabled="page <= 1"
				@click="emit('clickPrevious')"
			>
				<ChevronLeft
					:size="16"
					aria-hidden="true"
				/>
				Anterior
			</BaseButton>

			<span
				class="base-pagination__indicator"
				aria-live="polite"
			>
				Página {{ page }} de {{ pages }}
			</span>

			<BaseButton
				variant="secondary"
				size="sm"
				:disabled="page >= pages"
				@click="emit('clickNext')"
			>
				Próxima
				<ChevronRight
					:size="16"
					aria-hidden="true"
				/>
			</BaseButton>
		</nav>
	</div>
</template>

<style lang="scss">
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.base-pagination {
	@include flex-between;
	gap: $spacing-md;

	@media (max-width: 640px) {
		flex-direction: column;
		text-align: center;
	}
}

.base-pagination__info,
.base-pagination__indicator {
	font-size: 0.8125rem;
	color: $text-secondary;

	strong {
		color: $text-primary;
	}
}

.base-pagination__controls {
	display: flex;
	align-items: center;
	gap: 12px;
}
</style>
