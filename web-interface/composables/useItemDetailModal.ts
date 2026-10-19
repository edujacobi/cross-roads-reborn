export function useItemDetailModal() {
	const route = useRoute();
	const router = useRouter();

	async function openItemModal(item: { id: number }) {
		if (String(route.query.detailsItemId) === String(item.id)) return;
		await router.replace({ query: { ...route.query, detailsItemId: item.id } });
	}

	async function closeItemModal() {
		if (route.query.detailsItemId === undefined) return;
		const query = { ...route.query };
		delete query.detailsItemId;
		await router.replace({ query });
	}

	async function handleOpenUpdate(open: boolean) {
		if (!open) {
			await closeItemModal();
		}
	}

	return {
		openItemModal,
		closeItemModal,
		handleOpenUpdate,
	};
}
