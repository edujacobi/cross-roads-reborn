"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarDecorationList = void 0;
exports.getAvatarDecorationList = getAvatarDecorationList;
const Ids_1 = require("./Ids");
const Interfaces_1 = require("./Interfaces");
const Language_1 = require("#core/models/Language");
const Items_1 = require("./Items");
exports.AvatarDecorationList = {
    [Ids_1.AvatarDecorationId.Default]: {
        Id: Ids_1.AvatarDecorationId.Default,
        Description: Interfaces_1.defaultSkinDescription,
        Shop: false,
        Price: 0,
    },
    [Ids_1.AvatarDecorationId.VIP]: {
        Id: Ids_1.AvatarDecorationId.VIP,
        Description: {
            [Language_1.Language.English]: "VIP",
            [Language_1.Language.Portuguese]: "VIP",
            [Language_1.Language.Spanish]: "VIP",
        },
        Shop: false,
        Price: 0,
    },
    [Ids_1.AvatarDecorationId.Developer]: {
        Id: Ids_1.AvatarDecorationId.Developer,
        Description: {
            [Language_1.Language.English]: "Developer",
            [Language_1.Language.Portuguese]: "Desenvolvedor",
            [Language_1.Language.Spanish]: "Desarrollador",
        },
        Shop: false,
        Price: 0,
    },
    [Ids_1.AvatarDecorationId.Moderator]: {
        Id: Ids_1.AvatarDecorationId.Moderator,
        Description: {
            [Language_1.Language.English]: "Moderator",
            [Language_1.Language.Portuguese]: "Moderador",
            [Language_1.Language.Spanish]: "Moderador",
        },
        Shop: false,
        Price: 0,
    },
    [Ids_1.AvatarDecorationId.Helper]: {
        Id: Ids_1.AvatarDecorationId.Helper,
        Description: {
            [Language_1.Language.English]: "Helper",
            [Language_1.Language.Portuguese]: "Ajudante",
            [Language_1.Language.Spanish]: "Ayudante",
        },
        Shop: false,
        Price: 0,
    },
    [Ids_1.AvatarDecorationId.Purple]: {
        Id: Ids_1.AvatarDecorationId.Purple,
        Description: {
            [Language_1.Language.English]: "Purple",
            [Language_1.Language.Portuguese]: "Púrpura",
            [Language_1.Language.Spanish]: "Púrpura",
        },
        Shop: true,
        Price: 1_000,
    },
    [Ids_1.AvatarDecorationId.Sunset]: {
        Id: Ids_1.AvatarDecorationId.Sunset,
        Description: {
            [Language_1.Language.English]: "Sunset",
            [Language_1.Language.Portuguese]: "Pôr do sol",
            [Language_1.Language.Spanish]: "Puesta del sol",
        },
        Shop: true,
        Price: 1_000,
    },
    [Ids_1.AvatarDecorationId.Sunrise]: {
        Id: Ids_1.AvatarDecorationId.Sunrise,
        Description: {
            [Language_1.Language.English]: "Sunrise",
            [Language_1.Language.Portuguese]: "Nascer do sol",
            [Language_1.Language.Spanish]: "Salida del sol",
        },
        Shop: true,
        Price: 1_000,
    },
    [Ids_1.AvatarDecorationId.Cloud]: {
        Id: Ids_1.AvatarDecorationId.Cloud,
        Description: {
            [Language_1.Language.English]: "Cloud",
            [Language_1.Language.Portuguese]: "Nuvem",
            [Language_1.Language.Spanish]: "Nube",
        },
        Shop: true,
        Price: 1_000,
    },
    [Ids_1.AvatarDecorationId.FrutigerAero]: {
        Id: Ids_1.AvatarDecorationId.FrutigerAero,
        Description: {
            [Language_1.Language.English]: "Frutiger Aero",
            [Language_1.Language.Portuguese]: "Frutiger Aero",
            [Language_1.Language.Spanish]: "Frutiger Aero",
        },
        Shop: true,
        Price: 1_500,
    },
    [Ids_1.AvatarDecorationId.Silver]: {
        Id: Ids_1.AvatarDecorationId.Silver,
        Description: {
            [Language_1.Language.English]: "Silver",
            [Language_1.Language.Portuguese]: "Prata",
            [Language_1.Language.Spanish]: "Plata",
        },
        Shop: true,
        Price: 1_500,
    },
    [Ids_1.AvatarDecorationId.Rainbow]: {
        Id: Ids_1.AvatarDecorationId.Rainbow,
        Description: {
            [Language_1.Language.English]: "Rainbow",
            [Language_1.Language.Portuguese]: "Arco-íris",
            [Language_1.Language.Spanish]: "Arcoíris",
        },
        Shop: true,
        Price: 1_500,
    },
    [Ids_1.AvatarDecorationId.BotanicalGarden]: {
        Id: Ids_1.AvatarDecorationId.BotanicalGarden,
        Description: {
            [Language_1.Language.English]: "Botanical Garden",
            [Language_1.Language.Portuguese]: "Jardim Botânico",
            [Language_1.Language.Spanish]: "Jardín botánico",
        },
        Shop: true,
        Price: 1_000,
    },
    [Ids_1.AvatarDecorationId.Pistol]: {
        Id: Ids_1.AvatarDecorationId.Pistol,
        Description: Items_1.ItemList[Ids_1.ItemId.Pistol].Description,
        Shop: true,
        Price: 750,
    },
    [Ids_1.AvatarDecorationId.MachinePistol]: {
        Id: Ids_1.AvatarDecorationId.MachinePistol,
        Description: Items_1.ItemList[Ids_1.ItemId.MachinePistol].Description,
        Shop: true,
        Price: 750,
    },
    [Ids_1.AvatarDecorationId.Carbine]: {
        Id: Ids_1.AvatarDecorationId.Carbine,
        Description: Items_1.ItemList[Ids_1.ItemId.Carbine].Description,
        Shop: true,
        Price: 750,
    },
    [Ids_1.AvatarDecorationId.Katana]: {
        Id: Ids_1.AvatarDecorationId.Katana,
        Description: Items_1.ItemList[Ids_1.ItemId.Katana].Description,
        Shop: true,
        Price: 750,
    },
    [Ids_1.AvatarDecorationId.AssaultRifle]: {
        Id: Ids_1.AvatarDecorationId.AssaultRifle,
        Description: Items_1.ItemList[Ids_1.ItemId.AssaultRifle].Description,
        Shop: true,
        Price: 750,
    },
    [Ids_1.AvatarDecorationId.HuntRifle]: {
        Id: Ids_1.AvatarDecorationId.HuntRifle,
        Description: Items_1.ItemList[Ids_1.ItemId.HuntRifle].Description,
        Shop: true,
        Price: 750,
    },
    [Ids_1.AvatarDecorationId.Shotgun]: {
        Id: Ids_1.AvatarDecorationId.Shotgun,
        Description: Items_1.ItemList[Ids_1.ItemId.Shotgun].Description,
        Shop: true,
        Price: 750,
    },
    [Ids_1.AvatarDecorationId.SMG]: {
        Id: Ids_1.AvatarDecorationId.SMG,
        Description: Items_1.ItemList[Ids_1.ItemId.SMG].Description,
        Shop: true,
        Price: 750,
    },
    [Ids_1.AvatarDecorationId.Sniper]: {
        Id: Ids_1.AvatarDecorationId.Sniper,
        Description: Items_1.ItemList[Ids_1.ItemId.Sniper].Description,
        Shop: true,
        Price: 750,
    },
    [Ids_1.AvatarDecorationId.RPG]: {
        Id: Ids_1.AvatarDecorationId.RPG,
        Description: Items_1.ItemList[Ids_1.ItemId.RPG].Description,
        Shop: true,
        Price: 750,
    },
    [Ids_1.AvatarDecorationId.Minigun]: {
        Id: Ids_1.AvatarDecorationId.Minigun,
        Description: Items_1.ItemList[Ids_1.ItemId.Minigun].Description,
        Shop: true,
        Price: 750,
    },
    [Ids_1.AvatarDecorationId.Bazooka]: {
        Id: Ids_1.AvatarDecorationId.Bazooka,
        Description: Items_1.ItemList[Ids_1.ItemId.Bazooka].Description,
        Shop: true,
        Price: 750,
    },
    [Ids_1.AvatarDecorationId.MasterOfArms]: {
        Id: Ids_1.AvatarDecorationId.MasterOfArms,
        Description: {
            [Language_1.Language.English]: "Master of Arms",
            [Language_1.Language.Portuguese]: "Mestre das Armas",
            [Language_1.Language.Spanish]: "Maestro de las Armas",
        },
        Shop: true,
        Price: 2000,
    },
};
function getAvatarDecorationList() {
    return Object.values(exports.AvatarDecorationList);
}
//# sourceMappingURL=AvatarDecorations.js.map