"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const UserBadge_1 = require("#core/models/UserBadge");
const Badges_1 = require("#core/types/Badges");
const Language_1 = require("#core/models/Language");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const Pagination_1 = require("#core/models/Pagination");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const userUtils_1 = require("#bot/utils/userUtils");
var CommandOption;
(function (CommandOption) {
    CommandOption["Types"] = "types";
    CommandOption["Add"] = "add";
    CommandOption["Remove"] = "remove";
    CommandOption["List"] = "list";
})(CommandOption || (CommandOption = {}));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("badge")
        .setDescription("Manage user badges")
        .addSubcommand(types => types
        .setName(CommandOption.Types)
        .setDescription("All types of badges and respectives Ids"))
        .addSubcommand(add => add
        .setName(CommandOption.Add)
        .setDescription("Add a badge to a user")
        .addUserOption(user => user
        .setName("user")
        .setDescription("The user to add the badge to")
        .setRequired(true))
        .addIntegerOption(badge => badge
        .setName("badge")
        .setDescription("The type of badge to add")
        .setRequired(true)))
        .addSubcommand(remove => remove
        .setName(CommandOption.Remove)
        .setDescription("Remove a badge from a user")
        .addUserOption(user => user
        .setName("user")
        .setDescription("The user to remove the badge from")
        .setRequired(true))
        .addIntegerOption(badge => badge
        .setName("badge")
        .setDescription("The type of badge to remove")
        .setRequired(true)))
        .addSubcommand(list => list
        .setName(CommandOption.List)
        .setDescription("List all badges of a user")
        .addUserOption(user => user
        .setName("user")
        .setDescription("The user to list badges for")
        .setRequired(true))),
    async execute(interaction, user, language) {
        const s = Strings[language];
        if (!interaction.memberPermissions?.has("Administrator")) {
            return (0, discordInteractions_1.replyInteraction)(interaction, {
                content: s.noPerm,
            });
        }
        const subcommand = interaction.options.getSubcommand();
        switch (subcommand) {
            case CommandOption.Types: {
                await (0, discordInteractions_1.deferReply)(interaction);
                const badgeList = (0, Badges_1.getBadgeList)();
                const pagination = new Pagination_1.Pagination(interaction, language);
                pagination.HowManyRecords = badgeList.length;
                pagination.Limit = 10;
                pagination.CustomizeContainer = async () => {
                    return new CustomContainerBuilder_1.CustomContainerBuilder()
                        .addTexts([
                        `## Badge Types`,
                    ])
                        .addLargeSeparator()
                        .addTexts(badgeList
                        .slice(pagination.Offset, pagination.Offset + pagination.Limit)
                        .map(badge => {
                        return `### ${badge.Emoji.String} ${badge.Name[language]} \`${badge.Id}\`\n-# ${badge.Description[language]}`;
                    }));
                };
                await pagination.GenerateContainer();
                return;
            }
            case CommandOption.Add: {
                const badgeId = interaction.options.getInteger("badge", true);
                const _user = interaction.options.getUser("user", true);
                await (0, discordInteractions_1.deferReply)(interaction);
                const target = await (0, userUtils_1.checkUser)(_user.id, interaction);
                let targetName = `Id: ${_user.id}`;
                if (target) {
                    targetName = target.GetNameWithImage();
                }
                const success = await UserBadge_1.UserBadge.Create(_user.id, badgeId);
                if (success) {
                    const badgeEmoji = Badges_1.BadgeList[badgeId].Emoji.String;
                    const badgeName = Badges_1.BadgeList[badgeId].Name[language];
                    return (0, discordInteractions_1.replyInteraction)(interaction, {
                        content: s.badgeAdded(badgeEmoji, badgeName, targetName),
                    });
                }
                else {
                    return (0, discordInteractions_1.replyInteraction)(interaction, {
                        content: s.addError(targetName),
                    });
                }
            }
            case CommandOption.Remove: {
                const badgeId = interaction.options.getInteger("badge", true);
                const _user = interaction.options.getUser("user", true);
                await (0, discordInteractions_1.deferReply)(interaction);
                const target = await (0, userUtils_1.checkUser)(_user.id, interaction);
                let targetName = `Id: ${_user.id}`;
                if (target) {
                    targetName = target.GetNameWithImage();
                }
                const success = await UserBadge_1.UserBadge.Delete(_user.id, badgeId);
                if (success) {
                    const badgeEmoji = Badges_1.BadgeList[badgeId].Emoji.String;
                    const badgeName = Badges_1.BadgeList[badgeId].Name[language];
                    return (0, discordInteractions_1.replyInteraction)(interaction, {
                        content: s.badgeRemoved(badgeEmoji, badgeName, targetName),
                    });
                }
                else {
                    return (0, discordInteractions_1.replyInteraction)(interaction, {
                        content: s.removeError,
                    });
                }
            }
            case CommandOption.List: {
                const _user = interaction.options.getUser("user", true);
                await (0, discordInteractions_1.deferReply)(interaction);
                const target = await (0, userUtils_1.checkUser)(_user.id, interaction);
                if (!target) {
                    return await (0, discordInteractions_1.replyUserDontExist)(interaction, language);
                }
                let badges = await UserBadge_1.UserBadge.GetList(_user.id, language);
                if (target.IsVip()) {
                    badges = UserBadge_1.UserBadge.AddVIPBadgeInList(badges, target, language);
                }
                if (badges.length === 0) {
                    return (0, discordInteractions_1.replyInteraction)(interaction, {
                        content: s.noBadges(target.GetNameWithImage()),
                    });
                }
                const container = new CustomContainerBuilder_1.CustomContainerBuilder()
                    .setUser(user)
                    .addTexts([
                    s.badgesTitle(target.GetNameWithImage()),
                ])
                    .addLargeSeparator()
                    .addTexts(badges.map(badge => `### ${badge.Emoji || "▫️"} ${badge.Name}\n-# ${badge.Description}`))
                    .addFooter({
                    text: s.badgesFooter(badges.length),
                });
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
        }
    },
};
const Strings = {
    [Language_1.Language.English]: {
        noPerm: "❌ You don't have permission to use this command.",
        badgeAdded: (badge, name, user) => `✅ Badge ${badge} **${name}** added to ${user}.`,
        addError: (user) => `❌ Could not add the badge to ${user}. Check the logs for more details.`,
        badgeRemoved: (badge, name, user) => `✅ Badge ${badge} **${name}** removed from ${user}.`,
        removeError: "❌ UserBadge not found or not possible to remove.",
        noBadges: (user) => `${user} doesn't have any badges.`,
        badgesTitle: (user) => `${user}'s Badges`,
        badgesFooter: (count) => `Total: ${count} badge(s)`,
    },
    [Language_1.Language.Portuguese]: {
        noPerm: "❌ Você não tem permissão para usar este comando.",
        badgeAdded: (badge, name, user) => `✅ Insígnia ${badge} **${name}** adicionada para ${user}.`,
        addError: (user) => `❌ Não foi possível adicionar a insígnia para ${user}. Verifique os logs para mais detalhes.`,
        badgeRemoved: (badge, name, user) => `✅ Insígnia ${badge} **${name}** removida de ${user}.`,
        removeError: "❌ Insígnia não encontrada ou não foi possível remover.",
        noBadges: (user) => `${user} não tem nenhuma insígnia.`,
        badgesTitle: (user) => `Insígnias de ${user}`,
        badgesFooter: (count) => `Total: ${count} insígnia(s)`,
    },
    [Language_1.Language.Spanish]: {
        noPerm: "❌ No tienes permiso para usar este comando.",
        badgeAdded: (badge, name, user) => `✅ Insignia ${badge} **${name}** añadida a ${user}.`,
        addError: (user) => `❌ No se pudo añadir la insignia a ${user}. Consulta los registros para más detalles.`,
        badgeRemoved: (badge, name, user) => `✅ Insignia ${badge} **${name}** eliminada de ${user}.`,
        removeError: "❌ Insignia no encontrada o no fue posible eliminarla.",
        noBadges: (user) => `${user} no tiene ninguna insignia.`,
        badgesTitle: (user) => `Insignias de ${user}`,
        badgesFooter: (count) => `Total: ${count} insignia(s)`,
    },
};
//# sourceMappingURL=badge.js.map