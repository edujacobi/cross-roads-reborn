"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const Language_1 = require("#core/models/Language");
const ui_1 = require("#bot/utils/ui");
const emotes_1 = require("#bot/utils/emotes");
const colors_1 = require("#bot/utils/colors");
const Alms_1 = require("#core/models/Alms");
const userUtils_1 = require("#bot/utils/userUtils");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("alms")
        .setDescription("Donate some money to another user")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "esmola")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "limosna")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Doe algum dinheiro para outro usuário")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Dona algo de dinero a otro usuario")
        .addStringOption(target => target
        .setName("target")
        .setDescription("The user to donate")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "alvo")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "objetivo")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O alvo para doar")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "El usuario al que donar")
        .setMinLength(3)
        .setRequired(true)),
    async execute(interaction, user, language) {
        const nameOrId = interaction.options.getString("target", true);
        const target = await (0, userUtils_1.searchUser)(nameOrId, interaction);
        if (!target) {
            return;
        }
        const sG = Strings[language];
        const sR = Strings[target?.Language];
        const alms = new Alms_1.Alms(user, target);
        const { canGive, message } = alms.CanGiveAlms();
        if (!canGive) {
            const container = (0, ui_1.defaultComponent)({
                user,
                color: colors_1.CrColors.Default,
                description: message,
                footer: (0, ui_1.formatMoney)(user.Money, language),
            });
            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
        }
        await alms.GiveAlms();
        const privateMessage = `**${user.GetNameWithImage()}** ${interaction.guild ? sR.receivedServer(interaction.guild.name, alms.Value) : sR.received(alms.Value)} ${emotes_1.EmoteString.Alms}`;
        await (0, discordInteractions_1.sendPrivateMessage)(target.Id, privateMessage, colors_1.CrColors.Default);
        const container = (0, ui_1.defaultComponent)({
            user,
            color: colors_1.CrColors.Default,
            description: `${sG.donated(alms.Value)} **${target.GetNameWithImage()}** ${emotes_1.EmoteString.Alms}`,
            footer: (0, ui_1.formatMoney)(user.Money, language),
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
const Strings = {
    [Language_1.Language.English]: {
        donated: (money) => `You donated ${(0, ui_1.formatMoney)(money, Language_1.Language.English)} to`,
        received: (money) => `gave you a alms of ${(0, ui_1.formatMoney)(money, Language_1.Language.English)}`,
        receivedServer: (serverName, money) => `from server ${serverName} gave you a alms of ${(0, ui_1.formatMoney)(money, Language_1.Language.English)}`,
    },
    [Language_1.Language.Portuguese]: {
        donated: (money) => `Você doou ${(0, ui_1.formatMoney)(money, Language_1.Language.Portuguese)} para`,
        received: (money) => `te deu uma esmola de ${(0, ui_1.formatMoney)(money, Language_1.Language.Portuguese)}`,
        receivedServer: (serverName, money) => `do servidor ${serverName} te deu uma esmola de ${(0, ui_1.formatMoney)(money, Language_1.Language.Portuguese)}`,
    },
    [Language_1.Language.Spanish]: {
        donated: (money) => `Has donado ${(0, ui_1.formatMoney)(money, Language_1.Language.Spanish)} a`,
        received: (money) => `te ha dado una limosna de ${(0, ui_1.formatMoney)(money, Language_1.Language.Spanish)}`,
        receivedServer: (serverName, money) => `del servidor ${serverName} te ha dado una limosna de ${(0, ui_1.formatMoney)(money, Language_1.Language.Spanish)}`,
    },
};
//# sourceMappingURL=alms.js.map