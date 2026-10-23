export function useItemDetailModal() {
	const route = useRoute();
	const router = useRouter();

	async function openItemModal(item: { id: number }, ownerUserId?: string) {
		if (
			String(route.query.detailsItemId) === String(item.id) &&
			String(route.query.detailsItemOwnerId ?? "") === (ownerUserId ?? "")
		) {
			return;
		}

		const query = {
			...route.query,
			detailsItemId: item.id,
		};
		if (ownerUserId) query.detailsItemOwnerId = ownerUserId;
		else delete query.detailsItemOwnerId;
		await router.replace({ query });
	}

	async function closeItemModal() {
		if (route.query.detailsItemId === undefined && route.query.detailsItemOwnerId === undefined) return;
		const query = { ...route.query };
		delete query.detailsItemId;
		delete query.detailsItemOwnerId;
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
