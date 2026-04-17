import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { EmoteBadgeString } from "#bot/utils/badges";
import { createButtonCollector, disableButtons } from "#bot/utils/collectors";
import { CrColors } from "#bot/utils/colors";
import { deferUpdate, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteId, EmoteString } from "#bot/utils/emotes";
import { formatMoney, showTime } from "#bot/utils/ui";
import { Language, type Localization } from "#core/models/Language";
import { Lottery } from "#core/models/Lottery";
import type { User } from "#core/models/User";
import { ClassList, getCasinoClassModifier } from "#core/types/Classes";
import { ButtonBuilder, ButtonStyle, type ChatInputCommandInteraction, Colors, Locale, SlashCommandBuilder } from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("lottery")
		.setDescription("Buy a ticket and hope to be the winner!")
		.setNameLocalization(Locale.PortugueseBR, "bilhete")
		.setDescriptionLocalization(Locale.PortugueseBR, "Compre um bilhete e torça para ser o vencedor!"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];

		const draw = await Lottery.GetNextDraw();
		if (!draw) {
			const container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.Casino)
				.addTexts([s.noDrawActive]);
			return replyWithContainer(interaction, container);
		}

		const ticketPrice = Lottery.GetTicketPrice(draw.drawTime);
		const ticketCost = Lottery.GetTicketCost(draw.drawTime, user.IsVip());
		const isMega = Lottery.IsMegaDraw(draw.drawTime);
		const hasVipDiscount = user.IsVip() && ticketCost < ticketPrice;

		const lastWinnerInfo = await Lottery.GetLastWinner();
		let lastWinnerText = `${s.noLastWinner}`;

		if (lastWinnerInfo && lastWinnerInfo.user && lastWinnerInfo.ticket) {
			lastWinnerText = s.lastWinner(
				lastWinnerInfo.user.GetNameWithImage() || "Unknown",
				formatMoney(lastWinnerInfo.ticket.winnings, language)
			);
		}

		const hasBought = await Lottery.HasUserBoughtTicket(user.Id, draw.id);

		const accumulatorText = `${formatMoney(draw.totalAmount, language)} (${draw.totalTickets})`;

		const casinoModifier = getCasinoClassModifier(user.Class);
		const modifierPerc = Math.round((casinoModifier - 1) * 100);
		let modifierText = "";

		if (modifierPerc !== 0) {
			const classData = ClassList[user.Class];
			const vicDefEmote = modifierPerc > 0 ? EmoteString.Victory : EmoteString.Defeat;
			const classEmote = classData.Image.Emote.String;
			const className = classData.Name[language];
			const humanReadableMod = `${modifierPerc > 0 ? `+` : ""}${modifierPerc}% ${s.wins}`;
			modifierText = s.modifierText(vicDefEmote, classEmote, className, humanReadableMod);
		}

		const container = new CustomContainerBuilder()
			.setUser(user)
			.setAccentColor(CrColors.Casino)
			.addSectionComponents(section => section
				.addTexts([
					`# ${s.title}`,
					s.description,
					...(modifierText ? [modifierText] : []),
				])
				.setThumbnailAccessory(thumb => thumb
					.setURL("https://media.discordapp.net/attachments/1233604589064818808/1494366208307499199/Ticket.png")
				)
			)
			.addLargeSeparator()
			.addTexts([
				isMega ?
					`## ${EmoteString.MegaTicket} ${s.megaDrawTitle}` :
					`### ${EmoteString.Ticket} ${s.nextDrawTitle}`,
				s.nextDrawInfo(showTime(draw.drawTime.getTime(), true), formatMoney(ticketCost, language), hasVipDiscount ? formatMoney(ticketPrice, language) : undefined),
				s.accumulated(accumulatorText),
				lastWinnerText
			]);

		if (hasBought) {
			container
				.addLargeSeparator()
				.addTexts([
					s.alreadyBought(hasBought.id)
				])
				.addFooter();

			return replyWithContainer(interaction, container);
		}

		container.addFooter({
			text: formatMoney(user.Money, language),
			button: new ButtonBuilder()
				.setCustomId("lottery_buy_ticket")
				.setLabel(s.buyButton)
				.setStyle(ButtonStyle.Secondary)
				.setEmoji(isMega ? EmoteId.MegaTicket : EmoteId.Ticket),
		});

		const response = await replyWithContainer(interaction, container);

		const collector = createButtonCollector(interaction, response);

		collector?.on("collect", async btn => {
			if (btn.customId === "lottery_buy_ticket") {
				const confirmContainer = new CustomContainerBuilder()
					.setUser(user)
					.setAccentColor(CrColors.Casino)
					.addTexts([
						`### ${EmoteString.Ticket} ${s.confirmTitle}`,
						s.confirmDescription(formatMoney(ticketCost, language))
					])
					.addButtonRow(btnConfirm => btnConfirm
						.setCustomId("confirm")
						.setLabel(s.confirmButton)
						.setStyle(ButtonStyle.Success)
					)
					.addFooter({
						text: formatMoney(user.Money, language),
					});

				await replyWithContainer(interaction, confirmContainer);
			}

			else if (btn.customId === "confirm") {
				await deferUpdate(btn);
				await user.GetInfo();

				const buyResult = await Lottery.BuyTicket(user);

				const resultContainer = new CustomContainerBuilder()
					.setUser(user)
					.setAccentColor(buyResult.success ? CrColors.Casino : Colors.Red)
					.addTexts([
						`${EmoteString.Ticket} ${buyResult.message}`
					])
					.addFooter({
						text: formatMoney(user.Money, language),
					});

				await replyWithContainer(interaction, resultContainer);
			}
		});

		collector?.on("end", async () => {
			await disableButtons(interaction, container);
		});
	},
};

const Strings = {
	[Language.English]: {
		noDrawActive: "There is no draw active right now. Please check back later.",
		noLastWinner: "No last winner",
		lastWinner: (name: string, prize: string) => `-# ${EmoteBadgeString.Season6.LuckyOne} Last winner: **${name}** won **${prize}**!`,
		title: "Winning ticket",
		description: `Buy a ticket and test your luck! Draws every day at 6pm.\n${EmoteString.VIP} VIPs have a 25% discount on tickets!`,
		wins: "wins",
		modifierText: (vicDef: string, classEmote: string, className: string, val: string) => `-# ${vicDef} You are a ${classEmote} ${className} and have ${val}.`,
		confirmTitle: "Confirm purchase",
		confirmDescription: (price: string) => `Are you sure you want to buy a ticket for **${price}**?`,
		confirmButton: "Confirm",
		nextDrawTitle: "Next draw",
		megaDrawTitle: "Mega Draw!",
		nextDrawInfo: (time: string, price: string, originalPrice?: string) => `Takes place ${time}\nTicket Price: ${originalPrice ? `~~${originalPrice}~~ → ` : ""}**${price}**`,
		accumulated: (prize: string) => `Accumulated prize pool: **${prize}**`,
		alreadyBought: (ticketId: number) => `You already have Ticket #${ticketId}. Good luck!`,
		buyButton: "Buy ticket",
	},
	[Language.Portuguese]: {
		noDrawActive: "Não há nenhum sorteio ativo no momento. Volte mais tarde.",
		noLastWinner: "Sem vencedor anterior",
		lastWinner: (name: string, prize: string) => `-# ${EmoteBadgeString.Season6.LuckyOne} Último vencedor: **${name}** ganhou **${prize}**!`,
		title: "Bilhete premiado",
		description: `Compre um bilhete e teste sua sorte! Sorteios todo dia às 18h.\n${EmoteString.VIP} VIPs possuem 25% de desconto no bilhete!`,
		wins: "ganhos",
		modifierText: (vicDef: string, classEmote: string, className: string, val: string) => `-# ${vicDef} Você é ${classEmote} ${className} e possui ${val}.`,
		confirmTitle: "Confirmar compra",
		confirmDescription: (price: string) => `Você tem certeza de que deseja comprar um bilhete por **${price}**?`,
		confirmButton: "Confirmar",
		nextDrawTitle: "Próximo sorteio",
		megaDrawTitle: "Mega da Virada!",
		nextDrawInfo: (time: string, price: string, originalPrice?: string) => `Acontece ${time}\nPreço do Bilhete: ${originalPrice ? `~~${originalPrice}~~ → ` : ""}**${price}**`,
		accumulated: (prize: string) => `Prêmio acumulado: **${prize}**`,
		alreadyBought: (ticketId: number) => `Você já possui o Bilhete #${ticketId}. Boa sorte!`,
		buyButton: "Comprar bilhete",
	},
	[Language.Spanish]: {
		noDrawActive: "No hay ningún sorteo activo en este momento. Vuelve más tarde.",
		noLastWinner: "Sin ganador anterior",
		lastWinner: (name: string, prize: string) => `-# ${EmoteBadgeString.Season6.LuckyOne} Último ganador: **${name}** ganó **${prize}**!`,
		title: "Billete premiado",
		description: `¡Compra un billete y pon a prueba tu suerte! Sorteos todos los días a las 18h.\n${EmoteString.VIP} Los VIP tienen un 25% de descuento en el billete!`,
		wins: "ganancias",
		modifierText: (vicDef: string, classEmote: string, className: string, val: string) => `-# ${vicDef} Eres ${classEmote} ${className} y tienes ${val}.`,
		confirmTitle: "Confirmar compra",
		confirmDescription: (price: string) => `¿Estás seguro de que quieres comprar un billete por **${price}**?`,
		confirmButton: "Confirmar",
		nextDrawTitle: "Próximo sorteio",
		megaDrawTitle: "¡Mega Sorteio!",
		nextDrawInfo: (time: string, price: string, originalPrice?: string) => `Ocurre ${time}\nPrecio del Billete: ${originalPrice ? `~~${originalPrice}~~ → ` : ""}**${price}**`,
		accumulated: (prize: string) => `Premio acumulado: **${prize}**`,
		alreadyBought: (ticketId: number) => `Ya tienes el Billete #${ticketId}. ¡Buena suerte!`,
		buyButton: "Comprar billete",
	},
} as const satisfies Localization;
