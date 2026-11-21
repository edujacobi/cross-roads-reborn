"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HorseList = void 0;
const emotes_1 = require("#bot/utils/emotes");
const Language_1 = require("#core/models/Language");
exports.HorseList = [
    {
        Id: 1,
        Emote: emotes_1.EmoteString.HorseLightning,
        Name: {
            [Language_1.Language.English]: "Lightning",
            [Language_1.Language.Portuguese]: "Raio",
            [Language_1.Language.Spanish]: "Rayo"
        },
        Description: {
            [Language_1.Language.English]: "The fastest horse in the west. We are not in the west.",
            [Language_1.Language.Portuguese]: "O cavalo mais rápido do oeste. Nós não estamos no oeste.",
            [Language_1.Language.Spanish]: "El caballo más rápido del oeste. No estamos en el oeste."
        },
        Multiplier: 2.0,
        Weight: 40
    },
    {
        Id: 2,
        Emote: emotes_1.EmoteString.HorseThunder,
        Name: {
            [Language_1.Language.English]: "Thunder",
            [Language_1.Language.Portuguese]: "Trovão",
            [Language_1.Language.Spanish]: "Trueno"
        },
        Description: {
            [Language_1.Language.English]: "Fed with Whey Protein every morning. His flatulence during the race named him.",
            [Language_1.Language.Portuguese]: "Alimentado com Whey Protein todas as manhãs. Suas flatulências durante a corrida o nomearam.",
            [Language_1.Language.Spanish]: "Alimentado con Whey Protein todas las mañanas. Sus flatulencias durante la carrera lo nombraron."
        },
        Multiplier: 2.5,
        Weight: 30
    },
    {
        Id: 3,
        Emote: emotes_1.EmoteString.HorseGhost,
        Name: {
            [Language_1.Language.English]: "Ghost",
            [Language_1.Language.Portuguese]: "Fantasma",
            [Language_1.Language.Spanish]: "Fantasma"
        },
        Description: {
            [Language_1.Language.English]: "Extremely fast, but frequently, no one sees him cross the finish line.",
            [Language_1.Language.Portuguese]: "Extremamente veloz, mas frequentemente, ninguém o vê cruzar a linha de chegada.",
            [Language_1.Language.Spanish]: "Extremadamente veloz, pero frecuentemente, nadie lo ve cruzar la meta."
        },
        Multiplier: 3.0,
        Weight: 15
    },
    {
        Id: 4,
        Emote: emotes_1.EmoteString.HorseShadow,
        Name: {
            [Language_1.Language.English]: "Shadow",
            [Language_1.Language.Portuguese]: "Sombra",
            [Language_1.Language.Spanish]: "Sombra"
        },
        Description: {
            [Language_1.Language.English]: "He was the best horse in the area, until he took an arrow to the knee.",
            [Language_1.Language.Portuguese]: "Era o melhor alazão destas bandas, até tomar uma flechada no joelho.",
            [Language_1.Language.Spanish]: "Era el mejor alazán de estos lares, hasta que le dispararon en la rodilla."
        },
        Multiplier: 4.0,
        Weight: 10
    },
    {
        Id: 5,
        Emote: emotes_1.EmoteString.HorseMystic,
        Name: {
            [Language_1.Language.English]: "Mystic",
            [Language_1.Language.Portuguese]: "Místico",
            [Language_1.Language.Spanish]: "Místico"
        },
        Description: {
            [Language_1.Language.English]: "Untamable. Fearless. A deity with a will of its own. Runs only when it wants to.",
            [Language_1.Language.Portuguese]: "Indomável. Destemido. Uma divindade com vontade própria. Corre somente quando quer.",
            [Language_1.Language.Spanish]: "Indomable. Intrépido. Una deidad con voluntad propia. Corre solo cuando quiere."
        },
        Multiplier: 5.0,
        Weight: 5
    },
];
//# sourceMappingURL=Horses.js.map