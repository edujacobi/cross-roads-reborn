import { localStorageKeys } from "~/constants/localStorageKeys";
import type { UpdateFile } from "~/pages/updates.vue";

const UPDATES_READ_EVENT = "updates:read";

export function hasUnreadUpdates() {
	const hasNew = ref(false);

	async function check() {
		try {
			const res = await fetch("/updates/index.json");
			if (!res.ok) return;
			const fileNames = await res.json();
			if (!fileNames.length) return;
			const latestFile = fileNames[fileNames.length - 1];
			const latestRes = await fetch(`/updates/${latestFile}`);
			if (!latestRes.ok) return;
			const latest: UpdateFile = await latestRes.json();
			const stored = localStorage.getItem(localStorageKeys.lastReadUpdates);
			hasNew.value = latest.version !== stored;
		} catch {
			// Silent fail — badge stays off
		}
	}

	check();
	// 2 min
	setInterval(check, 120_000);

	window.addEventListener(UPDATES_READ_EVENT, check);

	return hasNew;
}

export function markUpdatesAsRead(version: string) {
	localStorage.setItem(localStorageKeys.lastReadUpdates, version);
	window.dispatchEvent(new Event(UPDATES_READ_EVENT));
}
