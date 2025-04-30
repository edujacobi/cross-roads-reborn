import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { UserBadge } from "../../models/UserBadge";
import { BadgeList, getBadgeList } from "../../interfaces/Badges";
import { Language } from "../../models/Language";
import { checkUser, replyInteraction, replyUserDontExist } from "../../utils/logic";
import { User } from "../../models/User";

enum CommandOption {
	Add = "add",
	Remove = "remove",
	List = "list",
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("badge")
		.setDescription("Manage user badges")
		.addSubcommand(subcommand =>
			subcommand
				.setName(CommandOption.Add)
				.setDescription("Add a badge to a user")
				.addUserOption(option =>
					option.setName("user")
						.setDescription("The user to add the badge to")
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName("badge")
						.setDescription("The type of badge to add")
						.setRequired(true)
						.addChoices(
							...getBadgeList().map(badge => ({
								name: badge.Name[Language.English],
								value: badge.Id,
							})),
						)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName(CommandOption.Remove)
				.setDescription("Remove a badge from a user")
				.addUserOption(option =>
					option.setName("user")
						.setDescription("The user to remove the badge from")
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName("badge")
						.setDescription("The type of badge to remove")
						.setRequired(true)
						.addChoices(
							...getBadgeList().map(badge => ({
								name: badge.Name[Language.English],
								value: badge.Id,
							})),
						)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName(CommandOption.List)
				.setDescription("List all badges of a user")
				.addUserOption(option =>
					option.setName("user")
						.setDescription("The user to list badges for")
						.setRequired(true)),
		),
	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];

		if (!interaction.memberPermissions?.has("Administrator")) {
			return replyInteraction(interaction, {
				content: s.noPerm,
			});
		}


		const subcommand = interaction.options.getSubcommand();
		const _user = interaction.options.getUser("user", true);
		const target = await checkUser(_user.id, interaction);

		if (!target) {
			return await replyUserDontExist(interaction, language);
		}

		switch (subcommand) {
		case CommandOption.Add: {
			const badgeId = interaction.options.getInteger("badge", true);

			await interaction.deferReply();

			const success = await UserBadge.Create(_user.id, badgeId);

			if (success) {
				const badgeEmoji = BadgeList[badgeId].Emoji.String;
				const badgeName = BadgeList[badgeId].Name[language];

				return replyInteraction(interaction, {
					content: s.badgeAdded(badgeEmoji, badgeName, target.GetNameWithImage()),
				});
			}
			else {
				return replyInteraction(interaction, {
					content: s.addError(target.GetNameWithImage()),
				});
			}
		}

		case CommandOption.Remove: {
			const badgeId = interaction.options.getInteger("badge", true);

			await interaction.deferReply();

			const success = await UserBadge.Delete(_user.id, badgeId);

			if (success) {
				const badgeEmoji = BadgeList[badgeId].Emoji.String;
				const badgeName = BadgeList[badgeId].Name[language];

				return replyInteraction(interaction, {
					content: s.badgeRemoved(badgeEmoji, badgeName, target.GetNameWithImage()),
				});
			}
			else {
				return replyInteraction(interaction, {
					content: s.removeError,
				});
			}
		}

		case CommandOption.List: {
			await interaction.deferReply();

			let badges = await UserBadge.GetList(_user.id, language);

			if (target.IsVip()) {
				badges = UserBadge.AddVIPBadgeInList(badges, target, language);
			}

			if (badges.length === 0) {
				return replyInteraction(interaction, {
					content: s.noBadges(target.GetNameWithImage()),
				});
			}

			const embed = new EmbedBuilder()
				.setTitle(s.badgesTitle(target.GetNameWithImage()))
				.setThumbnail(_user.displayAvatarURL())
				.setDescription(
					badges.map(badge => {
						return `### ${badge.Emoji || "▫️"} ${badge.Name}\n-# ${badge.Description}`;
					}).join("\n"),
				)
				.setFooter({ text: s.badgesFooter(badges.length) });

			return replyInteraction(interaction, {
				embeds: [embed],
			});
		}
		}
	},
};

const Strings = {
	[Language.English]: {
		noPerm: "❌ You don't have permission to use this command.",
		badgeAdded: (badge: string, name: string, user: string) => `✅ Badge ${badge} **${name}** added to ${user}.`,
		addError: (user: string) => `❌ Could not add the badge to ${user}. Check the logs for more details.`,
		badgeRemoved: (badge: string, name: string, user: string) => `✅ Badge ${badge} **${name}** removed from ${user}.`,
		removeError: "❌ UserBadge not found or not possible to remove.",
		noBadges: (user: string) => `${user} doesn't have any badges.`,
		badgesTitle: (user: string) => `${user}'s Badges`,
		badgesFooter: (count: number) => `Total: ${count} badge(s)`,
	},
	[Language.Portuguese]: {
		noPerm: "❌ Você não tem permissão para usar este comando.",
		badgeAdded: (badge: string, name: string, user: string) => `✅ Insígnia ${badge} **${name}** adicionada para ${user}.`,
		addError: (user: string) => `❌ Não foi possível adicionar a insígnia para ${user}. Verifique os logs para mais detalhes.`,
		badgeRemoved: (badge: string, name: string, user: string) => `✅ Insígnia ${badge} **${name}** removida de ${user}.`,
		removeError: "❌ Insígnia não encontrada ou não foi possível remover.",
		noBadges: (user: string) => `${user} não tem nenhuma insígnia.`,
		badgesTitle: (user: string) => `Insígnias de ${user}`,
		badgesFooter: (count: number) => `Total: ${count} insígnia(s)`,
	},
	[Language.Spanish]: {
		noPerm: "❌ No tienes permiso para usar este comando.",
		badgeAdded: (badge: string, name: string, user: string) => `✅ Insignia ${badge} **${name}** añadida a ${user}.`,
		addError: (user: string) => `❌ No se pudo añadir la insignia a ${user}. Consulta los registros para más detalles.`,
		badgeRemoved: (badge: string, name: string, user: string) => `✅ Insignia ${badge} **${name}** eliminada de ${user}.`,
		removeError: "❌ Insignia no encontrada o no fue posible eliminarla.",
		noBadges: (user: string) => `${user} no tiene ninguna insignia.`,
		badgesTitle: (user: string) => `Insignias de ${user}`,
		badgesFooter: (count: number) => `Total: ${count} insignia(s)`,
	},
} as const;