export function useMotionPreferences(initialize = false) {
	const isPaused = useState("motion-paused", () => false);
	const prefersReducedMotion = useState(
		"prefers-reduced-motion",
		() => import.meta.client && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
	);
	const isDocumentHidden = useState(
		"motion-document-hidden",
		() => import.meta.client && document.visibilityState === "hidden",
	);
	const motionEnabled = computed(() => !isPaused.value && !prefersReducedMotion.value && !isDocumentHidden.value);

	function syncPreferences() {
		prefersReducedMotion.value = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		isDocumentHidden.value = document.visibilityState === "hidden";
	}

	if (initialize) {
		const mediaQuery = import.meta.client ? window.matchMedia("(prefers-reduced-motion: reduce)") : undefined;
		const syncMotionPreference = () => {
			if (mediaQuery) prefersReducedMotion.value = mediaQuery.matches;
		};

		onMounted(() => {
			syncPreferences();
			mediaQuery?.addEventListener("change", syncMotionPreference);
			document.addEventListener("visibilitychange", syncPreferences);
		});
		onBeforeUnmount(() => {
			mediaQuery?.removeEventListener("change", syncMotionPreference);
			if (import.meta.client) document.removeEventListener("visibilitychange", syncPreferences);
		});
	}

	return { isPaused, prefersReducedMotion, isDocumentHidden, motionEnabled };
}
