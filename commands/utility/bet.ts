import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	Locale,
	MessageComponentInteraction,
	MessageFlags,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandNumberOption,
} from "discord.js";
import { disableButtons, replyInteraction } from "../../utils/logic";
import { formatMoney } from "../../utils/ui";
import { CrColors } from "../../utils/colors";
import { EmoteString } from "../../utils/emotes";
import { Language } from "../../models/Language";
import { setTimeout as wait } from "timers/promises";
import { User } from "../../models/User";
import { Casino } from "../../models/Casino";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";
import { getCasinoClassModifier } from "../../interfaces/Classes";

const enum CoinSide {
	Heads = 0,
	Tails = 1,
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("bet")
		.setDescription("Bet on a coin flip. Win 1.5x your bet if you are right")
		.setDescriptionLocalization(Locale.PortugueseBR, "Aposte em cara ou coroa. Ganhe 1.5x sua aposta se acertar")
		.addIntegerOption((option: SlashCommandIntegerOption) =>
			option
				.setName("side")
				.setNameLocalization(Locale.PortugueseBR, "lado")
				.setDescription("The side of the coin")
				.setDescriptionLocalization(Locale.PortugueseBR, "O lado da moeda")
				.setRequired(true)
				.addChoices([
					{
						name: "Heads",
						value: CoinSide.Heads,
						name_localizations: {
							[Locale.PortugueseBR]: "Cara",
						},
					},
					{
						name: "Tails",
						value: CoinSide.Tails,
						name_localizations: {
							[Locale.PortugueseBR]: "Coroa",
						},
					},
				]),
		)
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
		const side = interaction.options.getInteger("side", true) as CoinSide;
		const value = interaction.options.getNumber("value", true);

		let currentBet = value;
		let currentBalance = 0;
		let winStreak = 0;

		const s = Strings[language];

		let container: CustomContainerBuilder;

		function addContainerHeader() {
			return new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.Casino)
				.addTexts([
					`-# ${EmoteString.Casino} ${s.casino} • ${s.betting} ${formatMoney(currentBet, language)}`,
				])
				.addLargeSeparator();
		}

		async function playBet(value: number) {
			container = addContainerHeader()
				.addTexts([
					`${s.flipping} ${EmoteString.Waiting}`,
				])
				.addFooter({
					text: formatMoney(user.Money, language),
				});

			await replyInteraction(interaction, {
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});

			// Generate numbers between 2000 and 3000 (2s and 3s)
			const range = () => Math.floor(Math.random() * 1001) + 2000;

			await wait(range());
			const coinFlip = Math.floor(Math.random() * 2);

			const win = side === coinFlip;

			const userClassModifier = getCasinoClassModifier(user.Class);

			const prize = Math.round(value * 0.5 * userClassModifier);

			if (win) {
				user.Money += prize;
				user.Casino.WinCount += 1;
				user.Casino.WinSum += prize;
				currentBalance += prize;
				winStreak += 1;

			}
			else {
				user.Money -= value;
				user.Casino.LoseCount += 1;
				user.Casino.LoseSum += value;
				currentBalance -= value;
				winStreak = 0;
			}

			await user.Update();

			const heads = `${EmoteString.Heads} ${s.heads}`;
			const tails = `${EmoteString.Tails} ${s.tails}`;

			const firstResult = coinFlip === CoinSide.Heads ? heads : tails;

			const userBet = side == CoinSide.Heads ? heads : tails;

			container = addContainerHeader()
				.addTexts([
					`### ${s.result(firstResult)}`,
					`${win ? `${EmoteString.Victory} ${s.won}` : `${EmoteString.Defeat} ${s.lose}`} ${formatMoney(win ? prize : value, language)}!`,
					`-# ${s.bet} ${formatMoney(value, language)} ${s.at} ${userBet}`,
				])
				.addLargeSeparator()
				.addTexts([
					`-# ${s.currentBalance}: ${formatMoney(currentBalance, language)}`,
					winStreak > 1 ? `-# ${s.winStreak(winStreak)}` : false,
				].filter(Boolean) as string[])
				.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>()
					.addComponents(
						new ButtonBuilder()
							.setCustomId("playsamevalue")
							.setLabel(s.betAgain)
							.setDisabled(user.Money < value)
							.setStyle(ButtonStyle.Secondary),
						new ButtonBuilder()
							.setCustomId("playdouble")
							.setLabel(s.betDouble)
							.setDisabled(user.Money < value * 2)
							.setStyle(ButtonStyle.Success),
					),
				)
				.addFooter({
					text: formatMoney(user.Money, language),
				});

			return replyInteraction(interaction, {
				components: [container],
			});
		}

		async function checkIfCanPlay(value: number) {
			const { canPlay, message } = await Casino.CanUserPlayBet(user, value);

			if (!canPlay) {
				container = addContainerHeader()
					.addTexts([
						message,
					]);

				if (currentBalance !== 0) {
					container.addTexts([
						`-# ${s.totalBalance}: ${formatMoney(currentBalance, language)}`,
					]);
				}

				container.addFooter({
					text: formatMoney(user.Money, language),
				});

				await replyInteraction(interaction, {
					components: [container],
					flags: MessageFlags.IsComponentsV2,
				});
				return false;
			}
			return true;
		}

		if (!await checkIfCanPlay(value)) return;

		const response = await playBet(value);

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			idle: 60_000,
		});

		collector?.on("end", async () => {
			await disableButtons(interaction, container);
		});

		collector?.on("collect", async btn => {
			await btn.deferUpdate();

			if (btn.customId === "playsamevalue") {
				if (!await checkIfCanPlay(currentBet)) return;
				await playBet(currentBet);
			}

			else if (btn.customId === "playdouble") {
				currentBet *= 2;
				if (!await checkIfCanPlay(currentBet)) return;
				await playBet(currentBet);
			}
		});

	},
};

const Strings = {
	[Language.English]: {
		casino: "Casino",
		title: "Coin Flip",
		flipping: "Flipping the coin",
		heads: "Heads",
		tails: "Tails",
		won: "You **won**",
		lose: "You **lost**",
		bet: "You bet",
		at: "at",
		result: (result: string) => `The result was ${result}`,
		noMoney: "You don't have enough money to bet.",
		betting: "Betting",
		betAgain: "Bet again!",
		betDouble: "Double bet!",
		currentBalance: "Current balance",
		totalBalance: "Total balance",
		winStreak: (value: number) => `You won ${value} times in a row`,
	},
	[Language.Portuguese]: {
		casino: "Cassino",
		title: "Cara ou Coroa",
		flipping: "Jogando a moeda",
		heads: "Cara",
		tails: "Coroa",
		won: "Você **ganhou**",
		lose: "Você **perdeu**",
		bet: "Você apostou",
		at: "em",
		result: (result: string) => `O resultado foi ${result}`,
		noMoney: "Você não possui dinheiro suficiente para apostar.",
		betting: "Apostando",
		betAgain: "Apostar novamente!",
		betDouble: "Dobrar aposta!",
		currentBalance: "Balanço atual",
		totalBalance: "Balanço total",
		winStreak: (value: number) => `Você ganhou ${value} seguidas`,
	},
	[Language.Spanish]: {
		casino: "Casino",
		title: "Cara o Cruz",
		flipping: "Lanzando la moneda",
		heads: "Cara",
		tails: "Cruz",
		won: "¡**Ganaste**",
		lose: "¡**Perdiste**",
		bet: "Apostaste",
		at: "en",
		result: (result: string) => `El resultado fue ${result}`,
		noMoney: "No tienes suficiente dinero para apostar.",
		betting: "Apostando",
		betAgain: "Apostar de nuevo!",
		betDouble: "Doblar la apuesta!",
		currentBalance: "Balanco actual",
		totalBalance: "Balanco total",
		winStreak: (value: number) => `Ganaste ${value} seguidas`,
	},
} as const;
