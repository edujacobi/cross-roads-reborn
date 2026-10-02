export default defineNuxtRouteMiddleware(async (to) => {
	if ((to.path !== "/admin" && !to.path.startsWith("/admin/")) || to.path === "/admin/auth/callback") return;
	if (import.meta.server) return;

	const auth = useAuth();
	await auth.initAuth();

	if (!auth.isAuthenticated.value) {
		return navigateTo("/login", { replace: true });
	}

	if (!auth.hasAdminAccess.value) {
		return navigateTo("/", { replace: true });
	}
});
