import { BackgroundDecorationId } from "./Ids";
import { defaultSkinDescription, type IDescription } from "./Interfaces";
import { Language } from "#core/models/Language";

export interface BackgroundDecorations {
	readonly Id: BackgroundDecorationId,
	readonly Description: IDescription,
	readonly Shop: boolean;
	readonly Price: number;
}

interface BackgroundDecorationListType {
	[key: number]: BackgroundDecorations,
}

export const BackgroundDecorationList: BackgroundDecorationListType = {
	[BackgroundDecorationId.Default]: {
		Id: BackgroundDecorationId.Default,
		Description: defaultSkinDescription,
		Shop: false,
		Price: 0,
	},
	[BackgroundDecorationId.Purple]: {
		Id: BackgroundDecorationId.Purple,
		Description: {
			[Language.English]: "Purple",
			[Language.Portuguese]: "Púrpura",
			[Language.Spanish]: "Púrpura",
		},
		Shop: true,
		Price: 1_000,
	},
	[BackgroundDecorationId.Sunset]: {
		Id: BackgroundDecorationId.Sunset,
		Description: {
			[Language.English]: "Sunset",
			[Language.Portuguese]: "Pôr do sol",
			[Language.Spanish]: "Puesta del sol",
		},
		Shop: true,
		Price: 1_000,
	},
	[BackgroundDecorationId.Sunrise]: {
		Id: BackgroundDecorationId.Sunrise,
		Description: {
			[Language.English]: "Sunrise",
			[Language.Portuguese]: "Nascer do sol",
			[Language.Spanish]: "Salida del sol",
		},
		Shop: true,
		Price: 1_000,
	},
	[BackgroundDecorationId.Cloud]: {
		Id: BackgroundDecorationId.Cloud,
		Description: {
			[Language.English]: "Cloud",
			[Language.Portuguese]: "Nuvem",
			[Language.Spanish]: "Nube",
		},
		Shop: true,
		Price: 1_500,
	},
	[BackgroundDecorationId.FrutigerAero]: {
		Id: BackgroundDecorationId.FrutigerAero,
		Description: {
			[Language.English]: "Frutiger Aero",
			[Language.Portuguese]: "Frutiger Aero",
			[Language.Spanish]: "Frutiger Aero",
		},
		Shop: true,
		Price: 1_500,
	},
	[BackgroundDecorationId.Silver]: {
		Id: BackgroundDecorationId.Silver,
		Description: {
			[Language.English]: "Silver",
			[Language.Portuguese]: "Prata",
			[Language.Spanish]: "Plata",
		},
		Shop: true,
		Price: 1_500,
	},
	[BackgroundDecorationId.Rainbow]: {
		Id: BackgroundDecorationId.Rainbow,
		Description: {
			[Language.English]: "Rainbow",
			[Language.Portuguese]: "Arco-íris",
			[Language.Spanish]: "Arcoíris",
		},
		Shop: true,
		Price: 1_500,
	},
	[BackgroundDecorationId.BotanicalGarden]: {
		Id: BackgroundDecorationId.BotanicalGarden,
		Description: {
			[Language.English]: "Botanical Garden",
			[Language.Portuguese]: "Jardim Botânico",
			[Language.Spanish]: "Jardín botánico",
		},
		Shop: true,
		Price: 1_000,
	},
} as const;

export function getBackgroundDecorationList(): BackgroundDecorations[] {
	return Object.values(BackgroundDecorationList);
}
