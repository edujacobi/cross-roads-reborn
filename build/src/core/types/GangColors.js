"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GangColor = exports.GangColorId = void 0;
const Language_1 = require("#core/models/Language");
var GangColorId;
(function (GangColorId) {
    GangColorId[GangColorId["Grey"] = 0] = "Grey";
    GangColorId[GangColorId["Purple"] = 1] = "Purple";
    GangColorId[GangColorId["Blue"] = 2] = "Blue";
    GangColorId[GangColorId["Green"] = 3] = "Green";
    GangColorId[GangColorId["Yellow"] = 4] = "Yellow";
    GangColorId[GangColorId["Orange"] = 5] = "Orange";
    GangColorId[GangColorId["Red"] = 6] = "Red";
    GangColorId[GangColorId["Pink"] = 7] = "Pink";
    GangColorId[GangColorId["Gold"] = 8] = "Gold";
})(GangColorId || (exports.GangColorId = GangColorId = {}));
exports.GangColor = {
    [GangColorId.Grey]: {
        Id: GangColorId.Grey,
        Color: 0x89999A,
        Description: {
            [Language_1.Language.English]: "Grey",
            [Language_1.Language.Portuguese]: "Cinza",
            [Language_1.Language.Spanish]: "Gris",
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
            [Language_1.Language.English]: "Purple",
            [Language_1.Language.Portuguese]: "Roxo",
            [Language_1.Language.Spanish]: "Morado",
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
            [Language_1.Language.English]: "Blue",
            [Language_1.Language.Portuguese]: "Azul",
            [Language_1.Language.Spanish]: "Azul",
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
            [Language_1.Language.English]: "Green",
            [Language_1.Language.Portuguese]: "Verde",
            [Language_1.Language.Spanish]: "Verde",
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
            [Language_1.Language.English]: "Yellow",
            [Language_1.Language.Portuguese]: "Amarelo",
            [Language_1.Language.Spanish]: "Amarillo",
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
            [Language_1.Language.English]: "Orange",
            [Language_1.Language.Portuguese]: "Laranja",
            [Language_1.Language.Spanish]: "Naranja",
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
            [Language_1.Language.English]: "Red",
            [Language_1.Language.Portuguese]: "Vermelho",
            [Language_1.Language.Spanish]: "Rojo",
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
            [Language_1.Language.English]: "Pink",
            [Language_1.Language.Portuguese]: "Rosa",
            [Language_1.Language.Spanish]: "Rosa",
        },
        Emote: {
            Id: "1426278280717271081",
            String: "<:ColorPink:1426278280717271081>",
        },
        Special: false,
    },
    [GangColorId.Gold]: {
        Id: GangColorId.Gold,
        Color: 0xE0BA20,
        Description: {
            [Language_1.Language.English]: "Gold",
            [Language_1.Language.Portuguese]: "Dourado",
            [Language_1.Language.Spanish]: "Oro",
        },
        Emote: {
            Id: "1426278107043725372",
            String: "<:ColorGold:1426278107043725372>",
        },
        Special: true,
    },
};
//# sourceMappingURL=GangColors.js.map