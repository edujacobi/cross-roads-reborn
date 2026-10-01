export interface AuthUser {
	userId: string;
	username: string;
	avatar: string | null;
	avatarDecoration?: string;
	role: "DEVELOPER" | "MODERATOR" | "HELPER";
}

export function useAuth() {
	const config = useRuntimeConfig();
	const token = useState<string | null>("auth_token", () => null);
	const user = useState<AuthUser | null>("auth_user", () => null);
	const loading = useState<boolean>("auth_loading", () => true);

	const isAuthenticated = computed(() => !!token.value && !!user.value);
	const isDeveloper = computed(() => user.value?.role === "DEVELOPER");
	const canWrite = computed(() => user.value?.role === "DEVELOPER" || user.value?.role === "MODERATOR");

	async function initAuth() {
		if (!import.meta.client) return;

		if (!token.value) {
			token.value = localStorage.getItem("cr_admin_token");
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
		if (import.meta.client) {
			localStorage.setItem("cr_admin_token", newToken);
		}
		return fetchUser();
	}

	function loginWithDiscord() {
		const apiBase = config.public.apiBaseUrl;
		window.location.href = `${apiBase}/auth/discord/login`;
	}

	function logout() {
		clearSession();
		navigateTo("/login");
	}

	function clearSession() {
		token.value = null;
		user.value = null;
		if (import.meta.client) {
			localStorage.removeItem("cr_admin_token");
		}
	}

	return {
		token,
		user,
		loading,
		isAuthenticated,
		isDeveloper,
		canWrite,
		initAuth,
		fetchUser,
		setToken,
		loginWithDiscord,
		logout,
	};
}
