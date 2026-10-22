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

	event.waitUntil(
		self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
			const openWindow = windowClients[0];
			return openWindow ? openWindow.focus() : self.clients.openWindow("/me");
		}),
	);
});
