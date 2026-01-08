import { AvatarDecorationId } from "./Ids";
import { defaultSkinDescription, IDescription } from "./Interfaces";
import { Language } from "../models/Language";

export interface AvatarDecorations {
	Id: AvatarDecorationId,
	Description: IDescription,
	Shop: boolean;
	Price: number;
}

interface AvatarDecorationListType {
	[key: number]: AvatarDecorations,
}

export const AvatarDecorationList: AvatarDecorationListType = {
	[AvatarDecorationId.Default]: {
		Id: AvatarDecorationId.Default,
		Description: defaultSkinDescription,
		Shop: false,
		Price: 0,
	},
	[AvatarDecorationId.VIP]: {
		Id: AvatarDecorationId.VIP,
		Description: {
			[Language.English]: "VIP",
			[Language.Portuguese]: "VIP",
			[Language.Spanish]: "VIP",
		},
		Shop: false,
		Price: 0,
	},
	[AvatarDecorationId.Developer]: {
		Id: AvatarDecorationId.Developer,
		Description: {
			[Language.English]: "Developer",
			[Language.Portuguese]: "Desenvolvedor",
			[Language.Spanish]: "Desarrollador",
		},
		Shop: false,
		Price: 0,
	},
	[AvatarDecorationId.Moderator]: {
		Id: AvatarDecorationId.Moderator,
		Description: {
			[Language.English]: "Moderator",
			[Language.Portuguese]: "Moderador",
			[Language.Spanish]: "Moderador",
		},
		Shop: false,
		Price: 0,
	},
	[AvatarDecorationId.Helper]: {
		Id: AvatarDecorationId.Helper,
		Description: {
			[Language.English]: "Helper",
			[Language.Portuguese]: "Ajudante",
			[Language.Spanish]: "Ayudante",
		},
		Shop: false,
		Price: 0,
	},
	[AvatarDecorationId.Purple]: {
		Id: AvatarDecorationId.Purple,
		Description: {
			[Language.English]: "Purple",
			[Language.Portuguese]: "Púrpura",
			[Language.Spanish]: "Púrpura",
		},
		Shop: true,
		Price: 1000,
	},
	[AvatarDecorationId.Sunset]: {
		Id: AvatarDecorationId.Sunset,
		Description: {
			[Language.English]: "Sunset",
			[Language.Portuguese]: "Pôr do sol",
			[Language.Spanish]: "Puesta del sol",
		},
		Shop: true,
		Price: 1000,
	},
	[AvatarDecorationId.Sunrise]: {
		Id: AvatarDecorationId.Sunrise,
		Description: {
			[Language.English]: "Sunrise",
			[Language.Portuguese]: "Nascer do sol",
			[Language.Spanish]: "Salida del sol",
		},
		Shop: true,
		Price: 1000,
	},
	[AvatarDecorationId.Cloud]: {
		Id: AvatarDecorationId.Cloud,
		Description: {
			[Language.English]: "Cloud",
			[Language.Portuguese]: "Nuvem",
			[Language.Spanish]: "Nube",
		},
		Shop: true,
		Price: 1000,
	},
	[AvatarDecorationId.FrutigerAero]: {
		Id: AvatarDecorationId.FrutigerAero,
		Description: {
			[Language.English]: "Frutiger Aero",
			[Language.Portuguese]: "Frutiger Aero",
			[Language.Spanish]: "Frutiger Aero",
		},
		Shop: true,
		Price: 1500,
	},
	[AvatarDecorationId.Silver]: {
		Id: AvatarDecorationId.Silver,
		Description: {
			[Language.English]: "Silver",
			[Language.Portuguese]: "Prata",
			[Language.Spanish]: "Plata",
		},
		Shop: true,
		Price: 1500,
	},
};

export function getAvatarDecorationList(): AvatarDecorations[] {
	return Object.values(AvatarDecorationList);
}