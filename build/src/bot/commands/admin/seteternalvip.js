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
        .setName("seteternalvip")
        .setDescription("Set eternal VIP to an user!")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Adicione VIP eterno para um usuário!")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption((option) => option
        .setName("userid")
        .setDescription("The userId who will receive the vip")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O Id do usuário que vai receber o VIP")
        .setRequired(true)),
    async execute(interaction, user) {
        const userId = interaction.options.getString("userid", true);
        const target = await (0, userUtils_1.checkUser)(userId, interaction);
        if (!target) {
            return (0, discordInteractions_1.replyInteraction)(interaction, "Didn't find this user");
        }
        await target?.SetEternalVip();
        const messages = {
            [Language_1.Language.English]: {
                VIP: `${emotes_1.EmoteString.VIP} Now you are a Eternal VIP!`,
                noVIP: `${emotes_1.EmoteString.VIP} You are no longer a Eternal VIP... How?`,
            },
            [Language_1.Language.Portuguese]: {
                VIP: `${emotes_1.EmoteString.VIP} Você agora é um VIP Eterno!`,
                noVIP: `${emotes_1.EmoteString.VIP} Você não é mais um VIP Eterno... Como?`,
            },
            [Language_1.Language.Spanish]: {
                VIP: `${emotes_1.EmoteString.VIP} Ahora eres un VIP Eternal!`,
                noVIP: `${emotes_1.EmoteString.VIP} No eres más un VIP Eternal... Cómo?`,
            },
        };
        let description = "";
        if (target.VipEternal) {
            await (0, discordInteractions_1.sendPrivateMessage)(userId, messages[target.Language].VIP, discord_js_1.Colors.Gold);
            description = `${emotes_1.EmoteString.VIP} user **${target.GetNameWithImage()}** is now a Eternal VIP`;
        }
        else {
            await (0, discordInteractions_1.sendPrivateMessage)(userId, messages[target.Language].noVIP, discord_js_1.Colors.Gold);
            description = `${emotes_1.EmoteString.VIP} user **${target.GetNameWithImage()}** is no longer a Eternal VIP`;
        }
        const container = (0, ui_1.defaultComponent)({
            user,
            color: discord_js_1.Colors.Gold,
            description,
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
//# sourceMappingURL=seteternalvip.js.map