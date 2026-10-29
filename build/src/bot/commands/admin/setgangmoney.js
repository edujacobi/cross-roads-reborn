"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const Gang_1 = require("#core/models/Gang");
const Language_1 = require("#core/models/Language");
const discord_js_1 = require("discord.js");
var SetMoneyConfiguration;
(function (SetMoneyConfiguration) {
    SetMoneyConfiguration[SetMoneyConfiguration["Add"] = 0] = "Add";
    SetMoneyConfiguration[SetMoneyConfiguration["Set"] = 1] = "Set";
})(SetMoneyConfiguration || (SetMoneyConfiguration = {}));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("setgangmoney")
        .setDescription("Set or add money to a gang!")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Defina ou adicione dinheiro a uma gangue!")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addIntegerOption(option => option
        .setName("gangid")
        .setDescription("The Gang Id to modify the money")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O Id da Gangue para modificar o dinheiro")
        .setRequired(true))
        .addIntegerOption(option => option
        .setName("money")
        .setDescription("The money amount")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "A quantia de dinheiro")
        .setRequired(true))
        .addIntegerOption(option => option
        .setName("add_or_set")
        .setDescription("Add or Set the money")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Adicionar ou definir o dinheiro")
        .setRequired(true)
        .addChoices([
        {
            name: "Add",
            value: SetMoneyConfiguration.Add,
        },
        {
            name: "Set",
            value: SetMoneyConfiguration.Set,
        },
    ])),
    async execute(interaction, user) {
        const gangId = interaction.options.getInteger("gangid", true);
        const money = interaction.options.getInteger("money", true);
        const addOrSet = interaction.options.getInteger("add_or_set", true);
        const gang = await Gang_1.Gang.GetById(gangId);
        if (!gang) {
            return (0, discordInteractions_1.replyInteraction)(interaction, "Didn't find this gang");
        }
        let description = "";
        if (addOrSet === SetMoneyConfiguration.Add) {
            gang.Money += money;
            description = `${(0, ui_1.formatMoney)(money, Language_1.Language.English, "")} added to ${emotes_1.EmoteString.Gang} Gang **${gang.Name}** (${gang.Acronym}). Total: ${(0, ui_1.formatMoney)(gang.Money, Language_1.Language.English, "")}`;
        }
        else {
            const oldMoney = gang.Money;
            gang.Money = money;
            description = `${emotes_1.EmoteString.Gang} Gang **${gang.Name}** (${gang.Acronym}) money has been set to ${(0, ui_1.formatMoney)(gang.Money, Language_1.Language.English, "")} (was ${(0, ui_1.formatMoney)(oldMoney, Language_1.Language.English, "")}).`;
        }
        const container = (0, ui_1.defaultComponent)({
            user,
            color: colors_1.CrColors.Admin,
            description,
        });
        await gang.Update();
        await (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
//# sourceMappingURL=setgangmoney.js.map