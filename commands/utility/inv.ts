import {
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	Locale,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import {
	createButtonCollector,
	deferReply,
	disableButtons,
	replyInteraction,
	replyWithContainer,
	searchUser,
} from "../../utils/logic";
import { Language } from "../../models/Language";
import { EmoteId, EmoteString } from "../../utils/emotes";
import { differenceInHours, subMinutes } from "date-fns";
import { User } from "../../models/User";
import { UserBadge } from "../../models/UserBadge";
import { ClassList } from "../../interfaces/Classes";
import { convertHexNumberToString, formatMoney, hexToRGB, showTime } from "../../utils/ui";
import { ItemType } from "../../interfaces/Items";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";
import { GangColor } from "../../utils/colors";
import { getClient } from "../../client";
import { UserImageCanvasBuilder } from "../../ui/builders/UserImageCanvasBuilder";
import { GangImageCanvasBuilder } from "../../ui/builders/GangImageCanvasBuilder";

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

		await deferReply(interaction);

		const target = nameOrId ? await searchUser(nameOrId, interaction, language) : user;
		const _user = target ? await getClient().users.fetch(target.Id) : interaction.user;

		if (!target) {
			return;
		}

		const s = Strings[language];

		// eslint-disable-next-line prefer-const
		let [badges, userItems, gang] = await Promise.all([
			UserBadge.GetList(target.Id),
			target.GetItems(),
			target.GetGang(),
		]);

		if (target.IsVip()) {
			badges = UserBadge.AddVIPBadgeInList(badges, target, language);
		}

		const userImage = await new UserImageCanvasBuilder(target, _user.avatarURL({ size: 512 }))
			.SetBadges(badges)
			.SetDecoration(target.AvatarDecoration.Id)
			.GenerateImage();

		const userImageFile = new AttachmentBuilder(userImage, { name: "user.webp" });

		let badgeText = "";

		badges.forEach(badge => badgeText += `${badge.Emoji} `);

		const emoteItems = [...userItems].sort((a, b) => a.Id - b.Id).map(weapon => weapon.Skin[weapon.SelectedSkin].String);

		const lastCommand = interaction.client.userLastCommand.get(target.Id) || 0;

		const online = new Date(lastCommand) > subMinutes(new Date(), 15);
		const emoteOnline = online ? EmoteString.Online : EmoteString.Offline;
		const textOnline = online ? `${EmoteString.Online} Online` : `${EmoteString.Offline} Offline`;

		let gangImage: Buffer<ArrayBufferLike> | null = null;
		let gangImageFile: AttachmentBuilder | null = null;

		async function generateContainer(isClosed: boolean, target: User) {
			const container = new CustomContainerBuilder()
				.setUser(user);

			if (target.IsVip()) {
				container.setAccentColor(Colors.Gold);
			}

			if (gang) {
				container.setAccentColor(hexToRGB(convertHexNumberToString(GangColor[gang.Color].Color)));
			}

			const gangAcronym = gang ? `[${gang.Acronym}] ` : "";

			if (isClosed) {
				container
					.addSectionComponents(headerSection => headerSection
						.addTexts([
							`### ${emoteOnline} ${s.inventoryOf} ${gangAcronym}${target.GetNameWithImage()}`,
							badgeText ? `### -# ${badgeText}` : "\u200b",
							`# ${formatMoney(target.Money, language)}`
						])
						.setThumbnailAccessory(avatar => avatar
							.setURL("attachment://user.webp"),
						),
					)
					.addTexts([
						`-# ${target.Situation.SimpleEmote}`
					])
					.addLargeSeparator()
					.addTexts([
						emoteItems.length ? `# ${emoteItems.join("\u0009")}` : `-# ${s.emptyInventory}`
					])
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
					if (!gangImageFile) {
						gangImage = await new GangImageCanvasBuilder(target, gang, language).GenerateImage();
						gangImageFile = new AttachmentBuilder(gangImage, { name: "gang.webp" });
					}

					container
						.addMediaGalleryComponents(gallery => gallery
							.addItems(galleryItem => galleryItem
								.setURL("attachment://gang.webp"),
							),
						)
						.addSeparatorComponents(separator => separator.setDivider(false));
				}

				const textItems = userItems.map(userItem => {
					const name = `${userItem.Skin[userItem.SelectedSkin].String} ${userItem.Description[language]}`;
					const consumable = userItem.Type === ItemType.Consumable;
					const value = consumable ? String(userItem.Quantity) : showTime(userItem.RemainingTime.getTime(), true);
					const isLessThan24Hours = consumable ? userItem.Quantity <= 2 : differenceInHours(userItem.RemainingTime, Date.now()) < 24;
					const isLessThan12Hours = consumable ? userItem.Quantity <= 1 : differenceInHours(userItem.RemainingTime, Date.now()) < 12;
					const emote = isLessThan12Hours ? EmoteString.LessThan12Hours : isLessThan24Hours ? EmoteString.LessThan24Hours : "";

					return `**${name}** ${value}${emote}`;
				}).join("\n");

				container
					.addSectionComponents(headerSection => headerSection
						.addTexts([
							`### ${s.inventoryOf} ${target.GetNameWithImage()}, ${ClassList[target.Class].Name[language]}`,
							`-# ${textOnline}`,
							badgeText ? `### ${badgeText}` : "\u200b",
							`# ${formatMoney(target.Money, language)}`
						])
						.setThumbnailAccessory(avatar => avatar
							.setURL("attachment://user.webp"),
						),
					)
					.addTexts([
						`${target.Situation.Complex} • ${EmoteString.Attack}${target.Attributes.Attack} ATK • ${EmoteString.Defense}${target.Attributes.Defense} DEF`,
					])
					.addLargeSeparator()
					.addTexts([
						`-# ${s.inventoryItems}`,
						textItems || `-# ${s.emptyInventory}`,

					])
					.addFooter({
						button: new ButtonBuilder()
							.setCustomId("lessInfo")
							.setLabel(s.closeInv)
							.setStyle(ButtonStyle.Secondary)
							.setEmoji(EmoteId.CloseInv),
					});
			}

			return container;
		}

		let container = await generateContainer(true, target);

		const files: AttachmentBuilder[] = [];
		if (userImageFile) {
			files.push(userImageFile);
		}

		const response = await replyInteraction(interaction, {
			components: [container],
			files,
			flags: MessageFlags.IsComponentsV2,
		});

		const collector = createButtonCollector(interaction, response);

		collector?.on("collect", async btn => {
			if (btn.customId === "moreInfo") {
				await btn.deferUpdate();

				container = await generateContainer(false, target);
				if (gangImageFile && !files.includes(gangImageFile)) {
					files.push(gangImageFile);
				}
				return replyInteraction(interaction, {
					components: [container],
					files,
				});
			}
			else if (btn.customId === "lessInfo") {
				container = await generateContainer(true, target);
				return replyWithContainer(interaction, container);
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
