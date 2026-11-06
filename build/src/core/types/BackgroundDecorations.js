"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackgroundDecorationList = void 0;
exports.getBackgroundDecorationList = getBackgroundDecorationList;
const Ids_1 = require("./Ids");
const Interfaces_1 = require("./Interfaces");
const Language_1 = require("#core/models/Language");
exports.BackgroundDecorationList = {
    [Ids_1.BackgroundDecorationId.Default]: {
        Id: Ids_1.BackgroundDecorationId.Default,
        Description: Interfaces_1.defaultSkinDescription,
        Shop: false,
        Price: 0,
    },
    [Ids_1.BackgroundDecorationId.Purple]: {
        Id: Ids_1.BackgroundDecorationId.Purple,
        Description: {
            [Language_1.Language.English]: "Purple",
            [Language_1.Language.Portuguese]: "Púrpura",
            [Language_1.Language.Spanish]: "Púrpura",
        },
        Shop: true,
        Price: 1_000,
    },
    [Ids_1.BackgroundDecorationId.Sunset]: {
        Id: Ids_1.BackgroundDecorationId.Sunset,
        Description: {
            [Language_1.Language.English]: "Sunset",
            [Language_1.Language.Portuguese]: "Pôr do sol",
            [Language_1.Language.Spanish]: "Puesta del sol",
        },
        Shop: true,
        Price: 1_000,
    },
    [Ids_1.BackgroundDecorationId.Sunrise]: {
        Id: Ids_1.BackgroundDecorationId.Sunrise,
        Description: {
            [Language_1.Language.English]: "Sunrise",
            [Language_1.Language.Portuguese]: "Nascer do sol",
            [Language_1.Language.Spanish]: "Salida del sol",
        },
        Shop: true,
        Price: 1_000,
    },
    [Ids_1.BackgroundDecorationId.Cloud]: {
        Id: Ids_1.BackgroundDecorationId.Cloud,
        Description: {
            [Language_1.Language.English]: "Cloud",
            [Language_1.Language.Portuguese]: "Nuvem",
            [Language_1.Language.Spanish]: "Nube",
        },
        Shop: true,
        Price: 1_500,
    },
    [Ids_1.BackgroundDecorationId.FrutigerAero]: {
        Id: Ids_1.BackgroundDecorationId.FrutigerAero,
        Description: {
            [Language_1.Language.English]: "Frutiger Aero",
            [Language_1.Language.Portuguese]: "Frutiger Aero",
            [Language_1.Language.Spanish]: "Frutiger Aero",
        },
        Shop: true,
        Price: 1_500,
    },
    [Ids_1.BackgroundDecorationId.Silver]: {
        Id: Ids_1.BackgroundDecorationId.Silver,
        Description: {
            [Language_1.Language.English]: "Silver",
            [Language_1.Language.Portuguese]: "Prata",
            [Language_1.Language.Spanish]: "Plata",
        },
        Shop: true,
        Price: 1_500,
    },
    [Ids_1.BackgroundDecorationId.Rainbow]: {
        Id: Ids_1.BackgroundDecorationId.Rainbow,
        Description: {
            [Language_1.Language.English]: "Rainbow",
            [Language_1.Language.Portuguese]: "Arco-íris",
            [Language_1.Language.Spanish]: "Arcoíris",
        },
        Shop: true,
        Price: 1_500,
    },
    [Ids_1.BackgroundDecorationId.BotanicalGarden]: {
        Id: Ids_1.BackgroundDecorationId.BotanicalGarden,
        Description: {
            [Language_1.Language.English]: "Botanical Garden",
            [Language_1.Language.Portuguese]: "Jardim Botânico",
            [Language_1.Language.Spanish]: "Jardín botánico",
        },
        Shop: true,
        Price: 1_000,
    },
};
function getBackgroundDecorationList() {
    return Object.values(exports.BackgroundDecorationList);
}
//# sourceMappingURL=BackgroundDecorations.js.map