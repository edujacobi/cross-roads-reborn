import { Language } from "@core/models/Language";
import { IDescription, IEmote } from "./Interfaces";
import { EmoteId, EmoteString } from "@bot/utils/emotes";

export enum ClassId {
	None,
	Thief,
	Assassin,
	Entrepreneur,
	Hobo,
	Mafioso,
	Attorney
}

export interface IModifier {
	Positive?: number,
	Negative?: number,
}

export interface ClassModifier {
	Casino?: IModifier, // multiplicative
	Job?: IModifier, // multiplicative
	PrisonBribe?: IModifier, // additive
	PrisonEscape?: IModifier, // additive
	Robbery?: IModifier, // multiplicative
	ScavengeChance?: IModifier, // additive
	ScavengeDuration?: IModifier, // multiplicative
}

export interface Class {
	readonly Id: ClassId;
	readonly Name: IDescription;
	readonly Description: IDescription;
	readonly Image: {
		readonly Url: string,
		readonly Emote: IEmote,
	};
	readonly Modifier?: ClassModifier;
}

export interface ClassListType {
	[key: number]: Class,
}

export const ClassList: ClassListType = {
	[ClassId.None]: {
		Id: ClassId.None,
		Name: {
			[Language.English]: "Without class",
			[Language.Portuguese]: "Sem classe",
			[Language.Spanish]: "Sin clase",
		},
		Description: {
			[Language.English]: "Without class",
			[Language.Portuguese]: "Sem classe",
			[Language.Spanish]: "Sin clase",
		},
		Image: {
			Url: "https://cdn.discordapp.com/attachments/531174573463306240/814662917696782376/Inventario.png",
			Emote: {
				Id: EmoteId.OpenInv,
				String: EmoteString.OpenInv,
			},
		},
	},
	[ClassId.Thief]: {
		Id: ClassId.Thief,
		Name: {
			[Language.English]: "Thief",
			[Language.Portuguese]: "Ladrão",
			[Language.Spanish]: "Ladrón",
		},
		Description: {
			[Language.English]: "Skilled with his hands, he learned the art of stealing from a young age. It's a shame he has no luck with the Fortune Tiger.",
			[Language.Portuguese]: "Habilidoso com as mãos, aprendeu desde cedo a arte de roubar. Uma pena que não possui sorte no tigrinho.",
			[Language.Spanish]: "Hábil con las manos, aprendió el arte del robo desde muy joven. Es una pena que no tenga suerte con el Tigre de la Fortuna.",
		},
		Image: {
			Url: "https://media.discordapp.net/attachments/1233604589064818808/1460375095670472887/Class_Thief.png",
			Emote: {
				Id: EmoteId.Thief,
				String: EmoteString.Thief,
			},
		},
		Modifier: {
			Robbery: {
				Positive: 1.15,
			},
			PrisonEscape: {
				Positive: 5,
			},
			Casino: {
				Negative: 0.75,
			},
		},
	},
	[ClassId.Assassin]: {
		Id: ClassId.Assassin,
		Name: {
			[Language.English]: "Assassin",
			[Language.Portuguese]: "Assassino",
			[Language.Spanish]: "Asesino",
		},
		Description: {
			[Language.English]: "Assassin",
			[Language.Portuguese]: "Assassino",
			[Language.Spanish]: "Asesino",
		},
		Image: {
			Url: "https://media.discordapp.net/attachments/1233604589064818808/1339670907022606467/Classe_Assassino_New.png",
			Emote: {
				Id: EmoteId.Assassin,
				String: EmoteString.Assassin,
			},
		},
	},
	[ClassId.Entrepreneur]: {
		Id: ClassId.Entrepreneur,
		Name: {
			[Language.English]: "Entrepreneur",
			[Language.Portuguese]: "Empresário",
			[Language.Spanish]: "Empresario",
		},
		Description: {
			[Language.English]: "He grew up with a silver spoon in his mouth, networking with his father's colleagues, but he lacks a bit of mischief.",
			[Language.Portuguese]: "Cresceu em berço de ouro, fazendo networking com os colegas de seu pai, mas lhe falta um pouco de malícia.",
			[Language.Spanish]: "Creció con una cuchara de plata en la boca, relacionándose con los colegas de su padre, pero le falta un poco de malicia.",
		},
		Image: {
			Url: "https://media.discordapp.net/attachments/1233604589064818808/1460375094416248999/Class_Entrepeneur.png",
			Emote: {
				Id: EmoteId.Entrepreneur,
				String: EmoteString.Entrepreneur,
			},
		},
		Modifier: {
			Job: {
				Positive: 1.25,
			},
			Robbery: {
				Negative: 0.75,
			},
		},
	},
	[ClassId.Hobo]: {
		Id: ClassId.Hobo,
		Name: {
			[Language.English]: "Hobo",
			[Language.Portuguese]: "Mendigo",
			[Language.Spanish]: "Vagabundo",
		},
		Description: {
			[Language.English]: "Invisible to most of the population, it takes advantage of this to gain maximum benefit.",
			[Language.Portuguese]: "Invisível para a maioria da população, aproveita disto para tirar o máximo de vantagem.",
			[Language.Spanish]: "Invisible para la mayor parte de la población, se aprovecha de ello para sacar el máximo beneficio.",
		},
		Image: {
			Url: "https://media.discordapp.net/attachments/1233604589064818808/1460375095100051560/Class_Hobo.png",
			Emote: {
				Id: EmoteId.Hobo,
				String: EmoteString.Hobo,
			},
		},
		Modifier: {
			ScavengeDuration: {
				Positive: 1.2,
			},
			ScavengeChance: {
				Positive: 10,
			},
			Job: {
				Negative: 0.8,
			},
		},
	},
	[ClassId.Mafioso]: {
		Id: ClassId.Mafioso,
		Name: {
			[Language.English]: "Mafioso",
			[Language.Portuguese]: "Mafioso",
			[Language.Spanish]: "Mafioso",
		},
		Description: {
			[Language.English]: "Mafioso",
			[Language.Portuguese]: "Mafioso",
			[Language.Spanish]: "Mafioso",
		},
		Image: {
			Url: "https://media.discordapp.net/attachments/1233604589064818808/1339670908138160231/Classe_Mafioso_New3.png",
			Emote: {
				Id: EmoteId.Mafioso,
				String: EmoteString.Mafioso,
			},
		},
	},
	[ClassId.Attorney]: {
		Id: ClassId.Attorney,
		Name: {
			[Language.English]: "Attorney",
			[Language.Portuguese]: "Advogado",
			[Language.Spanish]: "Abogado",
		},
		Description: {
			[Language.English]: "He knows the loopholes in all the laws and uses them to his advantage, but he doesn't like to get his suit dirty.",
			[Language.Portuguese]: "Conhece as brechas de todas as leis e usa isso ao seu favor, mas não gosta de sujar seu traje.",
			[Language.Spanish]: "Él conoce los vacíos de todas las leyes y los utiliza para su beneficio, pero no le gusta ensuciarse el traje.",
		},
		Image: {
			Url: "https://media.discordapp.net/attachments/1233604589064818808/1460375094114255031/Class_Attorney.png",
			Emote: {
				Id: EmoteId.Attorney,
				String: EmoteString.Attorney,
			},
		},
		Modifier: {
			Casino: {
				Positive: 1.2,
			},
			PrisonBribe: {
				Positive: 5,
			},
			ScavengeDuration: {
				Negative: 0.75,
			},
		},
	},
} as const;

export function getCasinoClassModifier(classId: ClassId) {
	return ClassList[classId].Modifier?.Casino?.Positive || ClassList[classId].Modifier?.Casino?.Negative || 1;
}

export function getJobClassModifier(classId: ClassId) {
	return ClassList[classId].Modifier?.Job?.Positive || ClassList[classId].Modifier?.Job?.Negative || 1;
}

export function getPrisonBribeClassModifier(classId: ClassId) {
	return ClassList[classId].Modifier?.PrisonBribe?.Positive || ClassList[classId].Modifier?.PrisonBribe?.Negative || 0;
}

export function getPrisonEscapeClassModifier(classId: ClassId) {
	return ClassList[classId].Modifier?.PrisonEscape?.Positive || ClassList[classId].Modifier?.PrisonEscape?.Negative || 0;
}

export function getRobberyClassModifier(classId: ClassId) {
	return ClassList[classId].Modifier?.Robbery?.Positive || ClassList[classId].Modifier?.Robbery?.Negative || 1;
}

export function getScavengeChanceClassModifier(classId: ClassId) {
	return ClassList[classId].Modifier?.ScavengeChance?.Positive || ClassList[classId].Modifier?.ScavengeChance?.Negative || 0;
}

export function getScavengeDurationClassModifier(classId: ClassId) {
	return ClassList[classId].Modifier?.ScavengeDuration?.Positive || ClassList[classId].Modifier?.ScavengeDuration?.Negative || 1;
}