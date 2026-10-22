import { Bell } from "lucide-vue-next";

export default defineNuxtPlugin(() => {
	if (!("serviceWorker" in navigator)) return;

	const { showToast } = useToast();

	navigator.serviceWorker.addEventListener("message", (event) => {
		if (event.data?.type === "push-notification" && event.data.body) {
			showToast({ variant: "neutral", text: event.data.body, icon: Bell });
		}
	});
});
