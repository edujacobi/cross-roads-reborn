import {
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	Locale,
	MessageComponentInteraction,
	MessageFlags, SeparatorSpacingSize,
	SlashCommandBuilder,
	TextDisplayBuilder,
} from "discord.js";
import { disableButtons, getRandomItemFromArray, replyInteraction } from "../../utils/logic";
import { Language } from "../../models/Language";
import { User } from "../../models/User";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";
import { EmoteString } from "../../utils/emotes";
import { CrColors } from "../../utils/colors";
import { showTime } from "../../utils/ui";
import { addDays, addMinutes } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Log } from "../../utils/log";
import { Notification } from "../../models/Notification";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("drink")
		.setDescription("Drinks a refreshing beverage!")
		.setNameLocalization(Locale.PortugueseBR, "beber")
		.setDescriptionLocalization(Locale.PortugueseBR, "Bebe uma refrescante bebida!"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		await interaction.deferReply();
		const s = Strings[language];

		const now = toZonedTime(new Date(), "America/Sao_Paulo");
		const day = now.getDay();
		const hour = now.getHours();

		const isHappyHour = hour >= 18 && hour <= 20 || day === 0 || day === 6;

		let nextHappyHour = new Date(now);
		nextHappyHour.setHours(18, 0, 0, 0);
		if (day === 0 || day === 6) {
			nextHappyHour.setHours(0, 0, 0, 0);
		}
		else if (hour >= 20) {
			nextHappyHour = addDays(nextHappyHour, 1);
		}

		const cantDrink = user.IsInPrison() || user.IsInHospital() || user.IsWorking() || user.IsInBeatUp() || user.IsInRobbery();

		const channelName = interaction.guild?.name || s.fishcutterSt;

		const adjectives = {
			[Language.Portuguese]:
				["campeão", "guerreiro", "meu bruxo", "meu amigo", "meu chapa", "cliente", "comparsa", "parceiro", "meu cupinxa"],
			[Language.English]:
				["champion", "warrior", "my wizard", "my friend", "my pal", "customer", "accomplice", "partner", "my buddy"],
			[Language.Spanish]:
				["campeón", "guerrero", "mi brujo", "mi amigo", "mi colega", "cliente", "cómplice", "socio", "mi compañero"],
		};
		const chosenAdjective = getRandomItemFromArray(adjectives[language]);

		const drinkButton = new ButtonBuilder()
			.setStyle(ButtonStyle.Primary)
			.setLabel(`${s.drink}!`)
			.setDisabled(cantDrink)
			.setCustomId("drink");

		function getButtonLabel(currentLabel: string) {
			if (currentLabel === `${s.drink}!`) {
				return `${s.drinkMore}!`;
			}
			if (currentLabel.length < 32) {
				return currentLabel + "!";
			}
			return currentLabel;
		}

		const container = new CustomContainerBuilder()
			.setUser(user)
			.setAccentColor(CrColors.Bar)
			.addTextDisplayComponents(header => header
				.setContent(isHappyHour ? `-# ${s.happyHour}` : `-# Happy Hour ${showTime(nextHappyHour.getTime(), true)}`))
			.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Small))
			.addTextDisplayComponents(
				title => title
					.setContent(`# ${EmoteString.Idle} ${s.barOf} ${channelName}`),
				description => description
					.setContent(s.barmanDescription(chosenAdjective)))
			.addLargeSeparator(false)
			.addTextDisplayComponents(history => history
				.setId(1)
				.setContent(`-# ${s.drankNothing}`))
			.addFooter({
				button: drinkButton,
			});

		const response = await replyInteraction(interaction, {
			components: [container],
			flags: MessageFlags.IsComponentsV2,
			withResponse: true,
		});

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			idle: 60_000,
		});

		let count = 1;

		const anotherAdjective = getRandomItemFromArray(adjectives[language]);

		collector?.on("collect", async btn => {
			if (btn.customId === "drink") {
				await user.GetInfo();
				const cantDrink = user.IsInPrison() || user.IsInHospital() || user.IsWorking() || user.IsInBeatUp() || user.IsInRobbery();

				if (cantDrink) {
					drinkButton.setDisabled(true);
					return await btn.update({
						components: [container],
					});
				}

				const beverages = {
					[Language.Portuguese]: [
						"whisky", "vodka", "vinho", "gin", "tônica", "amarula", "caipirinha", "cerveja", "sakê",
						"cachaça", "água da torneira", "rum", "caipiroska", "sidra", "cerveja", "catuaba", "corote",
						"champanha", "licor", "água sanitária", "cerveja", "tequila", "tubaína", "água do miojo",
						"absinto", "Jägermeister", "cerveja", "gasolina", "cerveja artesanal", "Red Ale",
						"American Pale Ale", "Belgian Wheat Ale", "cerveja",
					],
					[Language.English]: [
						"whiskey", "vodka", "wine", "gin", "tonic", "amarula", "caipirinha", "beer", "sake",
						"cachaça", "tap water", "rum", "caipiroska", "cider", "beer", "catuaba", "corote", "champagne",
						"liqueur", "bleach", "beer", "tequila", "tubaína", "noodle water", "absinthe", "Jägermeister",
						"beer", "gasoline", "craft beer", "Red Ale", "American Pale Ale", "Belgian Wheat Ale", "beer",
					],
					[Language.Spanish]: [
						"whisky", "vodka", "vino", "ginebra", "tónica", "amarula", "caipirinha", "cerveza", "sake",
						"cachaça", "agua del grifo", "ron", "caipiroska", "sidra", "cerveza", "catuaba", "corote",
						"champán", "licor", "lejía", "cerveza", "tequila", "tubaína", "agua de fideos", "absenta",
						"Jägermeister", "cerveza", "gasolina", "cerveza artesanal", "Red Ale", "American Pale Ale",
						"Belgian Wheat Ale", "cerveza",
					],
				};

				const sensations = {
					[Language.Portuguese]: [
						"forte", "vigoroso", "potente", "poderoso", "ativo", "dinâmico", "robusto", "másculo",
						"viril", "masculino", "firme", "decidido", "resoluto", "enfático", "veemente", "expressivo",
						"drástico", "radical", "vivo", "vivaz", "incansável", "incisivo", "caloroso", "agradável",
						"jovial", "álacre", "animado", "animoso", "aprazerado", "bem-disposto", "bem-humorado",
						"contente", "divertido", "exultante", "feliz", "festejador", "festivo", "folgazão", "foliador",
						"fortunoso", "galhardo", "jubiloso", "jucundo", "ledo", "lépido", "prazenteiro", "radiante",
						"risonho", "satisfeito", "sorridente", "abatido", "apático", "indiferente", "desinteressado",
						"desempolgado", "parado", "caído", "cabisbaixo", "prostrado", "desencorajado", "desestimulado",
						"desalentado", "desapontado", "desiludido", "deprimido", "triste", "esmorecido", "entorpecido",
						"sucumbido", "desacoroçoado", "descorçoado", "derrotado", "feminino",
					],
					[Language.English]: [
						"strong", "vigorous", "potent", "powerful", "active", "dynamic", "robust", "masculine",
						"virile", "manly", "firm", "decided", "resolute", "emphatic", "vehement", "expressive",
						"drastic", "radical", "lively", "vivacious", "tireless", "incisive", "warm", "pleasant",
						"jovial", "cheerful", "animated", "spirited", "pleased", "well-disposed", "good-humored",
						"content", "amused", "exultant", "happy", "celebratory", "festive", "jolly", "reveler",
						"fortunate", "gallant", "jubilant", "joyful", "glad", "nimble", "pleasant", "radiant",
						"smiling", "satisfied", "grinning", "downcast", "apathetic", "indifferent", "uninterested",
						"unenthusiastic", "still", "fallen", "crestfallen", "prostrate", "discouraged", "demotivated",
						"disheartened", "disappointed", "disillusioned", "depressed", "sad", "faint-hearted", "numbed",
						"succumbed", "discouraged", "dispirited", "defeated", "feminine",
					],
					[Language.Spanish]: [
						"fuerte", "vigoroso", "potente", "poderoso", "activo", "dinámico", "robusto", "masculino",
						"viril", "varonil", "firme", "decidido", "resuelto", "enfático", "vehemente", "expresivo",
						"drástico", "radical", "vivo", "vivaz", "incansable", "incisivo", "cálido", "agradable",
						"jovial", "alegre", "animado", "animoso", "complacido", "bien dispuesto", "de buen humor",
						"contento", "divertido", "exultante", "feliz", "festejador", "festivo", "juguetón", "juerguista",
						"afortunado", "galante", "jubiloso", "jocoso", "alegre", "ágil", "placentero", "radiante",
						"sonriente", "satisfecho", "sonriente", "abatido", "apático", "indiferente", "desinteresado",
						"desanimado", "parado", "caído", "cabizbajo", "postrado", "desalentado", "desestimulado",
						"descorazonado", "decepcionado", "desilusionado", "deprimido", "triste", "desanimado",
						"entumecido", "sucumbido", "desalentado", "descorazonado", "derrotado", "femenino",
					],
				};

				const chosenBeverage = getRandomItemFromArray(beverages[user.Language]);
				const chosenSensation = getRandomItemFromArray(sensations[user.Language]);

				const coma = {
					chance: isHappyHour ? 15 : 5,
					text: "",
					inComa: false,
				};

				count += 1;

				if (Math.random() * 100 < coma.chance) {
					const minutes = Math.floor(Math.random() * 5) + 1;
					user.Hospital.Count += 1;
					user.Hospital.Time = addMinutes(new Date(), minutes);
					user.Drink.DrunkCount += 1;

					await Notification.Hospital(user);

					if (isHappyHour) {
						user.Drink.HappyHour = count;
					}
					else {
						user.Drink.Normal = count;
					}

					await user.Update();

					Log.Info(`${user.Nickname} (${user.Id}) drank too much and fell into an alcoholic coma. Will be hospitalized for ${minutes} minutes. Drank ${count} times.`);

					coma.inComa = true;
					coma.text = `\n${EmoteString.Hospital} ${s.toHospital(user.Hospital.Time)}`;
				}

				function getDrinkCountText(currentCount: number, lang: Language, adj: string): string {
					let text = "";
					const drinkCountStrings = Strings[lang].drinkCountMessages;

					if (currentCount > 5) text += `\n\n-# "${drinkCountStrings.five}"\n`;
					if (currentCount > 10) text += `-# "${drinkCountStrings.ten(adj)}"\n`;
					if (currentCount > 15) text += `-# "${drinkCountStrings.fifteen}"\n`;
					if (currentCount > 20) text += `-# "${drinkCountStrings.twenty}"\n`;
					if (currentCount > 30) text += `-# "${drinkCountStrings.thirty}"\n`;
					if (currentCount > 40) text += `-# "${drinkCountStrings.forty}"\n`;
					if (currentCount > 50) text += `-# "${drinkCountStrings.fifty}"\n`;
					if (currentCount > 60) text += `-# "${drinkCountStrings.sixty}"\n`;
					if (currentCount > 70) text += `-# "${drinkCountStrings.seventy}"\n`;
					if (currentCount > 80) text += `-# "${drinkCountStrings.eighty}"\n`;
					if (currentCount > 100) text += `-# "${drinkCountStrings.hundred}"\n`;
					return text;
				}

				const countText = getDrinkCountText(count, user.Language, anotherAdjective);

				const textComponent = container.components.find(component => component.data?.id === 1);
				if (textComponent && textComponent instanceof TextDisplayBuilder) {
					textComponent.setContent(`${s.youDrank(chosenBeverage, chosenSensation)}${countText}${coma.text}`);
				}

				container.changeFooterText(`${s.drinkCount} ${count - 1}`);

				if ("label" in drinkButton.data) {
					drinkButton.setLabel(getButtonLabel(drinkButton.data.label as string));
				}

				if (coma.inComa) {
					drinkButton
						.setLabel(s.drankToMuch)
						.setDisabled(true);

					container.setAccentColor(CrColors.Hospital);
				}

				await btn.update({
					components: [container],
				});
			}
		});

		collector?.on("end", async () => {
			await disableButtons(interaction, container);
		});
	},
};

const Strings = {
	[Language.English]: {
		fishcutterSt: "Fishcutter Street",
		drink: "Drink",
		drinkMore: "Drink more",
		happyHour: "Happy Hour! Chance of getting drunk x3",
		drankNothing: "You haven't drunk anything yet",
		barOf: "Bar of",
		barmanDescription: (adjective: string) => `Come on in, ${adjective}, would you like something to drink?`,
		toHospital: (timer: Date) => `You drank too much and fell into an alcoholic coma.\n-# You will be healed ${showTime(timer.getTime(), true)}`,
		youDrank: (beverage: string, sensation: string) => `You drank **${beverage}** and feel **${sensation}**!`,
		drinkCount: "You drank",
		drankToMuch: "You drank too much.",
		drinkCountMessages: {
			five: "Goes down smooth, huh?",
			ten: (adj: string) => `Take it easy, ${adj}.`,
			fifteen: "I think that's enough for today.",
			twenty: "After today, I doubt you won't have cirrhosis.",
			thirty: "Are you a god or something?",
			forty: "You're the devil, that's what you are.",
			fifty: "I'm declaring bankruptcy!",
			sixty: "My wife said she's going to leave me...",
			seventy: "Please, stop.",
			eighty: "My stock is gone, I don't even know what you're drinking anymore.",
			hundred: "ARE YOU JACOBI BY ANY CHANCE???!",
		},
	},

	[Language.Portuguese]: {
		fishcutterSt: "Rua da Peixeira",
		drink: "Beber",
		drinkMore: "Beber mais",
		happyHour: "Happy Hour! Chance de se embebedar x3",
		drankNothing: "Você ainda não bebeu nada",
		barOf: "Bar de",
		barmanDescription: (adjective: string) => `Chega aí, ${adjective}, gostaria de beber alguma coisa?`,
		toHospital: (timer: Date) => `Você bebeu demais e entrou em coma alcoólico.\n-# Será curado ${showTime(timer.getTime(), true)}`,
		youDrank: (beverage: string, sensation: string) => `Você bebeu **${beverage}** e se sente **${sensation}**!`,
		drinkCount: "Você bebeu",
		drankToMuch: "Você já bebeu demais.",
		drinkCountMessages: {
			five: "Desce redondo, hein?",
			ten: (adj: string) => `Vai com calma, ${adj}.`,
			fifteen: "Acho que já deu por hoje.",
			twenty: "Depois de hoje, duvido não ter cirrose.",
			thirty: "Você é um deus ou algo do tipo?",
			forty: "Você é o diabo, isso sim.",
			fifty: "Estou declarando falência!",
			sixty: "Minha mulher falou que vai me abandonar...",
			seventy: "Por favor, pare.",
			eighty: "Meu estoque acabou, eu nem sei mais o que você está bebendo.",
			hundred: "POR ACASO VOCÊ É O JACOBI???!",
		},
	},

	[Language.Spanish]: {
		fishcutterSt: "Calle del Cortapescado",
		drink: "Beber",
		drinkMore: "Beber más",
		happyHour: "¡Happy Hour! Posibilidad de emborracharse x3",
		drankNothing: "Aún no has bebido nada",
		barOf: "Bar de",
		barmanDescription: (adjective: string) => `Pase, ${adjective}, ¿le gustaría beber algo?`,
		toHospital: (timer: Date) => `Te emborrachaste y caíste en un coma alcohólico.\n-# Serás curado ${showTime(timer.getTime(), true)}`,
		youDrank: (beverage: string, sensation: string) => `¡Bebiste **${beverage}** y te sientes **${sensation}**!`,
		drinkCount: "Has bebido",
		drankToMuch: "Te emborrachaste.",
		drinkCountMessages: {
			five: "¿Baja suave, eh?",
			ten: (adj: string) => `Con calma, ${adj}.`,
			fifteen: "Creo que ya es suficiente por hoy.",
			twenty: "Después de hoy, dudo que no tengas cirrosis.",
			thirty: "¿Eres un dios o algo así?",
			forty: "Eres el diablo, eso sí.",
			fifty: "¡Estoy declarando la bancarrota!",
			sixty: "Mi mujer dijo que me va a abandonar...",
			seventy: "Por favor, para.",
			eighty: "Mi stock se acabó, ya ni sé lo que estás bebiendo.",
			hundred: "¿ACASO ERES JACOBI???!",
		},
	},
} as const;