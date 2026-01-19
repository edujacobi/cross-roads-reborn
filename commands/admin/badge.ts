import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { UserBadge } from "../../models/UserBadge";
import { BadgeList, getBadgeList } from "../../interfaces/Badges";
import { Language } from "../../models/Language";
import { checkUser, deferReply, replyInteraction, replyUserDontExist, replyWithContainer } from "../../utils/logic";
import { User } from "../../models/User";
import { Pagination } from "../../models/Pagination";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";

enum CommandOption {
	Types = "types",
	Add = "add",
	Remove = "remove",
	List = "list",
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("badge")
		.setDescription("Manage user badges")
		.addSubcommand(types => types
			.setName(CommandOption.Types)
			.setDescription("All types of badges and respectives Ids"),
		)
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
				.setRequired(true)),
		)
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
				.setRequired(true)),
		)
		.addSubcommand(list => list
			.setName(CommandOption.List)
			.setDescription("List all badges of a user")
			.addUserOption(user => user
				.setName("user")
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

		switch (subcommand) {
		case CommandOption.Types: {
			await deferReply(interaction);

			const badgeList = getBadgeList();

			const pagination = new Pagination(interaction, language);
			pagination.HowManyRecords = badgeList.length;
			pagination.Limit = 10;

			pagination.CustomizeContainer = async () => {
				return new CustomContainerBuilder()
					.addTexts([
						`## Badge Types`,
					])
					.addLargeSeparator()
					.addTexts(
						badgeList
							.slice(pagination.Offset, pagination.Offset + pagination.Limit)
							.map(badge => {
								return `### ${badge.Emoji.String} ${badge.Name[language]} \`${badge.Id}\`\n-# ${badge.Description[language]}`;
							}),
					);
			};

			await pagination.GenerateContainer();
			return;
		}
		case CommandOption.Add: {
			const badgeId = interaction.options.getInteger("badge", true);
			const _user = interaction.options.getUser("user", true);

			await deferReply(interaction);

			const target = await checkUser(_user.id, interaction);
			let targetName = `ID: ${_user.id}`;

			if (target) {
				targetName = target.GetNameWithImage();
			}

			const success = await UserBadge.Create(_user.id, badgeId);

			if (success) {
				const badgeEmoji = BadgeList[badgeId].Emoji.String;
				const badgeName = BadgeList[badgeId].Name[language];

				return replyInteraction(interaction, {
					content: s.badgeAdded(badgeEmoji, badgeName, targetName),
				});
			}
			else {
				return replyInteraction(interaction, {
					content: s.addError(targetName),
				});
			}
		}

		case CommandOption.Remove: {
			const badgeId = interaction.options.getInteger("badge", true);
			const _user = interaction.options.getUser("user", true);

			await deferReply(interaction);

			const target = await checkUser(_user.id, interaction);
			let targetName = `ID: ${_user.id}`;

			if (target) {
				targetName = target.GetNameWithImage();
			}

			const success = await UserBadge.Delete(_user.id, badgeId);

			if (success) {
				const badgeEmoji = BadgeList[badgeId].Emoji.String;
				const badgeName = BadgeList[badgeId].Name[language];

				return replyInteraction(interaction, {
					content: s.badgeRemoved(badgeEmoji, badgeName, targetName),
				});
			}
			else {
				return replyInteraction(interaction, {
					content: s.removeError,
				});
			}
		}

		case CommandOption.List: {
			const _user = interaction.options.getUser("user", true);

			await deferReply(interaction);

			const target = await checkUser(_user.id, interaction);

			if (!target) {
				return await replyUserDontExist(interaction, language);
			}

			let badges = await UserBadge.GetList(_user.id, language);

			if (target.IsVip()) {
				badges = UserBadge.AddVIPBadgeInList(badges, target, language);
			}

			if (badges.length === 0) {
				return replyInteraction(interaction, {
					content: s.noBadges(target.GetNameWithImage()),
				});
			}

			const container = new CustomContainerBuilder()
				.setUser(user)
				.addTexts([
					s.badgesTitle(target.GetNameWithImage()),
				])
				.addLargeSeparator()
				.addTexts(badges.map(badge => `### ${badge.Emoji || "▫️"} ${badge.Name}\n-# ${badge.Description}`))
				.addFooter({
					text: s.badgesFooter(badges.length),
				});

			return replyWithContainer(interaction, container);
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