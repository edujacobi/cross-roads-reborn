"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const ui_1 = require("#bot/utils/ui");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const Language_1 = require("#core/models/Language");
const colors_1 = require("#bot/utils/colors");
const userUtils_1 = require("#bot/utils/userUtils");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("addcoins")
        .setDescription("Add Special Coins to an user!")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Adicione Moedas Especiais para um usuário!")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption((option) => option
        .setName("userid")
        .setDescription("The userId who will receive the coins")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O Id do usuário que vai receber as moedas")
        .setRequired(true))
        .addIntegerOption((option) => option
        .setName("coins")
        .setDescription("How many coins to add")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Quantas moedas adicionar")
        .setRequired(true)),
    async execute(interaction, user) {
        const userId = interaction.options.getString("userid", true);
        const coins = interaction.options.getInteger("coins", true);
        const target = await (0, userUtils_1.checkUser)(userId, interaction);
        if (!target) {
            return;
        }
        await target.AddSpecialCoin(coins);
        const messages = {
            [Language_1.Language.English]: `You received ${emotes_1.EmoteString.SpecialCoinShop}${(0, ui_1.formatMoney)(coins, Language_1.Language.English, "")} Special Coins!`,
            [Language_1.Language.Portuguese]: `Você recebeu ${emotes_1.EmoteString.SpecialCoinShop}${(0, ui_1.formatMoney)(coins, Language_1.Language.Portuguese, "")} Moedas Especiais!`,
            [Language_1.Language.Spanish]: `Has recibido ${emotes_1.EmoteString.SpecialCoinShop}${(0, ui_1.formatMoney)(coins, Language_1.Language.Spanish, "")} Monedas Especiales!`,
        };
        await (0, discordInteractions_1.sendPrivateMessage)(userId, messages[target.Language], colors_1.CrColors.SpecialShop);
        const container = (0, ui_1.defaultComponent)({
            user,
            color: colors_1.CrColors.SpecialShop,
            description: `${emotes_1.EmoteString.SpecialCoinShop}${(0, ui_1.formatMoney)(coins, Language_1.Language.English, "")} Special Coins added to user **${target.GetNameWithImage()}**`,
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
//# sourceMappingURL=addcoins.js.map