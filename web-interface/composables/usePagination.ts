import { computed, ref, watch } from "vue";
import { type LocationQueryValue, useRouter } from "vue-router";

export function usePagination(initialPage = 1, initialPageSize = 15) {
	const route = useRoute();
	const router = useRouter();

	const page = ref(parseInt(route.query.page as string, 10) || initialPage);
	const pageSize = ref(initialPageSize);
	const offset = computed(() => (page.value - 1) * pageSize.value);

	watch(
		page,
		(newPage) => {
			const query: { [p: string]: string | null | LocationQueryValue[] } = { ...route.query };
			if (newPage === 1) {
				delete query.page;
			} else {
				query.page = String(newPage);
			}
			router.replace({ query });
		},
		{ flush: "post" },
	);

	function resetPage() {
		page.value = 1;
	}

	return { page, pageSize, offset, resetPage };
}
