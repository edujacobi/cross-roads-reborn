"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationList = exports.LocationId = void 0;
exports.getLocationList = getLocationList;
const Language_1 = require("#core/models/Language");
const Ids_1 = require("#core/types/Ids");
var Ids_2 = require("#core/types/Ids");
Object.defineProperty(exports, "LocationId", { enumerable: true, get: function () { return Ids_2.LocationId; } });
exports.LocationList = {
    [Ids_1.LocationId.OldLady]: {
        Id: Ids_1.LocationId.OldLady,
        Name: {
            [Language_1.Language.English]: "Old lady on the corner",
            [Language_1.Language.Portuguese]: "Velhinha na esquina",
            [Language_1.Language.Spanish]: "Vieja en la esquina",
        },
        Description: {
            [Language_1.Language.English]: `An defenseless old lady unable to scream for help`,
            [Language_1.Language.Portuguese]: "Uma senhora indefesa e incapaz de gritar por ajuda",
            [Language_1.Language.Spanish]: `Una anciana indefensa e incapaz de pedir ayuda`,
        },
        Emote: {
            Id: "1349193564881555499",
            String: "<:OldLady:1349193564881555499>",
        },
        ImageUrl: "https://media.discordapp.net/attachments/1349187098653233184/1349193675137089576/OldLady.png",
        Reward: {
            Min: 100,
            Max: 350,
        },
        SuccessChance: 70,
        NeedAttack: 15,
        Special: false,
        Prison: {
            Text: [{
                    [Language_1.Language.English]: "The police saw you bullying the old lady.",
                    [Language_1.Language.Portuguese]: "A polícia viu você intimidando a velhinha.",
                    [Language_1.Language.Spanish]: "La policía te vio intimidando a la anciana.",
                }, {
                    [Language_1.Language.English]: "A passerby called the cops on you.",
                    [Language_1.Language.Portuguese]: "Um pedestre chamou a polícia para você.",
                    [Language_1.Language.Spanish]: "Un transeúnte llamó a la policía por ti.",
                }, {
                    [Language_1.Language.English]: "The old lady hit you with her purse until the police arrived.",
                    [Language_1.Language.Portuguese]: "A velhinha te bateu com a bolsa até a polícia chegar.",
                    [Language_1.Language.Spanish]: "La anciana te golpeó con su bolso hasta que llegó la policía.",
                }],
        },
    },
    [Ids_1.LocationId.GroceryStore]: {
        Id: Ids_1.LocationId.GroceryStore,
        Name: {
            [Language_1.Language.English]: "Joe's Grocery Store",
            [Language_1.Language.Portuguese]: "Mercearia do Zé",
            [Language_1.Language.Spanish]: "Tienda de Pepe",
        },
        Description: {
            [Language_1.Language.English]: `Joe is already used to the violence of the streets`,
            [Language_1.Language.Portuguese]: "Seu Zé já está acostumado com a violência das ruas",
            [Language_1.Language.Spanish]: `Joe ya está acostumbrado a la violencia de las calles`,
        },
        Emote: {
            Id: "1349193566517198890",
            String: "<:GroceryStore:1349193566517198890>",
        },
        ImageUrl: "https://media.discordapp.net/attachments/1349187098653233184/1349193675376300072/GroceryStore.png",
        Reward: {
            Min: 650,
            Max: 2_000,
        },
        SuccessChance: 64,
        NeedAttack: 20,
        Special: false,
        Prison: {
            Text: [{
                    [Language_1.Language.English]: "Joe triggered the silent alarm.",
                    [Language_1.Language.Portuguese]: "O Zé acionou o alarme silencioso.",
                    [Language_1.Language.Spanish]: "Pepe activó la alarma silenciosa.",
                }, {
                    [Language_1.Language.English]: "A patrol car was passing by just as you entered.",
                    [Language_1.Language.Portuguese]: "Uma viatura estava passando bem na hora que você entrou.",
                    [Language_1.Language.Spanish]: "Una patrulla pasaba justo cuando entraste.",
                }, {
                    [Language_1.Language.English]: "You got stuck in the automatic door while trying to escape.",
                    [Language_1.Language.Portuguese]: "Você ficou preso na porta automática enquanto tentava fugir.",
                    [Language_1.Language.Spanish]: "Te quedaste atascado en la puerta automática mientras ententava escapar.",
                }],
        },
    },
    [Ids_1.LocationId.GasStation]: {
        Id: Ids_1.LocationId.GasStation,
        Name: {
            [Language_1.Language.English]: "Gas station",
            [Language_1.Language.Portuguese]: "Posto de gasolina",
            [Language_1.Language.Spanish]: "Gasolinera",
        },
        Description: {
            [Language_1.Language.English]: `So much corruption that even being robbed every week, it still makes a profit`,
            [Language_1.Language.Portuguese]: "É tanta corrupção que mesmo sendo roubado toda semana, ainda dá lucro",
            [Language_1.Language.Spanish]: `Tanta corrupción que, aunque la roben todas las semanas, sigue dando ganancias`,
        },
        Emote: {
            Id: "1349193568149049384",
            String: "<:GasStation:1349193568149049384>",
        },
        ImageUrl: "https://media.discordapp.net/attachments/1349187098653233184/1349193675594531017/GasStation.png",
        Reward: {
            Min: 3_125,
            Max: 7_500,
        },
        SuccessChance: 58,
        NeedAttack: 25,
        Special: false,
        Prison: {
            Text: [{
                    [Language_1.Language.English]: "The attendant locked the doors and called the police.",
                    [Language_1.Language.Portuguese]: "O frentista trancou as portas e chamou a polícia.",
                    [Language_1.Language.Spanish]: "El empleado cerró las puertas y llamó a la policía.",
                }, {
                    [Language_1.Language.English]: "Police were refueling their car and saw you.",
                    [Language_1.Language.Portuguese]: "A polícia estava abastecendo a viatura e te viu.",
                    [Language_1.Language.Spanish]: "La policía estaba llenando el tanque y te vio.",
                }, {
                    [Language_1.Language.English]: "You slipped on an oil spill and the police caught you.",
                    [Language_1.Language.Portuguese]: "Você escorregou em uma poça de óleo e a polícia te pegou.",
                    [Language_1.Language.Spanish]: "Resbalaste en un charco de aceite y la policía te atrapó.",
                }],
        },
    },
    [Ids_1.LocationId.JewelryStore]: {
        Id: Ids_1.LocationId.JewelryStore,
        Name: {
            [Language_1.Language.English]: "Jewelry store",
            [Language_1.Language.Portuguese]: "Joalheria",
            [Language_1.Language.Spanish]: "Joyería",
        },
        Description: {
            [Language_1.Language.English]: `The finest jewelry and watches, made with all possible care`,
            [Language_1.Language.Portuguese]: "As mais finas joias e relógios, feitas com todo o esmero possível",
            [Language_1.Language.Spanish]: `Las joyas y relojes más finos, hechos con todo el cuidado posible`,
        },
        Emote: {
            Id: "1349193569658863666",
            String: "<:Jewelry:1349193569658863666>",
        },
        ImageUrl: "https://media.discordapp.net/attachments/1349187098653233184/1349193675854315641/Jewelry.png",
        Reward: {
            Min: 9_200,
            Max: 15_000,
        },
        SuccessChance: 52,
        NeedAttack: 35,
        Special: false,
        Prison: {
            Text: [{
                    [Language_1.Language.English]: "You tripped the laser alarm system.",
                    [Language_1.Language.Portuguese]: "Você acionou o sistema de alarme a laser.",
                    [Language_1.Language.Spanish]: "Activaste el sistema de alarma láser.",
                }, {
                    [Language_1.Language.English]: "The security guard held you at gunpoint until police arrived.",
                    [Language_1.Language.Portuguese]: "O segurança te manteve sob a mira de uma arma até a polícia chegar.",
                    [Language_1.Language.Spanish]: "El guardia de seguridad te apuntó con un arma hasta que llegó la policía.",
                }, {
                    [Language_1.Language.English]: "An off-duty cop was buying a engagement ring and arrested you.",
                    [Language_1.Language.Portuguese]: "Um policial de folga estava comprando um anel de noivado e te prendeu.",
                    [Language_1.Language.Spanish]: "Un policía fuera de servicio estaba comprando un anillo de compromiso y te arrestó.",
                }],
        },
    },
    [Ids_1.LocationId.SmallBank]: {
        Id: Ids_1.LocationId.SmallBank,
        Name: {
            [Language_1.Language.English]: "Small bank",
            [Language_1.Language.Portuguese]: "Banco pequeno",
            [Language_1.Language.Spanish]: "Banco pequeño",
        },
        Description: {
            [Language_1.Language.English]: `A small bank with exorbitant interest rates on the outskirts of the city`,
            [Language_1.Language.Portuguese]: "Um pequeno banco com juros exorbitantes nos arredores da cidade",
            [Language_1.Language.Spanish]: `Un pequeño banco con tasas de interés exorbitantes en las afueras de la ciudad`,
        },
        Emote: {
            Id: "1349193571390984202",
            String: "<:SmallBank:1349193571390984202>",
        },
        ImageUrl: "https://media.discordapp.net/attachments/1349187098653233184/1349193676106104862/SmallBank.png",
        Reward: {
            Min: 18_750,
            Max: 40_000,
        },
        SuccessChance: 46,
        NeedAttack: 45,
        Special: false,
        Prison: {
            Text: [{
                    [Language_1.Language.English]: "The teller pressed the panic button under the desk.",
                    [Language_1.Language.Portuguese]: "O caixa apertou o botão de pânico embaixo da mesa.",
                    [Language_1.Language.Spanish]: "El cajero presionó el botón de pánico debajo del escritorio.",
                }, {
                    [Language_1.Language.English]: "You took too long to open the safe and police surrounded the building.",
                    [Language_1.Language.Portuguese]: "Você demorou muito para abrir o cofre e a polícia cercou o prédio.",
                    [Language_1.Language.Spanish]: "Tardaste mucho en abrir la caja fuerte y la policía rodeó el edificio.",
                }, {
                    [Language_1.Language.English]: "You got locked in the vault.",
                    [Language_1.Language.Portuguese]: "Você ficou trancado no cofre.",
                    [Language_1.Language.Spanish]: "Te quedaste encerrado en la bóveda.",
                }],
        },
    },
    [Ids_1.LocationId.ItalianMafia]: {
        Id: Ids_1.LocationId.ItalianMafia,
        Name: {
            [Language_1.Language.English]: "Italian Mafia",
            [Language_1.Language.Portuguese]: "Máfia Italiana",
            [Language_1.Language.Spanish]: "Mafia italiana",
        },
        Description: {
            [Language_1.Language.English]: `The gangs may rule the streets, but the Mafia is rooted in the city`,
            [Language_1.Language.Portuguese]: "As gangues podem dominar as ruas, mas a Mafia está enraizada na cidade",
            [Language_1.Language.Spanish]: `Las cuadrillas pueden gobernar las calles, pero la Mafia está arraigada en la ciudad`,
        },
        Emote: {
            Id: "1349193561068929144",
            String: "<:ItalianMafia:1349193561068929144>",
        },
        ImageUrl: "https://media.discordapp.net/attachments/1349187098653233184/1349193674570993775/ItalianMafia.png",
        Reward: {
            Min: 50_000,
            Max: 150_000,
        },
        SuccessChance: 40,
        NeedAttack: 60,
        Special: false,
        Prison: {
            Text: [{
                    [Language_1.Language.English]: "The Mafia abandoned the empty place and set a trap for you.",
                    [Language_1.Language.Portuguese]: "A Mafia abandonou o local vazio e armou uma armadilha pra você.",
                    [Language_1.Language.Spanish]: "The Mafia abandoned the empty place and set a trap for you.",
                }, {
                    [Language_1.Language.English]: "The police raided the place and caught you in the crossfire.",
                    [Language_1.Language.Portuguese]: "A polícia invadiu o local e te pegou no fogo cruzado.",
                    [Language_1.Language.Spanish]: "La policía allanó el lugar y te atrapó en el fuego cruzado.",
                }, {
                    [Language_1.Language.English]: "You were framed by the mobsters and left for the cops.",
                    [Language_1.Language.Portuguese]: "Você foi incriminado pelos mafiosos e deixado para os policiais.",
                    [Language_1.Language.Spanish]: "Fuiste incriminado por los mafiosos y dejado para la policía.",
                }],
        },
    },
    [Ids_1.LocationId.ArmyDepot]: {
        Id: Ids_1.LocationId.ArmyDepot,
        Name: {
            [Language_1.Language.English]: "Army Depot",
            [Language_1.Language.Portuguese]: "Depósito do Exército",
            [Language_1.Language.Spanish]: "Depósito del ejército",
        },
        Description: {
            [Language_1.Language.English]: `Its location is very well protected, as are the items stored there`,
            [Language_1.Language.Portuguese]: "Sua localização é muito bem protegida, bem como os itens guardados lá",
            [Language_1.Language.Spanish]: `Su ubicación está muy bien protegida, al igual que los artículos allí guardados`,
        },
        Emote: {
            Id: "1349193559315845190",
            String: "<:ArmyDepot:1349193559315845190>",
        },
        ImageUrl: "https://media.discordapp.net/attachments/1349187098653233184/1349193674344632400/ArmyDepot.png",
        Reward: {
            Min: 350_000,
            Max: 850_000,
        },
        SuccessChance: 34,
        NeedAttack: 80,
        Special: false,
        Prison: {
            Text: [{
                    [Language_1.Language.English]: "The Military surrounded you immediately.",
                    [Language_1.Language.Portuguese]: "Os militares te cercaram imediatamente.",
                    [Language_1.Language.Spanish]: "Los militares te cercaron inmediatamente.",
                }, {
                    [Language_1.Language.English]: "You were caught by a thermal camera.",
                    [Language_1.Language.Portuguese]: "Você foi pego por uma câmera térmica.",
                    [Language_1.Language.Spanish]: "Fuiste capturado por una cámara térmica.",
                }, {
                    [Language_1.Language.English]: "A patrol dog sniffed you out.",
                    [Language_1.Language.Portuguese]: "Um cão de patrulha te farejou.",
                    [Language_1.Language.Spanish]: "Un perro patrulla te olfateó.",
                }],
        },
    },
    [Ids_1.LocationId.JacobiPalace]: {
        Id: Ids_1.LocationId.JacobiPalace,
        Name: {
            [Language_1.Language.English]: "Jacobi Palace",
            [Language_1.Language.Portuguese]: "Palácio do Jacobi",
            [Language_1.Language.Spanish]: "Palacio de Jacobi",
        },
        Description: {
            [Language_1.Language.English]: `The most protected place in the city could not be other than the Mayor's house`,
            [Language_1.Language.Portuguese]: "O lugar mais protegido da cidade não poderia ser outro a não ser a casa do senhor Prefeito",
            [Language_1.Language.Spanish]: `El lugar más protegido de la ciudad no podría ser otro que la casa del alcalde`,
        },
        Emote: {
            Id: "1349193562738130964",
            String: "<:JacobiPalace:1349193562738130964>",
        },
        ImageUrl: "https://media.discordapp.net/attachments/1349187098653233184/1349193674810195979/JacobiPalace.png",
        Reward: {
            Min: 1_500_000,
            Max: 3_000_000,
        },
        SuccessChance: 27,
        NeedAttack: 90,
        Special: false,
        Prison: {
            Text: [{
                    [Language_1.Language.English]: "The Mayor's personal security team neutralized you.",
                    [Language_1.Language.Portuguese]: "A equipe de segurança pessoal do Prefeito te neutralizou.",
                    [Language_1.Language.Spanish]: "El equipo de seguridad personal del alcalde te neutralizó.",
                }, {
                    [Language_1.Language.English]: "High-tech sensors detected your heartbeat.",
                    [Language_1.Language.Portuguese]: "Sensores de alta tecnologia detectaram seus batimentos cardíacos.",
                    [Language_1.Language.Spanish]: "Sensores de alta tecnología detectaron tus latidos.",
                }, {
                    [Language_1.Language.English]: "You were spotted by a sniper on the roof.",
                    [Language_1.Language.Portuguese]: "Você foi avistado por um atirador no telhado.",
                    [Language_1.Language.Spanish]: "Fuiste visto por un francotirador en el techo.",
                }],
        },
    },
};
function getLocationList() {
    return Object.values(exports.LocationList);
}
//# sourceMappingURL=Locations.js.map