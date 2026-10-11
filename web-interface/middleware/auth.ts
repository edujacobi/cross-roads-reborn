export default defineNuxtRouteMiddleware(async () => {
	if (import.meta.server) return;

	const auth = useAuth();
	await auth.initAuth();

	if (!auth.isAuthenticated.value) {
		return navigateTo("/login", { replace: true });
	}
});
