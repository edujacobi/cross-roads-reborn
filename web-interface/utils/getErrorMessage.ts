export function getErrorMessage(error: unknown, fallback = "Erro inesperado."): string {
	return error && typeof error === "object" && "message" in error ? String(error.message) : fallback;
}
