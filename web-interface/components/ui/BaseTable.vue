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

const emit = defineEmits<(e: "sort", column: string) => void>();

function onHeaderClick(column: SortColumn) {
	if (!column.sortable) return;
	emit("sort", column.key);
}

function getSortIcon(column: SortColumn) {
	if (!column.sortable) return null;
	if (props.sortColumn !== column.key) return "unsorted";
	return props.sortDirection;
}

function getAriaSort(column: SortColumn) {
	if (!column.sortable) return undefined;
	if (props.sortColumn !== column.key || !props.sortDirection) return "none";
	return props.sortDirection === "asc" ? "ascending" : "descending";
}
</script>

<template>
	<div class="base-table">
		<table v-if="columns">
			<thead>
				<tr>
					<th
						v-for="column in columns"
						:key="column.key"
						scope="col"
						:class="column.class"
						:aria-sort="getAriaSort(column)"
					>
						<button
							v-if="column.sortable"
							type="button"
							class="base-table__sort-header"
							:class="{ 'base-table__sort-header--active': sortColumn === column.key }"
							@click="onHeaderClick(column)"
						>
							<span class="base-table__sort-label">{{ column.label }}</span>
							<span
								class="base-table__sort-icons"
								aria-hidden="true"
							>
								<ArrowUpDown
									v-if="getSortIcon(column) === 'unsorted'"
									:size="14"
									class="base-table__sort-icon base-table__sort-icon--unsorted"
								/>
								<ArrowUp
									v-if="getSortIcon(column) === 'asc'"
									:size="14"
									class="base-table__sort-icon base-table__sort-icon--asc"
								/>
								<ArrowDown
									v-if="getSortIcon(column) === 'desc'"
									:size="14"
									class="base-table__sort-icon base-table__sort-icon--desc"
								/>
							</span>
						</button>
						<template v-else>{{ column.label }}</template>
					</th>
				</tr>
			</thead>
			<slot />
		</table>
		<slot v-else />
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
		font-size: $font-size-14;

		th,
		td {
			padding: 0.75rem $spacing-md;
			text-align: left;
			border-bottom: 1px solid $border-subtle;
			white-space: nowrap;
		}

		th {
			color: $text-muted;
			font-size: $font-size-12;
			font-weight: $font-weight-semibold;
			text-transform: uppercase;
		}

		td {
			color: $text-secondary;
		}
	}

	&__sort-header {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		color: $text-muted;
		font-size: $font-size-12;
		font-weight: $font-weight-semibold;
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

		&--active {
			color: $text-primary;
		}

		&:hover .base-table__sort-icon--unsorted {
			opacity: 0.7;
		}
	}

	&__sort-label {
		flex: 1;
	}

	&__sort-icons {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	&__sort-icon {
		opacity: 0.35;
		@include transition-opacity;

		&--unsorted {
			opacity: 0.35;
		}

		&--asc,
		&--desc {
			opacity: 1;
			color: $color-special;
		}
	}
}
</style>
