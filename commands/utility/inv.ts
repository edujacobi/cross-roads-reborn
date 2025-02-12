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
import { formatChip, formatMoney, showTime } from "../../utils/ui";
import { Badge } from "../../models/Badge";
import { Language } from "../../models/Language";
import { EmoteId, EmoteString } from "../../utils/emotes";
import { ItemType } from "../../models/Item";
import { subMinutes } from "date-fns";

module.exports = {
	vip: true,
	data: new SlashCommandBuilder()
		.setName("inv")
		.setDescription("See the inventory of a user")
		.setDescriptionLocalization(Locale.PortugueseBR, "Veja o inventário de um usuário")
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

		const embedColor = user.IsVip() ? Colors.Gold : Colors.DarkButNotBlack;

		const s = Strings[user.Language];

		let badges = await Badge.GetList(_user.id);

		if (user.IsVip()) {
			badges = Badge.AddVIPBadgeInList(badges, user);
		}

		let badgeText = "";

		badges.forEach(badge => badgeText += `${badge.Emoji} `);

		const userItems = await user.GetItems();

		const invClosed = new CustomEmbedBuilder()
			.setColor(embedColor)
			.setAuthor({
				name: `${s.inventoryOf} ${user.Nickname}`,
				iconURL: "https://cdn.discordapp.com/attachments/531174573463306240/814662917696782376/Inventario.png",
			})
			.setThumbnail(_user.avatarURL() ?? "")
			.setDescription(`${badgeText}
${formatMoney(user.Money, user.Language)}`)
			.setFooter({
				text: `${user.Situation.Simple} • ${s.chips}: ${formatChip(user.Chip, user.Language)}`,
			})
			.setTimestamp();

		const weaponEmotes = userItems.map(weapon => weapon.Skin.Default.Emote.String);
		const textWeapons = weaponEmotes.join(" ").match(/.{1,1023}/g) || [];

		textWeapons.forEach(text => {
			invClosed.addFields({ value: text, name: "\u200b", inline: true });
		});

		const buttonClose = new ButtonBuilder()
			.setCustomId("lessInfo")
			.setLabel(s.closeInv)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(EmoteId.CloseInv);

		const buttonOpen = new ButtonBuilder()
			.setCustomId("moreInfo")
			.setLabel(s.openInv)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(EmoteId.OpenInv);


		let isOpen = false;

		function createRow() {
			const row = new ActionRowBuilder<ButtonBuilder>();
			if (badges.length > 0) {
				row.addComponents([isOpen ? buttonClose : buttonOpen]);
			}

			return row;
		}

		let row = createRow();
		const response = await replyInteraction(interaction, {
			content: interaction.user.id != _user.id ? `${interaction.options.getUser("target")}` : "",
			embeds: [invClosed],
			components: row.components.length > 0 ? [row] : [],
		});

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			time: 60_000,
		});

		collector?.on("collect", async btn => {
			if (btn.customId === "moreInfo") {
				await user.GetInfo();

				isOpen = true;
				row = createRow();

				const online = user.UpdatedAt > subMinutes(new Date(), 30);
				const emoteOnline = online ? `${EmoteString.Online} Online` : `${EmoteString.Offline} Offline`;

				const invOpen = new CustomEmbedBuilder()
					.setColor(embedColor)
					.setAuthor({
						name: `Inventário de ${user.Nickname}`,
						iconURL: "https://cdn.discordapp.com/attachments/531174573463306240/814662917696782376/Inventario.png",
					})
					.setThumbnail(_user.avatarURL() ?? "")
					.setDescription(`-# ${emoteOnline}
### ${badgeText}
### ${formatMoney(user.Money, user.Language)}
-# ${s.inventoryItems}`)
					.setFooter({
						text: `${s.chips}: ${formatChip(user.Chip, user.Language)}`,
					})
					.setTimestamp();

				userItems.forEach(item => {
					invOpen.addFields([{
						name: `${item.Skin.Default.Emote.String} ${item.Description[user.Language]}`,
						value: item.Type == ItemType.Consumable ? String(item.Quantity) : showTime(new Date(item.RemainingTime).getTime(), true),
						inline: true,
					}]);
				});

				invOpen.addFields([{
					name: "\u200b󠀀󠀀",
					value: `-# ${user.Situation.Complex} • ${EmoteString.Attack}${user.Attributes.Attack} ATK • ${EmoteString.Defense}${user.Attributes.Defense} DEF`,
				}]);

				await btn.update({ embeds: [invOpen], components: [row] });

			}
			else if (btn.customId === "lessInfo") {

				isOpen = false;
				row = createRow();

				await btn.update({ embeds: [invClosed], components: [row] });

			}
		});

		collector?.on("end", async () => {
			await removeEmbedComponents(interaction);
		});
	},
};

const Strings = {
	[Language.English]: {
		inventoryOf: "Inventory of",
		closeInv: "Close",
		openInv: "Open",
		chips: "Chips",
		inventoryItems: "Items in the inventory",
		noDescription: "no description",
	},

	[Language.Portuguese]: {
		inventoryOf: "Inventário de ",
		closeInv: "Fechar",
		openInv: "Abrir",
		chips: "Fichas",
		inventoryItems: "Itens no inventário",
		noDescription: "sem descrição",
	},

	[Language.Spanish]: {
		inventoryOf: "Inventario de",
		closeInv: "Cerrar",
		openInv: "Abrir",
		chips: "Fichas",
		inventoryItems: "Artículos en el inventario",
		noDescription: "sin descripción",
	},
} as const;