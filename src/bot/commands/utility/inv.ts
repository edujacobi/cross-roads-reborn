import { getClient } from "#bot/client";
import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { GangImageCanvasBuilder } from "#bot/ui/builders/GangImageCanvasBuilder";
import { UserImageCanvasBuilder } from "#bot/ui/builders/UserImageCanvasBuilder";
import { createButtonCollector, disableButtons } from "#bot/utils/collectors";
import { deferReply, deferUpdate, replyInteraction, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteId, EmoteString } from "#bot/utils/emotes";
import { Inventory } from "#bot/utils/invUtils";
import { convertHexNumberToString, formatMoney, hexToRGB, showTime } from "#bot/utils/ui";
import { searchUser } from "#bot/utils/userUtils";
import { Language, type Localization } from "#core/models/Language";
import type { User } from "#core/models/User";
import { UserBadge } from "#core/models/UserBadge";
import { ClassList } from "#core/types/Classes";
import { GangColor } from "#core/types/GangColors";
import { InvestmentList } from "#core/types/Investments";
import { ItemType } from "#core/types/Items";
import { differenceInHours, subMinutes } from "date-fns";
import {
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	Colors,
	Locale,
	MessageFlags,
	SlashCommandBuilder
} from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("inv")
		.setNameLocalization(Locale.SpanishES, "inv")
		.setDescription("See the inventory of a user")
		.setDescriptionLocalization(Locale.PortugueseBR, "Veja o inventário de um usuário")
		.setDescriptionLocalization(Locale.SpanishES, "Ver el inventario de un usuario")
		.addStringOption(target => target
			.setName("target")
			.setDescription("The user")
			.setNameLocalization(Locale.PortugueseBR, "alvo")
			.setNameLocalization(Locale.SpanishES, "objetivo")
			.setMinLength(3)
			.setDescriptionLocalization(Locale.PortugueseBR, "O usuário"),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const nameOrId = interaction.options.getString("target");

		const FEATURE_FLAG_NEW_INV = true;

		await deferReply(interaction);

		const target = nameOrId ? await searchUser(nameOrId, interaction, language) : user;
		const _user = target ? await getClient().users.fetch(target.Id) : interaction.user;

		if (!target) {
			return;
		}

		if (FEATURE_FLAG_NEW_INV) {
			const inventory = new Inventory(interaction, target, _user, language);
			await inventory.Load();
			await inventory.Generate();
			return;
		}

		const s = Strings[language];

		// eslint-disable-next-line prefer-const
		let [badges, gang] = await Promise.all([
			UserBadge.GetList(target.Id),
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

		const emoteItems = [...target.Items].sort((a, b) => a.Id - b.Id).map(weapon => weapon.Skin[weapon.SelectedSkin].String);

		const textItems = target.Items.map(userItem => {
			const name = `${userItem.Skin[userItem.SelectedSkin].String} ${userItem.Description[language]}`;
			const consumable = userItem.Type === ItemType.Consumable;
			const value = consumable ? String(userItem.Quantity) : showTime(userItem.RemainingTime.getTime(), true);
			const isLessThan24Hours = consumable ? userItem.Quantity <= 2 : differenceInHours(userItem.RemainingTime, Date.now()) < 24;
			const isLessThan12Hours = consumable ? userItem.Quantity <= 1 : differenceInHours(userItem.RemainingTime, Date.now()) < 12;
			const emote = isLessThan12Hours ? EmoteString.LessThan12Hours : isLessThan24Hours ? EmoteString.LessThan24Hours : "";

			return `**${name}** ${value}${emote}`;
		}).join("\n");

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


			let investTextSimple: string | undefined = undefined;
			let investTextComplex: string | undefined = undefined;

			if (target.Investment.Id !== null) {
				const investEmote = target.Investment.ExpiresAt!.getTime() > Date.now() ? EmoteString.InvestmentActive : EmoteString.InvestmentInactive;
				const investment = InvestmentList[target.Investment.Id];
				investTextSimple = `${investEmote} ${investment.Name[language]}`;
				investTextComplex = `${investTextSimple}: ${showTime(target.Investment.ExpiresAt!.getTime(), true)}`;
			}

			if (isClosed) {
				container
					.addSectionComponents(headerSection => headerSection
						.addTexts([
							`### ${emoteOnline} ${s.inventoryOf} ${gangAcronym}${target.GetNameWithImage()}`,
							badgeText ? `### -# ${badgeText}` : "\u200b",
							`# ${formatMoney(target.Money, language)}`,
						])
						.setThumbnailAccessory(avatar => avatar
							.setDescription(`Image of ${user.Nickname}`)
							.setURL("attachment://user.webp"),
						),
					)
					.addTexts([
						`-# ${target.Situation.SimpleEmote} •${EmoteString.Attack}${target.Attributes.Attack}${EmoteString.Defense}${target.Attributes.Defense}`,
					])
					.addLargeSeparator()
					.addTexts([
						emoteItems.length ? `# ${emoteItems.join("\u0009")}` : `-# ${s.emptyInventory}`,
					]);

				if (investTextSimple) {
					container
						.addLargeSeparator()
						.addTexts([investTextSimple]);
				}

				container.addFooter({
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
						gangImage = await new GangImageCanvasBuilder(target, gang, language, true).GenerateImage();
						gangImageFile = new AttachmentBuilder(gangImage, { name: "gang.webp" });
					}

					container
						.addImage("attachment://gang.webp")
						.addSmallSeparator(false);
				}

				container
					.addSectionComponents(headerSection => headerSection
						.addTexts([
							`### ${s.inventoryOf} ${target.GetNameWithImage()}, ${ClassList[target.Class].Name[language]}`,
							`-# ${textOnline}`,
							badgeText ? `### ${badgeText}` : "\u200b",
							`# ${formatMoney(target.Money, language)}`,
						])
						.setThumbnailAccessory(avatar => avatar
							.setDescription(`Image of ${user.Nickname}`)
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

					]);

				if (investTextComplex) {
					container
						.addLargeSeparator()
						.addTexts([
							`-# ${s.investment}`,
							investTextComplex,
						]);
				}

				container.addFooter({
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
			await deferUpdate(btn);

			if (btn.customId === "moreInfo") {
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
		investment: "Investment",
	},

	[Language.Portuguese]: {
		inventoryOf: "Inventário de",
		closeInv: "Fechar",
		openInv: "Abrir",
		inventoryItems: "Itens no inventário",
		emptyInventory: "Inventário vazio",
		investment: "Investimento",
	},

	[Language.Spanish]: {
		inventoryOf: "Inventario de",
		closeInv: "Cerrar",
		openInv: "Abrir",
		inventoryItems: "Artículos en el inventario",
		emptyInventory: "Inventario vacío",
		investment: "Inversión",
	},
} as const satisfies Localization;
