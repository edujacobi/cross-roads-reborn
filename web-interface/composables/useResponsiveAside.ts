import { onBeforeUnmount, onMounted, ref } from "vue";

export function useResponsiveAside() {
	const asideOpen = ref(false);
	let lastFocusedElement: HTMLElement | null = null;

	function closeAside() {
		if (!asideOpen.value) return;
		asideOpen.value = false;
		lastFocusedElement?.focus();
	}

	function toggleAside() {
		if (asideOpen.value) {
			closeAside();
		} else {
			lastFocusedElement = document.activeElement as HTMLElement | null;
			asideOpen.value = true;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === "Escape" && asideOpen.value) closeAside();
	}

	onMounted(() => window.addEventListener("keydown", handleKeyDown));
	onBeforeUnmount(() => window.removeEventListener("keydown", handleKeyDown));

	return { asideOpen, closeAside, toggleAside };
}
