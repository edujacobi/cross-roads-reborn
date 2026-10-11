import { computed, ref, watch } from "vue";
import { type LocationQueryValue, useRouter } from "vue-router";

export type SortDirection = "asc" | "desc" | null;

export interface SortColumn {
	key: string;
	label: string;
	sortable?: boolean;
}

export function useSorting(initialColumn?: string, initialDirection: SortDirection = null) {
	const route = useRoute();
	const router = useRouter();

	const sortColumn = ref(typeof route.query.sort === "string" ? route.query.sort : initialColumn || "");
	const orderParam = route.query.order as string;
	const sortDirection = ref<SortDirection>(
		(orderParam === "asc" || orderParam === "desc" ? orderParam : null) || initialDirection,
	);

	watch(
		[sortColumn, sortDirection],
		() => {
			const query: { [p: string]: string | null | LocationQueryValue[] } = { ...route.query };
			if (sortColumn.value && sortDirection.value) {
				query.sort = sortColumn.value;
				query.order = sortDirection.value;
			} else {
				delete query.sort;
				delete query.order;
			}
			router.replace({ query });
		},
		{ flush: "post" },
	);

	function toggleSort(column: string) {
		if (sortColumn.value !== column) {
			sortColumn.value = column;
			sortDirection.value = "asc";
		} else if (sortDirection.value === "asc") {
			sortDirection.value = "desc";
		} else {
			sortColumn.value = "";
			sortDirection.value = null;
		}
	}

	const hasSort = computed(() => sortColumn.value !== "" && sortDirection.value !== null);

	return { sortColumn, sortDirection, toggleSort, hasSort };
}
