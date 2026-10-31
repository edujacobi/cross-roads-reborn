"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const ui_1 = require("#bot/utils/ui");
const BlackMarket_1 = require("#core/models/BlackMarket");
const discord_js_1 = require("discord.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const shopCommand = require("./shop");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("blackmarket")
        .setDescription("Open the Black market to buy something")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "mercadonegro")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "mercadonegro")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Abra o Mercado negro para comprar alguma coisa")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Abrir el mercado negro para comprar artículos ilegales"),
    async execute(interaction, user, language) {
        const blackMarket = new BlackMarket_1.BlackMarket(user);
        const { isOpen, message } = blackMarket.IsBlackMarketOpen();
        if (!isOpen) {
            const container = (0, ui_1.defaultComponent)({
                user,
                color: colors_1.CrColors.BlackMarket,
                description: message,
                footer: (0, ui_1.formatMoney)(user.Money, language),
            });
            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
        }
        await shopCommand.execute(interaction, user, language, blackMarket);
    },
};
//# sourceMappingURL=blackmarket.js.map