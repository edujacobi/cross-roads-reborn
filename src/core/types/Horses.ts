import { EmoteString } from "#bot/utils/emotes";
import { Language } from "#core/models/Language";
import { type IDescription } from "./Interfaces";

export interface IHorse {
	readonly Id: number;
	readonly Emote: string;
	readonly Name: IDescription;
	readonly Description: IDescription;
	readonly Multiplier: number;
	readonly Weight: number;
}

export const HorseList: IHorse[] = [
	{
		Id: 1,
		Emote: EmoteString.HorseLightning,
		Name: {
			[Language.English]: "Lightning",
			[Language.Portuguese]: "Raio",
			[Language.Spanish]: "Rayo"
		},
		Description: {
			[Language.English]: "The fastest horse in the west. We are not in the west.",
			[Language.Portuguese]: "O cavalo mais rápido do oeste. Nós não estamos no oeste.",
			[Language.Spanish]: "El caballo más rápido del oeste. No estamos en el oeste."
		},
		Multiplier: 2.0,
		Weight: 40
	},
	{
		Id: 2,
		Emote: EmoteString.HorseThunder,
		Name: {
			[Language.English]: "Thunder",
			[Language.Portuguese]: "Trovão",
			[Language.Spanish]: "Trueno"
		},
		Description: {
			[Language.English]: "Fed with Whey Protein every morning. His flatulence during the race named him.",
			[Language.Portuguese]: "Alimentado com Whey Protein todas as manhãs. Suas flatulências durante a corrida o nomearam.",
			[Language.Spanish]: "Alimentado con Whey Protein todas las mañanas. Sus flatulencias durante la carrera lo nombraron."
		},
		Multiplier: 2.5,
		Weight: 30
	},
	{
		Id: 3,
		Emote: EmoteString.HorseGhost,
		Name: {
			[Language.English]: "Ghost",
			[Language.Portuguese]: "Fantasma",
			[Language.Spanish]: "Fantasma"
		},
		Description: {
			[Language.English]: "Extremely fast, but frequently, no one sees him cross the finish line.",
			[Language.Portuguese]: "Extremamente veloz, mas frequentemente, ninguém o vê cruzar a linha de chegada.",
			[Language.Spanish]: "Extremadamente veloz, pero frecuentemente, nadie lo ve cruzar la meta."
		},
		Multiplier: 3.0,
		Weight: 15
	},
	{
		Id: 4,
		Emote: EmoteString.HorseShadow,
		Name: {
			[Language.English]: "Shadow",
			[Language.Portuguese]: "Sombra",
			[Language.Spanish]: "Sombra"
		},
		Description: {
			[Language.English]: "He was the best horse in the area, until he took an arrow to the knee.",
			[Language.Portuguese]: "Era o melhor alazão destas bandas, até tomar uma flechada no joelho.",
			[Language.Spanish]: "Era el mejor alazán de estos lares, hasta que le dispararon en la rodilla."
		},
		Multiplier: 4.0,
		Weight: 10
	},
	{
		Id: 5,
		Emote: EmoteString.HorseMystic,
		Name: {
			[Language.English]: "Mystic",
			[Language.Portuguese]: "Místico",
			[Language.Spanish]: "Místico"
		},
		Description: {
			[Language.English]: "Untamable. Fearless. A deity with a will of its own. Runs only when it wants to.",
			[Language.Portuguese]: "Indomável. Destemido. Uma divindade com vontade própria. Corre somente quando quer.",
			[Language.Spanish]: "Indomable. Intrépido. Una deidad con voluntad propia. Corre solo cuando quiere."
		},
		Multiplier: 5.0,
		Weight: 5
	},
];