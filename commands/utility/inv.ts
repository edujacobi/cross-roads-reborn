import {
	ActionRowBuilder, AttachmentBuilder,
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
import { checkUser, removeEmbedComponents, replyInteraction, replyUserDontExist } from "../../utils/logic";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { formatMoney, showTime } from "../../utils/ui";
import { Badge } from "../../models/Badge";
import { Language } from "../../models/Language";
import { EmoteId, EmoteString } from "../../utils/emotes";
import { ItemType } from "../../interfaces/Items";
import { subMinutes } from "date-fns";
import { User } from "../../models/User";
import { ClassList } from "../../interfaces/Classes";
import Canvas from "@napi-rs/canvas";
import { InventoryCanvasBuilder } from "../../ui/builders/InventoryCanvasBuilder";
import Konva from "konva";
import Image = Konva.Image;


module.exports = {
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

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const _user = interaction.options.getUser("target") || interaction.user;
		const target = _user ? await checkUser(_user.id, interaction) : user;

		if (!target) {
			return await replyUserDontExist(interaction, language);
		}

		const embedColor = target.IsVip() ? Colors.Gold : Colors.DarkButNotBlack;

		const s = Strings[language];

		let badges = await Badge.GetList(target.Id);

		if (target.IsVip()) {
			badges = Badge.AddVIPBadgeInList(badges, target);
		}

		let badgeText = "";

		badges.forEach(badge => badgeText += `${badge.Emoji} `);

		const userItems = await target.GetItems();

		await interaction.deferReply();

		const lastCommand = interaction.client.userLastCommand.get(target.Id) || 0;

		const online = new Date(lastCommand) > subMinutes(new Date(), 30);

		const inventory = new InventoryCanvasBuilder(target, _user.avatarURL())
			.AddHeader(online)
			.AddSubHeader()
			.AddItemGrid(userItems);

		const attachment = new AttachmentBuilder(inventory.GenerateImage(), { name: `invOf${target.Nickname}.jpg` });

		// 		const invClosed = new CustomEmbedBuilder()
		// 			.setColor(embedColor)
		// 			// .setAuthor({
		// 			// 	name: `${s.inventoryOf} ${target.Nickname}`,
		// 			// 	iconURL: "https://cdn.discordapp.com/attachments/531174573463306240/814662917696782376/Inventario.png",
		// 			// })
		// 			.setAuthor({
		// 				name: `${s.inventoryOf} ${target.Nickname}`,
		// 				iconURL: ClassList[target.Class].Image.Url,
		// 			})
		// 			// .setTitle(`${s.inventoryOf} ${target.Nickname}`)
		// 			.setThumbnail(_user.avatarURL() ?? null)
		// 			.setDescription(`${badgeText}
		// ${formatMoney(target.Money, language)}`)
		// 			.setUserFooter({
		// 				nickname: user.Nickname,
		// 				image: interaction.user.avatarURL(),
		// 			});
		// .setFooter({
		// 	iconURL: ClassList[target.Class].Image.Url,
		// 	text: target.Situation.Simple,
		// });

		// const weaponEmotes = userItems.map(weapon => weapon.Skin.Default.Emote.String);
		// const textWeapons = weaponEmotes.join(" ").match(/.{1,1023}/g) || [];

		// textWeapons.forEach(text => {
		// 	invClosed.addFields({ name: "\u200b", value: text, inline: true });
		// });

		// invClosed.addFields({ name: "\u200b", value: `-# ${target.Situation.SimpleEmote}` });

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

		const createRow = () => new ActionRowBuilder<ButtonBuilder>()
			.addComponents([isOpen ? buttonClose : buttonOpen]);

		let row = createRow();
		const response = await interaction.editReply({
			// content: interaction.user.id != _user.id ? `${interaction.options.getUser("target")}` : "",
			// embeds: [invClosed],
			files: [attachment],
			components: row.components.length > 0 ? [row] : [],
		});

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			time: 60_000,
		});

		collector?.on("collect", async btn => {
			if (btn.customId === "moreInfo") {
				await target.GetInfo();

				isOpen = true;
				row = createRow();

				const lastCommand = interaction.client.userLastCommand.get(target.Id) || 0;

				const online = new Date(lastCommand) > subMinutes(new Date(), 30);
				const emoteOnline = online ? `${EmoteString.Online} Online` : `${EmoteString.Offline} Offline`;

				const invOpen = new CustomEmbedBuilder()
					.setColor(embedColor)
					// .setAuthor({
					// 	name: `${s.inventoryOf} ${target.Nickname}`,
					// 	iconURL: "https://cdn.discordapp.com/attachments/531174573463306240/814662917696782376/Inventario.png",
					// })
					.setAuthor({
						name: `${s.inventoryOf} ${target.Nickname}, ${ClassList[target.Class].Description[language]}`,
						iconURL: ClassList[target.Class].Image.Url,
					})
					// .setTitle(`${s.inventoryOf} ${target.Nickname}, ${ClassList[target.Class].Description[user.Language]}`)
					.setThumbnail(_user.avatarURL() ?? null)
					.setDescription(`-# ${emoteOnline}
${badges.length > 0 ? `### ${badgeText}\n` : ""}### ${formatMoney(target.Money, language)}
-# ${s.inventoryItems}`)
					.setUserFooter({
						nickname: user.Nickname,
						image: interaction.user.avatarURL(),
					});
				// .setFooter({
				// 	iconURL: ClassList[target.Class].Image.Url,
				// 	text: ClassList[target.Class].Description[user.Language],
				// });

				// userItems.forEach(item => {
				// 	invOpen.addFields([{
				// 		name: `${item.Skin.Default.Emote.String} ${item.Description[language]}`,
				// 		value: item.Type == ItemType.Consumable ? String(item.Quantity) : showTime(new Date(item.RemainingTime).getTime(), true),
				// 		inline: true,
				// 	}]);
				// });

				invOpen.addFields([{
					name: "\u200b󠀀󠀀",
					value: `-# ${target.Situation.Complex} • ${EmoteString.Attack}${target.Attributes.Attack} ATK • ${EmoteString.Defense}${target.Attributes.Defense} DEF`,
				}]);

				await btn.update({ embeds: [invOpen], components: [row] });

			}
			else if (btn.customId === "lessInfo") {

				isOpen = false;
				row = createRow();

				// await btn.update({ embeds: [invClosed], components: [row] });

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
		inventoryOf: "Inventário de",
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