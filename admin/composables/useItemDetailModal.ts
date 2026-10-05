import type { GetItemsQuery } from "~/graphql/generated";

type Item = GetItemsQuery["items"][number];

export function useItemDetailModal() {
	const route = useRoute();
	const router = useRouter();

	const selectedItem = useState<Item | null>("itemDetailModal-selectedItem", () => null);
	const isModalOpen = useState("itemDetailModal-isOpen", () => false);

	async function openItemModal(item: { id: number }) {
		if (String(route.query.detailsItemId) === String(item.id)) {
			isModalOpen.value = true;
			return;
		}
		await router.replace({ query: { ...route.query, detailsItemId: item.id } });
	}

	async function closeItemModal() {
		if (route.query.detailsItemId !== undefined) {
			const query = { ...route.query };
			delete query.detailsItemId;
			await router.replace({ query });
		}
		isModalOpen.value = false;
		selectedItem.value = null;
	}

	async function handleOpenUpdate(open: boolean) {
		if (!open) {
			await closeItemModal();
		}
	}

	return {
		selectedItem,
		isModalOpen,
		openItemModal,
		closeItemModal,
		handleOpenUpdate,
	};
}
