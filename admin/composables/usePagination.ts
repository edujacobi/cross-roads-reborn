import { computed, ref } from "vue";

export function usePagination(initialPage = 1, initialPageSize = 15) {
	const page = ref(initialPage);
	const pageSize = ref(initialPageSize);
	const offset = computed(() => (page.value - 1) * pageSize.value);

	function resetPage() {
		page.value = 1;
	}

	return { page, pageSize, offset, resetPage };
}
