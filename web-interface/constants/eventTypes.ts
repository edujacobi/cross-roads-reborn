import { imagePaths } from "~/constants/imagePaths";

export const eventTypes = [
	{ id: 1, name: "Multiplicador de tempo de trabalho", image: imagePaths.situations.job },
	{ id: 2, name: "Multiplicador de tempo para vasculhar", image: imagePaths.situations.scavenging },
	{ id: 3, name: "Multiplicador de tempo procurado", image: imagePaths.situations.wanted },
	{ id: 4, name: "Multiplicador de tempo hospitalizado", image: imagePaths.situations.hospital },
	{ id: 5, name: "Multiplicador de tempo preso", image: imagePaths.situations.prison },
	{ id: 6, name: "Chance bônus de vasculho", image: imagePaths.situations.scavenging },
	{ id: 7, name: "Chance bônus de roubo à locais", image: imagePaths.situations.robbery },
	{ id: 8, name: "Chance bônus de fugir da prisão", image: imagePaths.situations.prison },
] as const;

export const eventTypeNames: Record<number, string> = Object.fromEntries(eventTypes.map(({ id, name }) => [id, name]));

export function formatEventValue(type: number, value: number) {
	const isMultiplier = eventTypeNames[type]?.includes("Multiplicador") ?? false;
	return `${isMultiplier ? "x" : "+"}${value}${isMultiplier ? "" : "%"}`;
}
