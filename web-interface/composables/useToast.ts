import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
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

export function formatToastText(text: string) {
	return text
		.replace(/<t:(\d+)(?::([tTdDfFR]))?>/g, (_match, timestamp: string, style?: string) => {
			const date = new Date(Number(timestamp) * 1_000);
			if (Number.isNaN(date.getTime())) return "";
			if (style === "R") return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });

			const options: Intl.DateTimeFormatOptions = {
				...(style === "t" ? { hour: "2-digit", minute: "2-digit" } : {}),
				...(style === "T" ? { hour: "2-digit", minute: "2-digit", second: "2-digit" } : {}),
				...(style === "d" ? { dateStyle: "short" } : {}),
				...(style === "D" ? { dateStyle: "long" } : {}),
				...(style === "f" || !style ? { dateStyle: "short", timeStyle: "short" } : {}),
				...(style === "F" ? { dateStyle: "long", timeStyle: "short" } : {}),
			};
			return new Intl.DateTimeFormat("pt-BR", options).format(date);
		})
		.replace(/<a?:[\w~]+:\d+>/g, "")
		.replace(/\*\*|__|~~|`/g, "")
		.replace(/[ \t]+([,.;!?])/g, "$1")
		.replace(/[ \t]{2,}/g, " ")
		.replace(/ *\n */g, "\n")
		.trim();
}

export function useToast() {
	const toasts = useState<ToastMessage[]>("toasts", () => []);
	const nextToastId = useState("next-toast-id", () => 0);

	function showToast(options: ToastOptions) {
		const { icon, ...toastOptions } = options;
		const toast: ToastMessage = {
			...toastOptions,
			text: formatToastText(options.text),
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
