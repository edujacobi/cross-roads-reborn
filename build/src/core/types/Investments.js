"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentList = exports.InvestmentId = void 0;
exports.getInvestmentList = getInvestmentList;
const Language_1 = require("#core/models/Language");
const Ids_1 = require("./Ids");
var Ids_2 = require("./Ids");
Object.defineProperty(exports, "InvestmentId", { enumerable: true, get: function () { return Ids_2.InvestmentId; } });
exports.InvestmentList = {
    [Ids_1.InvestmentId.ChurrosCart]: {
        Id: Ids_1.InvestmentId.ChurrosCart,
        Name: {
            [Language_1.Language.English]: "Churros Cart",
            [Language_1.Language.Portuguese]: "Carrinho de Churros",
            [Language_1.Language.Spanish]: "Carrito de Churros",
        },
        Description: {
            [Language_1.Language.English]: "A simple churros cart at the corner of the fishcutter's street.",
            [Language_1.Language.Portuguese]: "Um carrinho de churros simples na esquina da rua da peixeira.",
            [Language_1.Language.Spanish]: "Un simple carrito de churros en la esquina de la calle de la pescatera.",
        },
        Emote: {
            Id: "0",
            String: "📰",
        },
        ImageUrl: "https://media.discordapp.net/attachments/529795576993415175/923591337561980979/1-Churros.png",
        Price: 5_000,
        HourlyYield: 5_000 * 0.012,
        BaseDefense: 20,
        PrisonSeverity: 1 * 0.3,
        HenchmanFee: 14,
    },
    [Ids_1.InvestmentId.CrackDen]: {
        Id: Ids_1.InvestmentId.CrackDen,
        Name: {
            [Language_1.Language.English]: "Crack den",
            [Language_1.Language.Portuguese]: "Boca de Fumo",
            [Language_1.Language.Spanish]: "Guarida de Crack",
        },
        Description: {
            [Language_1.Language.English]: "A place for illicit trade and questionable activities.",
            [Language_1.Language.Portuguese]: "Um local de comércio ilícito e atividades duvidosas.",
            [Language_1.Language.Spanish]: "Un lugar para el comercio ilícito y actividades dudosas.",
        },
        Emote: {
            Id: "0",
            String: "🏪",
        },
        ImageUrl: "https://media.discordapp.net/attachments/529795576993415175/923591337972989952/2-Boca.png",
        Price: 15_000,
        HourlyYield: 15_000 * 0.013,
        BaseDefense: 25,
        PrisonSeverity: 2 * 0.3,
        HenchmanFee: 16,
    },
    [Ids_1.InvestmentId.BocceCourt]: {
        Id: Ids_1.InvestmentId.BocceCourt,
        Name: {
            [Language_1.Language.English]: "Bocce Court",
            [Language_1.Language.Portuguese]: "Cancha de Bocha",
            [Language_1.Language.Spanish]: "Cancha de Bocha",
        },
        Description: {
            [Language_1.Language.English]: "A nice place to play bocce and drink a beer.",
            [Language_1.Language.Portuguese]: "Um lugar agradável para jogar bocha e tomar uma cerveja.",
            [Language_1.Language.Spanish]: "Un buen lugar para jugar bochas y tomar una cerveza.",
        },
        Emote: {
            Id: "0",
            String: "🍺",
        },
        ImageUrl: "https://media.discordapp.net/attachments/529795576993415175/923591338430185472/3-Cancha.png",
        Price: 50_000,
        HourlyYield: 50_000 * 0.014,
        BaseDefense: 30,
        PrisonSeverity: 3 * 0.3,
        HenchmanFee: 18,
    },
    [Ids_1.InvestmentId.VeganRestaurant]: {
        Id: Ids_1.InvestmentId.VeganRestaurant,
        Name: {
            [Language_1.Language.English]: "Vegan Restaurant",
            [Language_1.Language.Portuguese]: "Restaurante Vegano",
            [Language_1.Language.Spanish]: "Restaurante Vegano",
        },
        Description: {
            [Language_1.Language.English]: "Sells genetically modified vegan food.",
            [Language_1.Language.Portuguese]: "Vende comida vegana geneticamente modificada.",
            [Language_1.Language.Spanish]: "Vende comida vegana genéticamente modificada.",
        },
        Emote: {
            Id: "0",
            String: "⛽",
        },
        ImageUrl: "https://media.discordapp.net/attachments/529795576993415175/923591338824466532/4-Vegano.png",
        Price: 150_000,
        HourlyYield: 150_000 * 0.015,
        BaseDefense: 35,
        PrisonSeverity: 4 * 0.3,
        HenchmanFee: 20,
    },
    [Ids_1.InvestmentId.GolfClub]: {
        Id: Ids_1.InvestmentId.GolfClub,
        Name: {
            [Language_1.Language.English]: "Golf Club",
            [Language_1.Language.Portuguese]: "Clube de Golfe",
            [Language_1.Language.Spanish]: "Clube de Golfe",
        },
        Description: {
            [Language_1.Language.English]: "An exclusive social club for the city's elite.",
            [Language_1.Language.Portuguese]: "Um clube social exclusivo para a elite da cidade.",
            [Language_1.Language.Spanish]: "Un club social exclusivo para la élite de la ciudad.",
        },
        Emote: {
            Id: "0",
            String: "🛒",
        },
        ImageUrl: "https://media.discordapp.net/attachments/529795576993415175/923591339667488768/5-Golfe.png",
        Price: 500_000,
        HourlyYield: 500_000 * 0.016,
        BaseDefense: 40,
        PrisonSeverity: 5 * 0.3,
        HenchmanFee: 22,
    },
    [Ids_1.InvestmentId.VehicleManufacturer]: {
        Id: Ids_1.InvestmentId.VehicleManufacturer,
        Name: {
            [Language_1.Language.English]: "Vehicle Manufacturer",
            [Language_1.Language.Portuguese]: "Montadora de Veículos",
            [Language_1.Language.Spanish]: "Montadora de Vehículos",
        },
        Description: {
            [Language_1.Language.English]: "Sells luxury cars. Great for trafficking packs of cigarettes.",
            [Language_1.Language.Portuguese]: "Vende carros de luxo. Ótimos para traficar maços de cigarro.",
            [Language_1.Language.Spanish]: "Vende coches de lujo. Ideales para traficar paquetes de cigarrillos.",
        },
        Emote: {
            Id: "0",
            String: "🚗",
        },
        ImageUrl: "https://media.discordapp.net/attachments/529795576993415175/923591340078555226/6-Montadora.png",
        Price: 1_500_000,
        HourlyYield: 1_500_000 * 0.017,
        BaseDefense: 45,
        PrisonSeverity: 6 * 0.3,
        HenchmanFee: 24,
    },
    [Ids_1.InvestmentId.UnderdevelopedCountry]: {
        Id: Ids_1.InvestmentId.UnderdevelopedCountry,
        Name: {
            [Language_1.Language.English]: "Underdeveloped Country",
            [Language_1.Language.Portuguese]: "País Subdesenvolvido",
            [Language_1.Language.Spanish]: "País Subdesarrollado",
        },
        Description: {
            [Language_1.Language.English]: "A nation with untapped potential and resources.",
            [Language_1.Language.Portuguese]: "Uma nação com potencial e recursos inexplorados.",
            [Language_1.Language.Spanish]: "Una nación con potencial y recursos sin explotar.",
        },
        Emote: {
            Id: "0",
            String: "🕺",
        },
        ImageUrl: "https://media.discordapp.net/attachments/529795576993415175/923591340711903282/7-Pais.png",
        Price: 5_000_000,
        HourlyYield: 5_000_000 * 0.018,
        BaseDefense: 50,
        PrisonSeverity: 7 * 0.3,
        HenchmanFee: 26,
    },
    [Ids_1.InvestmentId.ReligiousCult]: {
        Id: Ids_1.InvestmentId.ReligiousCult,
        Name: {
            [Language_1.Language.English]: "Religious Cult",
            [Language_1.Language.Portuguese]: "Seita Religiosa",
            [Language_1.Language.Spanish]: "Seita Religiosa",
        },
        Description: {
            [Language_1.Language.English]: "A gathering of followers seeking enlightenment and profit.",
            [Language_1.Language.Portuguese]: "Uma reunião de seguidores em busca de iluminação e lucro.",
            [Language_1.Language.Spanish]: "Una reunión de seguidores que buscan iluminación y ganancias.",
        },
        Emote: {
            Id: "0",
            String: "🏨",
        },
        ImageUrl: "https://media.discordapp.net/attachments/529795576993415175/923591341282316368/8-Seita.png",
        Price: 15_000_000,
        HourlyYield: 15_000_000 * 0.019,
        BaseDefense: 55,
        PrisonSeverity: 8 * 0.3,
        HenchmanFee: 28,
    },
    [Ids_1.InvestmentId.StarGalaxy]: {
        Id: Ids_1.InvestmentId.StarGalaxy,
        Name: {
            [Language_1.Language.English]: "Star Galaxy",
            [Language_1.Language.Portuguese]: "Galáxia Estelar",
            [Language_1.Language.Spanish]: "Galaxia Estelar",
        },
        Description: {
            [Language_1.Language.English]: "Complete control over a celestial body of stars.",
            [Language_1.Language.Portuguese]: "Controle total sobre um corpo celeste de estrelas.",
            [Language_1.Language.Spanish]: "Control total sobre un cuerpo celeste de estrellas.",
        },
        Emote: {
            Id: "0",
            String: "🏦",
        },
        ImageUrl: "https://media.discordapp.net/attachments/529795576993415175/923591341684953188/9-Galaxia.png",
        Price: 50_000_000,
        HourlyYield: 50_000_000 * 0.02,
        BaseDefense: 60,
        PrisonSeverity: 10 * 0.3,
        HenchmanFee: 30,
    },
};
function getInvestmentList() {
    return Object.values(exports.InvestmentList);
}
//# sourceMappingURL=Investments.js.map