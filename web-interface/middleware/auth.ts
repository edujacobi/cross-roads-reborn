export default defineNuxtRouteMiddleware(async () => {
	if (import.meta.server) return;

	const auth = useAuth();
	await auth.initAuth();

	if (!auth.isAuthenticated.value) {
		return navigateTo("/login", { replace: true });
	}

	if (!auth.hasWebAccess.value) {
		auth.clearSession();
		return navigateTo(
			`/login?error=${encodeURIComponent("O acesso durante o período de beta fechado está disponível apenas para usuários VIP e membros da equipe.")}`,
			{ replace: true },
		);
	}
});
