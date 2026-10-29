"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScavengeList = exports.ScavengeFailureReason = exports.ScavengeResultType = exports.ScavengeRewardType = exports.ScavengeId = void 0;
const Language_1 = require("#core/models/Language");
const Items_1 = require("./Items");
const emotes_1 = require("#bot/utils/emotes");
const Ids_1 = require("./Ids");
var Ids_2 = require("./Ids");
Object.defineProperty(exports, "ScavengeId", { enumerable: true, get: function () { return Ids_2.ScavengeId; } });
var ScavengeRewardType;
(function (ScavengeRewardType) {
    ScavengeRewardType[ScavengeRewardType["Money"] = 0] = "Money";
    ScavengeRewardType[ScavengeRewardType["ItemConsumable"] = 1] = "ItemConsumable";
    ScavengeRewardType[ScavengeRewardType["ItemDuration"] = 2] = "ItemDuration";
})(ScavengeRewardType || (exports.ScavengeRewardType = ScavengeRewardType = {}));
var ScavengeResultType;
(function (ScavengeResultType) {
    ScavengeResultType[ScavengeResultType["Success"] = 0] = "Success";
    ScavengeResultType[ScavengeResultType["Failure"] = 1] = "Failure";
})(ScavengeResultType || (exports.ScavengeResultType = ScavengeResultType = {}));
var ScavengeFailureReason;
(function (ScavengeFailureReason) {
    ScavengeFailureReason[ScavengeFailureReason["UserScavengeTime"] = 0] = "UserScavengeTime";
    ScavengeFailureReason[ScavengeFailureReason["UserScavenging"] = 1] = "UserScavenging";
    ScavengeFailureReason[ScavengeFailureReason["UserWorking"] = 2] = "UserWorking";
    ScavengeFailureReason[ScavengeFailureReason["UserPrison"] = 3] = "UserPrison";
    ScavengeFailureReason[ScavengeFailureReason["UserHospital"] = 4] = "UserHospital";
    ScavengeFailureReason[ScavengeFailureReason["UserCasino"] = 5] = "UserCasino";
    ScavengeFailureReason[ScavengeFailureReason["AttackerIsBeatingId"] = 6] = "AttackerIsBeatingId";
    ScavengeFailureReason[ScavengeFailureReason["AttackerIsBeingBeatedById"] = 7] = "AttackerIsBeingBeatedById";
    ScavengeFailureReason[ScavengeFailureReason["AttackerIsRobbingId"] = 8] = "AttackerIsRobbingId";
    ScavengeFailureReason[ScavengeFailureReason["AttackerIsBeingRobbedById"] = 9] = "AttackerIsBeingRobbedById";
    ScavengeFailureReason[ScavengeFailureReason["AttackerIsRobbingLocationId"] = 10] = "AttackerIsRobbingLocationId";
    ScavengeFailureReason[ScavengeFailureReason["UserDefendingInvestment"] = 11] = "UserDefendingInvestment";
    ScavengeFailureReason[ScavengeFailureReason["UserParticipatingInGangAction"] = 12] = "UserParticipatingInGangAction";
})(ScavengeFailureReason || (exports.ScavengeFailureReason = ScavengeFailureReason = {}));
exports.ScavengeList = {
    [Ids_1.ScavengeId.Dump]: {
        Id: Ids_1.ScavengeId.Dump,
        Description: {
            [Language_1.Language.English]: "Dump",
            [Language_1.Language.Portuguese]: "Lixão",
            [Language_1.Language.Spanish]: "Vertedero",
        },
        Subtitle: {
            [Language_1.Language.English]: "Everyone starts from the bottom",
            [Language_1.Language.Portuguese]: "Todo mundo começa de baixo",
            [Language_1.Language.Spanish]: "Todos empiezan desde abajo",
        },
        Emote: {
            Id: emotes_1.EmoteId.Dump,
            String: emotes_1.EmoteString.Dump,
        },
        Reward: {
            Items: [{
                    Id: Ids_1.ItemId.Knife,
                    Duration: {
                        Min: 1,
                        Max: 2,
                    },
                }, {
                    Id: Ids_1.ItemId.Sunglasses,
                    Duration: {
                        Min: 1,
                        Max: 2,
                    },
                }],
            Money: {
                Min: 100,
                Max: 350,
            },
        },
        SuccessChance: 60,
        NeedAttack: 0,
        Special: false,
        Prison: {
            Chance: 0,
            Text: {
                [Language_1.Language.English]: "The police saw you entering private property.",
                [Language_1.Language.Portuguese]: "A polícia te viu entrando em propriedade privada.",
                [Language_1.Language.Spanish]: "La policía te vio entrando a una propiedad privada.",
            },
        },
        Hospital: {
            Chance: 3,
            Text: {
                [Language_1.Language.English]: "A heroin syringe pierced your finger.",
                [Language_1.Language.Portuguese]: "Uma seringa de heroína perfurou o seu dedo.",
                [Language_1.Language.Spanish]: "Una jeringa de heroína perforó tu dedo.",
            },
        },
    },
    // Need Knife (ATK 15)
    [Ids_1.ScavengeId.Forest]: {
        Id: Ids_1.ScavengeId.Forest,
        Description: {
            [Language_1.Language.English]: "Forest",
            [Language_1.Language.Portuguese]: "Floresta",
            [Language_1.Language.Spanish]: "Bosque",
        },
        Subtitle: {
            [Language_1.Language.English]: "Some battle roosters venture around here",
            [Language_1.Language.Portuguese]: "Alguns galos de batalha se aventuram por aqui",
            [Language_1.Language.Spanish]: "Algunos gallos de batalla se aventuran por aquí",
        },
        Emote: {
            Id: emotes_1.EmoteId.Forest,
            String: emotes_1.EmoteString.Forest,
        },
        Reward: {
            Items: [{
                    Id: Ids_1.ItemId.Knife,
                    Duration: {
                        Min: 4,
                        Max: 8,
                    },
                }, {
                    Id: Ids_1.ItemId.Pistol,
                    Duration: {
                        Min: 0.5,
                        Max: 1,
                    },
                }, {
                    Id: Ids_1.ItemId.Sunglasses,
                    Duration: {
                        Min: 3,
                        Max: 6,
                    },
                }, {
                    Id: Ids_1.ItemId.BrassKnuckles,
                    Duration: {
                        Min: 2,
                        Max: 4,
                    },
                }],
            Money: {
                Min: 400,
                Max: 700,
            },
        },
        SuccessChance: 55,
        NeedAttack: 15,
        Special: false,
        Prison: {
            Chance: 5,
            Text: {
                [Language_1.Language.English]: "You saw some cops taking bribes and they heard you.",
                [Language_1.Language.Portuguese]: "Você viu alguns policiais recebendo propina e eles te escutaram.",
                [Language_1.Language.Spanish]: "Viste a algunos policías recibiendo sobornos y te escucharon.",
            },
        },
        Hospital: {
            Chance: 4,
            Text: {
                [Language_1.Language.English]: "A snake bit your leg.",
                [Language_1.Language.Portuguese]: "Uma cobra picou sua perna.",
                [Language_1.Language.Spanish]: "Una serpiente te mordió la pierna.",
            },
        },
    },
    // Need Tec9 (ATK 25)
    [Ids_1.ScavengeId.Sewer]: {
        Id: Ids_1.ScavengeId.Sewer,
        Description: {
            [Language_1.Language.English]: "Sewer",
            [Language_1.Language.Portuguese]: "Esgoto",
            [Language_1.Language.Spanish]: "Alcantarilla",
        },
        Subtitle: {
            [Language_1.Language.English]: "They say there are alligators around here",
            [Language_1.Language.Portuguese]: "Dizem que há jacarés por aqui",
            [Language_1.Language.Spanish]: "Dicen que hay caimanes por aquí",
        },
        Emote: {
            Id: emotes_1.EmoteId.Sewer,
            String: emotes_1.EmoteString.Sewer,
        },
        Reward: {
            Items: [{
                    Id: Ids_1.ItemId.Knife,
                    Duration: {
                        Min: 4,
                        Max: 8,
                    },
                }, {
                    Id: Ids_1.ItemId.Pistol,
                    Duration: {
                        Min: 3,
                        Max: 6,
                    },
                }, {
                    Id: Ids_1.ItemId.MachinePistol,
                    Duration: {
                        Min: 1,
                        Max: 2,
                    },
                }, {
                    Id: Ids_1.ItemId.CompactSMG,
                    Duration: {
                        Min: 1,
                        Max: 2,
                    },
                }, {
                    Id: Ids_1.ItemId.Sawnoff,
                    Duration: {
                        Min: 0.5,
                        Max: 1,
                    },
                }, {
                    Id: Ids_1.ItemId.Sunglasses,
                    Duration: {
                        Min: 8,
                        Max: 12,
                    },
                }, {
                    Id: Ids_1.ItemId.BrassKnuckles,
                    Duration: {
                        Min: 6,
                        Max: 10,
                    },
                }, {
                    Id: Ids_1.ItemId.BaseballBat,
                    Duration: {
                        Min: 3,
                        Max: 6,
                    },
                }],
            Money: {
                Min: 1_000,
                Max: 2_000,
            },
        },
        SuccessChance: 50,
        NeedAttack: 25,
        Special: false,
        Prison: {
            Chance: 7,
            Text: {
                [Language_1.Language.English]: "You found an electronic ankle bracelet, which made the police find you.",
                [Language_1.Language.Portuguese]: "Você encontrou uma tornozeleira eletrônica, que fez a polícia te encontrar.",
                [Language_1.Language.Spanish]: "Encontraste un brazalete electrónico, lo que hizo que la policía te encontrara.",
            },
        },
        Hospital: {
            Chance: 5,
            Text: {
                [Language_1.Language.English]: "Diving into human waste didn't do you any good.",
                [Language_1.Language.Portuguese]: "Mergulhar em dejetos humanos não te fizeram bem.",
                [Language_1.Language.Spanish]: "Meterse en desechos humanos no te hizo bien.",
            },
        },
    },
    // Need Shotgun (ATK 35)
    [Ids_1.ScavengeId.WeaponFactory]: {
        Id: Ids_1.ScavengeId.WeaponFactory,
        Description: {
            [Language_1.Language.English]: "Weapon Factory",
            [Language_1.Language.Portuguese]: "Fábrica de armas",
            [Language_1.Language.Spanish]: "Fábrica de armas",
        },
        Subtitle: {
            [Language_1.Language.English]: "Careful. There are weapons there!",
            [Language_1.Language.Portuguese]: "Cuidado. Tem armas lá!",
            [Language_1.Language.Spanish]: "¡Cuidado! ¡Hay armas allí!",
        },
        Emote: {
            Id: emotes_1.EmoteId.WeaponFactory,
            String: emotes_1.EmoteString.WeaponFactory,
        },
        Reward: {
            Items: [{
                    Id: Ids_1.ItemId.MachinePistol,
                    Duration: {
                        Min: 6,
                        Max: 12,
                    },
                }, {
                    Id: Ids_1.ItemId.HuntRifle,
                    Duration: {
                        Min: 3,
                        Max: 6,
                    },
                }, {
                    Id: Ids_1.ItemId.Shotgun,
                    Duration: {
                        Min: 1,
                        Max: 2,
                    },
                }, {
                    Id: Ids_1.ItemId.Sawnoff,
                    Duration: {
                        Min: 1,
                        Max: 2,
                    },
                }, {
                    Id: Ids_1.ItemId.LightVest,
                    Duration: {
                        Min: 2,
                        Max: 3,
                    },
                }, {
                    Id: Ids_1.ItemId.BaseballBat,
                    Duration: {
                        Min: 8,
                        Max: 12,
                    },
                }],
            Money: {
                Min: 5_000,
                Max: 8_500,
            },
        },
        SuccessChance: 45,
        NeedAttack: 35,
        Special: false,
        Prison: {
            Chance: 9,
            Text: {
                [Language_1.Language.English]: "Some corrupt cops were protecting the Factory.",
                [Language_1.Language.Portuguese]: "Alguns policiais corruptos estavam protegendo a Fábrica.",
                [Language_1.Language.Spanish]: "Algunos policías corruptos estaban protegiendo la Fábrica.",
            },
        },
        Hospital: {
            Chance: 6,
            Text: {
                [Language_1.Language.English]: `You almost got a ${emotes_1.EmoteString.Rifle} ${Items_1.ItemList[Ids_1.ItemId.HuntRifle].Description[Language_1.Language.English]}, but it accidentally fired and hit your toe.`,
                [Language_1.Language.Portuguese]: `Você quase pegou uma ${emotes_1.EmoteString.Rifle} ${Items_1.ItemList[Ids_1.ItemId.HuntRifle].Description[Language_1.Language.Portuguese]}, mas ela disparou por engano e acertou seu dedão do pé.`,
                [Language_1.Language.Spanish]: `Casi agarras un ${emotes_1.EmoteString.Rifle} ${Items_1.ItemList[Ids_1.ItemId.HuntRifle].Description[Language_1.Language.Spanish]}, pero disparó accidentalmente y te golpeó el dedo gordo del pie.`,
            },
        },
    },
    // Need AK47 (ATK 45)
    [Ids_1.ScavengeId.DrugLab]: {
        Id: Ids_1.ScavengeId.DrugLab,
        Description: {
            [Language_1.Language.English]: "Drug Laboratory",
            [Language_1.Language.Portuguese]: "Laboratório de drogas",
            [Language_1.Language.Spanish]: "Laboratorio de drogas",
        },
        Subtitle: {
            [Language_1.Language.English]: "One hand in physics and the other in chemistry",
            [Language_1.Language.Portuguese]: "Uma mão na física e outra na química",
            [Language_1.Language.Spanish]: "Una mano en física y la otra en química",
        },
        Emote: {
            Id: emotes_1.EmoteId.DrugLab,
            String: emotes_1.EmoteString.DrugLab,
        },
        Reward: {
            Items: [{
                    Id: Ids_1.ItemId.AssaultRifle,
                    Duration: {
                        Min: 3,
                        Max: 6,
                    },
                }, {
                    Id: Ids_1.ItemId.Carbine,
                    Duration: {
                        Min: 1,
                        Max: 2,
                    },
                }, {
                    Id: Ids_1.ItemId.LightVest,
                    Duration: {
                        Min: 3,
                        Max: 4,
                    },
                }],
            Money: {
                Min: 10_000,
                Max: 20_000,
            },
        },
        SuccessChance: 40,
        NeedAttack: 45,
        Special: false,
        Prison: {
            Chance: 11,
            Text: {
                [Language_1.Language.English]: "You triggered an alarm while leaving, making the police arrive quickly.",
                [Language_1.Language.Portuguese]: "Você acionou um alarme enquanto saía, fazendo a polícia chegar rapidamente.",
                [Language_1.Language.Spanish]: "Activaste una alarma al salir, haciendo que la policía llegara rápidamente.",
            },
        },
        Hospital: {
            Chance: 7,
            Text: {
                [Language_1.Language.English]: "While you were sneaking, you accidentally knocked over a flask with a strange liquid that burned your skin.",
                [Language_1.Language.Portuguese]: "Enquanto você se esgueirava, acabou derrubando um frasco com um líquido estranho que queimou sua pele.",
                [Language_1.Language.Spanish]: "Mientras te escondías, accidentalmente derribaste un frasco con un líquido extraño que te quemó la piel.",
            },
        },
    },
    // Need Katana (ATK 60)
    [Ids_1.ScavengeId.NuclearPlant]: {
        Id: Ids_1.ScavengeId.NuclearPlant,
        Description: {
            [Language_1.Language.English]: "Nuclear Plant",
            [Language_1.Language.Portuguese]: "Usina nuclear",
            [Language_1.Language.Spanish]: "Planta nuclear",
        },
        Subtitle: {
            [Language_1.Language.English]: "How about a little radiation?",
            [Language_1.Language.Portuguese]: "Que tal uma radiaçãozinha?",
            [Language_1.Language.Spanish]: "¿Qué tal una pequeña radiación?",
        },
        Emote: {
            Id: emotes_1.EmoteId.NuclearPlant,
            String: emotes_1.EmoteString.NuclearPlant,
        },
        Reward: {
            Items: [{
                    Id: Ids_1.ItemId.Katana,
                    Duration: {
                        Min: 3,
                        Max: 6,
                    },
                }, {
                    Id: Ids_1.ItemId.HeavyVest,
                    Duration: {
                        Min: 1,
                        Max: 2,
                    },
                }, {
                    Id: Ids_1.ItemId.Goggles,
                    Duration: {
                        Min: 2,
                        Max: 4,
                    },
                }, {
                    Id: Ids_1.ItemId.AdvancedScope,
                    Duration: {
                        Min: 1,
                        Max: 3,
                    },
                }],
            Money: {
                Min: 30_000,
                Max: 75_000,
            },
        },
        SuccessChance: 35,
        NeedAttack: 60,
        Special: false,
        Prison: {
            Chance: 13,
            Text: {
                [Language_1.Language.English]: "Even hiding, the guards have found you.",
                [Language_1.Language.Portuguese]: "Mesmo se escondendo, os guardas te encontraram.",
                [Language_1.Language.Spanish]: "Aunque te escondiste, los guardias te encontraron.",
            },
        },
        Hospital: {
            Chance: 8,
            Text: {
                [Language_1.Language.English]: "You got too close to a nuclear reactor and ended up being contaminated.",
                [Language_1.Language.Portuguese]: "Você se aproximou demais de um reator nuclear e acabou sendo contaminado.",
                [Language_1.Language.Spanish]: "Te acercaste demasiado a un reactor nuclear y terminaste siendo contaminado.",
            },
        },
    },
    // Need RPG (ATK 70)
    [Ids_1.ScavengeId.AlienShip]: {
        Id: Ids_1.ScavengeId.AlienShip,
        Description: {
            [Language_1.Language.English]: "Alien Ship",
            [Language_1.Language.Portuguese]: "Nave extraterrestre",
            [Language_1.Language.Spanish]: "Nave extraterrestre",
        },
        Subtitle: {
            [Language_1.Language.English]: "I want to believe",
            [Language_1.Language.Portuguese]: "Eu quero acreditar",
            [Language_1.Language.Spanish]: "Quiero creer",
        },
        Emote: {
            Id: emotes_1.EmoteId.AlienShip,
            String: emotes_1.EmoteString.AlienShip,
        },
        Reward: {
            Items: [{
                    Id: Ids_1.ItemId.RPG,
                    Duration: {
                        Min: 4,
                        Max: 8,
                    },
                }, {
                    Id: Ids_1.ItemId.HeavyVest,
                    Duration: {
                        Min: 3,
                        Max: 6,
                    },
                }, {
                    Id: Ids_1.ItemId.Goggles,
                    Duration: {
                        Min: 4,
                        Max: 8,
                    },
                }, {
                    Id: Ids_1.ItemId.Jetpack,
                    Duration: {
                        Min: 2,
                        Max: 4,
                    },
                }, {
                    Id: Ids_1.ItemId.AdvancedScope,
                    Duration: {
                        Min: 3,
                        Max: 6,
                    },
                }],
            Money: {
                Min: 100_000,
                Max: 150_000,
            },
        },
        SuccessChance: 30,
        NeedAttack: 70,
        Special: false,
        Prison: {
            Chance: 15,
            Text: {
                [Language_1.Language.English]: "The ship was part of a police operation to catch you.",
                [Language_1.Language.Portuguese]: "A nave fazia parte de uma operação policial para te pegar.",
                [Language_1.Language.Spanish]: "La nave era parte de una operación policial para atraparte.",
            },
        },
        Hospital: {
            Chance: 9,
            Text: {
                [Language_1.Language.English]: "The aliens saw you entering the ship and decided to insert a rectal probe into you.",
                [Language_1.Language.Portuguese]: "Os alienígenas te viram entrando na nave e resolveram inserir uma sonda retal em você.",
                [Language_1.Language.Spanish]: "Los alienígenas te vieron entrar en la nave y decidieron insertarte una sonda.",
            },
        },
    },
    // Need Minigun (ATK 80)
    [Ids_1.ScavengeId.MilitaryBase]: {
        Id: Ids_1.ScavengeId.MilitaryBase,
        Description: {
            [Language_1.Language.English]: "Military Base",
            [Language_1.Language.Portuguese]: "Base Militar",
            [Language_1.Language.Spanish]: "Base Militar",
        },
        Subtitle: {
            [Language_1.Language.English]: "The nation's best kept secrets",
            [Language_1.Language.Portuguese]: "Os segredos mais bem guardados da nação",
            [Language_1.Language.Spanish]: "Los secretos mejor guardados de la nación",
        },
        Emote: {
            Id: emotes_1.EmoteId.MilitaryBase,
            String: emotes_1.EmoteString.MilitaryBase,
        },
        Reward: {
            Items: [{
                    Id: Ids_1.ItemId.Minigun,
                    Duration: {
                        Min: 2,
                        Max: 4,
                    },
                }, {
                    Id: Ids_1.ItemId.Exoskeleton,
                    Duration: {
                        Min: 4,
                        Max: 6,
                    },
                }, {
                    Id: Ids_1.ItemId.Grenade,
                    Duration: {
                        Min: 2,
                        Max: 6,
                    },
                }, {
                    Id: Ids_1.ItemId.Bazooka,
                    Duration: {
                        Min: 1,
                        Max: 2,
                    },
                }, {
                    Id: Ids_1.ItemId.AdvancedScope,
                    Duration: {
                        Min: 3,
                        Max: 6,
                    },
                }],
            Money: {
                Min: 200_000,
                Max: 500_000,
            },
        },
        SuccessChance: 25,
        NeedAttack: 80,
        Special: false,
        Prison: {
            Chance: 17,
            Text: {
                [Language_1.Language.English]: "The army was ready and locked you in a cell.",
                [Language_1.Language.Portuguese]: "O exército estava preparado e te trancou em uma cela.",
                [Language_1.Language.Spanish]: "El ejército estaba listo y te encerró en una celda.",
            },
        },
        Hospital: {
            Chance: 10,
            Text: {
                [Language_1.Language.English]: "You stepped on a landmine that exploded and threw you away, breaking a rib.",
                [Language_1.Language.Portuguese]: "Você pisou em uma mina terrestre que explodiu e te jogou longe, quebrando uma costela.",
                [Language_1.Language.Spanish]: "Pisaste una mina terrestre que explotó y te lanzó lejos, rompiendo una costilla.",
            },
        },
    },
};
//# sourceMappingURL=Scavenge.js.map