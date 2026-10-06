import { localStorageKeys } from "~/constants/localStorageKeys";

export interface AuthUser {
	userId: string;
	username: string;
	avatar: string | null;
	avatarDecoration?: string;
	role: "DEVELOPER" | "MODERATOR" | "HELPER" | "PLAYER";
}

export function useAuth() {
	const config = useRuntimeConfig();
	const tokenStorage = useLocalStorage(localStorageKeys.token);
	const token = useState<string | null>("auth_token", () => null);
	const user = useState<AuthUser | null>("auth_user", () => null);
	const loading = useState<boolean>("auth_loading", () => true);

	const isAuthenticated = computed(() => !!token.value && !!user.value);
	const isDeveloper = computed(() => user.value?.role === "DEVELOPER");
	const hasAdminAccess = computed(
		() => user.value?.role === "DEVELOPER" || user.value?.role === "MODERATOR" || user.value?.role === "HELPER",
	);
	const canWrite = computed(() => user.value?.role === "DEVELOPER" || user.value?.role === "MODERATOR");

	async function initAuth() {
		if (!import.meta.client) return;

		if (!token.value) {
			token.value = tokenStorage.get();
		}

		if (token.value && !user.value) {
			await fetchUser();
		} else {
			loading.value = false;
		}
	}

	async function fetchUser() {
		if (!token.value) {
			loading.value = false;
			return;
		}

		try {
			loading.value = true;
			const apiBase = config.public.apiBaseUrl;
			const res = await fetch(`${apiBase}/auth/me`, {
				headers: {
					Authorization: `Bearer ${token.value}`,
				},
			});

			if (res.ok) {
				const data = await res.json();
				user.value = data.user;
			} else {
				clearSession();
			}
		} catch (_err) {
			clearSession();
		} finally {
			loading.value = false;
		}
	}

	function setToken(newToken: string) {
		token.value = newToken;
		tokenStorage.set(newToken);
		return fetchUser();
	}

	async function loginWithDiscord() {
		// Ensure token is loaded from localStorage in case initAuth hasn't run yet
		if (!token.value) {
			token.value = tokenStorage.get();
		}
		// If we already have a valid token, skip Discord OAuth and go straight to the target
		if (token.value) {
			await fetchUser();
			if (user.value) {
				navigateTo(hasAdminAccess.value ? "/admin/dashboard" : "/users");
				return;
			}
		}
		const apiBase = config.public.apiBaseUrl;
		window.location.href = `${apiBase}/auth/discord/login`;
	}

	function logout() {
		clearSession();
		navigateTo("/");
	}

	function clearSession() {
		token.value = null;
		user.value = null;
		tokenStorage.remove();
	}

	return {
		token,
		user,
		loading,
		isAuthenticated,
		isDeveloper,
		hasAdminAccess,
		canWrite,
		initAuth,
		fetchUser,
		setToken,
		loginWithDiscord,
		logout,
	};
}
