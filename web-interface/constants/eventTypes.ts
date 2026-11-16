import { imagePaths } from "~/constants/imagePaths";
import { EventType } from "../../src/core/types/Ids";

export const eventTypes = [
	{ id: EventType.JOB_TIME_MULTIPLIER, name: "Multiplicador de tempo de trabalho", image: imagePaths.situations.job },
	{
		id: EventType.SCAVENGE_TIME_MULTIPLIER,
		name: "Multiplicador de tempo para vasculhar",
		image: imagePaths.situations.scavenging,
	},
	{
		id: EventType.WANTED_TIME_MULTIPLIER,
		name: "Multiplicador de tempo procurado",
		image: imagePaths.situations.wanted,
	},
	{
		id: EventType.HOSPITAL_TIME_MULTIPLIER,
		name: "Multiplicador de tempo hospitalizado",
		image: imagePaths.situations.hospital,
	},
	{ id: EventType.PRISON_TIME_MULTIPLIER, name: "Multiplicador de tempo preso", image: imagePaths.situations.prison },
	{ id: EventType.SCAVENGE_CHANCE_BONUS, name: "Chance bônus de vasculho", image: imagePaths.situations.scavenging },
	{
		id: EventType.ROB_LOCATION_CHANCE_BONUS,
		name: "Chance bônus de roubo à locais",
		image: imagePaths.situations.robbery,
	},
	{
		id: EventType.PRISON_ESCAPE_CHANCE_BONUS,
		name: "Chance bônus de fugir da prisão",
		image: imagePaths.situations.prison,
	},
	{ id: EventType.CLASS_CHANGE_BONUS, name: "Bônus de troca de classe", image: imagePaths.classes.assassin },
] as const;

export const eventTypeNames: Record<number, string> = Object.fromEntries(eventTypes.map(({ id, name }) => [id, name]));

export function formatEventValue(type: number, value: number) {
	if (type === EventType.CLASS_CHANGE_BONUS) return "Custo base";

	const isMultiplier = eventTypeNames[type]?.includes("Multiplicador") ?? false;
	return `${isMultiplier ? "x" : "+"}${value}${isMultiplier ? "" : "%"}`;
}
