import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router/auto";

export function usePagination(initialPage = 1, initialPageSize = 15) {
	const route = useRoute();
	const router = useRouter();

	const page = ref(parseInt(route.query.page as string, 10) || initialPage);
	const pageSize = ref(initialPageSize);
	const offset = computed(() => (page.value - 1) * pageSize.value);

	watch(page, (newPage) => {
		const query: Record<string, string> = { ...route.query };
		if (newPage === 1) {
			delete query.page;
		} else {
			query.page = String(newPage);
		}
		router.replace({ query });
	}, { flush: "post" });

	function resetPage() {
		page.value = 1;
	}

	return { page, pageSize, offset, resetPage };
}
