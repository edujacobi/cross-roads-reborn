import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { UserImageCanvasBuilder } from "#bot/ui/builders/UserImageCanvasBuilder";
import { UserRankingCardCanvasBuilder } from "#bot/ui/builders/UserRankingCardCanvasBuilder";
import { createButtonCollector, disableButtons } from "#bot/utils/collectors";
import { CrColors } from "#bot/utils/colors";
import { deferUpdate, replyInteraction, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteId } from "#bot/utils/emotes";
import { Language, type Localization } from "#core/models/Language";
import type { User } from "#core/models/User";
import { UserAvatarDecoration } from "#core/models/UserAvatarDecoration";
import { UserBackgroundDecoration } from "#core/models/UserBackgroundDecoration";
import { AvatarDecorationList } from "#core/types/AvatarDecorations";
import { BackgroundDecorationList } from "#core/types/BackgroundDecorations";
import { AvatarDecorationId, BackgroundDecorationId } from "#core/types/Ids";
import {
	AttachmentBuilder,
	type ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	Locale,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

const CATEGORY_AVATAR = "cat_avatar";
const CATEGORY_RANKING = "cat_ranking";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("decorations")
		.setNameLocalization(Locale.PortugueseBR, "decorações")
		.setNameLocalization(Locale.SpanishES, "decoraciones")
		.setDescription("Choose the decoration for your avatar or ranking card")
		.setDescriptionLocalization(Locale.PortugueseBR, "Escolha a decoração para seu avatar ou cartão de ranking")
		.setDescriptionLocalization(Locale.SpanishES, "Elige la decoración para tu avatar o tarjeta de ranking"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const s = Strings[language];
		let currentCategory = CATEGORY_AVATAR;

		function addHeader(container = new CustomContainerBuilder(), hasItems: boolean) {
			container
				.setUser(user)
				.setAccentColor(CrColors.Default)
				.addTexts([
					`# ${currentCategory === CATEGORY_AVATAR ? s.titleAvatar : s.titleRanking}`,
					hasItems ? s.subtitle : s.dontHave,
				]);

			if (hasItems) {
				container.addLargeSeparator();
			}

			return container;
		}

		function getAvatarEmote(id: AvatarDecorationId) {
			switch (id) {
			case AvatarDecorationId.Developer:
			case AvatarDecorationId.Moderator:
			case AvatarDecorationId.Helper:
				return EmoteId.Legendary;

			case AvatarDecorationId.Silver:
			case AvatarDecorationId.FrutigerAero:
			case AvatarDecorationId.Rainbow:
			case AvatarDecorationId.MasterOfArms:
				return EmoteId.Rare;

			case AvatarDecorationId.VIP:
				return EmoteId.VIP;

			case AvatarDecorationId.Default:
			case AvatarDecorationId.Pistol:
			case AvatarDecorationId.MachinePistol:
			case AvatarDecorationId.HuntRifle:
			case AvatarDecorationId.Shotgun:
			case AvatarDecorationId.SMG:
			case AvatarDecorationId.AssaultRifle:
			case AvatarDecorationId.Carbine:
			case AvatarDecorationId.Sniper:
			case AvatarDecorationId.Katana:
			case AvatarDecorationId.RPG:
			case AvatarDecorationId.Minigun:
			case AvatarDecorationId.Bazooka:
				return EmoteId.Common;

			default:
				return EmoteId.Uncommon;
			}
		}

		function getBackgroundEmote(id: BackgroundDecorationId) {
			switch (id) {
			case BackgroundDecorationId.Silver:
			case BackgroundDecorationId.FrutigerAero:
			case BackgroundDecorationId.Rainbow:
			case BackgroundDecorationId.Cloud:
				return EmoteId.Rare;

			case BackgroundDecorationId.Default:
				return EmoteId.Common;

			default:
				return EmoteId.Uncommon;
			}
		}

		async function generateDefaultContainer() {
			await user.GetInfo();

			const items = currentCategory === CATEGORY_AVATAR
				? await UserAvatarDecoration.GetList(user, language)
				: await UserBackgroundDecoration.GetList(user, language);

			const hasItems = items.length > 0;
			const container = addHeader(new CustomContainerBuilder(), hasItems);

			// Category Buttons
			container.addButtonRow(
				btn => btn
					.setLabel(s.catAvatar)
					.setStyle(currentCategory === CATEGORY_AVATAR ? ButtonStyle.Primary : ButtonStyle.Secondary)
					.setCustomId(CATEGORY_AVATAR)
					.setDisabled(currentCategory === CATEGORY_AVATAR),
				btn => btn
					.setLabel(s.catRanking)
					.setStyle(currentCategory === CATEGORY_RANKING ? ButtonStyle.Primary : ButtonStyle.Secondary)
					.setCustomId(CATEGORY_RANKING)
					.setDisabled(currentCategory === CATEGORY_RANKING),
			);

			if (hasItems) {
				container.addTexts([
					`### ${s.selectDecoration}`,
				]);

				const chunks = [];
				for (let i = 0; i < items.length; i += 5) {
					chunks.push(items.slice(i, i + 5));
				}

				for (const chunk of chunks) {
					container.addButtonRow(
						...chunk.map(item => {
							const isAvatar = "AvatarDecorationId" in item;
							const id = isAvatar ? item.AvatarDecorationId : item.BackgroundDecorationId;
							const isActive = isAvatar
								? user.AvatarDecoration.Id === id
								: user.BackgroundDecoration.Id === id;

							return (btn: ButtonBuilder) => btn
								.setLabel(item.Description)
								.setStyle(ButtonStyle.Secondary)
								.setEmoji(isAvatar ? getAvatarEmote(id as AvatarDecorationId) : getBackgroundEmote(id as BackgroundDecorationId))
								.setDisabled(isActive)
								.setCustomId("change-" + id);
						}),
					);
				}
			}

			container.addFooter({
				text: s.footer,
			});

			return container;
		}

		let container = await generateDefaultContainer();

		const response = await replyWithContainer(interaction, container);

		const collector = createButtonCollector(interaction, response);

		collector?.on("end", async () => {
			await disableButtons(interaction, container);
		});

		collector?.on("collect", async btn => {
			await deferUpdate(btn);

			if (btn.customId === CATEGORY_AVATAR || btn.customId === CATEGORY_RANKING) {
				currentCategory = btn.customId;
				container = await generateDefaultContainer();
				return replyWithContainer(interaction, container);
			}

			if (btn.customId === "back") {
				container = await generateDefaultContainer();
				return replyWithContainer(interaction, container);
			}

			else if (btn.customId.includes("change-")) {
				const id = Number(btn.customId.replace("change-", ""));
				const isAvatar = currentCategory === CATEGORY_AVATAR;

				let previewImage: Buffer;
				let name = "";

				if (isAvatar) {
					const decoration = AvatarDecorationList[id];
					name = decoration.Description[language];
					previewImage = await new UserImageCanvasBuilder(user, interaction.user.avatarURL({ size: 512 }))
						.SetDecoration(decoration.Id)
						.GenerateImage();
				}
				else {
					const bg = BackgroundDecorationList[id];
					name = bg.Description[language];

					previewImage = await new UserRankingCardCanvasBuilder(user, 1, "Cr$ 1.500.000", interaction.user.avatarURL({ size: 128 }))
						.SetDecoration(id)
						.GenerateImage();
				}

				const previewImageFile = new AttachmentBuilder(previewImage, { name: "preview.webp" });

				container = addHeader(new CustomContainerBuilder(), true);

				if (isAvatar) {
					container
						.addSectionComponents(section => section
							.addTexts([
								`## ${name}`,
							])
							.setThumbnailAccessory(preview => preview
								.setURL("attachment://preview.webp"),
							),
						);
				}
				else {
					container
						.addTexts([
							`## ${name}`,
						])
						.addImage("attachment://preview.webp");
				}

				container
					.addButtonRow(
						btn => btn
							.setLabel(s.goBack)
							.setStyle(ButtonStyle.Secondary)
							.setCustomId("back"),
						btn => btn
							.setLabel(s.confirm)
							.setStyle(ButtonStyle.Success)
							.setCustomId("confirm-" + id),
					);

				container.addFooter();

				await replyInteraction(interaction, {
					components: [container],
					files: [previewImageFile],
					flags: MessageFlags.IsComponentsV2,
				});
			}

			else if (btn.customId.includes("confirm-")) {
				const id = Number(btn.customId.replace("confirm-", ""));
				const isAvatar = currentCategory === CATEGORY_AVATAR;

				await user.GetInfo();
				let name = "";

				if (isAvatar) {
					const decoration = AvatarDecorationList[id];
					name = decoration.Description[language];
					await user.SetAvatarDecoration(decoration);
				}
				else {
					const bg = BackgroundDecorationList[id];
					name = bg.Description[language];
					await user.SetBackgroundDecoration(bg);
				}

				container = addHeader(new CustomContainerBuilder(), true)
					.addTexts([
						`## ${name}`,
						`-# ${s.applied}`,
					])
					.addButtonRow(btn => btn
						.setLabel(s.goBack)
						.setStyle(ButtonStyle.Secondary)
						.setCustomId("back"),
					);

				container.addFooter();

				return replyWithContainer(interaction, container);
			}
		});
	},
};

const Strings = {
	[Language.English]: {
		titleAvatar: "Avatar decorations",
		titleRanking: "Ranking backgrounds",
		catAvatar: "Avatar",
		catRanking: "Ranking",
		subtitle: "Personalize your look!",
		selectDecoration: "Select item",
		dontHave: "You don't have items in this category.",
		footer: "To buy customizations, access `/specialshop`",
		confirm: "Confirm",
		goBack: "Go back",
		applied: "Applied successfully!",
	},
	[Language.Portuguese]: {
		titleAvatar: "Decorações de avatar",
		titleRanking: "Fundos de ranking",
		catAvatar: "Avatar",
		catRanking: "Ranking",
		subtitle: "Personalize seu visual!",
		selectDecoration: "Selecionar item",
		dontHave: "Você não possui itens nesta categoria.",
		footer: "Para comprar customizações, acesse a `/lojaespecial`",
		confirm: "Confirmar",
		goBack: "Voltar",
		applied: "Aplicado com sucesso!",
	},
	[Language.Spanish]: {
		titleAvatar: "Decoraciones de avatar",
		titleRanking: "Fondos de ranking",
		catAvatar: "Avatar",
		catRanking: "Ranking",
		subtitle: "¡Personaliza tu look!",
		selectDecoration: "Seleccionar artículo",
		dontHave: "No tienes artículos en esta categoría.",
		footer: "¡Para comprar personalizaciones, ve a `/specialshop`",
		confirm: "Confirmar",
		goBack: "Volver",
		applied: "¡Aplicado con éxito!",
	},
} as const satisfies Localization;
