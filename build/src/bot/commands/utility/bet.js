"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const collectors_1 = require("#bot/utils/collectors");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const Casino_1 = require("#core/models/Casino");
const Language_1 = require("#core/models/Language");
const Classes_1 = require("#core/types/Classes");
const discord_js_1 = require("discord.js");
const promises_1 = require("timers/promises");
const BET_COOLDOWN_MS = 10_000;
// While cooling down the user is not "in casino game", so he can be robbed
const lastBetFinishedAtByUserId = new Map();
function getCooldownRemainingSeconds(userId) {
    const finishedAt = lastBetFinishedAtByUserId.get(userId);
    if (finishedAt === undefined)
        return 0;
    return Math.max(0, Math.ceil((finishedAt + BET_COOLDOWN_MS - Date.now()) / 1_000));
}
var CoinSide;
(function (CoinSide) {
    CoinSide[CoinSide["Heads"] = 0] = "Heads";
    CoinSide[CoinSide["Tails"] = 1] = "Tails";
})(CoinSide || (CoinSide = {}));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("bet")
        .setDescription("Bet on a coin flip. Win 1.5x your bet if you are right")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Aposte em cara ou coroa. Ganhe 1.5x sua aposta se acertar")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Apuesta en cara o cruz. Gana 1.5x tu apuesta si aciertas")
        .addIntegerOption((option) => option
        .setName("side")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "lado")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "lado")
        .setDescription("The side of the coin")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O lado da moeda")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "El lado de la moneda")
        .setRequired(true)
        .addChoices([
        {
            name: "Heads",
            value: CoinSide.Heads,
            name_localizations: {
                [discord_js_1.Locale.PortugueseBR]: "Cara",
                [discord_js_1.Locale.SpanishES]: "Cara",
            },
        },
        {
            name: "Tails",
            value: CoinSide.Tails,
            name_localizations: {
                [discord_js_1.Locale.PortugueseBR]: "Coroa",
                [discord_js_1.Locale.SpanishES]: "Cruz",
            },
        },
    ]))
        .addNumberOption((option) => option
        .setName("value")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "valor")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "valor")
        .setDescription("The value of the bet")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O valor da aposta")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "El valor de la apuesta")
        .setRequired(true)
        .setMinValue(500)),
    async execute(interaction, user, language) {
        const side = interaction.options.getInteger("side", true);
        const value = interaction.options.getNumber("value", true);
        let currentBet = value;
        let currentBalance = 0;
        let winStreak = 0;
        let isAllIn = false;
        const s = Strings[language];
        let container;
        function addContainerHeader() {
            return new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(user)
                .setAccentColor(colors_1.CrColors.Casino)
                .addTexts([
                `-# ${emotes_1.EmoteString.Casino} ${s.casino} • ${s.betting} ${(0, ui_1.formatMoney)(currentBet, language)} ${isAllIn ? `• **ALL IN!**` : ""}`,
            ])
                .addLargeSeparator();
        }
        async function playBet(value) {
            if (!await Casino_1.Casino.StartUserGame(user))
                return;
            try {
                return await flipCoin(value);
            }
            finally {
                if (user.Casino.IsInGame) {
                    user.Casino.IsInGame = false;
                    await user.Update({ casinoIsInGame: false });
                }
                lastBetFinishedAtByUserId.set(user.Id, Date.now());
            }
        }
        async function flipCoin(value) {
            container = addContainerHeader()
                .addTexts([
                `${s.flipping} ${emotes_1.EmoteString.Waiting}`,
            ])
                .addFooter({
                text: (0, ui_1.formatMoney)(user.Money, language),
            });
            await (0, discordInteractions_1.replyWithContainer)(interaction, container);
            // Generate numbers between 2_000 and 3_000 (2s and 3s)
            const range = () => Math.floor(Math.random() * 1_001) + 2_000;
            await (0, promises_1.setTimeout)(range());
            const coinFlip = Math.floor(Math.random() * 2);
            const win = side === coinFlip;
            const userClassModifier = (0, Classes_1.getCasinoClassModifier)(user.Class);
            const prize = Math.round(value * 0.5 * userClassModifier);
            if (win) {
                await Casino_1.Casino.FinishUserGameWithWin(user, prize, value);
                currentBalance += prize;
                winStreak += 1;
            }
            else {
                await Casino_1.Casino.FinishUserGameWithLoss(user, value);
                currentBalance -= value;
                winStreak = 0;
            }
            const heads = `${emotes_1.EmoteString.Heads} ${s.heads}`;
            const tails = `${emotes_1.EmoteString.Tails} ${s.tails}`;
            const firstResult = coinFlip === CoinSide.Heads ? heads : tails;
            const userBet = side == CoinSide.Heads ? heads : tails;
            container = addContainerHeader()
                .addTexts([
                `### ${s.result(firstResult)}`,
                `${win ? `${emotes_1.EmoteString.Victory} ${s.won}` : `${emotes_1.EmoteString.Defeat} ${s.lose}`} ${(0, ui_1.formatMoney)(win ? prize : value, language)}!`,
                `-# ${s.bet} ${(0, ui_1.formatMoney)(value, language)} ${s.at} ${userBet}`,
            ])
                .addLargeSeparator()
                .addTexts([
                `-# ${s.currentBalance}: ${(0, ui_1.formatMoney)(currentBalance, language)}`,
                winStreak > 1 ? `-# ${s.winStreak(winStreak)}` : false,
            ].filter(Boolean))
                .addButtonRow(btn => btn
                .setCustomId("playsamevalue")
                .setLabel(s.betAgain)
                .setDisabled(user.Money < value)
                .setStyle(discord_js_1.ButtonStyle.Secondary), btn => btn
                .setCustomId("playdouble")
                .setLabel(s.betDouble)
                .setDisabled(user.Money < value * 2)
                .setStyle(discord_js_1.ButtonStyle.Success), btn => btn
                .setCustomId("allin")
                .setLabel("ALL IN!")
                .setDisabled(user.Money === 0)
                .setStyle(discord_js_1.ButtonStyle.Danger))
                .addFooter({
                text: (0, ui_1.formatMoney)(user.Money, language),
            });
            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
        }
        async function checkIfCanPlay(value) {
            const { canPlay, message } = await Casino_1.Casino.CanUserPlayGame(user, value);
            if (!canPlay) {
                container = addContainerHeader()
                    .addTexts([
                    message,
                ]);
                if (currentBalance !== 0) {
                    container.addTexts([
                        `-# ${s.totalBalance}: ${(0, ui_1.formatMoney)(currentBalance, language)}`,
                    ]);
                }
                container.addFooter({
                    text: (0, ui_1.formatMoney)(user.Money, language),
                });
                await (0, discordInteractions_1.replyWithContainer)(interaction, container);
                return false;
            }
            return true;
        }
        const initialCooldown = getCooldownRemainingSeconds(user.Id);
        if (initialCooldown > 0) {
            return (0, discordInteractions_1.replyWithContainer)(interaction, addContainerHeader().addTexts([s.cooldown(initialCooldown)]));
        }
        if (!await checkIfCanPlay(value))
            return;
        const response = await playBet(value);
        if (!response)
            return;
        const collector = (0, collectors_1.createButtonCollector)(interaction, response);
        collector?.on("end", async () => {
            await (0, collectors_1.disableButtons)(interaction, container);
        });
        let isProcessingClick = false;
        collector?.on("collect", async (btn) => {
            await (0, discordInteractions_1.deferUpdate)(btn);
            // Discord lag can deliver repeated clicks while a round is still running
            if (isProcessingClick)
                return;
            isProcessingClick = true;
            try {
                const remainingSeconds = getCooldownRemainingSeconds(user.Id);
                if (remainingSeconds > 0) {
                    await btn.followUp({ content: s.cooldown(remainingSeconds), flags: discord_js_1.MessageFlags.Ephemeral });
                    return;
                }
                await user.GetInfo();
                if (btn.customId === "playsamevalue") {
                    isAllIn = false;
                    if (!await checkIfCanPlay(currentBet))
                        return;
                    await playBet(currentBet);
                }
                else if (btn.customId === "playdouble") {
                    currentBet *= 2;
                    isAllIn = false;
                    if (!await checkIfCanPlay(currentBet))
                        return;
                    await playBet(currentBet);
                }
                else if (btn.customId === "allin") {
                    currentBet = user.Money;
                    isAllIn = true;
                    if (!await checkIfCanPlay(currentBet))
                        return;
                    await playBet(currentBet);
                }
            }
            finally {
                isProcessingClick = false;
            }
        });
    },
};
const Strings = {
    [Language_1.Language.English]: {
        casino: "Casino",
        title: "Coin Flip",
        flipping: "Flipping the coin",
        heads: "Heads",
        tails: "Tails",
        won: "You **won**",
        lose: "You **lost**",
        bet: "You bet",
        at: "at",
        result: (result) => `The result was ${result}`,
        noMoney: "You don't have enough money to bet.",
        betting: "Betting",
        betAgain: "Bet again!",
        betDouble: "Double bet!",
        currentBalance: "Current balance",
        totalBalance: "Total balance",
        winStreak: (value) => `You won ${value} times in a row`,
        cooldown: (seconds) => `Wait ${seconds}s before betting again.`,
    },
    [Language_1.Language.Portuguese]: {
        casino: "Cassino",
        title: "Cara ou Coroa",
        flipping: "Jogando a moeda",
        heads: "Cara",
        tails: "Coroa",
        won: "Você **ganhou**",
        lose: "Você **perdeu**",
        bet: "Você apostou",
        at: "em",
        result: (result) => `O resultado foi ${result}`,
        noMoney: "Você não possui dinheiro suficiente para apostar.",
        betting: "Apostando",
        betAgain: "Apostar novamente!",
        betDouble: "Dobrar aposta!",
        currentBalance: "Balanço atual",
        totalBalance: "Balanço total",
        winStreak: (value) => `Você ganhou ${value} seguidas`,
        cooldown: (seconds) => `Aguarde ${seconds}s para apostar novamente.`,
    },
    [Language_1.Language.Spanish]: {
        casino: "Casino",
        title: "Cara o Cruz",
        flipping: "Lanzando la moneda",
        heads: "Cara",
        tails: "Cruz",
        won: "¡**Ganaste**",
        lose: "¡**Perdiste**",
        bet: "Apostaste",
        at: "en",
        result: (result) => `El resultado fue ${result}`,
        noMoney: "No tienes suficiente dinero para apostar.",
        betting: "Apostando",
        betAgain: "Apostar de nuevo!",
        betDouble: "Doblar la apuesta!",
        currentBalance: "Balanco actual",
        totalBalance: "Balanco total",
        winStreak: (value) => `Ganaste ${value} seguidas`,
        cooldown: (seconds) => `Espera ${seconds}s para apostar de nuevo.`,
    },
};
//# sourceMappingURL=bet.js.map