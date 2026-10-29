"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const Language_1 = require("#core/models/Language");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("casino")
        .setDescription("Check the casino games")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "cassino")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "casino")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Conheça os jogos do cassino")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Conoce los juegos del casino"),
    async execute(interaction, user, language) {
        const s = Strings[language];
        const container = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(user)
            .setAccentColor(colors_1.CrColors.Casino)
            .addSectionComponents(section => section
            .addTexts([
            `# ${s.title}`,
            s.description,
            `-# ${s.description2}`,
        ])
            .setThumbnailAccessory(thumb => thumb
            .setURL("https://media.discordapp.net/attachments/1233604589064818808/1460598163546312857/Casino_New.png")))
            .addLargeSeparator()
            .addTexts([
            `### ${emotes_1.EmoteString.Heads} ${s.headsTailsTitle}`,
            s.headTailsDescription,
            `-# ${s.headTailsDescription2}`,
        ])
            .addLargeSeparator()
            .addTexts([
            `### ${emotes_1.EmoteString.HorseRacing} ${s.horseRaceTitle}`,
            s.horseRaceDescription,
            `-# ${s.horseRaceDescription2}`,
        ])
            .addLargeSeparator()
            .addTexts([
            `### ${emotes_1.EmoteString.RussianRoulette} ${s.russianRouletteTitle}`,
            s.russianRouletteDescription,
            `-# ${s.russianRouletteDescription2}`,
        ])
            .addLargeSeparator()
            .addTexts([
            `### ${emotes_1.EmoteString.Ticket} ${s.lotteryTitle}`,
            s.lotteryDescription,
            `-# ${s.lotteryDescription2}`,
        ])
            .addFooter({
            text: (0, ui_1.formatMoney)(user.Money, language),
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
const Strings = {
    [Language_1.Language.English]: {
        title: "Casino",
        description: `Den of iniquity! Bet, win, lose, break the bank!`,
        description2: `Here you can bet and lose all your money!`,
        headsTailsTitle: `Heads or Tails`,
        headTailsDescription: `Bet an amount on a coin that must fall on the same side that you choose. You have a 50% chance of winning. If you win, you get 1.5x the amount bet!`,
        headTailsDescription2: `Use \`/bet <side> <value>\` to bet on heads or tails.`,
        horseRaceTitle: `Horse Racing`,
        horseRaceDescription: `Bet on your favorite horse! Races run every 4 hours. Winners receive fixed-odds payouts based on the horse's rarity and multiplier.`,
        horseRaceDescription2: `Use \`/horserace <amount>\` to place your bet.`,
        russianRouletteTitle: `Russian Roulette`,
        russianRouletteDescription: `Bet an amount and compete against your friends. Only one will walk away with the cash and all others will be ${emotes_1.EmoteString.Hospital} Hospitalized!`,
        russianRouletteDescription2: `Use \`/russianroulette <value>\` to start a new roulette.`,
        lotteryTitle: `Winning Ticket`,
        lotteryDescription: `Buy a ticket for the daily draw at 18h! The more people buy, the bigger the prize! VIPs have a 25% discount on tickets!`,
        lotteryDescription2: `Use \`/lottery\` to see the next draw and buy your ticket.`,
    },
    [Language_1.Language.Portuguese]: {
        title: "Cassino",
        description: `Antro da perdição! Aposte, ganhe, perca, quebre a banca!`,
        description2: `Aqui você pode apostar e perder todo seu dinheiro!`,
        headsTailsTitle: `Cara ou Coroa`,
        headTailsDescription: `Aposte um valor em uma moeda que deve cair no mesmo lado que você escolheu. Você tem 50% de chance de vencer. Se vencer, ganha 1.5x o valor apostado!`,
        headTailsDescription2: `Use \`/bet <lado> <valor>\` para apostar em cara ou coroa.`,
        horseRaceTitle: `Corrida de Cavalos`,
        horseRaceDescription: `Aposte no seu cavalo favorito! As corridas acontecem a cada 4 horas. Os vencedores recebem prêmios fixos baseados no multiplicador e raridade do cavalo.`,
        horseRaceDescription2: `Use \`/corridadecavalos <valor>\` para fazer sua aposta.`,
        russianRouletteTitle: `Roleta Russa`,
        russianRouletteDescription: `Aposte um valor e dispute contra seus amigos. Apenas um sairá com a grana e todos os outros ficarão ${emotes_1.EmoteString.Hospital} Hospitalizados!`,
        russianRouletteDescription2: `Use \`/roletarussa <valor>\` para iniciar uma nova roleta.`,
        lotteryTitle: `Bilhete Premiado`,
        lotteryDescription: `Compre um bilhete para o sorteio diário às 18h! Quanto mais compram, maior o prêmio! VIPs possuem 25% de desconto no bilhete!`,
        lotteryDescription2: `Use \`/bilhete\` para ver o próximo sorteio e comprar seu ingresso.`,
    },
    [Language_1.Language.Spanish]: {
        title: "Casino",
        description: `Den de iniquidad! Apuesta, gana, pierde, rompe el banco!`,
        description2: `¡Aquí puedes apostar y perder todo tu dinero!`,
        headsTailsTitle: `Cara o Cruz`,
        headTailsDescription: `Apostar una cantidad en una moneda que debe caer del mismo lado que elijas. Tienes un 50% de posibilidades de ganar. ¡Si ganas, obtienes 1.5 veces la cantidad apostada!`,
        headTailsDescription2: `Usa \`/bet <lado> <valor>\` para apostar en cara o cruz.`,
        horseRaceTitle: `Carrera de Caballos`,
        horseRaceDescription: `¡Apuesta por tu caballo favorito! Las carreras se celebran cada 4 horas. ¡Los ganadores reciben pagos fijos basados en el multiplicador y la rareza del caballo!`,
        horseRaceDescription2: `Usa \`/carreradecaballos <cantidad>\` para realizar tu apuesta.`,
        russianRouletteTitle: `Roleta Russa`,
        russianRouletteDescription: `Apuesta una cantidad y compete contra tus amigos. ¡Solo uno se llevará el dinero y todos los demás quedarán ${emotes_1.EmoteString.Hospital} Hospitalizados!`,
        russianRouletteDescription2: `Usa \`/ruletarusa <apuesta>\` para iniciar una nueva ruleta.`,
        lotteryTitle: `Billete Premiado`,
        lotteryDescription: `¡Compra un billete para el sorteo diario a las 18h! ¡Cuantos más compren, mayor será el premio! ¡Los VIP tienen un 25% de descuento en el billete!`,
        lotteryDescription2: `Usa \`/billete\` para ver el próximo sorteo y comprar tu billete.`,
    },
};
//# sourceMappingURL=casino.js.map