"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const ui_1 = require("#bot/utils/ui");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const colors_1 = require("#bot/utils/colors");
const userUtils_1 = require("#bot/utils/userUtils");
var SetMoneyConfiguration;
(function (SetMoneyConfiguration) {
    SetMoneyConfiguration[SetMoneyConfiguration["Add"] = 0] = "Add";
    SetMoneyConfiguration[SetMoneyConfiguration["Set"] = 1] = "Set";
})(SetMoneyConfiguration || (SetMoneyConfiguration = {}));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("setmoney")
        .setDescription("Set money to an user!")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Adicione dinheiro para um usuário!")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption((option) => option
        .setName("userid")
        .setDescription("The userId who will receive the money")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O Id do usuário que vai receber o dinheiro")
        .setRequired(true))
        .addIntegerOption((option) => option
        .setName("money")
        .setDescription("How many money")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Quanto de dinheiro")
        .setRequired(true))
        .addIntegerOption((option) => option
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
        const userId = interaction.options.getString("userid", true);
        const money = interaction.options.getInteger("money", true);
        const addOrSet = interaction.options.getInteger("add_or_set", true);
        const target = await (0, userUtils_1.checkUser)(userId, interaction);
        if (!target) {
            return (0, discordInteractions_1.replyInteraction)(interaction, "Didn't find this user");
        }
        let description = "";
        if (addOrSet === SetMoneyConfiguration.Add) {
            target.Money += money;
            await (0, discordInteractions_1.sendPrivateMessage)(userId, `You received ${(0, ui_1.formatMoney)(money, user.Language)}.`, colors_1.CrColors.Admin);
            description = `${(0, ui_1.formatMoney)(money, user.Language)} added to user **${target.GetNameWithImage()}**`;
        }
        else {
            target.Money = money;
            await (0, discordInteractions_1.sendPrivateMessage)(userId, `Your money is now ${(0, ui_1.formatMoney)(money, user.Language)}.`, colors_1.CrColors.Admin);
            description = `User **${target.GetNameWithImage()}** now has ${(0, ui_1.formatMoney)(money, user.Language)}`;
        }
        const container = (0, ui_1.defaultComponent)({
            user,
            color: colors_1.CrColors.Admin,
            description,
        });
        await target.Update({
            money: target.Money,
        });
        await (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
//# sourceMappingURL=setmoney.js.map