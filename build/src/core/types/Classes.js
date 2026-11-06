"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassList = exports.ClassId = void 0;
exports.getCasinoClassModifier = getCasinoClassModifier;
exports.getJobClassModifier = getJobClassModifier;
exports.getPrisonBribeClassModifier = getPrisonBribeClassModifier;
exports.getPrisonEscapeClassModifier = getPrisonEscapeClassModifier;
exports.getRobberyClassModifier = getRobberyClassModifier;
exports.getScavengeChanceClassModifier = getScavengeChanceClassModifier;
exports.getScavengeDurationClassModifier = getScavengeDurationClassModifier;
exports.getInvestmentYieldClassModifier = getInvestmentYieldClassModifier;
const Language_1 = require("#core/models/Language");
const emotes_1 = require("#bot/utils/emotes");
const Ids_1 = require("./Ids");
var Ids_2 = require("./Ids");
Object.defineProperty(exports, "ClassId", { enumerable: true, get: function () { return Ids_2.ClassId; } });
exports.ClassList = {
    [Ids_1.ClassId.None]: {
        Id: Ids_1.ClassId.None,
        Name: {
            [Language_1.Language.English]: "Without class",
            [Language_1.Language.Portuguese]: "Sem classe",
            [Language_1.Language.Spanish]: "Sin clase",
        },
        Description: {
            [Language_1.Language.English]: "Without class",
            [Language_1.Language.Portuguese]: "Sem classe",
            [Language_1.Language.Spanish]: "Sin clase",
        },
        Image: {
            Url: "https://cdn.discordapp.com/attachments/531174573463306240/814662917696782376/Inventario.png",
            Emote: {
                Id: emotes_1.EmoteId.OpenInv,
                String: emotes_1.EmoteString.OpenInv,
            },
        },
    },
    [Ids_1.ClassId.Thief]: {
        Id: Ids_1.ClassId.Thief,
        Name: {
            [Language_1.Language.English]: "Thief",
            [Language_1.Language.Portuguese]: "Ladrão",
            [Language_1.Language.Spanish]: "Ladrón",
        },
        Description: {
            [Language_1.Language.English]: "Skilled with his hands, he learned the art of stealing from a young age. It's a shame he has no luck with the Fortune Tiger.",
            [Language_1.Language.Portuguese]: "Habilidoso com as mãos, aprendeu desde cedo a arte de roubar. Uma pena que não possui sorte no tigrinho.",
            [Language_1.Language.Spanish]: "Hábil con las manos, aprendió el arte del robo desde muy joven. Es una pena que no tenga suerte con el Tigre de la Fortuna.",
        },
        Image: {
            Url: "https://media.discordapp.net/attachments/1233604589064818808/1460375095670472887/Class_Thief.png",
            Emote: {
                Id: emotes_1.EmoteId.Thief,
                String: emotes_1.EmoteString.Thief,
            },
        },
        Modifier: {
            Robbery: {
                Positive: 1.15,
            },
            PrisonEscape: {
                Positive: 5,
            },
            Casino: {
                Negative: 0.75,
            },
        },
    },
    [Ids_1.ClassId.Assassin]: {
        Id: Ids_1.ClassId.Assassin,
        Name: {
            [Language_1.Language.English]: "Assassin",
            [Language_1.Language.Portuguese]: "Assassino",
            [Language_1.Language.Spanish]: "Asesino",
        },
        Description: {
            [Language_1.Language.English]: "Assassin",
            [Language_1.Language.Portuguese]: "Assassino",
            [Language_1.Language.Spanish]: "Asesino",
        },
        Image: {
            Url: "https://media.discordapp.net/attachments/1233604589064818808/1339670907022606467/Classe_Assassino_New.png",
            Emote: {
                Id: emotes_1.EmoteId.Assassin,
                String: emotes_1.EmoteString.Assassin,
            },
        },
    },
    [Ids_1.ClassId.Entrepreneur]: {
        Id: Ids_1.ClassId.Entrepreneur,
        Name: {
            [Language_1.Language.English]: "Entrepreneur",
            [Language_1.Language.Portuguese]: "Empresário",
            [Language_1.Language.Spanish]: "Empresario",
        },
        Description: {
            [Language_1.Language.English]: "He grew up with a silver spoon in his mouth, networking with his father's colleagues, but he lacks a bit of mischief.",
            [Language_1.Language.Portuguese]: "Cresceu em berço de ouro, fazendo networking com os colegas de seu pai, mas lhe falta um pouco de malícia.",
            [Language_1.Language.Spanish]: "Creció con una cuchara de plata en la boca, relacionándose con los colegas de su padre, pero le falta un poco de malicia.",
        },
        Image: {
            Url: "https://media.discordapp.net/attachments/1233604589064818808/1460375094416248999/Class_Entrepeneur.png",
            Emote: {
                Id: emotes_1.EmoteId.Entrepreneur,
                String: emotes_1.EmoteString.Entrepreneur,
            },
        },
        Modifier: {
            Job: {
                Positive: 1.15,
            },
            InvestmentYield: {
                Positive: 1.10,
            },
            Robbery: {
                Negative: 0.75,
            },
        },
    },
    [Ids_1.ClassId.Hobo]: {
        Id: Ids_1.ClassId.Hobo,
        Name: {
            [Language_1.Language.English]: "Hobo",
            [Language_1.Language.Portuguese]: "Mendigo",
            [Language_1.Language.Spanish]: "Vagabundo",
        },
        Description: {
            [Language_1.Language.English]: "Invisible to most of the population, it takes advantage of this to gain maximum benefit.",
            [Language_1.Language.Portuguese]: "Invisível para a maioria da população, aproveita disto para tirar o máximo de vantagem.",
            [Language_1.Language.Spanish]: "Invisible para la mayor parte de la población, se aprovecha de ello para sacar el máximo beneficio.",
        },
        Image: {
            Url: "https://media.discordapp.net/attachments/1233604589064818808/1460375095100051560/Class_Hobo.png",
            Emote: {
                Id: emotes_1.EmoteId.Hobo,
                String: emotes_1.EmoteString.Hobo,
            },
        },
        Modifier: {
            ScavengeDuration: {
                Positive: 1.2,
            },
            ScavengeChance: {
                Positive: 10,
            },
            Job: {
                Negative: 0.8,
            },
        },
    },
    [Ids_1.ClassId.Mafioso]: {
        Id: Ids_1.ClassId.Mafioso,
        Name: {
            [Language_1.Language.English]: "Mafioso",
            [Language_1.Language.Portuguese]: "Mafioso",
            [Language_1.Language.Spanish]: "Mafioso",
        },
        Description: {
            [Language_1.Language.English]: "Mafioso",
            [Language_1.Language.Portuguese]: "Mafioso",
            [Language_1.Language.Spanish]: "Mafioso",
        },
        Image: {
            Url: "https://media.discordapp.net/attachments/1233604589064818808/1339670908138160231/Classe_Mafioso_New3.png",
            Emote: {
                Id: emotes_1.EmoteId.Mafioso,
                String: emotes_1.EmoteString.Mafioso,
            },
        },
    },
    [Ids_1.ClassId.Attorney]: {
        Id: Ids_1.ClassId.Attorney,
        Name: {
            [Language_1.Language.English]: "Attorney",
            [Language_1.Language.Portuguese]: "Advogado",
            [Language_1.Language.Spanish]: "Abogado",
        },
        Description: {
            [Language_1.Language.English]: "He knows the loopholes in all the laws and uses them to his advantage, but he doesn't like to get his suit dirty.",
            [Language_1.Language.Portuguese]: "Conhece as brechas de todas as leis e usa isso ao seu favor, mas não gosta de sujar seu traje.",
            [Language_1.Language.Spanish]: "Él conoce los vacíos de todas las leyes y los utiliza para su beneficio, pero no le gusta ensuciarse el traje.",
        },
        Image: {
            Url: "https://media.discordapp.net/attachments/1233604589064818808/1460375094114255031/Class_Attorney.png",
            Emote: {
                Id: emotes_1.EmoteId.Attorney,
                String: emotes_1.EmoteString.Attorney,
            },
        },
        Modifier: {
            Casino: {
                Positive: 1.2,
            },
            PrisonBribe: {
                Positive: 5,
            },
            ScavengeDuration: {
                Negative: 0.75,
            },
        },
    },
};
function getCasinoClassModifier(classId) {
    return exports.ClassList[classId].Modifier?.Casino?.Positive || exports.ClassList[classId].Modifier?.Casino?.Negative || 1;
}
function getJobClassModifier(classId) {
    return exports.ClassList[classId].Modifier?.Job?.Positive || exports.ClassList[classId].Modifier?.Job?.Negative || 1;
}
function getPrisonBribeClassModifier(classId) {
    return exports.ClassList[classId].Modifier?.PrisonBribe?.Positive || exports.ClassList[classId].Modifier?.PrisonBribe?.Negative || 0;
}
function getPrisonEscapeClassModifier(classId) {
    return exports.ClassList[classId].Modifier?.PrisonEscape?.Positive || exports.ClassList[classId].Modifier?.PrisonEscape?.Negative || 0;
}
function getRobberyClassModifier(classId) {
    return exports.ClassList[classId].Modifier?.Robbery?.Positive || exports.ClassList[classId].Modifier?.Robbery?.Negative || 1;
}
function getScavengeChanceClassModifier(classId) {
    return exports.ClassList[classId].Modifier?.ScavengeChance?.Positive || exports.ClassList[classId].Modifier?.ScavengeChance?.Negative || 0;
}
function getScavengeDurationClassModifier(classId) {
    return exports.ClassList[classId].Modifier?.ScavengeDuration?.Positive || exports.ClassList[classId].Modifier?.ScavengeDuration?.Negative || 1;
}
function getInvestmentYieldClassModifier(classId) {
    return exports.ClassList[classId].Modifier?.InvestmentYield?.Positive || exports.ClassList[classId].Modifier?.InvestmentYield?.Negative || 1;
}
//# sourceMappingURL=Classes.js.map