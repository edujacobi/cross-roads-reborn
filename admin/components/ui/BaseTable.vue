<script
	setup
	lang="ts"
>
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-vue-next";
import type { SortColumn } from "~/composables/useSorting";

const props = withDefaults(
	defineProps<{
		/** Array of column definitions for sortable headers */
		columns?: SortColumn[];
		/** Currently sorted column key */
		sortColumn?: string;
		/** Current sort direction */
		sortDirection?: "asc" | "desc" | null;
	}>(),
	{
		columns: undefined,
		sortColumn: "",
		sortDirection: null,
	},
);

const emit = defineEmits<(sort: [column: string]) => void>();

function onHeaderClick(column: SortColumn) {
	if (!column.sortable) return;
	emit("sort", column.key);
}

function getSortIcon(column: SortColumn) {
	if (!column.sortable) return null;
	if (props.sortColumn !== column.key) return "unsorted";
	return props.sortDirection;
}
</script>

<template>
	<div class="base-table">
		<slot v-if="!columns" />
		<template v-else>
			<slot name="header">
				<div class="base-table__header">
					<button
						v-for="column in columns"
						:key="column.key"
						type="button"
						:class="[
							'base-table__sort-header',
							{ 'base-table__sort-header--active': sortColumn === column.key && column.sortable },
						]"
						:disabled="!column.sortable"
						@click="onHeaderClick(column)"
					>
						<span class="base-table__sort-label">{{ column.label }}</span>
						<span
							v-if="column.sortable"
							class="base-table__sort-icons"
							aria-hidden="true"
						>
							<ArrowUpDown
								v-if="getSortIcon(column) === 'unsorted'"
								:size="14"
								class="base-table__sort-icon unsorted"
							/>
							<ArrowUp
								v-if="getSortIcon(column) === 'asc'"
								:size="14"
								class="base-table__sort-icon asc"
							/>
							<ArrowDown
								v-if="getSortIcon(column) === 'desc'"
								:size="14"
								class="base-table__sort-icon desc"
							/>
						</span>
					</button>
				</div>
			</slot>
			<slot />
		</template>
	</div>
</template>

<style lang="scss">
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.base-table {
	overflow-x: auto;
	@include scrollbar-custom;

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;

		th,
		td {
			padding: 0.75rem $spacing-md;
			text-align: left;
			border-bottom: 1px solid $border-subtle;
			white-space: nowrap;
		}

		th {
			color: $text-muted;
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
		}

		td {
			color: $text-secondary;
		}
	}

	&__header {
		display: grid;
		grid-template-columns: subgrid;
		padding: 0.75rem $spacing-md;
		border-bottom: 1px solid $border-subtle;
		background-color: $bg-card;
	}

	&__sort-header {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		color: $text-muted;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		text-align: left;
		white-space: nowrap;
		@include transition-color;

		&:hover {
			color: $text-primary;
		}

		&:focus-visible {
			@include focus-outline;
		}

		&:disabled {
			cursor: default;
			color: $text-muted;
		}

		&--active {
			color: $text-primary;
		}

		.sort-label {
			flex: 1;
		}

		.sort-icons {
			display: flex;
			align-items: center;
			flex-shrink: 0;
		}

		.sort-icon {
			opacity: 0.35;
			@include transition-opacity;

			&.unsorted {
				opacity: 0.35;
			}

			&.asc,
			&.desc {
				opacity: 1;
				color: $color-special;
			}
		}

		&:hover .sort-icon.unsorted {
			opacity: 0.7;
		}
	}
}
</style>
