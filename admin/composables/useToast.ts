import { type Component, markRaw } from "vue";

export type ToastVariant = "neutral" | "success" | "warning" | "error";

export interface ToastOptions {
	variant: ToastVariant;
	text: string;
	icon?: Component;
	image?: string;
	duration?: number;
}

export interface ToastMessage extends ToastOptions {
	id: number;
	duration: number;
}

export function useToast() {
	const toasts = useState<ToastMessage[]>("toasts", () => []);
	const nextToastId = useState("next-toast-id", () => 0);

	function showToast(options: ToastOptions) {
		const { icon, ...toastOptions } = options;
		const toast: ToastMessage = {
			...toastOptions,
			...(icon ? { icon: markRaw(icon) } : {}),
			duration: options.duration ?? 5_000,
			id: nextToastId.value++,
		};

		toasts.value.push(toast);
		return toast.id;
	}

	function dismissToast(id: number) {
		toasts.value = toasts.value.filter((toast) => toast.id !== id);
	}

	return {
		toasts,
		showToast,
		dismissToast,
	};
}
