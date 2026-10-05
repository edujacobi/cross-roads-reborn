import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router/auto";

export type SortDirection = "asc" | "desc" | null;

export interface SortColumn {
	key: string;
	label: string;
	sortable?: boolean;
}

export function useSorting(initialColumn?: string, initialDirection: SortDirection = null) {
	const route = useRoute();
	const router = useRouter();

	const sortColumn = ref(route.query.sort || initialColumn || "");
	const orderParam = route.query.order as string;
	const sortDirection = ref<SortDirection>(
		(orderParam === "asc" || orderParam === "desc" ? orderParam : null) || initialDirection,
	);

	watch(
		[sortColumn, sortDirection],
		() => {
			const query: Record<string, string> = { ...route.query };
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
