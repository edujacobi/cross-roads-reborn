import { localStorageKeys } from "~/constants/localStorageKeys";

export default defineNuxtPlugin(() => {
	const { public: { apiBaseUrl } } = useRuntimeConfig();
	const heartbeatInterval = 60_000;
	let lastHeartbeatAt = 0;
	let heartbeatInProgress = false;

	async function sendHeartbeat() {
		const now = Date.now();
		if (
			document.visibilityState !== "visible"
			|| now - lastHeartbeatAt < heartbeatInterval
			|| heartbeatInProgress
		) {
			return;
		}

		const token = localStorage.getItem(localStorageKeys.token);
		if (!token) return;

		lastHeartbeatAt = now;
		heartbeatInProgress = true;

		try {
			const response = await fetch(`${apiBaseUrl}/presence/heartbeat`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok && response.status !== 401) {
				console.warn("Presence heartbeat failed:", response.status);
			}
		}
		catch (error) {
			console.warn("Presence heartbeat failed:", error);
		}
		finally {
			heartbeatInProgress = false;
		}
	}

	for (const event of ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"]) {
		window.addEventListener(event, () => {
			void sendHeartbeat();
		}, { passive: true });
	}
});
