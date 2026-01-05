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
	SpecialShop: 0x03a2e9,
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
			Id: "1426278274753106102",
			String: "<:ColorGray:1426278274753106102>",
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
			Id: "1426278282063773816",
			String: "<:ColorPurple:1426278282063773816>",
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
			Id: "1426278273356398632",
			String: "<:ColorBlue:1426278273356398632>",
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
			Id: "1426278276262793336",
			String: "<:ColorGreen:1426278276262793336>",
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
			Id: "1426278286287179945",
			String: "<:ColorYellow:1426278286287179945>",
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
			Id: "1426278279136018472",
			String: "<:ColorOrange:1426278279136018472>",
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
			Id: "1426278283875455057",
			String: "<:ColorRed:1426278283875455057>",
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
			Id: "1426278280717271081",
			String: "<:ColorPink:1426275360433242192>",
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
			Id: "1426278107043725372",
			String: "<:ColorGold:1426278107043725372>",
		},
		Special: true,
	},
};