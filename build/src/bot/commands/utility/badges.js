"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const Badges_1 = require("#core/types/Badges");
const Language_1 = require("#core/models/Language");
const UserBadge_1 = require("#core/models/UserBadge");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("badges")
        .setDescription("Check all the existing badges")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "insígnias")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "insignias")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Conheça todas as insígnias existentes")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Conoce todas las insignias existentes"),
    async execute(interaction, user, language) {
        await (0, discordInteractions_1.deferReply)(interaction);
        const s = Strings[language];
        const badgeGroups = (0, Badges_1.getCommandBadgeGroups)();
        const textSpecial = badgeGroups.special.map(badge => `### ${badge.Emoji.String} ${badge.Name[language]}\n${badge.Description[language]}`);
        const textSeasonal = badgeGroups.seasonal.map(badge => `### ${badge.Emoji.String} ${badge.Name[language]}\n${badge.Description[language]}`);
        let userBadges = await UserBadge_1.UserBadge.GetList(user.Id);
        if (user.IsVip()) {
            userBadges = UserBadge_1.UserBadge.AddVIPBadgeInList(userBadges, user, language);
        }
        let userBadgeText = "";
        userBadges.forEach(badge => userBadgeText += `${badge.Emoji} `);
        const container = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(user)
            .addTexts([
            `# ${s.badges}`,
        ])
            .addLargeSeparator()
            .addTexts([
            `## ${s.special}`,
            textSpecial.join("\n"),
        ])
            .addLargeSeparator()
            .addTexts([
            `## ${s.seasonal}`,
            textSeasonal.join("\n"),
        ])
            .addFooter({ text: userBadgeText.length ? `${s.your}: ${userBadgeText}` : undefined });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
const Strings = {
    [Language_1.Language.English]: {
        badges: "Badges",
        special: "Special badges",
        seasonal: "Seasonal badges",
        your: "Your badges",
    },
    [Language_1.Language.Portuguese]: {
        badges: "Insígnias",
        special: "Insígnias especiais",
        seasonal: "Insígnias da temporada",
        your: "Suas insígnias",
    },
    [Language_1.Language.Spanish]: {
        badges: "Insignia",
        special: "Insignia especiales",
        seasonal: "Insignia de temporada",
        your: "Tus insignias",
    },
};
//# sourceMappingURL=badges.js.map