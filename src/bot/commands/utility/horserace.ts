import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { createButtonCollector, disableButtons } from "#bot/utils/collectors";
import { CrColors } from "#bot/utils/colors";
import { replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteString } from "#bot/utils/emotes";
import { defaultComponent, formatMoney } from "#bot/utils/ui";
import { BetFailureReason, HorseRacing, type RaceInfo } from "#core/models/HorseRacing";
import { Language, type Localization } from "#core/models/Language";
import type { User } from "#core/models/User";
import { HorseList } from "#core/types/Horses";
import {
	ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	Colors,
	Locale,
	SlashCommandBuilder,
	time,
	TimestampStyles,
} from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("horserace")
		.setDescription("Bet on horse races and win big with fixed-odds payouts")
		.setNameLocalization(Locale.PortugueseBR, "corridadecavalos")
		.setNameLocalization(Locale.SpanishES, "carreradecaballos")
		.setDescriptionLocalization(Locale.PortugueseBR, "Aposte em corridas de cavalos e ganhe muito com prêmios fixos")
		.setDescriptionLocalization(Locale.SpanishES, "Apuesta en carreras de caballos y gana mucho con pagos fijos")
		.addIntegerOption(option => option
			.setName("amount")
			.setNameLocalization(Locale.PortugueseBR, "valor")
			.setNameLocalization(Locale.SpanishES, "cantidad")
			.setDescription(`Bet amount (min: $${HorseRacing.MIN_BET.toLocaleString()}, max: $${HorseRacing.MAX_BET_CAP.toLocaleString()})`)
			.setDescriptionLocalization(Locale.PortugueseBR, `Valor da aposta (mín: $${HorseRacing.MIN_BET.toLocaleString()}, máx: $${HorseRacing.MAX_BET_CAP.toLocaleString()})`)
			.setDescriptionLocalization(Locale.SpanishES, `Cantidad de apuesta (mín: $${HorseRacing.MIN_BET.toLocaleString()}, máx: $${HorseRacing.MAX_BET_CAP.toLocaleString()})`)
			.setMinValue(HorseRacing.MIN_BET)
			.setRequired(false),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];
		const racing = new HorseRacing(user);

		const amount = interaction.options.getInteger("amount");

		function getContainerHeader(raceInfo: RaceInfo | null) {
			return new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.Casino)
				.addSectionComponents(section => section
					.addTexts([
						`# ${s.title}`,
						`-# ${s.subtitle}`,
						raceInfo ? s.nextRace(raceInfo.race.raceTime) : s.noRace
					])
					.setThumbnailAccessory(thumb => thumb
						.setURL("https://media.discordapp.net/attachments/1233604589064818808/1499581098408280096/HorseRacing.png"),
					),
				);
		}

		/**
		 * Builds the main info container for the horse race command (without amount param)
		 * @param raceInfo the time of the next race
		 * @returns the container component
		 */
		function buildInfoContainer(raceInfo: RaceInfo | null) {
			const container = getContainerHeader(raceInfo);

			if (!raceInfo) {
				return container.addFooter({ text: formatMoney(user.Money, user.Language) });
			}

			const { race, userBet, isBettingOpen } = raceInfo;

			const horseLines = HorseList.map(horse => {
				const name = horse.Name[user.Language];
				return `${horse.Emote} **${name}** — ${horse.Multiplier}× ${s.payout}`;
			}).join("\n");

			let betStatus = s.noBet as string;
			if (userBet) {
				const horse = HorseList.find(x => x.Id === userBet.horseNumber)!;
				const name = horse.Name[user.Language];
				betStatus = `${horse.Emote} **${name}** — ${formatMoney(userBet.amount, user.Language)}`;
			}

			const statusLine = !isBettingOpen
				? s.bettingClosed
				: userBet ? s.alreadyBet : s.hint;

			return container
				.addLargeSeparator()
				.addTexts([
					`### ${s.horses}`,
					horseLines,
				])
				.addLargeSeparator()
				.addTexts([
					`### ${s.raceStats}`,
					`${s.totalBets}: **${race.totalBets}**`,
					`${s.yourBet}: ${betStatus}`,
					`-# ${statusLine}`,
				])
				.addFooter({ text: formatMoney(user.Money, user.Language) });
		}

		/**
		 * Builds the horse selection container (with amount param)
		 * @param amount the amount the user is betting
		 * @param raceInfo the race info
		 * @returns the container component with horse selection buttons
		 */
		function buildHorseSelectContainer(amount: number, raceInfo: RaceInfo) {
			const container = getContainerHeader(raceInfo)
				.addLargeSeparator()
				.addTexts([
					`### ${s.horses}`,
					s.choosingHorse(formatMoney(amount, user.Language)),
				])
				.addLargeSeparator();

			for (let i = 0; i < HorseList.length; i += 1) {
				const horse = HorseList[i]!;
				const horseName = horse.Name[user.Language];
				container
					.addSectionComponents(section => section
						.addTexts([
							`### ${horse.Emote} ${horseName}\n${horse.Description[user.Language]}\n-# ${horse.Multiplier}× → **${formatMoney(Math.floor(amount * horse.Multiplier), user.Language)}**`
						])
						.setButtonAccessory(new ButtonBuilder()
							.setCustomId(`horse_${horse.Id}`)
							.setLabel(horseName)
							.setEmoji(horse.Emote)
							.setStyle(ButtonStyle.Secondary),
						)
					);

				if (i + 1 < HorseList.length) {
					container.addLargeSeparator();
				}
			}

			container.addFooter({ text: formatMoney(user.Money, user.Language) });

			return container;
		}

		// No amount → show race info only
		if (amount === null) {
			let raceInfo = await racing.GetRaceInfo();

			// No race in DB — create one and retry
			if (!raceInfo) {
				await HorseRacing.ScheduleNextRace();
				raceInfo = await racing.GetRaceInfo();
			}

			const container = buildInfoContainer(raceInfo);
			return replyWithContainer(interaction, container);
		}

		// Amount provided → validate, then show horse-selection buttons
		await user.GetInfo();

		const maxBet = racing.CalculateMaxBet();

		function warn(message: string) {
			return replyWithContainer(interaction, defaultComponent({
				user,
				color: Colors.Red,
				description: message,
			}));
		}

		if (amount < HorseRacing.MIN_BET) {
			return warn(s.betTooLow(formatMoney(HorseRacing.MIN_BET, language)));
		}

		if (amount > maxBet) {
			return warn(s.betTooHigh(formatMoney(maxBet, language)));
		}

		const raceInfo = await racing.GetRaceInfo();

		if (!raceInfo) {
			return warn(s.noRace);
		}

		if (raceInfo.userBet) {
			return warn(s.alreadyBet);
		}

		if (!raceInfo.isBettingOpen) {
			return warn(s.bettingClosed);
		}

		// Show horse-selection buttons
		let container = buildHorseSelectContainer(amount, raceInfo);
		const response = await replyWithContainer(interaction, container);

		const collector = createButtonCollector(interaction, response, { maxClicks: 1 });

		collector?.on("collect", async btn => {
			const horseId = parseInt(btn.customId.replace("horse_", ""));

			await user.GetInfo();
			const result = await racing.PlaceBet(raceInfo.race.id, horseId, amount);

			if (!result.Success) {
				switch (result.Reason) {
				case BetFailureReason.BetTooLow:
					return warn(s.betTooLow(formatMoney(HorseRacing.MIN_BET, language)));
				case BetFailureReason.BetTooHigh:
					return warn(s.betTooHigh(result.Message));
				case BetFailureReason.AlreadyBet:
					return warn(s.alreadyBet);
				case BetFailureReason.RaceClosed:
					return warn(s.bettingClosed);
				default:
					return warn(result.Message);
				}
			}

			// Success — show confirmation
			const { Horse: horse, RaceTime: raceTime } = result;
			const horseName = horse.Name[language];
			const prize = formatMoney(Math.floor(amount * horse.Multiplier), language);

			container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.Casino)
				.addSectionComponents(section => section
					.addTexts([
						s.betPlaced(horse.Emote, horseName, formatMoney(amount, language), prize, horse.Multiplier, raceTime)
					])
					.setThumbnailAccessory(thumb => thumb
						.setURL("https://media.discordapp.net/attachments/1233604589064818808/1499581098408280096/HorseRacing.png"),
					),
				)
				.addFooter({ text: formatMoney(user.Money, language) });

			return replyWithContainer(interaction, container);
		});

		collector?.on("end", async () => {
			await disableButtons(interaction, container);
		});
	},
};

const Strings = {
	[Language.English]: {
		title: "Horse Racing",
		subtitle: "Pick your winner! Rarer horses offer higher multipliers but are harder to win.",
		noRace: "No race is currently scheduled. Check back shortly!",
		horses: "Horses & Payouts",
		payout: "payout",
		raceStats: "Current race",
		nextRace: (date: Date) => `Next race ${time(date, TimestampStyles.RelativeTime)}`,
		totalBets: "Total bets",
		yourBet: "Your bet",
		noBet: "None",
		hint: "Provide an amount with `/horserace <amount>` to place your bet.",
		alreadyBet: "You have already placed a bet on this race.",
		bettingClosed: "**Betting is closed** — the race starts in less than 5 minutes!",
		choosingHorse: (amount: string) => `You are betting **${amount}**. Select your horse below:`,
		betTooLow: (min: string) => `Minimum bet is **${min}** ${EmoteString.Casino}`,
		betTooHigh: (max: string) => `Your bet exceeds the maximum of **${max}** ${EmoteString.Casino}`,
		betPlaced: (emoji: string, name: string, amount: string, prize: string, multiplier: number, raceTime: Date) =>
			`# Bet placed!\n### ${emoji} ${name} (${multiplier}×)\n\nYou bet **${amount}** and can win **${prize}**!\n-# Race starts ${time(raceTime, TimestampStyles.RelativeTime)}. You will receive a DM with the result.`,
	},
	[Language.Portuguese]: {
		title: "Corrida de Cavalos",
		subtitle: "Escolha seu vencedor! Cavalos mais raros oferecem multiplicadores maiores, mas são mais difíceis de ganhar.",
		noRace: "Nenhuma corrida agendada no momento. Volte em breve!",
		horses: "Cavalos & Multiplicadores",
		payout: "de retorno",
		raceStats: "Corrida atual",
		nextRace: (date: Date) => `Próxima corrida ${time(date, TimestampStyles.RelativeTime)}`,
		totalBets: "Total de apostas",
		yourBet: "Sua aposta",
		noBet: "Nenhuma",
		hint: "Use `/corridadecavalos <valor>` para fazer sua aposta.",
		alreadyBet: "Você já fez uma aposta nesta corrida.",
		bettingClosed: "**Apostas encerradas** — a corrida começa em menos de 5 minutos!",
		choosingHorse: (amount: string) => `Você está apostando **${amount}**. Escolha seu cavalo abaixo:`,
		betTooLow: (min: string) => `A aposta mínima é **${min}** ${EmoteString.Casino}`,
		betTooHigh: (max: string) => `Sua aposta ultrapassa o máximo de **${max}** ${EmoteString.Casino}`,
		betPlaced: (emoji: string, name: string, amount: string, prize: string, multiplier: number, raceTime: Date) =>
			`# Aposta realizada!\n### ${emoji} ${name} (${multiplier}×)\n\nVocê apostou **${amount}** e pode ganhar **${prize}**!\n-# A corrida começa ${time(raceTime, TimestampStyles.RelativeTime)}. Você receberá um DM com o resultado.`,
	},
	[Language.Spanish]: {
		title: "Carrera de Caballos",
		subtitle: "¡Elige a tu ganador! Los caballos más raros ofrecen multiplicadores más altos, pero son más difíciles de ganar.",
		noRace: "No hay ninguna carrera programada. ¡Vuelve pronto!",
		horses: "Caballos & Multiplicadores",
		payout: "de retorno",
		raceStats: "Carrera actual",
		nextRace: (date: Date) => `Próxima carrera ${time(date, TimestampStyles.RelativeTime)}`,
		totalBets: "Total de apuestas",
		yourBet: "Tu apuesta",
		noBet: "Ninguna",
		hint: "Usa `/carreradecaballos <cantidad>` para realizar tu apuesta.",
		alreadyBet: "Ya has realizado una apuesta en esta carrera.",
		bettingClosed: "**Apuestas cerradas** — ¡la carrera comienza en menos de 5 minutos!",
		choosingHorse: (amount: string) => `Estás apostando **${amount}**. Selecciona tu caballo a continuación:`,
		betTooLow: (min: string) => `La apuesta mínima es **${min}** ${EmoteString.Casino}`,
		betTooHigh: (max: string) => `Tu apuesta supera el máximo de **${max}** ${EmoteString.Casino}`,
		betPlaced: (emoji: string, name: string, amount: string, prize: string, multiplier: number, raceTime: Date) =>
			`# ¡Apuesta realizada!\n###${emoji} ${name} (${multiplier}×)\n\n¡Apostaste **${amount}** y puedes ganar **${prize}**!\n-# La carrera comienza ${time(raceTime, TimestampStyles.RelativeTime)}. Recibirás un DM con el resultado.`,
	},
} as const satisfies Localization;
