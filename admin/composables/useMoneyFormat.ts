export function useMoneyFormat() {
	const numberFormatter = new Intl.NumberFormat("pt-BR");

	function format(amount: number | string) {
		const num = typeof amount === "string" ? Number(amount) : amount;
		return `Cr$ ${numberFormatter.format(num)}`;
	}

	function formatPlain(amount: number | string) {
		const num = typeof amount === "string" ? Number(amount) : amount;
		return numberFormatter.format(num);
	}

	return { format, formatPlain };
}
