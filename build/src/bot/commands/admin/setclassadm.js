"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const ui_1 = require("#bot/utils/ui");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const Language_1 = require("#core/models/Language");
const Classes_1 = require("#core/types/Classes");
const colors_1 = require("#bot/utils/colors");
const userUtils_1 = require("#bot/utils/userUtils");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("setclassadm")
        .setDescription("Set class to an user!")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Adicione classe para um usuário!")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption((option) => option
        .setName("userid")
        .setDescription("The userId who will receive the class")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O Id do usuário que vai receber a classe")
        .setRequired(true))
        .addIntegerOption((option) => option
        .setName("class")
        .setDescription("Which class")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Qual classe")
        .setRequired(true)
        .addChoices([{
            name: Classes_1.ClassList[Classes_1.ClassId.Attorney].Name[Language_1.Language.English],
            value: Classes_1.ClassId.Attorney,
        }, {
            name: Classes_1.ClassList[Classes_1.ClassId.Entrepreneur].Name[Language_1.Language.English],
            value: Classes_1.ClassId.Entrepreneur,
        }, {
            name: Classes_1.ClassList[Classes_1.ClassId.Hobo].Name[Language_1.Language.English],
            value: Classes_1.ClassId.Hobo,
        }, {
            name: Classes_1.ClassList[Classes_1.ClassId.Thief].Name[Language_1.Language.English],
            value: Classes_1.ClassId.Thief,
        }])),
    async execute(interaction, user) {
        const userId = interaction.options.getString("userid", true);
        const classId = interaction.options.getInteger("class", true);
        const target = await (0, userUtils_1.checkUser)(userId, interaction);
        if (!target) {
            return (0, discordInteractions_1.replyInteraction)(interaction, "Didn't find this user");
        }
        await target.SetClass(classId);
        const messages = {
            [Language_1.Language.English]: `${Classes_1.ClassList[classId].Image.Emote.String} You are now ${Classes_1.ClassList[classId].Name[Language_1.Language.English]}`,
            [Language_1.Language.Portuguese]: `${Classes_1.ClassList[classId].Image.Emote.String} Você agora é ${Classes_1.ClassList[classId].Name[Language_1.Language.Portuguese]}`,
            [Language_1.Language.Spanish]: `${Classes_1.ClassList[classId].Image.Emote.String} Ahora eres ${Classes_1.ClassList[classId].Name[Language_1.Language.Spanish]}`,
        };
        await (0, discordInteractions_1.sendPrivateMessage)(userId, messages[target.Language], colors_1.CrColors.Default);
        const container = (0, ui_1.defaultComponent)({
            user,
            color: colors_1.CrColors.Default,
            description: `User **${target.GetNameWithImage()}** is now ${Classes_1.ClassList[classId].Name[Language_1.Language.English]}`,
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
//# sourceMappingURL=setclassadm.js.map