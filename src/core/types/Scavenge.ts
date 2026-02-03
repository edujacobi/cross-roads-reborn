import { Language } from "@core/models/Language";
import { IDescription, IEmote } from "./Interfaces";
import { ItemList } from "./Items";
import { EmoteId, EmoteString } from "@bot/utils/emotes";
import { ItemId } from "./Ids";

export enum ScavengeId {
	Dump,
	Forest,
	Sewer,
	WeaponFactory,
	DrugLab,
	NuclearPlant,
	AlienShip,
	MilitaryBase,
}

export enum ScavengeRewardType {
	Money,
	ItemConsumable,
	ItemDuration,
}

export enum ScavengeResultType {
	Success,
	Failure,
}

export enum ScavengeFailureReason {
	UserScavengeTime,
	UserScavenging,
	UserWorking,
	UserPrison,
	UserHospital,
	UserCasino,
	AttackerIsBeatingId,
	AttackerIsBeingBeatedById,
	AttackerIsRobbingId,
	AttackerIsBeingRobbedById,
	AttackerIsRobbingLocationId,
}

export interface ItemRewardScavenge {
	readonly Id: ItemId;
	readonly Duration: {
		Min: number,
		Max: number,
	};
}

export interface IScavenge {
	readonly Id: ScavengeId,
	readonly Description: IDescription,
	readonly Subtitle: IDescription,
	readonly Emote: IEmote,
	readonly Reward: {
		readonly Items: ItemRewardScavenge[],
		readonly Money: {
			readonly Min: number,
			readonly Max: number,
		},
	},
	readonly SuccessChance: number,
	readonly NeedAttack: number,
	readonly Special: boolean,
	readonly Prison: {
		readonly Chance: number,
		readonly Text: IDescription,
	},
	readonly Hospital: {
		readonly Chance: number
		readonly Text: IDescription,
	},
}

interface ScavengeListType {
	[key: number]: IScavenge;
}

export const ScavengeList: ScavengeListType = {
	[ScavengeId.Dump]: {
		Id: ScavengeId.Dump,
		Description: {
			[Language.English]: "Dump",
			[Language.Portuguese]: "Lixão",
			[Language.Spanish]: "Vertedero",
		},
		Subtitle: {
			[Language.English]: "Everyone starts from the bottom",
			[Language.Portuguese]: "Todo mundo começa de baixo",
			[Language.Spanish]: "Todos empiezan desde abajo",
		},
		Emote: {
			Id: EmoteId.Dump,
			String: EmoteString.Dump,
		},
		Reward: {
			Items: [{
				Id: ItemId.Knife,
				Duration: {
					Min: 1,
					Max: 2,
				},
			}, {
				Id: ItemId.Sunglasses,
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
				[Language.English]: "The police saw you entering private property.",
				[Language.Portuguese]: "A polícia te viu entrando em propriedade privada.",
				[Language.Spanish]: "La policía te vio entrando a una propiedad privada.",
			},
		},
		Hospital: {
			Chance: 2,
			Text: {
				[Language.English]: "A heroin syringe pierced your finger.",
				[Language.Portuguese]: "Uma seringa de heroína perfurou o seu dedo.",
				[Language.Spanish]: "Una jeringa de heroína perforó tu dedo.",
			},
		},
	},
	// Need Knife (ATK 15)
	[ScavengeId.Forest]: {
		Id: ScavengeId.Forest,
		Description: {
			[Language.English]: "Forest",
			[Language.Portuguese]: "Floresta",
			[Language.Spanish]: "Bosque",
		},
		Subtitle: {
			[Language.English]: "Some battle roosters venture around here",
			[Language.Portuguese]: "Alguns galos de batalha se aventuram por aqui",
			[Language.Spanish]: "Algunos gallos de batalla se aventuran por aquí",
		},
		Emote: {
			Id: EmoteId.Forest,
			String: EmoteString.Forest,
		},
		Reward: {
			Items: [{
				Id: ItemId.Knife,
				Duration: {
					Min: 4,
					Max: 8,
				},
			}, {
				Id: ItemId.Pistol,
				Duration: {
					Min: 0.5,
					Max: 1,
				},
			}, {
				Id: ItemId.Sunglasses,
				Duration: {
					Min: 3,
					Max: 6,
				},
			}, {
				Id: ItemId.BrassKnuckles,
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
			Chance: 3,
			Text: {
				[Language.English]: "You saw some cops taking bribes and they heard you.",
				[Language.Portuguese]: "Você viu alguns policiais recebendo propina e eles te escutaram.",
				[Language.Spanish]: "Viste a algunos policías recibiendo sobornos y te escucharon.",
			},
		},
		Hospital: {
			Chance: 4,
			Text: {
				[Language.English]: "A snake bit your leg.",
				[Language.Portuguese]: "Uma cobra picou sua perna.",
				[Language.Spanish]: "Una serpiente te mordió la pierna.",
			},
		},
	},
	// Need Tec9 (ATK 25)
	[ScavengeId.Sewer]: {
		Id: ScavengeId.Sewer,
		Description: {
			[Language.English]: "Sewer",
			[Language.Portuguese]: "Esgoto",
			[Language.Spanish]: "Alcantarilla",
		},
		Subtitle: {
			[Language.English]: "They say there are alligators around here",
			[Language.Portuguese]: "Dizem que há jacarés por aqui",
			[Language.Spanish]: "Dicen que hay caimanes por aquí",
		},
		Emote: {
			Id: EmoteId.Sewer,
			String: EmoteString.Sewer,
		},
		Reward: {
			Items: [{
				Id: ItemId.Knife,
				Duration: {
					Min: 4,
					Max: 8,
				},
			}, {
				Id: ItemId.Pistol,
				Duration: {
					Min: 3,
					Max: 6,
				},
			}, {
				Id: ItemId.MachinePistol,
				Duration: {
					Min: 1,
					Max: 2,
				},
			}, {
				Id: ItemId.CompactSMG,
				Duration: {
					Min: 1,
					Max: 2,
				},
			}, {
				Id: ItemId.Sawnoff,
				Duration: {
					Min: 0.5,
					Max: 1,
				},
			}, {
				Id: ItemId.Sunglasses,
				Duration: {
					Min: 8,
					Max: 12,
				},
			}, {
				Id: ItemId.BrassKnuckles,
				Duration: {
					Min: 6,
					Max: 10,
				},
			}, {
				Id: ItemId.BaseballBat,
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
			Chance: 6,
			Text: {
				[Language.English]: "You found an electronic ankle bracelet, which made the police find you.",
				[Language.Portuguese]: "Você encontrou uma tornozeleira eletrônica, que fez a polícia te encontrar.",
				[Language.Spanish]: "Encontraste un brazalete electrónico, lo que hizo que la policía te encontrara.",
			},
		},
		Hospital: {
			Chance: 6,
			Text: {
				[Language.English]: "Diving into human waste didn't do you any good.",
				[Language.Portuguese]: "Mergulhar em dejetos humanos não te fizeram bem.",
				[Language.Spanish]: "Meterse en desechos humanos no te hizo bien.",
			},
		},
	},
	// Need Shotgun (ATK 35)
	[ScavengeId.WeaponFactory]: {
		Id: ScavengeId.WeaponFactory,
		Description: {
			[Language.English]: "Weapon Factory",
			[Language.Portuguese]: "Fábrica de armas",
			[Language.Spanish]: "Fábrica de armas",
		},
		Subtitle: {
			[Language.English]: "Careful. There are weapons there!",
			[Language.Portuguese]: "Cuidado. Tem armas lá!",
			[Language.Spanish]: "¡Cuidado! ¡Hay armas allí!",
		},
		Emote: {
			Id: EmoteId.WeaponFactory,
			String: EmoteString.WeaponFactory,
		},
		Reward: {
			Items: [{
				Id: ItemId.MachinePistol,
				Duration: {
					Min: 6,
					Max: 12,
				},
			}, {
				Id: ItemId.HuntRifle,
				Duration: {
					Min: 3,
					Max: 6,
				},
			}, {
				Id: ItemId.Shotgun,
				Duration: {
					Min: 1,
					Max: 2,
				},
			}, {
				Id: ItemId.Sawnoff,
				Duration: {
					Min: 1,
					Max: 2,
				},
			}, {
				Id: ItemId.LightVest,
				Duration: {
					Min: 2,
					Max: 3,
				},
			}, {
				Id: ItemId.BaseballBat,
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
				[Language.English]: "Some corrupt cops were protecting the Factory.",
				[Language.Portuguese]: "Alguns policiais corruptos estavam protegendo a Fábrica.",
				[Language.Spanish]: "Algunos policías corruptos estaban protegiendo la Fábrica.",
			},
		},
		Hospital: {
			Chance: 8,
			Text: {
				[Language.English]: `You almost got a ${EmoteString.Rifle} ${ItemList[ItemId.HuntRifle].Description[Language.English]}, but it accidentally fired and hit your toe.`,
				[Language.Portuguese]: `Você quase pegou uma ${EmoteString.Rifle} ${ItemList[ItemId.HuntRifle].Description[Language.Portuguese]}, mas ela disparou por engano e acertou seu dedão do pé.`,
				[Language.Spanish]: `Casi agarras un ${EmoteString.Rifle} ${ItemList[ItemId.HuntRifle].Description[Language.Spanish]}, pero disparó accidentalmente y te golpeó el dedo gordo del pie.`,
			},
		},
	},
	// Need AK47 (ATK 45)
	[ScavengeId.DrugLab]: {
		Id: ScavengeId.DrugLab,
		Description: {
			[Language.English]: "Drug Laboratory",
			[Language.Portuguese]: "Laboratório de drogas",
			[Language.Spanish]: "Laboratorio de drogas",
		},
		Subtitle: {
			[Language.English]: "One hand in physics and the other in chemistry",
			[Language.Portuguese]: "Uma mão na física e outra na química",
			[Language.Spanish]: "Una mano en física y la otra en química",
		},
		Emote: {
			Id: EmoteId.DrugLab,
			String: EmoteString.DrugLab,
		},
		Reward: {
			Items: [{
				Id: ItemId.AssaultRifle,
				Duration: {
					Min: 3,
					Max: 6,
				},
			}, {
				Id: ItemId.Carbine,
				Duration: {
					Min: 1,
					Max: 2,
				},
			}, {
				Id: ItemId.LightVest,
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
			Chance: 12,
			Text: {
				[Language.English]: "You triggered an alarm while leaving, making the police arrive quickly.",
				[Language.Portuguese]: "Você acionou um alarme enquanto saía, fazendo a polícia chegar rapidamente.",
				[Language.Spanish]: "Activaste una alarma al salir, haciendo que la policía llegara rápidamente.",
			},
		},
		Hospital: {
			Chance: 10,
			Text: {
				[Language.English]: "While you were sneaking, you accidentally knocked over a flask with a strange liquid that burned your skin.",
				[Language.Portuguese]: "Enquanto você se esgueirava, acabou derrubando um frasco com um líquido estranho que queimou sua pele.",
				[Language.Spanish]: "Mientras te escondías, accidentalmente derribaste un frasco con un líquido extraño que te quemó la piel.",
			},
		},
	},
	// Need Katana (ATK 60)
	[ScavengeId.NuclearPlant]: {
		Id: ScavengeId.NuclearPlant,
		Description: {
			[Language.English]: "Nuclear Plant",
			[Language.Portuguese]: "Usina nuclear",
			[Language.Spanish]: "Planta nuclear",
		},
		Subtitle: {
			[Language.English]: "How about a little radiation?",
			[Language.Portuguese]: "Que tal uma radiaçãozinha?",
			[Language.Spanish]: "¿Qué tal una pequeña radiación?",
		},
		Emote: {
			Id: EmoteId.NuclearPlant,
			String: EmoteString.NuclearPlant,
		},
		Reward: {
			Items: [{
				Id: ItemId.Katana,
				Duration: {
					Min: 3,
					Max: 6,
				},
			}, {
				Id: ItemId.HeavyVest,
				Duration: {
					Min: 1,
					Max: 2,
				},
			}, {
				Id: ItemId.Goggles,
				Duration: {
					Min: 2,
					Max: 4,
				},
			}, {
				Id: ItemId.AdvancedScope,
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
			Chance: 15,
			Text: {
				[Language.English]: "Even hiding, the guards have found you.",
				[Language.Portuguese]: "Mesmo se escondendo, os guardas te encontraram.",
				[Language.Spanish]: "Aunque te escondiste, los guardias te encontraron.",
			},
		},
		Hospital: {
			Chance: 12,
			Text: {
				[Language.English]: "You got too close to a nuclear reactor and ended up being contaminated.",
				[Language.Portuguese]: "Você se aproximou demais de um reator nuclear e acabou sendo contaminado.",
				[Language.Spanish]: "Te acercaste demasiado a un reactor nuclear y terminaste siendo contaminado.",
			},
		},
	},
	// Need RPG (ATK 70)
	[ScavengeId.AlienShip]: {
		Id: ScavengeId.AlienShip,
		Description: {
			[Language.English]: "Alien Ship",
			[Language.Portuguese]: "Nave extraterrestre",
			[Language.Spanish]: "Nave extraterrestre",
		},
		Subtitle: {
			[Language.English]: "I want to believe",
			[Language.Portuguese]: "Eu quero acreditar",
			[Language.Spanish]: "Quiero creer",
		},
		Emote: {
			Id: EmoteId.AlienShip,
			String: EmoteString.AlienShip,
		},
		Reward: {
			Items: [{
				Id: ItemId.RPG,
				Duration: {
					Min: 4,
					Max: 8,
				},
			}, {
				Id: ItemId.HeavyVest,
				Duration: {
					Min: 3,
					Max: 6,
				},
			}, {
				Id: ItemId.Goggles,
				Duration: {
					Min: 4,
					Max: 8,
				},
			}, {
				Id: ItemId.Jetpack,
				Duration: {
					Min: 1,
					Max: 3,
				},
			}, {
				Id: ItemId.AdvancedScope,
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
			Chance: 18,
			Text: {
				[Language.English]: "The ship was part of a police operation to catch you.",
				[Language.Portuguese]: "A nave fazia parte de uma operação policial para te pegar.",
				[Language.Spanish]: "La nave era parte de una operación policial para atraparte.",
			},
		},
		Hospital: {
			Chance: 14,
			Text: {
				[Language.English]: "The aliens saw you entering the ship and decided to insert a rectal probe into you.",
				[Language.Portuguese]: "Os alienígenas te viram entrando na nave e resolveram inserir uma sonda retal em você.",
				[Language.Spanish]: "Los alienígenas te vieron entrar en la nave y decidieron insertarte una sonda.",
			},
		},
	},
	// Need Minigun (ATK 80)
	[ScavengeId.MilitaryBase]: {
		Id: ScavengeId.MilitaryBase,
		Description: {
			[Language.English]: "Military Base",
			[Language.Portuguese]: "Base Militar",
			[Language.Spanish]: "Base Militar",
		},
		Subtitle: {
			[Language.English]: "The nation's best kept secrets",
			[Language.Portuguese]: "Os segredos mais bem guardados da nação",
			[Language.Spanish]: "Los secretos mejor guardados de la nación",
		},
		Emote: {
			Id: EmoteId.MilitaryBase,
			String: EmoteString.MilitaryBase,
		},
		Reward: {
			Items: [{
				Id: ItemId.Minigun,
				Duration: {
					Min: 2,
					Max: 4,
				},
			}, {
				Id: ItemId.Exoskeleton,
				Duration: {
					Min: 4,
					Max: 6,
				},
			}, {
				Id: ItemId.Grenade,
				Duration: {
					Min: 2,
					Max: 6,
				},
			}, {
				Id: ItemId.Bazooka,
				Duration: {
					Min: 1,
					Max: 2,
				},
			}, {
				Id: ItemId.AdvancedScope,
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
			Chance: 21,
			Text: {
				[Language.English]: "The army was ready and locked you in a cell.",
				[Language.Portuguese]: "O exército estava preparado e te trancou em uma cela.",
				[Language.Spanish]: "El ejército estaba listo y te encerró en una celda.",
			},
		},
		Hospital: {
			Chance: 16,
			Text: {
				[Language.English]: "You stepped on a landmine that exploded and threw you away, breaking a rib.",
				[Language.Portuguese]: "Você pisou em uma mina terrestre que explodiu e te jogou longe, quebrando uma costela.",
				[Language.Spanish]: "Pisaste una mina terrestre que explotó y te lanzó lejos, rompiendo una costilla.",
			},
		},
	},
} as const;
