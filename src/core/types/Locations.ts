import { IDescription, IEmote } from "./Interfaces";
import { Language } from "@core/models/Language";

export enum LocationId {
	OldLady,
	GroceryStore,
	GasStation,
	JewelryStore,
	SmallBank,
	ItalianMafia,
	ArmyDepot,
	JacobiPalace,
}

export interface Location {
	readonly Id: LocationId,
	readonly Name: IDescription,
	readonly Description: IDescription,
	readonly Emote: IEmote,
	readonly ImageUrl: string,
	readonly Reward: {
		readonly Min: number,
		readonly Max: number,
	},
	readonly SuccessChance: number,
	readonly NeedAttack: number,
	readonly Special: boolean,
	readonly Prison: {
		readonly Text: IDescription[],
	},
}

interface LocationListType {
	[key: number]: Location;
}

export const LocationList: LocationListType = {
	[LocationId.OldLady]: {
		Id: LocationId.OldLady,
		Name: {
			[Language.English]: "Old lady on the corner",
			[Language.Portuguese]: "Velhinha na esquina",
			[Language.Spanish]: "Vieja en la esquina",
		},
		Description: {
			[Language.English]: `An defenseless old lady unable to scream for help`,
			[Language.Portuguese]: "Uma senhora indefesa e incapaz de gritar por ajuda",
			[Language.Spanish]: `Una anciana indefensa e incapaz de pedir ayuda`,
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
				[Language.English]: "The police saw you bullying the old lady.",
				[Language.Portuguese]: "A polícia viu você intimidando a velhinha.",
				[Language.Spanish]: "La policía te vio intimidando a la anciana.",
			}, {
				[Language.English]: "A passerby called the cops on you.",
				[Language.Portuguese]: "Um pedestre chamou a polícia para você.",
				[Language.Spanish]: "Un transeúnte llamó a la policía por ti.",
			}, {
				[Language.English]: "The old lady hit you with her purse until the police arrived.",
				[Language.Portuguese]: "A velhinha te bateu com a bolsa até a polícia chegar.",
				[Language.Spanish]: "La anciana te golpeó con su bolso hasta que llegó la policía.",
			}],
		},
	},
	[LocationId.GroceryStore]: {
		Id: LocationId.GroceryStore,
		Name: {
			[Language.English]: "Joe's Grocery Store",
			[Language.Portuguese]: "Mercearia do Zé",
			[Language.Spanish]: "Tienda de Pepe",
		},
		Description: {
			[Language.English]: `Joe is already used to the violence of the streets`,
			[Language.Portuguese]: "Seu Zé já está acostumado com a violência das ruas",
			[Language.Spanish]: `Joe ya está acostumbrado a la violencia de las calles`,
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
				[Language.English]: "Joe triggered the silent alarm.",
				[Language.Portuguese]: "O Zé acionou o alarme silencioso.",
				[Language.Spanish]: "Pepe activó la alarma silenciosa.",
			}, {
				[Language.English]: "A patrol car was passing by just as you entered.",
				[Language.Portuguese]: "Uma viatura estava passando bem na hora que você entrou.",
				[Language.Spanish]: "Una patrulla pasaba justo cuando entraste.",
			}, {
				[Language.English]: "You got stuck in the automatic door while trying to escape.",
				[Language.Portuguese]: "Você ficou preso na porta automática enquanto tentava fugir.",
				[Language.Spanish]: "Te quedaste atascado en la puerta automática mientras ententava escapar.",
			}],
		},
	},
	[LocationId.GasStation]: {
		Id: LocationId.GasStation,
		Name: {
			[Language.English]: "Gas station",
			[Language.Portuguese]: "Posto de gasolina",
			[Language.Spanish]: "Gasolinera",
		},
		Description: {
			[Language.English]: `So much corruption that even being robbed every week, it still makes a profit`,
			[Language.Portuguese]: "É tanta corrupção que mesmo sendo roubado toda semana, ainda dá lucro",
			[Language.Spanish]: `Tanta corrupción que, aunque la roben todas las semanas, sigue dando ganancias`,
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
				[Language.English]: "The attendant locked the doors and called the police.",
				[Language.Portuguese]: "O frentista trancou as portas e chamou a polícia.",
				[Language.Spanish]: "El empleado cerró las puertas y llamó a la policía.",
			}, {
				[Language.English]: "Police were refueling their car and saw you.",
				[Language.Portuguese]: "A polícia estava abastecendo a viatura e te viu.",
				[Language.Spanish]: "La policía estaba llenando el tanque y te vio.",
			}, {
				[Language.English]: "You slipped on an oil spill and the police caught you.",
				[Language.Portuguese]: "Você escorregou em uma poça de óleo e a polícia te pegou.",
				[Language.Spanish]: "Resbalaste en un charco de aceite y la policía te atrapó.",
			}],
		},
	},
	[LocationId.JewelryStore]: {
		Id: LocationId.JewelryStore,
		Name: {
			[Language.English]: "Jewelry store",
			[Language.Portuguese]: "Joalheria",
			[Language.Spanish]: "Joyería",
		},
		Description: {
			[Language.English]: `The finest jewelry and watches, made with all possible care`,
			[Language.Portuguese]: "As mais finas joias e relógios, feitas com todo o esmero possível",
			[Language.Spanish]: `Las joyas y relojes más finos, hechos con todo el cuidado posible`,
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
				[Language.English]: "You tripped the laser alarm system.",
				[Language.Portuguese]: "Você acionou o sistema de alarme a laser.",
				[Language.Spanish]: "Activaste el sistema de alarma láser.",
			}, {
				[Language.English]: "The security guard held you at gunpoint until police arrived.",
				[Language.Portuguese]: "O segurança te manteve sob a mira de uma arma até a polícia chegar.",
				[Language.Spanish]: "El guardia de seguridad te apuntó con un arma hasta que llegó la policía.",
			}, {
				[Language.English]: "An off-duty cop was buying a engagement ring and arrested you.",
				[Language.Portuguese]: "Um policial de folga estava comprando um anel de noivado e te prendeu.",
				[Language.Spanish]: "Un policía fuera de servicio estaba comprando un anillo de compromiso y te arrestó.",
			}, ],
		},
	},
	[LocationId.SmallBank]: {
		Id: LocationId.SmallBank,
		Name: {
			[Language.English]: "Small bank",
			[Language.Portuguese]: "Banco pequeno",
			[Language.Spanish]: "Banco pequeño",
		},
		Description: {
			[Language.English]: `A small bank with exorbitant interest rates on the outskirts of the city`,
			[Language.Portuguese]: "Um pequeno banco com juros exorbitantes nos arredores da cidade",
			[Language.Spanish]: `Un pequeño banco con tasas de interés exorbitantes en las afueras de la ciudad`,
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
				[Language.English]: "The teller pressed the panic button under the desk.",
				[Language.Portuguese]: "O caixa apertou o botão de pânico embaixo da mesa.",
				[Language.Spanish]: "El cajero presionó el botón de pánico debajo del escritorio.",
			}, {
				[Language.English]: "You took too long to open the safe and police surrounded the building.",
				[Language.Portuguese]: "Você demorou muito para abrir o cofre e a polícia cercou o prédio.",
				[Language.Spanish]: "Tardaste mucho en abrir la caja fuerte y la policía rodeó el edificio.",
			}, {
				[Language.English]: "You got locked in the vault.",
				[Language.Portuguese]: "Você ficou trancado no cofre.",
				[Language.Spanish]: "Te quedaste encerrado en la bóveda.",
			}],
		},
	},
	[LocationId.ItalianMafia]: {
		Id: LocationId.ItalianMafia,
		Name: {
			[Language.English]: "Italian Mafia",
			[Language.Portuguese]: "Máfia Italiana",
			[Language.Spanish]: "Mafia italiana",
		},
		Description: {
			[Language.English]: `The gangs may rule the streets, but the Mafia is rooted in the city`,
			[Language.Portuguese]: "As gangues podem dominar as ruas, mas a Mafia está enraizada na cidade",
			[Language.Spanish]: `La pandilla puede gobernar las calles, pero la Mafia está arraigada en la ciudad`,
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
				[Language.English]: "The Mafia abandoned the empty place and set a trap for you.",
				[Language.Portuguese]: "A Mafia abandonou o local vazio e armou uma armadilha pra você.",
				[Language.Spanish]: "The Mafia abandoned the empty place and set a trap for you.",
			}, {
				[Language.English]: "The police raided the place and caught you in the crossfire.",
				[Language.Portuguese]: "A polícia invadiu o local e te pegou no fogo cruzado.",
				[Language.Spanish]: "La policía allanó el lugar y te atrapó en el fuego cruzado.",
			}, {
				[Language.English]: "You were framed by the mobsters and left for the cops.",
				[Language.Portuguese]: "Você foi incriminado pelos mafiosos e deixado para os policiais.",
				[Language.Spanish]: "Fuiste incriminado por los mafiosos y dejado para la policía.",
			}],
		},
	},
	[LocationId.ArmyDepot]: {
		Id: LocationId.ArmyDepot,
		Name: {
			[Language.English]: "Army Depot",
			[Language.Portuguese]: "Depósito do Exército",
			[Language.Spanish]: "Depósito del ejército",
		},
		Description: {
			[Language.English]: `Its location is very well protected, as are the items stored there`,
			[Language.Portuguese]: "Sua localização é muito bem protegida, bem como os itens guardados lá",
			[Language.Spanish]: `Su ubicación está muy bien protegida, al igual que los artículos allí guardados`,
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
				[Language.English]: "The Military surrounded you immediately.",
				[Language.Portuguese]: "Os militares te cercaram imediatamente.",
				[Language.Spanish]: "Los militares te cercaron inmediatamente.",
			}, {
				[Language.English]: "You were caught by a thermal camera.",
				[Language.Portuguese]: "Você foi pego por uma câmera térmica.",
				[Language.Spanish]: "Fuiste capturado por una cámara térmica.",
			}, {
				[Language.English]: "A patrol dog sniffed you out.",
				[Language.Portuguese]: "Um cão de patrulha te farejou.",
				[Language.Spanish]: "Un perro patrulla te olfateó.",
			}],
		},
	},
	[LocationId.JacobiPalace]: {
		Id: LocationId.JacobiPalace,
		Name: {
			[Language.English]: "Jacobi Palace",
			[Language.Portuguese]: "Palácio do Jacobi",
			[Language.Spanish]: "Palacio de Jacobi",
		},
		Description: {
			[Language.English]: `The most protected place in the city could not be other than the Mayor's house`,
			[Language.Portuguese]: "O lugar mais protegido da cidade não poderia ser outro a não ser a casa do senhor Prefeito",
			[Language.Spanish]: `El lugar más protegido de la ciudad no podría ser otro que la casa del alcalde`,
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
		Special: true,
		Prison: {
			Text: [{
				[Language.English]: "The Mayor's personal security team neutralized you.",
				[Language.Portuguese]: "A equipe de segurança pessoal do Prefeito te neutralizou.",
				[Language.Spanish]: "El equipo de seguridad personal del alcalde te neutralizó.",
			}, {
				[Language.English]: "High-tech sensors detected your heartbeat.",
				[Language.Portuguese]: "Sensores de alta tecnologia detectaram seus batimentos cardíacos.",
				[Language.Spanish]: "Sensores de alta tecnología detectaron tus latidos.",
			}, {
				[Language.English]: "You were spotted by a sniper on the roof.",
				[Language.Portuguese]: "Você foi avistado por um atirador no telhado.",
				[Language.Spanish]: "Fuiste visto por un francotirador en el techo.",
			}],
		},
	},
} as const;

export function getLocationList(): Location[] {
	return Object.values(LocationList);
}