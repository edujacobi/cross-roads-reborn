"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GangBases = exports.GangBaseId = void 0;
exports.getGangBases = getGangBases;
const Language_1 = require("#core/models/Language");
const Ids_1 = require("./Ids");
var Ids_2 = require("./Ids");
Object.defineProperty(exports, "GangBaseId", { enumerable: true, get: function () { return Ids_2.GangBaseId; } });
exports.GangBases = {
    [Ids_1.GangBaseId.None]: {
        Id: Ids_1.GangBaseId.None,
        Name: {
            [Language_1.Language.English]: "Without base",
            [Language_1.Language.Portuguese]: "Sem base",
            [Language_1.Language.Spanish]: "Sin base",
        },
        Description: {
            [Language_1.Language.English]: "-",
            [Language_1.Language.Portuguese]: "-",
            [Language_1.Language.Spanish]: "-",
        },
        Modifier: {},
    },
    [Ids_1.GangBaseId.Airport]: {
        Id: Ids_1.GangBaseId.Airport,
        ImageUrl: "https://media.discordapp.net/attachments/531174573463306240/757330414342766676/unknown.png",
        Name: {
            [Language_1.Language.English]: "Abandoned Airport",
            [Language_1.Language.Portuguese]: "Aeroporto Abandonado",
            [Language_1.Language.Spanish]: "Aeropuerto Abandonado",
        },
        Description: {
            [Language_1.Language.English]: "An old abandoned airport, a perfect place for illicit activities and to expand your influence.",
            [Language_1.Language.Portuguese]: "Um antigo aeroporto abandonado, um lugar perfeito para atividades ilícitas e para expandir sua influência.",
            [Language_1.Language.Spanish]: "Un antiguo aeropuerto abandonado, un lugar perfecto para actividades ilícitas y para expandir tu influencia.",
        },
        Modifier: {
            PrisonEscape: {
                Positive: 0.5,
            },
        },
    },
    [Ids_1.GangBaseId.Bunker]: {
        Id: Ids_1.GangBaseId.Bunker,
        ImageUrl: "https://media.discordapp.net/attachments/531174573463306240/757329826091892736/unknown.png",
        Name: {
            [Language_1.Language.English]: "Subterranean Bunker",
            [Language_1.Language.Portuguese]: "Bunker Subterrâneo",
            [Language_1.Language.Spanish]: "Bunker Subterráneo",
        },
        Description: {
            [Language_1.Language.English]: "A fortified underground bunker, ideal for planning your next moves and safeguarding your operations.",
            [Language_1.Language.Portuguese]: "Um bunker subterrâneo fortificado, ideal para planejar seus próximos movimentos e salvaguardar suas operações.",
            [Language_1.Language.Spanish]: "Un búnker subterráneo fortificado, ideal para planificar tus próximos movimientos y salvaguardar tus operaciones.",
        },
        Modifier: {
            Defense: {
                Positive: 1,
            },
        },
    },
    [Ids_1.GangBaseId.BikeClub]: {
        Id: Ids_1.GangBaseId.BikeClub,
        ImageUrl: "https://media.discordapp.net/attachments/531174573463306240/757330594303574146/unknown.png",
        Name: {
            [Language_1.Language.English]: "Anarchist Bikeclub",
            [Language_1.Language.Portuguese]: "Motoclube Anarquista",
            [Language_1.Language.Spanish]: "Club de Motociclistas Anarquistas",
        },
        Description: {
            [Language_1.Language.English]: "A rowdy bike club, a haven for outlaws and a strategic point for controlling the streets.",
            [Language_1.Language.Portuguese]: "Um motoclube barulhento, um refúgio para foras da lei e um ponto estratégico para controlar as ruas.",
            [Language_1.Language.Spanish]: "Un ruidoso club de motociclistas, un refugio para forajidos y un punto estratégico para controlar las calles.",
        },
        Modifier: {
            Attack: {
                Positive: 0.5,
            },
        },
    },
};
function getGangBases() {
    return Object.values(exports.GangBases);
}
//# sourceMappingURL=GangBases.js.map