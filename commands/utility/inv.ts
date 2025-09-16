import {
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	ComponentType,
	Locale,
	MessageComponentInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { disableButtons, replyInteraction, searchUser } from "../../utils/logic";
import { Language } from "../../models/Language";
import { EmoteId, EmoteString } from "../../utils/emotes";
import { differenceInHours, subMinutes } from "date-fns";
import { User } from "../../models/User";
import { UserBadge } from "../../models/UserBadge";
import { ClassList } from "../../interfaces/Classes";
import { convertHexNumberToString, createUserGangImage, formatMoney, hexToRGB, showTime } from "../../utils/ui";
import { ItemType } from "../../interfaces/Items";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";
import { GangColor } from "../../utils/colors";
import { getClient } from "../../client";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("inv")
		.setDescription("See the inventory of a user")
		.setDescriptionLocalization(Locale.PortugueseBR, "Veja o inventário de um usuário")
		.addStringOption(target => target
			.setName("target")
			.setDescription("The user")
			.setNameLocalization(Locale.PortugueseBR, "alvo")
			.setMinLength(3)
			.setDescriptionLocalization(Locale.PortugueseBR, "O usuário"),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const nameOrId = interaction.options.getString("target");
		const target = nameOrId ? await searchUser(nameOrId, interaction) : user;
		const _user = target ? await getClient().users.fetch(target.Id) : interaction.user;

		if (!target) {
			return;
		}

		const s = Strings[language];

		await interaction.deferReply();

		let badges = await UserBadge.GetList(target.Id);

		if (target.IsVip()) {
			badges = UserBadge.AddVIPBadgeInList(badges, target, language);
		}

		let badgeText = "";

		badges.forEach(badge => badgeText += `${badge.Emoji} `);

		const userItems = await target.GetItems();
		const emoteItems = userItems.map(weapon => weapon.Skin.Default.Emote.String);

		const lastCommand = interaction.client.userLastCommand.get(target.Id) || 0;

		const online = new Date(lastCommand) > subMinutes(new Date(), 15);
		const emoteOnline = online ? EmoteString.Online : EmoteString.Offline;
		const textOnline = online ? `${EmoteString.Online} Online` : `${EmoteString.Offline} Offline`;

		const gang = await target.GetGang();

		const gangImage = gang ? await createUserGangImage(target, gang, language) : null;
		const file = gangImage ? new AttachmentBuilder(gangImage, { name: "gang.webp" }) : null;

		function generateContainer(isClosed: boolean, target: User) {
			const inv = new CustomContainerBuilder()
				.setUser(user);

			if (target.IsVip()) {
				inv.setAccentColor(Colors.Gold);
			}

			if (gang) {
				inv.setAccentColor(hexToRGB(convertHexNumberToString(GangColor[gang.Color].Color)));
			}

			const gangAcronym = gang ? `[${gang.Acronym}] ` : "";

			if (isClosed) {
				inv
					.addSectionComponents(headerSection => headerSection
						.addTextDisplayComponents(
							header => header
								.setContent(`### ${emoteOnline} ${s.inventoryOf} ${gangAcronym}${target.GetNameWithImage()}`),
							badges => badges
								.setContent(badgeText ? `### -# ${badgeText}` : "\u200b"),
							money => money
								.setContent(`# ${formatMoney(target.Money, language)}`),
						)
						.setThumbnailAccessory(avatar => avatar
							.setURL(_user.avatarURL() ?? ClassList[target.Class].Image.Url),
						),
					)
					.addTextDisplayComponents(situation => situation
						.setContent(`-# ${target.Situation.SimpleEmote}`),
					)
					.addLargeSeparator()
					.addTextDisplayComponents(items => items
						.setContent(emoteItems.length ? `# ${emoteItems.join("\u0009")}` : `-# ${s.emptyInventory}`),
					)
					.addFooter({
						button: new ButtonBuilder()
							.setCustomId("moreInfo")
							.setLabel(s.openInv)
							.setStyle(ButtonStyle.Secondary)
							.setEmoji(EmoteId.OpenInv),
					});
			}
			else {
				if (gang) {
					inv
						.addMediaGalleryComponents(gallery => gallery
							.addItems(galleryItem => galleryItem
								.setURL("attachment://gang.webp"),
							),
						)
						.addSeparatorComponents(separator => separator.setDivider(false));
				}
				inv
					.addSectionComponents(headerSection => headerSection
						.addTextDisplayComponents(
							header => header
								.setContent(`### ${s.inventoryOf} ${target.GetNameWithImage()}, ${ClassList[target.Class].Description[language]}\n-# ${textOnline}`),
							badges => badges
								.setContent(badgeText ? `### ${badgeText}` : "\u200b"),
							money => money
								.setContent(`# ${formatMoney(target.Money, language)}`),
						)
						.setThumbnailAccessory(avatar => avatar
							.setURL(_user.avatarURL() ?? ClassList[target.Class].Image.Url)),
					)
					.addTextDisplayComponents(situation => situation
						.setContent(`${target.Situation.Complex} • ${EmoteString.Attack}${target.Attributes.Attack} ATK • ${EmoteString.Defense}${target.Attributes.Defense} DEF`),
					)
					.addLargeSeparator()
					.addTextDisplayComponents(
						label => label
							.setContent(`-# ${s.inventoryItems}`),
						items => {
							const text = userItems.map(userItem => {
								const name = `${userItem.Skin.Default.Emote.String} ${userItem.Description[language]}`;
								const consumable = userItem.Type === ItemType.Consumable;
								const value = consumable ? String(userItem.Quantity) : showTime(userItem.RemainingTime.getTime(), true);
								const isLessThan24Hours = consumable ? userItem.Quantity <= 2 : differenceInHours(userItem.RemainingTime, Date.now()) < 24;
								const isLessThan12Hours = consumable ? userItem.Quantity <= 1 : differenceInHours(userItem.RemainingTime, Date.now()) < 12;
								const emote = isLessThan12Hours ? EmoteString.LessThan12Hours : isLessThan24Hours ? EmoteString.LessThan24Hours : "";

								return `**${name}** ${value}${emote}`;
							}).join("\n");
							items.setContent(text || `-# ${s.emptyInventory}`);
							return items;
						},
					)
					.addFooter({
						button: new ButtonBuilder()
							.setCustomId("lessInfo")
							.setLabel(s.closeInv)
							.setStyle(ButtonStyle.Secondary)
							.setEmoji(EmoteId.CloseInv),
					});
			}

			return inv;
		}

		let container = generateContainer(true, target);

		const response = await replyInteraction(interaction, {
			components: [container],
			files: file ? [file] : [],
			flags: MessageFlags.IsComponentsV2,
			withResponse: true,
		});

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			time: 60_000,
		});

		collector?.on("collect", async btn => {
			if (btn.customId === "moreInfo") {
				container = generateContainer(false, target);
				await btn.update({
					components: [container],
				});
			}
			else if (btn.customId === "lessInfo") {
				container = generateContainer(true, target);
				await btn.update({
					components: [container],
				});
			}
		});

		collector?.on("end", async () => {
			await disableButtons(interaction, container);
		});
	},
};

const Strings = {
	[Language.English]: {
		inventoryOf: "Inventory of",
		closeInv: "Close",
		openInv: "Open",
		inventoryItems: "Items in the inventory",
		emptyInventory: "Empty inventory",
	},

	[Language.Portuguese]: {
		inventoryOf: "Inventário de",
		closeInv: "Fechar",
		openInv: "Abrir",
		inventoryItems: "Itens no inventário",
		emptyInventory: "Inventário vazio",
	},

	[Language.Spanish]: {
		inventoryOf: "Inventario de",
		closeInv: "Cerrar",
		openInv: "Abrir",
		inventoryItems: "Artículos en el inventario",
		emptyInventory: "Inventario vacío",
	},
} as const;
