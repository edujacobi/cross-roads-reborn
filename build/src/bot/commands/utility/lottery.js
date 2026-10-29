"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const badges_1 = require("#bot/utils/badges");
const collectors_1 = require("#bot/utils/collectors");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const Language_1 = require("#core/models/Language");
const Lottery_1 = require("#core/models/Lottery");
const Classes_1 = require("#core/types/Classes");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("lottery")
        .setDescription("Buy a ticket and hope to be the winner!")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "bilhete")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "loteria")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Compre um bilhete e torça para ser o vencedor!")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "¡Compra un boleto y espera ser el ganador!"),
    async execute(interaction, user, language) {
        const s = Strings[language];
        const draw = await Lottery_1.Lottery.GetNextDraw();
        if (!draw) {
            const container = new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(user)
                .setAccentColor(colors_1.CrColors.Casino)
                .addTexts([s.noDrawActive]);
            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
        }
        const ticketPrice = Lottery_1.Lottery.GetTicketPrice(draw.drawTime);
        const ticketCost = Lottery_1.Lottery.GetTicketCost(draw.drawTime, user.IsVip());
        const isMega = Lottery_1.Lottery.IsMegaDraw(draw.drawTime);
        const hasVipDiscount = user.IsVip() && ticketCost < ticketPrice;
        const lastWinnerInfo = await Lottery_1.Lottery.GetLastWinner();
        let lastWinnerText = `${s.noLastWinner}`;
        if (lastWinnerInfo && lastWinnerInfo.user && lastWinnerInfo.ticket) {
            lastWinnerText = s.lastWinner(lastWinnerInfo.user.GetNameWithImage() || "Unknown", (0, ui_1.formatMoney)(lastWinnerInfo.ticket.winnings, language));
        }
        const hasBought = await Lottery_1.Lottery.HasUserBoughtTicket(user.Id, draw.id);
        const accumulatorText = `${(0, ui_1.formatMoney)(draw.totalAmount, language)} (${draw.totalTickets})`;
        const casinoModifier = (0, Classes_1.getCasinoClassModifier)(user.Class);
        const modifierPerc = Math.round((casinoModifier - 1) * 100);
        let modifierText = "";
        if (modifierPerc !== 0) {
            const classData = Classes_1.ClassList[user.Class];
            const vicDefEmote = modifierPerc > 0 ? emotes_1.EmoteString.Victory : emotes_1.EmoteString.Defeat;
            const classEmote = classData.Image.Emote.String;
            const className = classData.Name[language];
            const humanReadableMod = `${modifierPerc > 0 ? `+` : ""}${modifierPerc}% ${s.wins}`;
            modifierText = s.modifierText(vicDefEmote, classEmote, className, humanReadableMod);
        }
        const container = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(user)
            .setAccentColor(colors_1.CrColors.Casino)
            .addSectionComponents(section => section
            .addTexts([
            `# ${s.title}`,
            s.description,
            ...(modifierText ? [modifierText] : []),
        ])
            .setThumbnailAccessory(thumb => thumb
            .setURL("https://media.discordapp.net/attachments/1233604589064818808/1494366208307499199/Ticket.png")))
            .addLargeSeparator()
            .addTexts([
            isMega ?
                `## ${emotes_1.EmoteString.MegaTicket} ${s.megaDrawTitle}` :
                `### ${emotes_1.EmoteString.Ticket} ${s.nextDrawTitle}`,
            s.nextDrawInfo((0, discord_js_1.time)(draw.drawTime, discord_js_1.TimestampStyles.RelativeTime), (0, ui_1.formatMoney)(ticketCost, language), hasVipDiscount ? (0, ui_1.formatMoney)(ticketPrice, language) : undefined),
            s.accumulated(accumulatorText),
            lastWinnerText
        ]);
        if (hasBought) {
            container
                .addLargeSeparator()
                .addTexts([
                s.alreadyBought(hasBought.id)
            ])
                .addFooter({
                text: (0, ui_1.formatMoney)(user.Money, language),
            });
            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
        }
        container.addFooter({
            text: (0, ui_1.formatMoney)(user.Money, language),
            button: new discord_js_1.ButtonBuilder()
                .setCustomId("lottery_buy_ticket")
                .setLabel(s.buyButton)
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setEmoji(isMega ? emotes_1.EmoteId.MegaTicket : emotes_1.EmoteId.Ticket),
        });
        const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
        const collector = (0, collectors_1.createButtonCollector)(interaction, response);
        collector?.on("collect", async (btn) => {
            if (btn.customId === "lottery_buy_ticket") {
                const confirmContainer = new CustomContainerBuilder_1.CustomContainerBuilder()
                    .setUser(user)
                    .setAccentColor(colors_1.CrColors.Casino)
                    .addTexts([
                    `### ${emotes_1.EmoteString.Ticket} ${s.confirmTitle}`,
                    s.confirmDescription((0, ui_1.formatMoney)(ticketCost, language))
                ])
                    .addButtonRow(btnConfirm => btnConfirm
                    .setCustomId("confirm")
                    .setLabel(s.confirmButton)
                    .setStyle(discord_js_1.ButtonStyle.Success))
                    .addFooter({
                    text: (0, ui_1.formatMoney)(user.Money, language),
                });
                await (0, discordInteractions_1.replyWithContainer)(interaction, confirmContainer);
            }
            else if (btn.customId === "confirm") {
                await (0, discordInteractions_1.deferUpdate)(btn);
                await user.GetInfo();
                const buyResult = await Lottery_1.Lottery.BuyTicket(user);
                const resultContainer = new CustomContainerBuilder_1.CustomContainerBuilder()
                    .setUser(user)
                    .setAccentColor(buyResult.success ? colors_1.CrColors.Casino : discord_js_1.Colors.Red)
                    .addTexts([
                    `${emotes_1.EmoteString.Ticket} ${buyResult.message}`
                ])
                    .addFooter({
                    text: (0, ui_1.formatMoney)(user.Money, language),
                });
                await (0, discordInteractions_1.replyWithContainer)(interaction, resultContainer);
            }
        });
        collector?.on("end", async () => {
            await (0, collectors_1.disableButtons)(interaction, container);
        });
    },
};
const Strings = {
    [Language_1.Language.English]: {
        noDrawActive: "There is no draw active right now. Please check back later.",
        noLastWinner: "No last winner",
        lastWinner: (name, prize) => `-# ${badges_1.EmoteBadgeString.Season6.LuckyOne} Last winner: **${name}** won **${prize}**!`,
        title: "Winning ticket",
        description: `Buy a ticket and test your luck! Draws every day at 6pm.\n${emotes_1.EmoteString.VIP} VIPs have a 25% discount on tickets!`,
        wins: "wins",
        modifierText: (vicDef, classEmote, className, val) => `-# ${vicDef} You are a ${classEmote} ${className} and have ${val}.`,
        confirmTitle: "Confirm purchase",
        confirmDescription: (price) => `Are you sure you want to buy a ticket for **${price}**?`,
        confirmButton: "Confirm",
        nextDrawTitle: "Next draw",
        megaDrawTitle: "Mega Draw!",
        nextDrawInfo: (time, price, originalPrice) => `Takes place ${time}\nTicket Price: ${originalPrice ? `~~${originalPrice}~~ → ` : ""}**${price}**`,
        accumulated: (prize) => `Accumulated prize pool: **${prize}**`,
        alreadyBought: (ticketId) => `You already have Ticket #${ticketId}. Good luck!`,
        buyButton: "Buy ticket",
    },
    [Language_1.Language.Portuguese]: {
        noDrawActive: "Não há nenhum sorteio ativo no momento. Volte mais tarde.",
        noLastWinner: "Sem vencedor anterior",
        lastWinner: (name, prize) => `-# ${badges_1.EmoteBadgeString.Season6.LuckyOne} Último vencedor: **${name}** ganhou **${prize}**!`,
        title: "Bilhete premiado",
        description: `Compre um bilhete e teste sua sorte! Sorteios todo dia às 18h.\n${emotes_1.EmoteString.VIP} VIPs possuem 25% de desconto no bilhete!`,
        wins: "ganhos",
        modifierText: (vicDef, classEmote, className, val) => `-# ${vicDef} Você é ${classEmote} ${className} e possui ${val}.`,
        confirmTitle: "Confirmar compra",
        confirmDescription: (price) => `Você tem certeza de que deseja comprar um bilhete por **${price}**?`,
        confirmButton: "Confirmar",
        nextDrawTitle: "Próximo sorteio",
        megaDrawTitle: "Mega da Virada!",
        nextDrawInfo: (time, price, originalPrice) => `Acontece ${time}\nPreço do Bilhete: ${originalPrice ? `~~${originalPrice}~~ → ` : ""}**${price}**`,
        accumulated: (prize) => `Prêmio acumulado: **${prize}**`,
        alreadyBought: (ticketId) => `Você já possui o Bilhete #${ticketId}. Boa sorte!`,
        buyButton: "Comprar bilhete",
    },
    [Language_1.Language.Spanish]: {
        noDrawActive: "No hay ningún sorteo activo en este momento. Vuelve más tarde.",
        noLastWinner: "Sin ganador anterior",
        lastWinner: (name, prize) => `-# ${badges_1.EmoteBadgeString.Season6.LuckyOne} Último ganador: **${name}** ganó **${prize}**!`,
        title: "Billete premiado",
        description: `¡Compra un billete y pon a prueba tu suerte! Sorteos todos los días a las 18h.\n${emotes_1.EmoteString.VIP} Los VIP tienen un 25% de descuento en el billete!`,
        wins: "ganancias",
        modifierText: (vicDef, classEmote, className, val) => `-# ${vicDef} Eres ${classEmote} ${className} y tienes ${val}.`,
        confirmTitle: "Confirmar compra",
        confirmDescription: (price) => `¿Estás seguro de que quieres comprar un billete por **${price}**?`,
        confirmButton: "Confirmar",
        nextDrawTitle: "Próximo sorteio",
        megaDrawTitle: "¡Mega Sorteio!",
        nextDrawInfo: (time, price, originalPrice) => `Ocurre ${time}\nPrecio del Billete: ${originalPrice ? `~~${originalPrice}~~ → ` : ""}**${price}**`,
        accumulated: (prize) => `Premio acumulado: **${prize}**`,
        alreadyBought: (ticketId) => `Ya tienes el Billete #${ticketId}. ¡Buena suerte!`,
        buyButton: "Comprar billete",
    },
};
//# sourceMappingURL=lottery.js.map