"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadgeList = exports.BadgeId = void 0;
exports.getBadgeList = getBadgeList;
exports.getCommandBadgeGroups = getCommandBadgeGroups;
const Language_1 = require("#core/models/Language");
const emotes_1 = require("#bot/utils/emotes");
const badges_1 = require("#bot/utils/badges");
const Ids_1 = require("./Ids");
var Ids_2 = require("./Ids");
Object.defineProperty(exports, "BadgeId", { enumerable: true, get: function () { return Ids_2.BadgeId; } });
exports.BadgeList = {
    [Ids_1.BadgeId.VIP]: {
        Id: Ids_1.BadgeId.VIP,
        Name: {
            [Language_1.Language.English]: "VIP",
            [Language_1.Language.Portuguese]: "VIP",
            [Language_1.Language.Spanish]: "VIP",
        },
        Description: {
            [Language_1.Language.English]: "This user is a VIP member",
            [Language_1.Language.Portuguese]: "Este usuário é um membro VIP",
            [Language_1.Language.Spanish]: "Este usuario es un miembro VIP",
        },
        Emoji: {
            Id: emotes_1.EmoteId.VIP,
            String: emotes_1.EmoteString.VIP,
        },
    },
    [Ids_1.BadgeId.VIPEternal]: {
        Id: Ids_1.BadgeId.VIPEternal,
        Name: {
            [Language_1.Language.English]: "Eternal VIP",
            [Language_1.Language.Portuguese]: "VIP Eterno",
            [Language_1.Language.Spanish]: "VIP Eterno",
        },
        Description: {
            [Language_1.Language.English]: "This user is an Eternal VIP member",
            [Language_1.Language.Portuguese]: "Este usuário é um membro VIP Eterno",
            [Language_1.Language.Spanish]: "Este usuario es un miembro VIP Eterno",
        },
        Emoji: {
            Id: emotes_1.EmoteId.VIP,
            String: emotes_1.EmoteString.VIP,
        },
    },
    [Ids_1.BadgeId.Developer]: {
        Id: Ids_1.BadgeId.Developer,
        Name: {
            [Language_1.Language.English]: "Developer",
            [Language_1.Language.Portuguese]: "Desenvolvedor",
            [Language_1.Language.Spanish]: "Desarrolladora",
        },
        Description: {
            [Language_1.Language.English]: "This user is a game developer",
            [Language_1.Language.Portuguese]: "Este usuário é um desenvolvedor do jogo",
            [Language_1.Language.Spanish]: "Este usuario es un desarrollador del juego",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.General.Developer,
            String: badges_1.EmoteBadgeString.General.Developer,
        },
    },
    [Ids_1.BadgeId.Moderator]: {
        Id: Ids_1.BadgeId.Moderator,
        Name: {
            [Language_1.Language.English]: "Moderator",
            [Language_1.Language.Portuguese]: "Moderador",
            [Language_1.Language.Spanish]: "Moderador",
        },
        Description: {
            [Language_1.Language.English]: "This user is a game moderator",
            [Language_1.Language.Portuguese]: "Este usuário é um moderador do jogo",
            [Language_1.Language.Spanish]: "Este usuario es un moderador del juego",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.General.Moderator,
            String: badges_1.EmoteBadgeString.General.Moderator,
        },
    },
    [Ids_1.BadgeId.Helper]: {
        Id: Ids_1.BadgeId.Helper,
        Name: {
            [Language_1.Language.English]: "Helper",
            [Language_1.Language.Portuguese]: "Ajudante",
            [Language_1.Language.Spanish]: "Ayudante",
        },
        Description: {
            [Language_1.Language.English]: "This user is a game helper",
            [Language_1.Language.Portuguese]: "Este usuário é um ajudante do jogo",
            [Language_1.Language.Spanish]: "Este usuario es un ayudante del juego",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.General.Helper,
            String: badges_1.EmoteBadgeString.General.Helper,
        },
    },
    [Ids_1.BadgeId.BugCatcher]: {
        Id: Ids_1.BadgeId.BugCatcher,
        Name: {
            [Language_1.Language.English]: "Bug Catcher",
            [Language_1.Language.Portuguese]: "Cata Bug",
            [Language_1.Language.Spanish]: "Atrapa Bug",
        },
        Description: {
            [Language_1.Language.English]: "This user has found a game-breaking bug and reported it",
            [Language_1.Language.Portuguese]: "Este usuário encontrou um bug que interrompe o jogo e o relatou",
            [Language_1.Language.Spanish]: "Este usuario ha encontrado un error que rompe el juego y lo ha reportado.",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.General.BugCatcher,
            String: badges_1.EmoteBadgeString.General.BugCatcher,
        },
    },
    [Ids_1.BadgeId.Artist]: {
        Id: Ids_1.BadgeId.Artist,
        Name: {
            [Language_1.Language.English]: "Artist",
            [Language_1.Language.Portuguese]: "Artista",
            [Language_1.Language.Spanish]: "Artista",
        },
        Description: {
            [Language_1.Language.English]: "This user contributed with art to the game",
            [Language_1.Language.Portuguese]: "Este usuário contribuiu com arte para o jogo",
            [Language_1.Language.Spanish]: "Este usuario contribuyó con arte para el juego",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.General.Artist,
            String: badges_1.EmoteBadgeString.General.Artist,
        },
    },
    [Ids_1.BadgeId.Billionaire]: {
        Id: Ids_1.BadgeId.Billionaire,
        Name: {
            [Language_1.Language.English]: "Billionaire",
            [Language_1.Language.Portuguese]: "Bilionário",
            [Language_1.Language.Spanish]: "Multimillonario",
        },
        Description: {
            [Language_1.Language.English]: "This user has accumulated over 1 billion Cr$",
            [Language_1.Language.Portuguese]: "Este usuário acumulou mais de 1 bilhão de Cr$",
            [Language_1.Language.Spanish]: "Este usuario ha acumulado más de mil millones de Cr$",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.General.Billionaire,
            String: badges_1.EmoteBadgeString.General.Billionaire,
        },
    },
    [Ids_1.BadgeId.ChristmasArt2020]: {
        Id: Ids_1.BadgeId.ChristmasArt2020,
        Name: {
            [Language_1.Language.English]: "Christmas 2020",
            [Language_1.Language.Portuguese]: "Natal 2020",
            [Language_1.Language.Spanish]: "Navidad 2020",
        },
        Description: {
            [Language_1.Language.English]: "Christmas Art Event 2020",
            [Language_1.Language.Portuguese]: "Evento de Arte de Natal 2020",
            [Language_1.Language.Spanish]: "Evento de Arte Navideño 2020",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Events.Christmas2020,
            String: badges_1.EmoteBadgeString.Events.Christmas2020,
        },
    },
    [Ids_1.BadgeId.EasterGoldenEggs2021]: {
        Id: Ids_1.BadgeId.EasterGoldenEggs2021,
        Name: {
            [Language_1.Language.English]: "Golden Eggs",
            [Language_1.Language.Portuguese]: "Ovos Dourados",
            [Language_1.Language.Spanish]: "Huevos de oro",
        },
        Description: {
            [Language_1.Language.English]: "Bought at the Egg Market with 500 eggs - Easter 2021",
            [Language_1.Language.Portuguese]: "Comprado no Mercado de Ovos com 500 ovos - Páscoa 2021",
            [Language_1.Language.Spanish]: "Comprado en el Mercado de Huevos con 500 huevos - Pascua 2021",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Events.Easter2021,
            String: badges_1.EmoteBadgeString.Events.Easter2021,
        },
    },
    [Ids_1.BadgeId.HalloweenArt2021]: {
        Id: Ids_1.BadgeId.HalloweenArt2021,
        Name: {
            [Language_1.Language.English]: "Halloween 2021",
            [Language_1.Language.Portuguese]: "Halloween 2021",
            [Language_1.Language.Spanish]: "Halloween 2021",
        },
        Description: {
            [Language_1.Language.English]: "Halloween Art Event 2021",
            [Language_1.Language.Portuguese]: "Evento de Arte de Halloween 2021",
            [Language_1.Language.Spanish]: "Evento de Arte de Halloween 2021",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Events.Halloween2021,
            String: badges_1.EmoteBadgeString.Events.Halloween2021,
        },
    },
    [Ids_1.BadgeId.ChristmasCookie2021]: {
        Id: Ids_1.BadgeId.ChristmasCookie2021,
        Name: {
            [Language_1.Language.English]: "Christmas Cookie",
            [Language_1.Language.Portuguese]: "Biscoito de Natal",
            [Language_1.Language.Spanish]: "Galleta de Navidad",
        },
        Description: {
            [Language_1.Language.English]: "Bought at the Christmas Market with 500 presents - Christmas 2021",
            [Language_1.Language.Portuguese]: "Comprado no Mercado de Natal com 500 presentes - Natal 2021",
            [Language_1.Language.Spanish]: "Comprado en el Mercado Navideño con 500 regalos - Navidad 2021",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Events.Christmas2021,
            String: badges_1.EmoteBadgeString.Events.Christmas2021,
        },
    },
    [Ids_1.BadgeId.KeyishMandrake]: {
        Id: Ids_1.BadgeId.KeyishMandrake,
        Name: {
            [Language_1.Language.English]: "Keyish Mandrake",
            [Language_1.Language.Portuguese]: "Mandrake Chavoso",
            [Language_1.Language.Spanish]: "Mandrake Chavoso",
        },
        Description: {
            [Language_1.Language.English]: "Rewarded at the Baile of the end of 6th season",
            [Language_1.Language.Portuguese]: "Recompensado no Baile do final da 6ª temporada",
            [Language_1.Language.Spanish]: "Recompensado en el Baile del final de la sexta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Events.KeyishMandrake,
            String: badges_1.EmoteBadgeString.Events.KeyishMandrake,
        },
    },
    [Ids_1.BadgeId.S1Top1Money]: {
        Id: Ids_1.BadgeId.S1Top1Money,
        Name: {
            [Language_1.Language.English]: "Top 1 Money S1",
            [Language_1.Language.Portuguese]: "Top 1 Grana S1",
            [Language_1.Language.Spanish]: "Top 1 Dinero S1",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Money in the 1st season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Grana na 1ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Dinero en la 1ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season1.Top1Money,
            String: badges_1.EmoteBadgeString.Season1.Top1Money,
        },
    },
    [Ids_1.BadgeId.S1Top2Money]: {
        Id: Ids_1.BadgeId.S1Top2Money,
        Name: {
            [Language_1.Language.English]: "Top 2 Money S1",
            [Language_1.Language.Portuguese]: "Top 2 Grana S1",
            [Language_1.Language.Spanish]: "Top 2 Dinero S1",
        },
        Description: {
            [Language_1.Language.English]: "2nd place in Top Money in the 1st season",
            [Language_1.Language.Portuguese]: "2º lugar no Top Grana na 1ª temporada",
            [Language_1.Language.Spanish]: "2do lugar en Top Dinero en la 1ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season1.Top2Money,
            String: badges_1.EmoteBadgeString.Season1.Top2Money,
        },
    },
    [Ids_1.BadgeId.S1Top3Money]: {
        Id: Ids_1.BadgeId.S1Top3Money,
        Name: {
            [Language_1.Language.English]: "Top 3 Money S1",
            [Language_1.Language.Portuguese]: "Top 3 Grana S1",
            [Language_1.Language.Spanish]: "Top 3 Dinero S1",
        },
        Description: {
            [Language_1.Language.English]: "3rd place in Top Money in the 1st season",
            [Language_1.Language.Portuguese]: "3º lugar no Top Grana na 1ª temporada",
            [Language_1.Language.Spanish]: "3er lugar en Top Dinero en la 1ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season1.Top3Money,
            String: badges_1.EmoteBadgeString.Season1.Top3Money,
        },
    },
    [Ids_1.BadgeId.S2Top1Money]: {
        Id: Ids_1.BadgeId.S2Top1Money,
        Name: {
            [Language_1.Language.English]: "Top 1 Money S2",
            [Language_1.Language.Portuguese]: "Top 1 Grana S2",
            [Language_1.Language.Spanish]: "Top 1 Dinero S2",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Money in the 2nd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Grana na 2ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Dinero en la 2da temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season2.Top1Money,
            String: badges_1.EmoteBadgeString.Season2.Top1Money,
        },
    },
    [Ids_1.BadgeId.S2Top2Money]: {
        Id: Ids_1.BadgeId.S2Top2Money,
        Name: {
            [Language_1.Language.English]: "Top 2 Money S2",
            [Language_1.Language.Portuguese]: "Top 2 Grana S2",
            [Language_1.Language.Spanish]: "Top 2 Dinero S2",
        },
        Description: {
            [Language_1.Language.English]: "2nd place in Top Money in the 2nd season",
            [Language_1.Language.Portuguese]: "2º lugar no Top Grana na 2ª temporada",
            [Language_1.Language.Spanish]: "2do lugar en Top Dinero en la 2da temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season2.Top2Money,
            String: badges_1.EmoteBadgeString.Season2.Top2Money,
        },
    },
    [Ids_1.BadgeId.S2Top3Money]: {
        Id: Ids_1.BadgeId.S2Top3Money,
        Name: {
            [Language_1.Language.English]: "Top 3 Money S2",
            [Language_1.Language.Portuguese]: "Top 3 Grana S2",
            [Language_1.Language.Spanish]: "Top 3 Dinero S2",
        },
        Description: {
            [Language_1.Language.English]: "3rd place in Top Money in the 2nd season",
            [Language_1.Language.Portuguese]: "3º lugar no Top Grana na 2ª temporada",
            [Language_1.Language.Spanish]: "3er lugar en Top Dinero en la 2da temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season2.Top3Money,
            String: badges_1.EmoteBadgeString.Season2.Top3Money,
        },
    },
    [Ids_1.BadgeId.S2Top1BeatUp]: {
        Id: Ids_1.BadgeId.S2Top1BeatUp,
        Name: {
            [Language_1.Language.English]: "Home Run S2",
            [Language_1.Language.Portuguese]: "Home Run S2",
            [Language_1.Language.Spanish]: "Home Run S2",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Beat Up in the 2nd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Pancada na 2ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Pelea en la 2da temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season2.HomeRun,
            String: badges_1.EmoteBadgeString.Season2.HomeRun,
        },
    },
    [Ids_1.BadgeId.S2Top1Escapes]: {
        Id: Ids_1.BadgeId.S2Top1Escapes,
        Name: {
            [Language_1.Language.English]: "Escapist S2",
            [Language_1.Language.Portuguese]: "Fujão S2",
            [Language_1.Language.Spanish]: "Top 1 Fugas S2",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Escapes in the 2nd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Fugas na 2ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Fugas en la 2da temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season2.Escapist,
            String: badges_1.EmoteBadgeString.Season2.Escapist,
        },
    },
    [Ids_1.BadgeId.S2Top1CasinoWR]: {
        Id: Ids_1.BadgeId.S2Top1CasinoWR,
        Name: {
            [Language_1.Language.English]: "Lucky One S2",
            [Language_1.Language.Portuguese]: "Sortudo S2",
            [Language_1.Language.Spanish]: "Afortunado S2",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Casino Win Rate in the 2nd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Taxa de Vitória do Cassino na 2ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Tasa de Victoria del Casino en la 2da temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season2.LuckyOne,
            String: badges_1.EmoteBadgeString.Season2.LuckyOne,
        },
    },
    [Ids_1.BadgeId.S2Top1RobberyQuantity]: {
        Id: Ids_1.BadgeId.S2Top1RobberyQuantity,
        Name: {
            [Language_1.Language.English]: "Silly Hand S2",
            [Language_1.Language.Portuguese]: "Mão Boba S2",
            [Language_1.Language.Spanish]: "Mano Tonta S2",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Robbery Quantity in the 2nd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Quantidade de Roubos na 2ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Cantidad de Robos en la 2da temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season2.SillyHand,
            String: badges_1.EmoteBadgeString.Season2.SillyHand,
        },
    },
    [Ids_1.BadgeId.S2Top1RobberyProfit]: {
        Id: Ids_1.BadgeId.S2Top1RobberyProfit,
        Name: {
            [Language_1.Language.English]: "Large Pocket S2",
            [Language_1.Language.Portuguese]: "Bolso Largo S2",
            [Language_1.Language.Spanish]: "Bolsillo grande S2",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Robbery Profit in the 2nd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Lucro de Roubos na 2ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Beneficio de Robos en la 2da temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season2.LargePocket,
            String: badges_1.EmoteBadgeString.Season2.LargePocket,
        },
    },
    [Ids_1.BadgeId.S2TopRooster]: {
        Id: Ids_1.BadgeId.S2TopRooster,
        Name: {
            [Language_1.Language.English]: "Top Rooster S2",
            [Language_1.Language.Portuguese]: "Top Galo S2",
            [Language_1.Language.Spanish]: "Top Pollo S2",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Rooster in the 2nd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Galo na 2ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Pollo en la 2da temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season2.TopRooster,
            String: badges_1.EmoteBadgeString.Season2.TopRooster,
        },
    },
    [Ids_1.BadgeId.S3Top1Money]: {
        Id: Ids_1.BadgeId.S3Top1Money,
        Name: {
            [Language_1.Language.English]: "Top 1 Money S3",
            [Language_1.Language.Portuguese]: "Top 1 Grana S3",
            [Language_1.Language.Spanish]: "Top 1 Dinero S3",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Money in the 3rd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Grana na 3ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Dinero en la 3ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season3.Top1Money,
            String: badges_1.EmoteBadgeString.Season3.Top1Money,
        },
    },
    [Ids_1.BadgeId.S3Top2Money]: {
        Id: Ids_1.BadgeId.S3Top2Money,
        Name: {
            [Language_1.Language.English]: "Top 2 Money S3",
            [Language_1.Language.Portuguese]: "Top 2 Grana S3",
            [Language_1.Language.Spanish]: "Top 2 Dinero S3",
        },
        Description: {
            [Language_1.Language.English]: "2nd place in Top Money in the 3rd season",
            [Language_1.Language.Portuguese]: "2º lugar no Top Grana na 3ª temporada",
            [Language_1.Language.Spanish]: "2do lugar en Top Dinero en la 3ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season3.Top2Money,
            String: badges_1.EmoteBadgeString.Season3.Top2Money,
        },
    },
    [Ids_1.BadgeId.S3Top3Money]: {
        Id: Ids_1.BadgeId.S3Top3Money,
        Name: {
            [Language_1.Language.English]: "Top 3 Money S3",
            [Language_1.Language.Portuguese]: "Top 3 Grana S3",
            [Language_1.Language.Spanish]: "Top 3 Dinero S3",
        },
        Description: {
            [Language_1.Language.English]: "3rd place in Top Money in the 3rd season",
            [Language_1.Language.Portuguese]: "3º lugar no Top Grana na 3ª temporada",
            [Language_1.Language.Spanish]: "3er lugar en Top Dinero en la 3ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season3.Top3Money,
            String: badges_1.EmoteBadgeString.Season3.Top3Money,
        },
    },
    [Ids_1.BadgeId.S3Top1BeatUp]: {
        Id: Ids_1.BadgeId.S3Top1BeatUp,
        Name: {
            [Language_1.Language.English]: "Head Smasher S3",
            [Language_1.Language.Portuguese]: "Esmaga Crânio S3",
            [Language_1.Language.Spanish]: "Aplasta Cráneos S3",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Beat Up in the 3rd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Pancada na 3ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Pelea en la 3ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season3.HeadSmasher,
            String: badges_1.EmoteBadgeString.Season3.HeadSmasher,
        },
    },
    [Ids_1.BadgeId.S3Top1Beated]: {
        Id: Ids_1.BadgeId.S3Top1Beated,
        Name: {
            [Language_1.Language.English]: "Crazy Dead Body S3",
            [Language_1.Language.Portuguese]: "Morto Muito Louco S3",
            [Language_1.Language.Spanish]: "Cadáver Loco S3",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Beated in the 3rd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Espancado na 3ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Golpeado en la 3ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season3.CrazyDeadBody,
            String: badges_1.EmoteBadgeString.Season3.CrazyDeadBody,
        },
    },
    [Ids_1.BadgeId.S3Top1Escapes]: {
        Id: Ids_1.BadgeId.S3Top1Escapes,
        Name: {
            [Language_1.Language.English]: "Escapist S3",
            [Language_1.Language.Portuguese]: "Fujão S3",
            [Language_1.Language.Spanish]: "Escapista S3",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Escapes in the 3rd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Fugas na 3ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Fugas en la 3ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season3.Escapist,
            String: badges_1.EmoteBadgeString.Season3.Escapist,
        },
    },
    [Ids_1.BadgeId.S3Top1CasinoWR]: {
        Id: Ids_1.BadgeId.S3Top1CasinoWR,
        Name: {
            [Language_1.Language.English]: "Lucky One S3",
            [Language_1.Language.Portuguese]: "Sortudo S3",
            [Language_1.Language.Spanish]: "Afortunado S3",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Casino Win Rate in the 3rd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Taxa de Vitória do Cassino na 3ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Tasa de Victoria del Casino en la 3ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season3.LuckyOne,
            String: badges_1.EmoteBadgeString.Season3.LuckyOne,
        },
    },
    [Ids_1.BadgeId.S3Top1CasinoProfit]: {
        Id: Ids_1.BadgeId.S3Top1CasinoProfit,
        Name: {
            [Language_1.Language.English]: "Elite Trader S3",
            [Language_1.Language.Portuguese]: "Trader Elite S3",
            [Language_1.Language.Spanish]: "Comerciante de Élite S3",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Casino Profit in the 3rd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Lucro do Cassino na 3ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Beneficio del Casino en la 3ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season3.EliteTrader,
            String: badges_1.EmoteBadgeString.Season3.EliteTrader,
        },
    },
    [Ids_1.BadgeId.S3Top1RobberyQuantity]: {
        Id: Ids_1.BadgeId.S3Top1RobberyQuantity,
        Name: {
            [Language_1.Language.English]: "Silly Hand S3",
            [Language_1.Language.Portuguese]: "Mão Boba S3",
            [Language_1.Language.Spanish]: "Mano Tonta S3",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Robbery Quantity in the 3rd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Quantidade de Roubos na 3ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Cantidad de Robos en la 3ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season3.SillyHand,
            String: badges_1.EmoteBadgeString.Season3.SillyHand,
        },
    },
    [Ids_1.BadgeId.S3Top1RobberyProfit]: {
        Id: Ids_1.BadgeId.S3Top1RobberyProfit,
        Name: {
            [Language_1.Language.English]: "Large Pocket S3",
            [Language_1.Language.Portuguese]: "Bolso Largo S3",
            [Language_1.Language.Spanish]: "Bolsillo Grande S3",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Robbery Profit in the 3rd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Lucro de Roubos na 3ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Beneficio de Robos en la 3ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season3.LargePocket,
            String: badges_1.EmoteBadgeString.Season3.LargePocket,
        },
    },
    [Ids_1.BadgeId.S3Top1Rooster]: {
        Id: Ids_1.BadgeId.S3Top1Rooster,
        Name: {
            [Language_1.Language.English]: "Top Rooster S3",
            [Language_1.Language.Portuguese]: "Top Galo S3",
            [Language_1.Language.Spanish]: "Top Pollo S3",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Rooster in the 3rd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Galo na 3ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Pollo en la 3ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season3.TopRooster,
            String: badges_1.EmoteBadgeString.Season3.TopRooster,
        },
    },
    [Ids_1.BadgeId.S3Top1Stolen]: {
        Id: Ids_1.BadgeId.S3Top1Stolen,
        Name: {
            [Language_1.Language.English]: "Walking Target S3",
            [Language_1.Language.Portuguese]: "Alvo Ambulante S3",
            [Language_1.Language.Spanish]: "Blanco Ambulante S3",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Stolen in the 3rd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Roubado na 3ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Robado en la 3ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season3.WalkingTarget,
            String: badges_1.EmoteBadgeString.Season3.WalkingTarget,
        },
    },
    [Ids_1.BadgeId.S3Top1Alms]: {
        Id: Ids_1.BadgeId.S3Top1Alms,
        Name: {
            [Language_1.Language.English]: "Philantrope S3",
            [Language_1.Language.Portuguese]: "Filantropo S3",
            [Language_1.Language.Spanish]: "Filántropo S3",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Alms in the 3rd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Esmolas na 3ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Limosnas en la 3ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season3.Philantrope,
            String: badges_1.EmoteBadgeString.Season3.Philantrope,
        },
    },
    [Ids_1.BadgeId.S3Top1Investments]: {
        Id: Ids_1.BadgeId.S3Top1Investments,
        Name: {
            [Language_1.Language.English]: "Investor S3",
            [Language_1.Language.Portuguese]: "Investidor S3",
            [Language_1.Language.Spanish]: "Inversor S3",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Investments in the 3rd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Investimentos na 3ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Inversiones en la 3ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season3.Invester,
            String: badges_1.EmoteBadgeString.Season3.Invester,
        },
    },
    [Ids_1.BadgeId.S3Top1Jobs]: {
        Id: Ids_1.BadgeId.S3Top1Jobs,
        Name: {
            [Language_1.Language.English]: "Workaholic S3",
            [Language_1.Language.Portuguese]: "Workaholic S3",
            [Language_1.Language.Spanish]: "Workaholic S3",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Jobs in the 3rd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Trabalhos na 3ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Trabajos en la 3ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season3.Workaholic,
            String: badges_1.EmoteBadgeString.Season3.Workaholic,
        },
    },
    [Ids_1.BadgeId.S3Top1Spender]: {
        Id: Ids_1.BadgeId.S3Top1Spender,
        Name: {
            [Language_1.Language.English]: "Preppy S3",
            [Language_1.Language.Portuguese]: "Patricinha S3",
            [Language_1.Language.Spanish]: "Pijo S3",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Spender in the 3rd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Gastador na 3ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Gastador en la 3ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season3.Preppy,
            String: badges_1.EmoteBadgeString.Season3.Preppy,
        },
    },
    [Ids_1.BadgeId.S3Top1Bribery]: {
        Id: Ids_1.BadgeId.S3Top1Bribery,
        Name: {
            [Language_1.Language.English]: "Politician S3",
            [Language_1.Language.Portuguese]: "Deputado S3",
            [Language_1.Language.Spanish]: "Político S3",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Bribery in the 3rd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Suborno na 3ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Soborno en la 3ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season3.Politician,
            String: badges_1.EmoteBadgeString.Season3.Politician,
        },
    },
    [Ids_1.BadgeId.S3Top1Hospital]: {
        Id: Ids_1.BadgeId.S3Top1Hospital,
        Name: {
            [Language_1.Language.English]: "Hypochondriac S3",
            [Language_1.Language.Portuguese]: "Hipocondríaco S3",
            [Language_1.Language.Spanish]: "Hipocondríaco S3",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Hospital in the 3rd season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Hospital na 3ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Hospital en la 3ra temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season3.Hypochondriac,
            String: badges_1.EmoteBadgeString.Season3.Hypochondriac,
        },
    },
    [Ids_1.BadgeId.S4Top1Money]: {
        Id: Ids_1.BadgeId.S4Top1Money,
        Name: {
            [Language_1.Language.English]: "Top 1 Money S4",
            [Language_1.Language.Portuguese]: "Top 1 Grana S4",
            [Language_1.Language.Spanish]: "Top 1 Dinero S4",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Money in the 4th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Grana na 4ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Dinero en la 4ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season4.Top1Money,
            String: badges_1.EmoteBadgeString.Season4.Top1Money,
        },
    },
    [Ids_1.BadgeId.S4Top2Money]: {
        Id: Ids_1.BadgeId.S4Top2Money,
        Name: {
            [Language_1.Language.English]: "Top 2 Money S4",
            [Language_1.Language.Portuguese]: "Top 2 Grana S4",
            [Language_1.Language.Spanish]: "Top 2 Dinero S4",
        },
        Description: {
            [Language_1.Language.English]: "2nd place in Top Money in the 4th season",
            [Language_1.Language.Portuguese]: "2º lugar no Top Grana na 4ª temporada",
            [Language_1.Language.Spanish]: "2do lugar en Top Dinero en la 4ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season4.Top2Money,
            String: badges_1.EmoteBadgeString.Season4.Top2Money,
        },
    },
    [Ids_1.BadgeId.S4Top3Money]: {
        Id: Ids_1.BadgeId.S4Top3Money,
        Name: {
            [Language_1.Language.English]: "Top 3 Money S4",
            [Language_1.Language.Portuguese]: "Top 3 Grana S4",
            [Language_1.Language.Spanish]: "Top 3 Dinero S4",
        },
        Description: {
            [Language_1.Language.English]: "3rd place in Top Money in the 4th season",
            [Language_1.Language.Portuguese]: "3º lugar no Top Grana na 4ª temporada",
            [Language_1.Language.Spanish]: "3er lugar en Top Dinero en la 4ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season4.Top3Money,
            String: badges_1.EmoteBadgeString.Season4.Top3Money,
        },
    },
    [Ids_1.BadgeId.S4Top1BeatUp]: {
        Id: Ids_1.BadgeId.S4Top1BeatUp,
        Name: {
            [Language_1.Language.English]: "Head Smasher S4",
            [Language_1.Language.Portuguese]: "Esmaga Crânio S4",
            [Language_1.Language.Spanish]: "Aplasta Cráneos S4",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Beat Up in the 4th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Pancada na 4ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Pelea en la 4ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season4.HeadSmasher,
            String: badges_1.EmoteBadgeString.Season4.HeadSmasher,
        },
    },
    [Ids_1.BadgeId.S4Top1Scavenge]: {
        Id: Ids_1.BadgeId.S4Top1Scavenge,
        Name: {
            [Language_1.Language.English]: "Sherlock Holmes S4",
            [Language_1.Language.Portuguese]: "Xeroque Holmes S4",
            [Language_1.Language.Spanish]: "Sherlock Holmes S4",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Scavenge in the 4th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Vasculhar na 4ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Rebuscar en la 4ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season4.SherlockHolmes,
            String: badges_1.EmoteBadgeString.Season4.SherlockHolmes || `<:sherlock_holmes:${badges_1.EmoteBadgeId.Season4.SherlockHolmes}>`,
        },
    },
    [Ids_1.BadgeId.S4Top1Escapes]: {
        Id: Ids_1.BadgeId.S4Top1Escapes,
        Name: {
            [Language_1.Language.English]: "Escapist S4",
            [Language_1.Language.Portuguese]: "Fujão S4",
            [Language_1.Language.Spanish]: "Escapista S4",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Escapes in the 4th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Fugas na 4ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Fugas en la 4ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season4.Escapist,
            String: badges_1.EmoteBadgeString.Season4.Escapist,
        },
    },
    [Ids_1.BadgeId.S4Top1CasinoWR]: {
        Id: Ids_1.BadgeId.S4Top1CasinoWR,
        Name: {
            [Language_1.Language.English]: "Lucky One S4",
            [Language_1.Language.Portuguese]: "Sortudo S4",
            [Language_1.Language.Spanish]: "Afortunado S4",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Casino Win Rate in the 4th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Taxa de Vitória do Cassino na 4ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Tasa de Victoria del Casino en la 4ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season4.LuckyOne,
            String: badges_1.EmoteBadgeString.Season4.LuckyOne,
        },
    },
    [Ids_1.BadgeId.S4Top1CasinoProfit]: {
        Id: Ids_1.BadgeId.S4Top1CasinoProfit,
        Name: {
            [Language_1.Language.English]: "Elite Trader S4",
            [Language_1.Language.Portuguese]: "Trader Elite S4",
            [Language_1.Language.Spanish]: "Comerciante de Élite S4",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Casino Profit in the 4th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Lucro do Cassino na 4ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Beneficio del Casino en la 4ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season4.EliteTrader,
            String: badges_1.EmoteBadgeString.Season4.EliteTrader,
        },
    },
    [Ids_1.BadgeId.S4Top1RobberyQuantity]: {
        Id: Ids_1.BadgeId.S4Top1RobberyQuantity,
        Name: {
            [Language_1.Language.English]: "Silly Hand S4",
            [Language_1.Language.Portuguese]: "Mão Boba S4",
            [Language_1.Language.Spanish]: "Mano Tonta S4",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Robbery Quantity in the 4th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Quantidade de Roubos na 4ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Cantidad de Robos en la 4ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season4.SillyHand,
            String: badges_1.EmoteBadgeString.Season4.SillyHand,
        },
    },
    [Ids_1.BadgeId.S4Top1RobberyProfit]: {
        Id: Ids_1.BadgeId.S4Top1RobberyProfit,
        Name: {
            [Language_1.Language.English]: "Large Pocket S4",
            [Language_1.Language.Portuguese]: "Bolso Largo S4",
            [Language_1.Language.Spanish]: "Bolsillo Grande S4",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Robbery Profit in the 4th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Lucro de Roubos na 4ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Beneficio de Robos en la 4ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season4.LargePocket,
            String: badges_1.EmoteBadgeString.Season4.LargePocket,
        },
    },
    [Ids_1.BadgeId.S4Top1Rooster]: {
        Id: Ids_1.BadgeId.S4Top1Rooster,
        Name: {
            [Language_1.Language.English]: "Top Rooster S4",
            [Language_1.Language.Portuguese]: "Top Galo S4",
            [Language_1.Language.Spanish]: "Top Pollo S4",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Rooster in the 4th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Galo na 4ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Pollo en la 4ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season4.TopRooster,
            String: badges_1.EmoteBadgeString.Season4.TopRooster,
        },
    },
    [Ids_1.BadgeId.S4Top1Alms]: {
        Id: Ids_1.BadgeId.S4Top1Alms,
        Name: {
            [Language_1.Language.English]: "Philantrope S4",
            [Language_1.Language.Portuguese]: "Filantropo S4",
            [Language_1.Language.Spanish]: "Filántropo S4",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Alms in the 4th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Esmolas na 4ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Limosnas en la 4ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season4.Philantrope,
            String: badges_1.EmoteBadgeString.Season4.Philantrope,
        },
    },
    [Ids_1.BadgeId.S4Top1Investments]: {
        Id: Ids_1.BadgeId.S4Top1Investments,
        Name: {
            [Language_1.Language.English]: "Investor S4",
            [Language_1.Language.Portuguese]: "Investidor S4",
            [Language_1.Language.Spanish]: "Inversor S4",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Investments in the 4th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Investimentos na 4ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Inversiones en la 4ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season4.Invester,
            String: badges_1.EmoteBadgeString.Season4.Invester,
        },
    },
    [Ids_1.BadgeId.S4Top1Jobs]: {
        Id: Ids_1.BadgeId.S4Top1Jobs,
        Name: {
            [Language_1.Language.English]: "Workaholic S4",
            [Language_1.Language.Portuguese]: "Workaholic S4",
            [Language_1.Language.Spanish]: "Adicto al Trabajo S4",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Jobs in the 4th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Trabalhos na 4ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Trabajos en la 4ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season4.Workaholic,
            String: badges_1.EmoteBadgeString.Season4.Workaholic,
        },
    },
    [Ids_1.BadgeId.S4Top1Spender]: {
        Id: Ids_1.BadgeId.S4Top1Spender,
        Name: {
            [Language_1.Language.English]: "Preppy S4",
            [Language_1.Language.Portuguese]: "Patricinha S4",
            [Language_1.Language.Spanish]: "Pijo S4",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Spender in the 4th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Gastador na 4ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Gastador en la 4ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season4.Preppy,
            String: badges_1.EmoteBadgeString.Season4.Preppy,
        },
    },
    [Ids_1.BadgeId.S4Top1Bribery]: {
        Id: Ids_1.BadgeId.S4Top1Bribery,
        Name: {
            [Language_1.Language.English]: "Politician S4",
            [Language_1.Language.Portuguese]: "Deputado S4",
            [Language_1.Language.Spanish]: "Político S4",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Bribery in the 4th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Suborno na 4ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Soborno en la 4ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season4.Politician,
            String: badges_1.EmoteBadgeString.Season4.Politician,
        },
    },
    [Ids_1.BadgeId.S4Top1Hospital]: {
        Id: Ids_1.BadgeId.S4Top1Hospital,
        Name: {
            [Language_1.Language.English]: "Hypochondriac S4",
            [Language_1.Language.Portuguese]: "Hipocondríaco S4",
            [Language_1.Language.Spanish]: "Hipocondríaco S4",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Hospital in the 4th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Hospital na 4ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Hospital en la 4ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season4.Hypochondriac,
            String: badges_1.EmoteBadgeString.Season4.Hypochondriac,
        },
    },
    [Ids_1.BadgeId.S5Top1Money]: {
        Id: Ids_1.BadgeId.S5Top1Money,
        Name: {
            [Language_1.Language.English]: "Top 1 Money S5",
            [Language_1.Language.Portuguese]: "Top 1 Grana S5",
            [Language_1.Language.Spanish]: "Top 1 Dinero S5",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Money in the 5th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Grana na 5ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Dinero en la 5ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season5.Top1Money,
            String: badges_1.EmoteBadgeString.Season5.Top1Money,
        },
    },
    [Ids_1.BadgeId.S5Top2Money]: {
        Id: Ids_1.BadgeId.S5Top2Money,
        Name: {
            [Language_1.Language.English]: "Top 2 Money S5",
            [Language_1.Language.Portuguese]: "Top 2 Grana S5",
            [Language_1.Language.Spanish]: "Top 2 Dinero S5",
        },
        Description: {
            [Language_1.Language.English]: "2nd place in Top Money in the 5th season",
            [Language_1.Language.Portuguese]: "2º lugar no Top Grana na 5ª temporada",
            [Language_1.Language.Spanish]: "2do lugar en Top Dinero en la 5ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season5.Top2Money,
            String: badges_1.EmoteBadgeString.Season5.Top2Money,
        },
    },
    [Ids_1.BadgeId.S5Top3Money]: {
        Id: Ids_1.BadgeId.S5Top3Money,
        Name: {
            [Language_1.Language.English]: "Top 3 Money S5",
            [Language_1.Language.Portuguese]: "Top 3 Grana S5",
            [Language_1.Language.Spanish]: "Top 3 Dinero S5",
        },
        Description: {
            [Language_1.Language.English]: "3rd place in Top Money in the 5th season",
            [Language_1.Language.Portuguese]: "3º lugar no Top Grana na 5ª temporada",
            [Language_1.Language.Spanish]: "3er lugar en Top Dinero en la 5ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season5.Top3Money,
            String: badges_1.EmoteBadgeString.Season5.Top3Money,
        },
    },
    [Ids_1.BadgeId.S5Top1BeatUp]: {
        Id: Ids_1.BadgeId.S5Top1BeatUp,
        Name: {
            [Language_1.Language.English]: "Head Smasher S5",
            [Language_1.Language.Portuguese]: "Esmaga Crânio S5",
            [Language_1.Language.Spanish]: "Aplasta Cráneos S5",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Beat Up in the 5th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Pancada na 5ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Pelea en la 5ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season5.HeadSmasher,
            String: badges_1.EmoteBadgeString.Season5.HeadSmasher,
        },
    },
    [Ids_1.BadgeId.S5Top1Scavenge]: {
        Id: Ids_1.BadgeId.S5Top1Scavenge,
        Name: {
            [Language_1.Language.English]: "Sherlock Holmes S5",
            [Language_1.Language.Portuguese]: "Xeroque Holmes S5",
            [Language_1.Language.Spanish]: "Sherlock Holmes S5",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Scavenge in the 5th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Vasculhar na 5ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Rebuscar en la 5ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season5.SherlockHolmes,
            String: badges_1.EmoteBadgeString.Season5.SherlockHolmes,
        },
    },
    [Ids_1.BadgeId.S5Top1Escapes]: {
        Id: Ids_1.BadgeId.S5Top1Escapes,
        Name: {
            [Language_1.Language.English]: "Escapist S5",
            [Language_1.Language.Portuguese]: "Fujão S5",
            [Language_1.Language.Spanish]: "Escapista S5",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Escapes in the 5th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Fugas na 5ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Fugas en la 5ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season5.Escapist,
            String: badges_1.EmoteBadgeString.Season5.Escapist,
        },
    },
    [Ids_1.BadgeId.S5Top1CasinoWR]: {
        Id: Ids_1.BadgeId.S5Top1CasinoWR,
        Name: {
            [Language_1.Language.English]: "Lucky One S5",
            [Language_1.Language.Portuguese]: "Sortudo S5",
            [Language_1.Language.Spanish]: "Afortunado S5",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Casino Win Rate in the 5th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Taxa de Vitória do Cassino na 5ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Tasa de Victoria del Casino en la 5ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season5.LuckyOne,
            String: badges_1.EmoteBadgeString.Season5.LuckyOne,
        },
    },
    [Ids_1.BadgeId.S5Top1CasinoProfit]: {
        Id: Ids_1.BadgeId.S5Top1CasinoProfit,
        Name: {
            [Language_1.Language.English]: "Elite Trader S5",
            [Language_1.Language.Portuguese]: "Trader Elite S5",
            [Language_1.Language.Spanish]: "Comerciante de Élite S5",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Casino Profit in the 5th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Lucro do Cassino na 5ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Beneficio del Casino en la 5ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season5.EliteTrader,
            String: badges_1.EmoteBadgeString.Season5.EliteTrader,
        },
    },
    [Ids_1.BadgeId.S5Top1RobberyQuantity]: {
        Id: Ids_1.BadgeId.S5Top1RobberyQuantity,
        Name: {
            [Language_1.Language.English]: "Silly Hand S5",
            [Language_1.Language.Portuguese]: "Mão Boba S5",
            [Language_1.Language.Spanish]: "Mano Tonta S5",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Robbery Quantity in the 5th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Quantidade de Roubos na 5ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Cantidad de Robos en la 5ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season5.SillyHand,
            String: badges_1.EmoteBadgeString.Season5.SillyHand,
        },
    },
    [Ids_1.BadgeId.S5Top1RobberyProfit]: {
        Id: Ids_1.BadgeId.S5Top1RobberyProfit,
        Name: {
            [Language_1.Language.English]: "Large Pocket S5",
            [Language_1.Language.Portuguese]: "Bolso Largo S5",
            [Language_1.Language.Spanish]: "Bolsillo Grande S5",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Robbery Profit in the 5th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Lucro de Roubos na 5ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Beneficio de Robos en la 5ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season5.LargePocket,
            String: badges_1.EmoteBadgeString.Season5.LargePocket,
        },
    },
    [Ids_1.BadgeId.S5Top1Rooster]: {
        Id: Ids_1.BadgeId.S5Top1Rooster,
        Name: {
            [Language_1.Language.English]: "Top Rooster S5",
            [Language_1.Language.Portuguese]: "Top Galo S5",
            [Language_1.Language.Spanish]: "Top Pollo S5",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Rooster in the 5th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Galo na 5ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Pollo en la 5ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season5.TopRooster,
            String: badges_1.EmoteBadgeString.Season5.TopRooster,
        },
    },
    [Ids_1.BadgeId.S5Top1Alms]: {
        Id: Ids_1.BadgeId.S5Top1Alms,
        Name: {
            [Language_1.Language.English]: "Philantrope S5",
            [Language_1.Language.Portuguese]: "Filantropo S5",
            [Language_1.Language.Spanish]: "Filántropo S5",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Alms in the 5th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Esmolas na 5ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Limosnas en la 5ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season5.Philantrope,
            String: badges_1.EmoteBadgeString.Season5.Philantrope,
        },
    },
    [Ids_1.BadgeId.S5Top1Investments]: {
        Id: Ids_1.BadgeId.S5Top1Investments,
        Name: {
            [Language_1.Language.English]: "Investor S5",
            [Language_1.Language.Portuguese]: "Investidor S5",
            [Language_1.Language.Spanish]: "Inversor S5",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Investments in the 5th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Investimentos na 5ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Inversiones en la 5ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season5.Invester,
            String: badges_1.EmoteBadgeString.Season5.Invester,
        },
    },
    [Ids_1.BadgeId.S5Top1Jobs]: {
        Id: Ids_1.BadgeId.S5Top1Jobs,
        Name: {
            [Language_1.Language.English]: "Workaholic S5",
            [Language_1.Language.Portuguese]: "Workaholic S5",
            [Language_1.Language.Spanish]: "Adicto al Trabajo S5",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Jobs in the 5th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Trabalhos na 5ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Trabajos en la 5ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season5.Workaholic,
            String: badges_1.EmoteBadgeString.Season5.Workaholic,
        },
    },
    [Ids_1.BadgeId.S5Top1Spender]: {
        Id: Ids_1.BadgeId.S5Top1Spender,
        Name: {
            [Language_1.Language.English]: "Preppy S5",
            [Language_1.Language.Portuguese]: "Patricinha S5",
            [Language_1.Language.Spanish]: "Pijo S5",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Spender in the 5th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Gastador na 5ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Gastador en la 5ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season5.Preppy,
            String: badges_1.EmoteBadgeString.Season5.Preppy,
        },
    },
    [Ids_1.BadgeId.S5Top1Bribery]: {
        Id: Ids_1.BadgeId.S5Top1Bribery,
        Name: {
            [Language_1.Language.English]: "Politician S5",
            [Language_1.Language.Portuguese]: "Deputado S5",
            [Language_1.Language.Spanish]: "Político S5",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Bribery in the 5th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Suborno na 5ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Soborno en la 5ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season5.Politician,
            String: badges_1.EmoteBadgeString.Season5.Politician,
        },
    },
    [Ids_1.BadgeId.S5Top1Hospital]: {
        Id: Ids_1.BadgeId.S5Top1Hospital,
        Name: {
            [Language_1.Language.English]: "Hypochondriac S5",
            [Language_1.Language.Portuguese]: "Hipocondríaco S5",
            [Language_1.Language.Spanish]: "Hipocondríaco S5",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Hospital in the 5th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Hospital na 5ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Hospital en la 5ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season5.Hypochondriac,
            String: badges_1.EmoteBadgeString.Season5.Hypochondriac,
        },
    },
    [Ids_1.BadgeId.S5Top1Gang]: {
        Id: Ids_1.BadgeId.S5Top1Gang,
        Name: {
            [Language_1.Language.English]: "Top Gang S5",
            [Language_1.Language.Portuguese]: "Top Gangue S5",
            [Language_1.Language.Spanish]: "Top Cuadrilla S5",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Gang in the 5th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Gangue na 5ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Cuadrilla en la 5ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season5.TopGang,
            String: badges_1.EmoteBadgeString.Season5.TopGang,
        },
    },
    [Ids_1.BadgeId.S6Top1Money]: {
        Id: Ids_1.BadgeId.S6Top1Money,
        Name: {
            [Language_1.Language.English]: "Top 1 Money S6",
            [Language_1.Language.Portuguese]: "Top 1 Grana S6",
            [Language_1.Language.Spanish]: "Top 1 Dinero S6",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Money in the 6th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Grana na 6ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Dinero en la 6ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.Top1Money,
            String: badges_1.EmoteBadgeString.Season6.Top1Money,
        },
    },
    [Ids_1.BadgeId.S6Top2Money]: {
        Id: Ids_1.BadgeId.S6Top2Money,
        Name: {
            [Language_1.Language.English]: "Top 2 Money S6",
            [Language_1.Language.Portuguese]: "Top 2 Grana S6",
            [Language_1.Language.Spanish]: "Top 2 Dinero S6",
        },
        Description: {
            [Language_1.Language.English]: "2nd place in Top Money in the 6th season",
            [Language_1.Language.Portuguese]: "2º lugar no Top Grana na 6ª temporada",
            [Language_1.Language.Spanish]: "2do lugar en Top Dinero en la 6ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.Top2Money,
            String: badges_1.EmoteBadgeString.Season6.Top2Money,
        },
    },
    [Ids_1.BadgeId.S6Top3Money]: {
        Id: Ids_1.BadgeId.S6Top3Money,
        Name: {
            [Language_1.Language.English]: "Top 3 Money S6",
            [Language_1.Language.Portuguese]: "Top 3 Grana S6",
            [Language_1.Language.Spanish]: "Top 3 Dinero S6",
        },
        Description: {
            [Language_1.Language.English]: "3rd place in Top Money in the 6th season",
            [Language_1.Language.Portuguese]: "3º lugar no Top Grana na 6ª temporada",
            [Language_1.Language.Spanish]: "3er lugar en Top Dinero en la 6ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.Top3Money,
            String: badges_1.EmoteBadgeString.Season6.Top3Money,
        },
    },
    [Ids_1.BadgeId.S6Top1BeatUp]: {
        Id: Ids_1.BadgeId.S6Top1BeatUp,
        Name: {
            [Language_1.Language.English]: "Head Smasher S6",
            [Language_1.Language.Portuguese]: "Esmaga Crânio S6",
            [Language_1.Language.Spanish]: "Aplasta Cráneos S6",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Beat Up in the 6th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Pancada na 6ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Pelea en la 6ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.HeadSmasher,
            String: badges_1.EmoteBadgeString.Season6.HeadSmasher,
        },
    },
    [Ids_1.BadgeId.S6Top1Scavenge]: {
        Id: Ids_1.BadgeId.S6Top1Scavenge,
        Name: {
            [Language_1.Language.English]: "Sherlock Holmes S6",
            [Language_1.Language.Portuguese]: "Xeroque Holmes S6",
            [Language_1.Language.Spanish]: "Sherlock Holmes S6",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Scavenge in the 6th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Vasculhar na 6ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Rebuscar en la 6ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.SherlockHolmes,
            String: badges_1.EmoteBadgeString.Season6.SherlockHolmes,
        },
    },
    [Ids_1.BadgeId.S6Top1Escapes]: {
        Id: Ids_1.BadgeId.S6Top1Escapes,
        Name: {
            [Language_1.Language.English]: "Escapist S6",
            [Language_1.Language.Portuguese]: "Fujão S6",
            [Language_1.Language.Spanish]: "Escapista S6",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Escapes in the 6th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Fugas na 6ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Fugas en la 6ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.Escapist,
            String: badges_1.EmoteBadgeString.Season6.Escapist,
        },
    },
    [Ids_1.BadgeId.S6Top1CasinoWR]: {
        Id: Ids_1.BadgeId.S6Top1CasinoWR,
        Name: {
            [Language_1.Language.English]: "Lucky One S6",
            [Language_1.Language.Portuguese]: "Sortudo S6",
            [Language_1.Language.Spanish]: "Afortunado S6",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Casino Win Rate in the 6th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Taxa de Vitória do Cassino na 6ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Tasa de Victoria del Casino en la 6ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.LuckyOne,
            String: badges_1.EmoteBadgeString.Season6.LuckyOne,
        },
    },
    [Ids_1.BadgeId.S6Top1CasinoProfit]: {
        Id: Ids_1.BadgeId.S6Top1CasinoProfit,
        Name: {
            [Language_1.Language.English]: "Elite Trader S6",
            [Language_1.Language.Portuguese]: "Trader Elite S6",
            [Language_1.Language.Spanish]: "Comerciante de Élite S6",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Casino Profit in the 6th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Lucro do Cassino na 6ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Beneficio del Casino en la 6ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.EliteTrader,
            String: badges_1.EmoteBadgeString.Season6.EliteTrader,
        },
    },
    [Ids_1.BadgeId.S6Top1RobberyQuantity]: {
        Id: Ids_1.BadgeId.S6Top1RobberyQuantity,
        Name: {
            [Language_1.Language.English]: "Silly Hand S6",
            [Language_1.Language.Portuguese]: "Mão Boba S6",
            [Language_1.Language.Spanish]: "Mano Tonta S6",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Robbery Quantity in the 6th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Quantidade de Roubos na 6ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Cantidad de Robos en la 6ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.SillyHand,
            String: badges_1.EmoteBadgeString.Season6.SillyHand,
        },
    },
    [Ids_1.BadgeId.S6Top1RobberyProfit]: {
        Id: Ids_1.BadgeId.S6Top1RobberyProfit,
        Name: {
            [Language_1.Language.English]: "Large Pocket S6",
            [Language_1.Language.Portuguese]: "Bolso Largo S6",
            [Language_1.Language.Spanish]: "Bolsillo Grande S6",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Robbery Profit in the 6th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Lucro de Roubos na 6ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Beneficio de Robos en la 6ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.LargePocket,
            String: badges_1.EmoteBadgeString.Season6.LargePocket,
        },
    },
    [Ids_1.BadgeId.S6Top1Rooster]: {
        Id: Ids_1.BadgeId.S6Top1Rooster,
        Name: {
            [Language_1.Language.English]: "Top Rooster S6",
            [Language_1.Language.Portuguese]: "Top Galo S6",
            [Language_1.Language.Spanish]: "Top Pollo S6",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Rooster in the 6th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Galo na 6ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Pollo en la 6ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.TopRooster,
            String: badges_1.EmoteBadgeString.Season6.TopRooster,
        },
    },
    [Ids_1.BadgeId.S6Top1Alms]: {
        Id: Ids_1.BadgeId.S6Top1Alms,
        Name: {
            [Language_1.Language.English]: "Philantrope S6",
            [Language_1.Language.Portuguese]: "Filantropo S6",
            [Language_1.Language.Spanish]: "Filántropo S6",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Alms in the 6th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Esmolas na 6ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Limosnas en la 6ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.Philantrope,
            String: badges_1.EmoteBadgeString.Season6.Philantrope,
        },
    },
    [Ids_1.BadgeId.S6Top1Investments]: {
        Id: Ids_1.BadgeId.S6Top1Investments,
        Name: {
            [Language_1.Language.English]: "Investor S6",
            [Language_1.Language.Portuguese]: "Investidor S6",
            [Language_1.Language.Spanish]: "Inversor S6",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Investments in the 6th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Investimentos na 6ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Inversiones en la 6ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.Invester,
            String: badges_1.EmoteBadgeString.Season6.Invester,
        },
    },
    [Ids_1.BadgeId.S6Top1Jobs]: {
        Id: Ids_1.BadgeId.S6Top1Jobs,
        Name: {
            [Language_1.Language.English]: "Workaholic S6",
            [Language_1.Language.Portuguese]: "Workaholic S6",
            [Language_1.Language.Spanish]: "Adicto al Trabajo S6",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Jobs in the 6th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Trabalhos na 6ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Trabajos en la 6ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.Workaholic,
            String: badges_1.EmoteBadgeString.Season6.Workaholic,
        },
    },
    [Ids_1.BadgeId.S6Top1Spender]: {
        Id: Ids_1.BadgeId.S6Top1Spender,
        Name: {
            [Language_1.Language.English]: "Preppy S6",
            [Language_1.Language.Portuguese]: "Patricinha S6",
            [Language_1.Language.Spanish]: "Pijo S6",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Spender in the 6th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Gastador na 6ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Gastador en la 6ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.Preppy,
            String: badges_1.EmoteBadgeString.Season6.Preppy,
        },
    },
    [Ids_1.BadgeId.S6Top1Bribery]: {
        Id: Ids_1.BadgeId.S6Top1Bribery,
        Name: {
            [Language_1.Language.English]: "Politician S6",
            [Language_1.Language.Portuguese]: "Deputado S6",
            [Language_1.Language.Spanish]: "Político S6",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Bribery in the 6th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Suborno na 6ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Soborno en la 6ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.Politician,
            String: badges_1.EmoteBadgeString.Season6.Politician,
        },
    },
    [Ids_1.BadgeId.S6Top1Hospital]: {
        Id: Ids_1.BadgeId.S6Top1Hospital,
        Name: {
            [Language_1.Language.English]: "Hypochondriac S6",
            [Language_1.Language.Portuguese]: "Hipocondríaco S6",
            [Language_1.Language.Spanish]: "Hipocondríaco S6",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Hospital in the 6th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Hospital na 6ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Hospital en la 6ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.Hypochondriac,
            String: badges_1.EmoteBadgeString.Season6.Hypochondriac,
        },
    },
    [Ids_1.BadgeId.S6Top1Gang]: {
        Id: Ids_1.BadgeId.S6Top1Gang,
        Name: {
            [Language_1.Language.English]: "Top Gang S6",
            [Language_1.Language.Portuguese]: "Top Gangue S6",
            [Language_1.Language.Spanish]: "Top Cuadrilla S6",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Gang in the 6th season",
            [Language_1.Language.Portuguese]: "1º lugar no Top Gangue na 6ª temporada",
            [Language_1.Language.Spanish]: "1er lugar en Top Cuadrilla en la 6ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.TopGang,
            String: badges_1.EmoteBadgeString.Season6.TopGang,
        },
    },
    [Ids_1.BadgeId.DefeatedCoroamuru]: {
        Id: Ids_1.BadgeId.DefeatedCoroamuru,
        Name: {
            [Language_1.Language.English]: "I Defeated Coroamuru",
            [Language_1.Language.Portuguese]: "Eu Derrotei Coroamuru",
            [Language_1.Language.Spanish]: "Yo derroté a Coroamuru",
        },
        Description: {
            [Language_1.Language.English]: "Finale Event Winner in the 4th season",
            [Language_1.Language.Portuguese]: "Vencedor do evento do final da 4ª temporada",
            [Language_1.Language.Spanish]: "Ganador del evento final de la 4ta temporada",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Events.Coroamuru,
            String: badges_1.EmoteBadgeString.Events.Coroamuru,
        },
    },
    // Just for /badges command
    [Ids_1.BadgeId.S_Top1Money]: {
        Id: Ids_1.BadgeId.S_Top1Money,
        Name: {
            [Language_1.Language.English]: "Top 1 Money",
            [Language_1.Language.Portuguese]: "Top 1 Grana",
            [Language_1.Language.Spanish]: "Top 1 Dinero",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Money",
            [Language_1.Language.Portuguese]: "1º lugar no Top Grana",
            [Language_1.Language.Spanish]: "1er lugar en Top Dinero",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season1.Top1Money,
            String: badges_1.EmoteBadgeString.Season1.Top1Money,
        },
    },
    [Ids_1.BadgeId.S_Top2Money]: {
        Id: Ids_1.BadgeId.S_Top2Money,
        Name: {
            [Language_1.Language.English]: "Top 2 Money",
            [Language_1.Language.Portuguese]: "Top 2 Grana",
            [Language_1.Language.Spanish]: "Top 2 Dinero",
        },
        Description: {
            [Language_1.Language.English]: "2nd place in Top Money",
            [Language_1.Language.Portuguese]: "2º lugar no Top Grana",
            [Language_1.Language.Spanish]: "2do lugar en Top Dinero",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season1.Top2Money,
            String: badges_1.EmoteBadgeString.Season1.Top2Money,
        },
    },
    [Ids_1.BadgeId.S_Top3Money]: {
        Id: Ids_1.BadgeId.S_Top3Money,
        Name: {
            [Language_1.Language.English]: "Top 3 Money",
            [Language_1.Language.Portuguese]: "Top 3 Grana",
            [Language_1.Language.Spanish]: "Top 3 Dinero",
        },
        Description: {
            [Language_1.Language.English]: "3rd place in Top Money",
            [Language_1.Language.Portuguese]: "3º lugar no Top Grana",
            [Language_1.Language.Spanish]: "3er lugar en Top Dinero",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season1.Top3Money,
            String: badges_1.EmoteBadgeString.Season1.Top3Money,
        },
    },
    [Ids_1.BadgeId.S_Top1BeatUp]: {
        Id: Ids_1.BadgeId.S_Top1BeatUp,
        Name: {
            [Language_1.Language.English]: "Head Smasher",
            [Language_1.Language.Portuguese]: "Esmaga Crânio",
            [Language_1.Language.Spanish]: "Aplasta Cráneos",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Beat Up",
            [Language_1.Language.Portuguese]: "1º lugar no Top Pancada",
            [Language_1.Language.Spanish]: "1er lugar en Top Pelea",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.HeadSmasher,
            String: badges_1.EmoteBadgeString.Season6.HeadSmasher,
        },
    },
    [Ids_1.BadgeId.S_Top1Scavenge]: {
        Id: Ids_1.BadgeId.S_Top1Scavenge,
        Name: {
            [Language_1.Language.English]: "Sherlock Holmes",
            [Language_1.Language.Portuguese]: "Xeroque Holmes",
            [Language_1.Language.Spanish]: "Sherlock Holmes",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Scavenge",
            [Language_1.Language.Portuguese]: "1º lugar no Top Vasculhar",
            [Language_1.Language.Spanish]: "1er lugar en Top Rebuscar",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.SherlockHolmes,
            String: badges_1.EmoteBadgeString.Season6.SherlockHolmes,
        },
    },
    [Ids_1.BadgeId.S_Top1Escapes]: {
        Id: Ids_1.BadgeId.S_Top1Escapes,
        Name: {
            [Language_1.Language.English]: "Escapist",
            [Language_1.Language.Portuguese]: "Fujão",
            [Language_1.Language.Spanish]: "Escapista",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Escapes",
            [Language_1.Language.Portuguese]: "1º lugar no Top Fugas",
            [Language_1.Language.Spanish]: "1er lugar en Top Fugas",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.Escapist,
            String: badges_1.EmoteBadgeString.Season6.Escapist,
        },
    },
    [Ids_1.BadgeId.S_Top1CasinoWR]: {
        Id: Ids_1.BadgeId.S_Top1CasinoWR,
        Name: {
            [Language_1.Language.English]: "Lucky One",
            [Language_1.Language.Portuguese]: "Sortudo",
            [Language_1.Language.Spanish]: "Afortunado",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Casino Win Rate",
            [Language_1.Language.Portuguese]: "1º lugar no Top Taxa de Vitória do Cassino",
            [Language_1.Language.Spanish]: "1er lugar en Top Tasa de Victoria del Casino",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.LuckyOne,
            String: badges_1.EmoteBadgeString.Season6.LuckyOne,
        },
    },
    [Ids_1.BadgeId.S_Top1CasinoProfit]: {
        Id: Ids_1.BadgeId.S_Top1CasinoProfit,
        Name: {
            [Language_1.Language.English]: "Elite Trader",
            [Language_1.Language.Portuguese]: "Trader Elite",
            [Language_1.Language.Spanish]: "Comerciante de Élite",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Casino Profit",
            [Language_1.Language.Portuguese]: "1º lugar no Top Lucro do Cassino",
            [Language_1.Language.Spanish]: "1er lugar en Top Beneficio del Casino",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.EliteTrader,
            String: badges_1.EmoteBadgeString.Season6.EliteTrader,
        },
    },
    [Ids_1.BadgeId.S_Top1RobberyQuantity]: {
        Id: Ids_1.BadgeId.S_Top1RobberyQuantity,
        Name: {
            [Language_1.Language.English]: "Silly Hand",
            [Language_1.Language.Portuguese]: "Mão Boba",
            [Language_1.Language.Spanish]: "Mano Tonta",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Robbery Quantity",
            [Language_1.Language.Portuguese]: "1º lugar no Top Quantidade de Roubos",
            [Language_1.Language.Spanish]: "1er lugar en Top Cantidad de Robos",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.SillyHand,
            String: badges_1.EmoteBadgeString.Season6.SillyHand,
        },
    },
    [Ids_1.BadgeId.S_Top1RobberyProfit]: {
        Id: Ids_1.BadgeId.S_Top1RobberyProfit,
        Name: {
            [Language_1.Language.English]: "Large Pocket",
            [Language_1.Language.Portuguese]: "Bolso Largo",
            [Language_1.Language.Spanish]: "Bolsillo Grande",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Robbery Profit",
            [Language_1.Language.Portuguese]: "1º lugar no Top Lucro de Roubos",
            [Language_1.Language.Spanish]: "1er lugar en Top Beneficio de Robos",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.LargePocket,
            String: badges_1.EmoteBadgeString.Season6.LargePocket,
        },
    },
    [Ids_1.BadgeId.S_Top1Rooster]: {
        Id: Ids_1.BadgeId.S_Top1Rooster,
        Name: {
            [Language_1.Language.English]: "Top Rooster",
            [Language_1.Language.Portuguese]: "Top Galo",
            [Language_1.Language.Spanish]: "Top Pollo",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Rooster",
            [Language_1.Language.Portuguese]: "1º lugar no Top Galo",
            [Language_1.Language.Spanish]: "1er lugar en Top Pollo",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.TopRooster,
            String: badges_1.EmoteBadgeString.Season6.TopRooster,
        },
    },
    [Ids_1.BadgeId.S_Top1Alms]: {
        Id: Ids_1.BadgeId.S_Top1Alms,
        Name: {
            [Language_1.Language.English]: "Philantrope",
            [Language_1.Language.Portuguese]: "Filantropo",
            [Language_1.Language.Spanish]: "Filántropo",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Alms",
            [Language_1.Language.Portuguese]: "1º lugar no Top Esmolas",
            [Language_1.Language.Spanish]: "1er lugar en Top Limosnas",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.Philantrope,
            String: badges_1.EmoteBadgeString.Season6.Philantrope,
        },
    },
    [Ids_1.BadgeId.S_Top1Investments]: {
        Id: Ids_1.BadgeId.S_Top1Investments,
        Name: {
            [Language_1.Language.English]: "Investor",
            [Language_1.Language.Portuguese]: "Investidor",
            [Language_1.Language.Spanish]: "Inversor",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Investments",
            [Language_1.Language.Portuguese]: "1º lugar no Top Investimentos",
            [Language_1.Language.Spanish]: "1er lugar en Top Inversiones",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.Invester,
            String: badges_1.EmoteBadgeString.Season6.Invester,
        },
    },
    [Ids_1.BadgeId.S_Top1Jobs]: {
        Id: Ids_1.BadgeId.S_Top1Jobs,
        Name: {
            [Language_1.Language.English]: "Workaholic",
            [Language_1.Language.Portuguese]: "Workaholic",
            [Language_1.Language.Spanish]: "Adicto al Trabajo",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Jobs",
            [Language_1.Language.Portuguese]: "1º lugar no Top Trabalhos",
            [Language_1.Language.Spanish]: "1er lugar en Top Trabajos",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.Workaholic,
            String: badges_1.EmoteBadgeString.Season6.Workaholic,
        },
    },
    [Ids_1.BadgeId.S_Top1Spender]: {
        Id: Ids_1.BadgeId.S_Top1Spender,
        Name: {
            [Language_1.Language.English]: "Preppy",
            [Language_1.Language.Portuguese]: "Patricinha",
            [Language_1.Language.Spanish]: "Pijo",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Spender",
            [Language_1.Language.Portuguese]: "1º lugar no Top Gastador",
            [Language_1.Language.Spanish]: "1er lugar en Top Gastador",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.Preppy,
            String: badges_1.EmoteBadgeString.Season6.Preppy,
        },
    },
    [Ids_1.BadgeId.S_Top1Bribery]: {
        Id: Ids_1.BadgeId.S_Top1Bribery,
        Name: {
            [Language_1.Language.English]: "Politician",
            [Language_1.Language.Portuguese]: "Deputado",
            [Language_1.Language.Spanish]: "Político",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Bribery",
            [Language_1.Language.Portuguese]: "1º lugar no Top Suborno",
            [Language_1.Language.Spanish]: "1er lugar en Top Soborno",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.Politician,
            String: badges_1.EmoteBadgeString.Season6.Politician,
        },
    },
    [Ids_1.BadgeId.S_Top1Hospital]: {
        Id: Ids_1.BadgeId.S_Top1Hospital,
        Name: {
            [Language_1.Language.English]: "Hypochondriac",
            [Language_1.Language.Portuguese]: "Hipocondríaco",
            [Language_1.Language.Spanish]: "Hipocondríaco",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Hospital",
            [Language_1.Language.Portuguese]: "1º lugar no Top Hospital",
            [Language_1.Language.Spanish]: "1er lugar en Top Hospital",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.Hypochondriac,
            String: badges_1.EmoteBadgeString.Season6.Hypochondriac,
        },
    },
    [Ids_1.BadgeId.S_Top1Gang]: {
        Id: Ids_1.BadgeId.S_Top1Gang,
        Name: {
            [Language_1.Language.English]: "Top Gang",
            [Language_1.Language.Portuguese]: "Top Gangue",
            [Language_1.Language.Spanish]: "Top Cuadrilla",
        },
        Description: {
            [Language_1.Language.English]: "1st place in Top Gang",
            [Language_1.Language.Portuguese]: "1º lugar no Top Gangue",
            [Language_1.Language.Spanish]: "1er lugar en Top Cuadrilla",
        },
        Emoji: {
            Id: badges_1.EmoteBadgeId.Season6.TopGang,
            String: badges_1.EmoteBadgeString.Season6.TopGang,
        },
    },
};
function getBadgeList() {
    return Object.values(exports.BadgeList);
}
function getCommandBadgeGroups() {
    const specialBadgeIds = [
        Ids_1.BadgeId.VIP,
        Ids_1.BadgeId.Developer,
        Ids_1.BadgeId.Moderator,
        Ids_1.BadgeId.Helper,
        Ids_1.BadgeId.BugCatcher,
        Ids_1.BadgeId.Artist,
        Ids_1.BadgeId.Billionaire,
        Ids_1.BadgeId.ChristmasArt2020,
        Ids_1.BadgeId.EasterGoldenEggs2021,
        Ids_1.BadgeId.HalloweenArt2021,
        Ids_1.BadgeId.ChristmasCookie2021,
        Ids_1.BadgeId.DefeatedCoroamuru,
        Ids_1.BadgeId.KeyishMandrake,
    ];
    const seasonalBadgeIds = [
        Ids_1.BadgeId.S_Top1Money,
        Ids_1.BadgeId.S_Top2Money,
        Ids_1.BadgeId.S_Top3Money,
        Ids_1.BadgeId.S_Top1BeatUp,
        Ids_1.BadgeId.S_Top1Scavenge,
        Ids_1.BadgeId.S_Top1Escapes,
        Ids_1.BadgeId.S_Top1CasinoWR,
        Ids_1.BadgeId.S_Top1CasinoProfit,
        Ids_1.BadgeId.S_Top1RobberyQuantity,
        Ids_1.BadgeId.S_Top1RobberyProfit,
        Ids_1.BadgeId.S_Top1Rooster,
        Ids_1.BadgeId.S_Top1Alms,
        Ids_1.BadgeId.S_Top1Investments,
        Ids_1.BadgeId.S_Top1Jobs,
        Ids_1.BadgeId.S_Top1Spender,
        Ids_1.BadgeId.S_Top1Bribery,
        Ids_1.BadgeId.S_Top1Hospital,
        Ids_1.BadgeId.S_Top1Gang,
    ];
    const badges = getBadgeList();
    return {
        special: badges.filter(({ Id }) => specialBadgeIds.includes(Id)),
        seasonal: badges.filter(({ Id }) => seasonalBadgeIds.includes(Id)),
    };
}
//# sourceMappingURL=Badges.js.map