import type { localStorageKeys } from "~/constants/localStorageKeys";

type LocalStorageKey = (typeof localStorageKeys)[keyof typeof localStorageKeys];

export function useLocalStorage(key: LocalStorageKey) {
	return {
		get: () => (import.meta.client ? window.localStorage.getItem(key) : null),
		set: (value: string) => {
			if (import.meta.client) {
				window.localStorage.setItem(key, value);
			}
		},
		remove: () => {
			if (import.meta.client) {
				window.localStorage.removeItem(key);
			}
		},
	};
}
