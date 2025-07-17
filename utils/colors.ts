import { Colors } from "discord.js";
import { Language } from "../models/Language";
import { IDescription, IEmote } from "../interfaces/Interfaces";

export const CrColors = {
	Default: Colors.Green,
	Police: 0x163cb6,
	Hospital: 0xe54747,
	Casino: 0xffebd6,
	Jobs: 0xFFE300,
	Robbery: 0xA70D00,
	BlackMarket: 0x000001,
	Admin: 0x80e893,
	Jacobi: 0x426b69,
	Scavenge: Colors.LightGrey,
	BeatUp: 0xff8C00,
	Bar: 0x0064FF,
};

export enum GangColorId {
	Grey,
	Purple,
	Blue,
	Green,
	Yellow,
	Orange,
	Red,
	Pink,
	Gold,
}

export interface IGangColor {
	Id: GangColorId;
	Color: number;
	Description: IDescription,
	Emote: IEmote,
	Special: boolean,
}

interface IGangColorList {
	[key: number]: IGangColor;
}

export const GangColor: IGangColorList = {
	[GangColorId.Grey]: {
		Id: GangColorId.Grey,
		Color: 0x89999A,
		Description: {
			[Language.English]: "Grey",
			[Language.Portuguese]: "Cinza",
			[Language.Spanish]: "Gris",
		},
		Emote: {
			Id: "",
			String: "",
		},
		Special: false,
	},
	[GangColorId.Purple]: {
		Id: GangColorId.Purple,
		Color: 0x7345C4,
		Description: {
			[Language.English]: "Purple",
			[Language.Portuguese]: "Roxo",
			[Language.Spanish]: "Morado",
		},
		Emote: {
			Id: "gang_purple",
			String: "<:gang_purple:123456789012345678>",
		},
		Special: false,
	},
	[GangColorId.Blue]: {
		Id: GangColorId.Blue,
		Color: 0x448aff,
		Description: {
			[Language.English]: "Blue",
			[Language.Portuguese]: "Azul",
			[Language.Spanish]: "Azul",
		},
		Emote: {
			Id: "gang_blue",
			String: "<:gang_blue:123456789012345678>",
		},
		Special: false,
	},
	[GangColorId.Green]: {
		Id: GangColorId.Green,
		Color: 0x4caf50,
		Description: {
			[Language.English]: "Green",
			[Language.Portuguese]: "Verde",
			[Language.Spanish]: "Verde",
		},
		Emote: {
			Id: "gang_green",
			String: "<:gang_green:123456789012345678>",
		},
		Special: false,
	},
	[GangColorId.Yellow]: {
		Id: GangColorId.Yellow,
		Color: 0xfdd835,
		Description: {
			[Language.English]: "Yellow",
			[Language.Portuguese]: "Amarelo",
			[Language.Spanish]: "Amarillo",
		},
		Emote: {
			Id: "gang_yellow",
			String: "<:gang_yellow:123456789012345678>",
		},
		Special: false,
	},
	[GangColorId.Orange]: {
		Id: GangColorId.Orange,
		Color: 0xff9100,
		Description: {
			[Language.English]: "Orange",
			[Language.Portuguese]: "Laranja",
			[Language.Spanish]: "Naranja",
		},
		Emote: {
			Id: "gang_orange",
			String: "<:gang_orange:123456789012345678>",
		},
		Special: false,
	},
	[GangColorId.Red]: {
		Id: GangColorId.Red,
		Color: 0xe53935,
		Description: {
			[Language.English]: "Red",
			[Language.Portuguese]: "Vermelho",
			[Language.Spanish]: "Rojo",
		},
		Emote: {
			Id: "gang_red",
			String: "<:gang_red:123456789012345678>",
		},
		Special: false,
	},
	[GangColorId.Pink]: {
		Id: GangColorId.Pink,
		Color: 0xEB459E,
		Description: {
			[Language.English]: "Pink",
			[Language.Portuguese]: "Rosa",
			[Language.Spanish]: "Rosa",
		},
		Emote: {
			Id: "gang_pink",
			String: "<:gang_pink:123456789012345678>",
		},
		Special: false,
	},
	[GangColorId.Gold]: {
		Id: GangColorId.Gold,
		Color: 0xE0BA20,
		Description: {
			[Language.English]: "Gold",
			[Language.Portuguese]: "Dourado",
			[Language.Spanish]: "Oro",
		},
		Emote: {
			Id: "gang_gold",
			String: "<:gang_gold:123456789012345678>",
		},
		Special: true,
	},
};