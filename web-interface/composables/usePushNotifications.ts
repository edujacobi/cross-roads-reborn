import { localStorageKeys } from "~/constants/localStorageKeys";

export function usePushNotifications() {
	const {
		public: { apiBaseUrl },
	} = useRuntimeConfig();
	const isSupported =
		import.meta.client && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
	const isSubscribed = useState("push-subscribed", () => false);

	async function postToApi(path: string, body: unknown) {
		const response = await fetch(`${apiBaseUrl}${path}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem(localStorageKeys.token)}`,
			},
			body: JSON.stringify(body),
		});
		if (!response.ok) throw new Error(`Push request failed: ${response.status}`);
	}

	async function refreshStatus() {
		if (!isSupported) return;
		const registration = await navigator.serviceWorker.getRegistration();
		isSubscribed.value = Notification.permission === "granted" && !!(await registration?.pushManager.getSubscription());
	}

	async function enable() {
		if ((await Notification.requestPermission()) !== "granted") return false;

		const { publicKey } = await (await fetch(`${apiBaseUrl}/push/public-key`)).json();
		if (!publicKey) throw new Error("Push notifications are not configured on the server.");

		const registration = await navigator.serviceWorker.register("/sw.js");
		await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: publicKey,
		});

		await postToApi("/push/subscribe", subscription.toJSON());
		isSubscribed.value = true;
		return true;
	}

	async function disable() {
		const registration = await navigator.serviceWorker.getRegistration();
		const subscription = await registration?.pushManager.getSubscription();
		if (subscription) {
			await postToApi("/push/unsubscribe", { endpoint: subscription.endpoint });
			await subscription.unsubscribe();
		}
		isSubscribed.value = false;
	}

	return { isSupported, isSubscribed, refreshStatus, enable, disable };
}
