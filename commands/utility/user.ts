import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	ComponentType,
	Locale,
	MessageComponentInteraction,
	SlashCommandBuilder,
	SlashCommandUserOption,
} from "discord.js";
import { checkUser, removeEmbedComponents, replyInteraction } from "../../utils/logic";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { EmoteString, formatDate, getRarityText, getRoosterWinrate } from "../../utils/ui";
import { Badge } from "../../models/Badge";
import { Roosters } from "../../database/Roosters";
import { getRoosterEmote } from "../../models/RoosterImage";
import { Language } from "../../models/Language";
import { Op } from "sequelize";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("user")
		.setDescription("See info about a user")
		.setNameLocalization(Locale.PortugueseBR, "usuario")
		.setDescriptionLocalization(Locale.PortugueseBR, "Veja informações de um usuário")
		.addUserOption((option: SlashCommandUserOption) =>
			option
				.setName("target")
				.setDescription("The user")
				.setNameLocalization(Locale.PortugueseBR, "alvo")
				.setDescriptionLocalization(Locale.PortugueseBR, "O usuário"),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const _user = interaction.options.getUser("target") ?? interaction.user;

		const user = await checkUser(_user.id, interaction);

		if (!user) {
			return;
		}

		const s = Strings[user.Language];

		// let roosterText = "Without rooster";

		// const rooster = await checkRooster(_user.id, interaction);

		// if (rooster) {
		// 	roosterText = `Owner of **${rooster.Name}**`;
		// }

		// Check if user has released roosters
		const releasedRoosters = await Roosters.findAll({
			attributes: ["name", "rarity", "level", "wins", "losses", "image"],
			where: {
				ownerId: user.Id,
				isDeleted: true,
				level: {
					[Op.gt]: 0,
				}
			},
		});

		let badges = await Badge.GetList(_user.id);

		if (user.IsVip()) {
			badges = Badge.AddVIPBadgeInList(badges, user);
		}

		let badgeText = "";

		badges.forEach(badge => badgeText += `${badge.Emoji} `);

		const smallDescription = `# ${_user.displayName}\n${badgeText}`;
		const bigDescription = `# ${_user.displayName}${badges.length > 0 ? `\n### ${s.badges}` : ""}`;
		const releasedDescription = `# ${_user.displayName}\n### ${s.releasedRoosters}`;

		const embed = new CustomEmbedBuilder()
			.setColor(user.IsVip() ? Colors.Gold : Colors.White)
			.setThumbnail(_user.avatarURL())
			.setDescription(smallDescription)
			.setDefaultFooter(interaction, `${s.playerSince} ${formatDate(user.CreatedAt)}`);

		const buttonLessInfo = new ButtonBuilder()
			.setCustomId("lessInfo")
			.setLabel(s.hideBadges)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("➖");

		const buttonMoreInfo = new ButtonBuilder()
			.setCustomId("moreInfo")
			.setLabel(s.showBadges)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("➕");

		const buttonReleases = new ButtonBuilder()
			.setCustomId("releases")
			.setLabel(s.releasedRoosters)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("🐓");

		let isOpen = false;

		function createRow() {
			const row = new ActionRowBuilder<ButtonBuilder>();
			if (badges.length > 0) {
				row.addComponents([isOpen ? buttonLessInfo : buttonMoreInfo]);
			}
			if (releasedRoosters.length > 0) {
				row.addComponents([buttonReleases]);
			}

			return row;
		}

		let row = createRow();
		const response = await replyInteraction(interaction, {
			embeds: [embed],
			components: row.components.length > 0 ? [row] : [],
		});

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			time: 60_000,
		});

		collector?.on("collect", async btn => {
			if (btn.customId === "moreInfo") {

				buttonReleases.setDisabled(releasedRoosters.length == 0);

				embed
					.setDescription(bigDescription)
					.setFields([]);

				badges.forEach(badge => {
					embed.addFields({
						name: `${badge.Emoji} ${badge.Description}`,
						value: badge.DescriptionLong ? `-# ${badge.DescriptionLong}` : `-# ${s.noDescription}`,
						inline: true,
					});
				});

				isOpen = true;
				row = createRow();

				await btn.update({ embeds: [embed], components: [row] });

			}
			else if (btn.customId === "lessInfo") {

				buttonReleases.setDisabled(releasedRoosters.length == 0);

				embed
					.setDescription(smallDescription)
					.setFields([]);

				isOpen = false;
				row = createRow();

				await btn.update({ embeds: [embed], components: [row] });

			}
			else if (btn.customId === "releases") {

				buttonReleases.setDisabled(true);

				embed
					.setDescription(releasedDescription)
					.setFields([]);

				releasedRoosters.forEach(rooster => {
					embed.addFields([{
						name: `${getRoosterEmote(rooster.image)} ${rooster.name}`,
						value: `${getRarityText(rooster.rarity)}\n${EmoteString.Experience}${s.level}: \`${rooster.level}\`\n${EmoteString.Victory}${rooster.wins} ${EmoteString.Defeat}${rooster.losses} ${EmoteString.Winrate}${getRoosterWinrate(rooster.wins, rooster.losses)}`,
						inline: true,
					}]);
				});

				row = createRow();

				await btn.update({ embeds: [embed], components: [row] });

			}
		});

		collector?.on("end", async () => {
			await removeEmbedComponents(interaction);
		});
	},
};

const Strings = {
	[Language.English]: {
		badges: "Badges",
		releasedRoosters: "Released roosters",
		playerSince: "Player since",
		hideBadges: "Hide badges",
		showBadges: "Show badges",
		noDescription: "no description",
		level: "Level",
	},

	[Language.Portuguese]: {
		badges: "Insígnias",
		releasedRoosters: "Galos soltos",
		playerSince: "Jogador desde",
		hideBadges: "Ocultar insígnias",
		showBadges: "Mostrar insígnias",
		noDescription: "sem descrição",
		level: "Nível",
	},

	[Language.Spanish]: {
		badges: "Insignias",
		releasedRoosters: "Gallos liberados",
		playerSince: "Jugador desde",
		hideBadges: "Ocultar insignias",
		showBadges: "Mostrar insignias",
		noDescription: "sin descripción",
		level: "nivel",
	},
} as const;