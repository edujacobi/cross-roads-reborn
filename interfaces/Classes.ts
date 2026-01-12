import { Language } from "../models/Language";
import { IDescription, IEmote } from "./Interfaces";
import { EmoteId, EmoteString } from "../utils/emotes";

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
	Id: ClassId;
	Description: IDescription;
	Image: {
		Url: string,
		Emote: IEmote,
	};
	Modifier?: ClassModifier;
}

export interface ClassListType {
	[key: number]: Class,
}

export const ClassList: ClassListType = {
	[ClassId.None]: {
		Id: ClassId.None,
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
		Description: {
			[Language.English]: "Thief",
			[Language.Portuguese]: "Ladrão",
			[Language.Spanish]: "Ladrón",
		},
		Image: {
			Url: "https://media.discordapp.net/attachments/1233604589064818808/1339670907752550490/Classe_Ladrao_New2.png",
			Emote: {
				Id: EmoteId.Thief,
				String: EmoteString.Thief,
			},
		},
		Modifier: {
			Robbery: {
				Positive: 1.2,
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
		Description: {
			[Language.English]: "Entrepreneur",
			[Language.Portuguese]: "Empresário",
			[Language.Spanish]: "Empresario",
		},
		Image: {
			Url: "https://media.discordapp.net/attachments/1233604589064818808/1339670907328663662/Classe_Empresario_New.png",
			Emote: {
				Id: EmoteId.Entrepreneur,
				String: EmoteString.Entrepreneur,
			},
		},
		Modifier: {
			Job: {
				Positive: 1.5,
			},
			Robbery: {
				Negative: 0.75,
			},
		},
	},
	[ClassId.Hobo]: {
		Id: ClassId.Hobo,
		Description: {
			[Language.English]: "Hobo",
			[Language.Portuguese]: "Mendigo",
			[Language.Spanish]: "Vagabundo",
		},
		Image: {
			Url: "https://media.discordapp.net/attachments/1233604589064818808/1339670908591145040/Classe_Mendigo_New.png",
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
				Positive: 5,
			},
			Job: {
				Negative: 0.75,
			},
		},
	},
	[ClassId.Mafioso]: {
		Id: ClassId.Mafioso,
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
		Description: {
			[Language.English]: "Attorney",
			[Language.Portuguese]: "Advogado",
			[Language.Spanish]: "Abogado",
		},
		Image: {
			Url: "https://media.discordapp.net/attachments/1233604589064818808/1339670906573820004/Classe_Advogado_New3.png",
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
};

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
	return ClassList[classId].Modifier?.ScavengeDuration?.Positive || ClassList[classId].Modifier?.ScavengeDuration?.Negative || 0;
}