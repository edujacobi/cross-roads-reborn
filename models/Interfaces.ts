import { Language } from "./Language";

export interface IDescription {
	[Language.English]: string;
	[Language.Portuguese]: string;
	[Language.Spanish]: string;
}

export const defaultSkinDescription = {
	[Language.English]: "Default",
	[Language.Portuguese]: "Padrão",
	[Language.Spanish]: "Por defecto",
};

export interface IEmote {
	Id: string,
	String: string,
}

export interface ISkin {
	Description: IDescription;
	Emote: IEmote;
}