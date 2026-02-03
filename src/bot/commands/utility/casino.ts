import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { User } from "@core/models/User";
import { CustomContainerBuilder } from "@bot/ui/builders/CustomContainerBuilder";
import { replyWithContainer } from "@bot/utils/discordInteractions";
import { CrColors } from "@bot/utils/colors";
import { Language } from "@core/models/Language";
import { EmoteString } from "@bot/utils/emotes";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("casino")
		.setDescription("Check the casino games")
		.setNameLocalization(Locale.PortugueseBR, "cassino")
		.setDescriptionLocalization(Locale.PortugueseBR, "Conheça os jogos do cassino"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];

		const container = new CustomContainerBuilder()
			.setUser(user)
			.setAccentColor(CrColors.Casino)
			.addSectionComponents(section => section
				.addTexts([
					`# ${s.title}`,
					s.description,
					`-# ${s.description2}`,
				])
				.setThumbnailAccessory(thumb => thumb
					.setURL("https://media.discordapp.net/attachments/1233604589064818808/1460598163546312857/Casino_New.png"),
				),
			)
			.addLargeSeparator()
			.addTexts([
				`### ${EmoteString.Heads} ${s.headsTailsTitle}`,
				s.headTailsDescription,
				`-# ${s.headTailsDescription2}`,
			])
			.addLargeSeparator()
			.addTexts([
				`### 🏇 ${s.horseRaceTitle}`,
				s.horseRaceDescription,
				`-# ${s.horseRaceDescription2}`,
			])
			.addLargeSeparator()
			.addTexts([
				`### ${EmoteString.RussianRoulette} ${s.russianRouletteTitle}`,
				s.russianRouletteDescription,
				`-# ${s.russianRouletteDescription2}`,
			])
			.addFooter();

		return replyWithContainer(interaction, container);
	},
};

const Strings = {
	[Language.English]: {
		title: "Casino",
		description: `Den of iniquity! Bet, win, lose, break the bank!`,
		description2: `Here you can bet and lose all your money!`,
		headsTailsTitle: `Heads or Tails`,
		headTailsDescription: `Bet an amount on a coin that must fall on the same side that you choose. You have a 50% chance of winning. If you win, you get 1.5x the amount bet!`,
		headTailsDescription2: `Use \`/bet <side> <value>\` to bet on heads or tails.`,
		horseRaceTitle: `Horse Racing`,
		horseRaceDescription: `Bet on one of the horses in a race. Races are held every 6 hours. If your horse wins, you share the prize pool with other winners. Maximum bet is based on your ${EmoteString.Attack}ATK.`,
		horseRaceDescription2: `Use \`/horserace\` to see the next race and to place your bet.`,
		russianRouletteTitle: `Russian Roulette`,
		russianRouletteDescription: `Bet an amount and compete against your friends. Only one will walk away with the cash and all others will be ${EmoteString.Hospital} Hospitalized!`,
		russianRouletteDescription2: `Use \`/russianroulette <value>\` to start a new roulette.`,
	},
	[Language.Portuguese]: {
		title: "Cassino",
		description: `Antro da perdição! Aposte, ganhe, perca, quebre a banca!`,
		description2: `Aqui você pode apostar e perder todo seu dinheiro!`,
		headsTailsTitle: `Cara ou Coroa`,
		headTailsDescription: `Aposte um valor em uma moeda que deve cair no mesmo lado que você escolheu. Você tem 50% de chance de vencer. Se vencer, ganha 1.5x o valor apostado!`,
		headTailsDescription2: `Use \`/bet <lado> <valor>\` para apostar em cara ou coroa.`,
		horseRaceTitle: `Corrida de Cavalos`,
		horseRaceDescription: `Aposte em um dos cavalos em uma corrida. As corridas acontecem a cada 6 horas. Se seu cavalo vencer, você divide o prêmio com outros vencedores. A aposta máxima é baseada no seu ${EmoteString.Attack}ATK.`,
		horseRaceDescription2: `Use \`/corridadecavalos\` para ver a próxima corrida e para fazer sua aposta.`,
		russianRouletteTitle: `Roleta Russa`,
		russianRouletteDescription: `Aposte um valor e dispute contra seus amigos. Apenas um sairá com a grana e todos os outros ficarão ${EmoteString.Hospital} Hospitalizados!`,
		russianRouletteDescription2: `Use \`/roletarussa <valor>\` para iniciar uma nova roleta.`,
	},
	[Language.Spanish]: {
		title: "Casino",
		description: `Den de iniquidad! Apuesta, gana, pierde, rompe el banco!`,
		description2: `¡Aquí puedes apostar y perder todo tu dinero!`,
		headsTailsTitle: `Cara o Cruz`,
		headTailsDescription: `Apostar una cantidad en una moneda que debe caer del mismo lado que elijas. Tienes un 50% de posibilidades de ganar. ¡Si ganas, obtienes 1.5 veces la cantidad apostada!`,
		headTailsDescription2: `Usa \`/bet <lado> <valor>\` para apostar en cara o cruz.`,
		horseRaceTitle: `Carrera de Caballos`,
		horseRaceDescription: `Apuesta a uno de los caballos en una carrera. Las carreras se celebran cada 6 horas. Si tu caballo gana, compartes el premio con otros ganadores. La apuesta máxima se basa en tu ${EmoteString.Attack}ATK.`,
		horseRaceDescription2: `Usa \`/horserace\` para ver la próxima carrera y para hacer tu apuesta.`,
		russianRouletteTitle: `Roleta Russa`,
		russianRouletteDescription: `Apuesta una cantidad y compete contra tus amigos. ¡Solo uno se llevará el dinero y todos los demás quedarán ${EmoteString.Hospital} Hospitalizados!`,
		russianRouletteDescription2: `Usa \`/ruletarusa <apuesta>\` para iniciar una nueva ruleta.`,
	},
} as const;