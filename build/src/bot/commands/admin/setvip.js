"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const ui_1 = require("#bot/utils/ui");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const Language_1 = require("#core/models/Language");
const userUtils_1 = require("#bot/utils/userUtils");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("setvip")
        .setDescription("Set VIP to an user!")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Adicione VIP para um usuário!")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption((option) => option
        .setName("userid")
        .setDescription("The userId who will receive the vip")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O Id do usuário que vai receber o VIP")
        .setRequired(true))
        .addIntegerOption((option) => option
        .setName("days")
        .setDescription("How many days of VIP to add")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Quantos dias adicionar")
        .setRequired(true)),
    async execute(interaction, user) {
        const userId = interaction.options.getString("userid", true);
        const days = interaction.options.getInteger("days", true);
        const target = await (0, userUtils_1.checkUser)(userId, interaction);
        if (!target) {
            return (0, discordInteractions_1.replyInteraction)(interaction, "Didn't find this user");
        }
        await target?.AddVip(days);
        const messages = {
            [Language_1.Language.English]: `${emotes_1.EmoteString.VIP} You received ${days} days of VIP`,
            [Language_1.Language.Portuguese]: `${emotes_1.EmoteString.VIP} Você recebeu ${days} dias de VIP`,
            [Language_1.Language.Spanish]: `${emotes_1.EmoteString.VIP} Has recibido ${days} días de VIP`,
        };
        await (0, discordInteractions_1.sendPrivateMessage)(userId, messages[target.Language], discord_js_1.Colors.Gold);
        const container = (0, ui_1.defaultComponent)({
            user,
            color: discord_js_1.Colors.Gold,
            description: `${emotes_1.EmoteString.VIP} ${days} days of VIP added to user **${target.GetNameWithImage()}**`,
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
//# sourceMappingURL=setvip.js.map