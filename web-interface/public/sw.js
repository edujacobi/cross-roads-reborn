self.addEventListener("push", (event) => {
	const payload = event.data?.json() ?? {};
	const { title, body, data, requireInteraction, tag } = payload;
	const actions = Array.isArray(payload.actions)
		? payload.actions.filter((action) => typeof action?.action === "string" && typeof action.title === "string")
		: [];

	event.waitUntil(
		Promise.all([
			self.registration.showNotification(title ?? "Cross Roads", {
				body,
				icon: "/manifest/web-app-manifest-192x192.png",
				badge: "/manifest/favicon-96x96.png",
				actions,
				data,
				requireInteraction: requireInteraction === true,
				tag,
			}),
			self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
				for (const windowClient of windowClients) {
					windowClient.postMessage({ type: "push-notification", body });
				}
			}),
		]),
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const targetUrl = new URL("/me", self.location.origin);
	const sessionId = event.notification.data?.sessionId;
	if (event.action && typeof sessionId === "string") {
		targetUrl.searchParams.set("pushSessionId", sessionId);
		targetUrl.searchParams.set("pushResponse", event.action);
	}

	event.waitUntil(
		self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windowClients) => {
			const existingClient = windowClients.find((client) => new URL(client.url).origin === self.location.origin);
			if (!existingClient) return self.clients.openWindow(targetUrl.href);

			const targetClient = await existingClient.navigate(targetUrl.href);
			return (targetClient ?? existingClient).focus();
		}),
	);
});
