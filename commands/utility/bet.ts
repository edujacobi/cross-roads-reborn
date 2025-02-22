import {
	ChatInputCommandInteraction,
	Colors,
	Locale,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandNumberOption,
} from "discord.js";
import { replyInteraction } from "../../utils/logic";
import { defaultEmbed, formatMoney, showTime } from "../../utils/ui";
import { CrColors } from "../../utils/colors";
import { JobList } from "../../models/Job";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { EmoteString } from "../../utils/emotes";
import { Language } from "../../models/Language";
import { setTimeout as wait } from "timers/promises";
import { User } from "../../models/User";
import { Casino } from "../../models/Casino";

const enum CoinSide {
	Heads = 0,
	Tails = 1,
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("bet")
		.setDescription("Bet on two coin flips. Win 3x your bet if both are the same")
		.setDescriptionLocalization(Locale.PortugueseBR, "Aposte em duas cara ou coroa. Ganhe 3x sua aposta se ambas forem iguais")

		.addIntegerOption((option: SlashCommandIntegerOption) =>
			option
				.setName("side")
				.setNameLocalization(Locale.PortugueseBR, "lado")
				.setDescription("The side of the coin")
				.setDescriptionLocalization(Locale.PortugueseBR, "O lado da moeda")
				.setRequired(true)
				.addChoices([
					{
						name: "Heads", value: CoinSide.Heads, name_localizations: {
							[Locale.PortugueseBR]: "Cara",
						},
					},
					{
						name: "Tails", value: CoinSide.Tails, name_localizations: {
							[Locale.PortugueseBR]: "Coroa",
						},
					},
				]))
		.addNumberOption((option: SlashCommandNumberOption) =>
			option
				.setName("value")
				.setNameLocalization(Locale.PortugueseBR, "valor")
				.setDescription("The value of the bet")
				.setDescriptionLocalization(Locale.PortugueseBR, "O valor da aposta")
				.setRequired(true)
				.setMinValue(500),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const side = interaction.options.getInteger("side") as CoinSide;
		const value = interaction.options.getNumber("value") as number;

		const s = Strings[language];

		const { canPlay, message } = Casino.CanUserPlayBet(user, value);

		if (!canPlay) {
			return await replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: user.Nickname,
					interaction,
					color: CrColors.Casino,
					description: message,
				})],
			});
		}

		const embed = new CustomEmbedBuilder()
			.setAuthor({
				name: s.title,
				iconURL: "https://media.discordapp.net/attachments/1233604589064818808/1337969966821146695/radar_mafiaCasino.png",
			})
			.setColor(CrColors.Casino)
			.setDescription(s.flipping)
			.setDefaultFooter(user.Nickname, interaction.user.avatarURL(), formatMoney(user.Money, language));

		await replyInteraction(interaction, { embeds: [embed] });

		// Generate numbers between 1200 and 1600 (1.2s and 1.6s)
		const range = () => Math.floor(Math.random() * 401) + 1200;

		await wait(range());
		const firstCoinFlip = Math.floor(Math.random() * 2);

		await wait(range());
		const secondCoinFlip = Math.floor(Math.random() * 2);

		const win = side === firstCoinFlip && side === secondCoinFlip;

		const prize = value * 2;

		if (win) {
			user.Money += prize;
			user.Casino.WinCount += 1;
			user.Casino.WinSum += prize;

		}
		else {
			user.Money -= value;
			user.Casino.LoseCount += 1;
			user.Casino.LoseSum += value;
		}

		await user.Update();

		const heads = `${EmoteString.Heads} ${s.heads}`;
		const tails = `${EmoteString.Tails} ${s.tails}`;

		const firstResult = firstCoinFlip === CoinSide.Heads ? heads : tails;
		const secondResult = secondCoinFlip === CoinSide.Heads ? heads : tails;

		const userBet = side == CoinSide.Heads ? `${heads} ${heads}` : `${tails} ${tails}`;

		embed
			.setColor(win ? Colors.Green : Colors.Red)
			.setDescription(`### ${s.result(firstResult, secondResult)}
${win ? s.won : s.lose} ${formatMoney(win ? prize : value, user.Language)}!
-# ${s.bet} ${formatMoney(value, user.Language)} ${s.at} ${userBet}.`)
			.setDefaultFooter(user.Nickname, interaction.user.avatarURL(), formatMoney(user.Money, language));

		await replyInteraction(interaction, { embeds: [embed] });
	},
};

const Strings = {
	[Language.English]: {
		title: "Coin Flip",
		flipping: "Flipping the coins...",
		heads: "Heads",
		tails: "Tails",
		won: "You **won**",
		lose: "You **lost**",
		bet: "You bet",
		at: "at",
		result: (result1: string, result2: string) => `The result was ${result1} ${result2}`,
		noMoney: "You don't have enough money to bet.",
		working: (job: string, time: Date) => `You are working as ${job} and can't do this. Will end ${showTime(time.getTime(), true)}`,
	},
	[Language.Portuguese]: {
		title: "Cara ou Coroa",
		flipping: "Jogando as moedas...",
		heads: "Cara",
		tails: "Coroa",
		won: "Você **ganhou**",
		lose: "Você **perdeu**",
		bet: "Você apostou",
		at: "em",
		result: (result1: string, result2: string) => `O resultado foi ${result1} ${result2}`,
		noMoney: "Você não possui dinheiro suficiente para apostar.",
		working: (job: string, time: Date) => `Você está trabalhando como ${job} e não pode fazer isto. Terminará ${showTime(time.getTime(), true)}`,
	},
	[Language.Spanish]: {
		title: "Cara o Cruz",
		flipping: "Lanzando las monedas...",
		heads: "Cara",
		tails: "Cruz",
		won: "¡**Ganaste**",
		lose: "¡**Perdiste**",
		bet: "Apostaste",
		at: "en",
		result: (result1: string, result2: string) => `El resultado fue ${result1} ${result2}`,
		noMoney: "No tienes suficiente dinero para apostar.",
		working: (job: string, time: Date) => `Estás trabajando como ${job} y no puedes hacer esto. Terminará ${showTime(time.getTime(), true)}`,
	},
} as const;
