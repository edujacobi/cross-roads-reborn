self.addEventListener("push", (event) => {
	const { title, body } = event.data?.json() ?? {};

	event.waitUntil(
		Promise.all([
			self.registration.showNotification(title ?? "Cross Roads", {
				body,
				icon: "/manifest/web-app-manifest-192x192.png",
				badge: "/manifest/favicon-96x96.png",
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
	const targetUrl = new URL("/me", self.location.origin).href;

	event.waitUntil(
		self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windowClients) => {
			const existingClient = windowClients.find(
				(client) => new URL(client.url).origin === self.location.origin,
			);
			if (!existingClient) return self.clients.openWindow(targetUrl);

			const targetClient = await existingClient.navigate(targetUrl);
			return (targetClient ?? existingClient).focus();
		}),
	);
});
