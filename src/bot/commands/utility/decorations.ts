import {
	AttachmentBuilder,
	type ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	Locale,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { replyInteraction, replyWithContainer } from "@bot/utils/discordInteractions";
import type { User } from "@core/models/User";
import { Language, type Localization } from "@core/models/Language";
import { CustomContainerBuilder } from "@bot/ui/builders/CustomContainerBuilder";
import { CrColors } from "@bot/utils/colors";
import { UserAvatarDecoration } from "@core/models/UserAvatarDecoration";
import { AvatarDecorationList } from "@core/types/AvatarDecorations";
import { UserImageCanvasBuilder } from "@bot/ui/builders/UserImageCanvasBuilder";
import { AvatarDecorationId } from "@core/types/Ids";
import { EmoteId } from "@bot/utils/emotes";
import { createButtonCollector, disableButtons } from "@bot/utils/collectors";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("decorations")
		.setNameLocalization(Locale.PortugueseBR, "decorações")
		.setDescription("Choose the decoration for your avatar")
		.setDescriptionLocalization(Locale.PortugueseBR, "Escolha a decoração para seu avatar"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const s = Strings[language];

		const userDecorations = await UserAvatarDecoration.GetList(user, language);

		const userHasDecorations = userDecorations.length > 0;

		function addHeader(container = new CustomContainerBuilder()) {
			container
				.setUser(user)
				.setAccentColor(CrColors.Default)
				.addTexts([
					`# ${s.title}`,
					userHasDecorations ? s.subtitle : s.dontHave,
				]);

			if (userHasDecorations) {
				container.addLargeSeparator();
			}

			return container;
		}

		function getEmoteDecoration(avatarDecorationId: AvatarDecorationId) {
			switch (avatarDecorationId) {

			case AvatarDecorationId.Developer:
			case AvatarDecorationId.Moderator:
			case AvatarDecorationId.Helper:
				// Special decorations
				return EmoteId.Legendary;

			case AvatarDecorationId.Silver:
			case AvatarDecorationId.FrutigerAero:
			case AvatarDecorationId.Rainbow:
				// Expensive decorations
				return EmoteId.Rare;

			case AvatarDecorationId.VIP:
				return EmoteId.VIP;

			case AvatarDecorationId.Default:
				return EmoteId.Common;

			default:
				// Cheap decorations
				return EmoteId.Uncommon;
			}
		}

		async function generateDefaultContainer() {
			await user.GetInfo();

			// separate availableDecorations in different arrays with length = 5
			const availableDecorationsChunks = [];
			for (let i = 0; i < userDecorations.length; i += 5) {
				availableDecorationsChunks.push(userDecorations.slice(i, i + 5));
			}

			const container = addHeader();

			container.addTexts([
				`### ${s.selectDecoration}`,
			]);

			for (const chunk of availableDecorationsChunks) {
				container.addButtonRow(
					...chunk.map(decoration => (btn: ButtonBuilder) => btn
						.setLabel(decoration.Description)
						.setStyle(ButtonStyle.Secondary)
						.setEmoji(getEmoteDecoration(decoration.AvatarDecorationId))
						.setDisabled(user.AvatarDecoration.Id === decoration.AvatarDecorationId)
						.setCustomId("change-decoration" + decoration.AvatarDecorationId),
					),
				);
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
			await btn.deferUpdate();

			if (btn.customId === "back") {
				container = await generateDefaultContainer();

				return replyWithContainer(interaction, container);
			}

			else if (btn.customId.includes("change-decoration")) {
				const decorationId = Number(btn.customId.replace("change-decoration", ""));
				const decoration = AvatarDecorationList[decorationId];

				const previewImage = await new UserImageCanvasBuilder(user, interaction.user.avatarURL({ size: 512 }))
					.SetDecoration(decoration.Id)
					.GenerateImage();

				const previewImageFile = new AttachmentBuilder(previewImage, { name: "preview.webp" });

				container = addHeader()
					.addSectionComponents(section => section
						.addTexts([
							`## ${decoration.Description[language]}`,
						])
						.setThumbnailAccessory(preview => preview
							.setURL("attachment://preview.webp")),
					)
					.addButtonRow(
						btn => btn
							.setLabel(s.goBack)
							.setStyle(ButtonStyle.Secondary)
							.setCustomId("back"),
						btn => btn
							.setLabel(s.confirm)
							.setStyle(ButtonStyle.Success)
							.setCustomId("confirm" + decoration.Id),
					);

				container.addFooter();

				await replyInteraction(interaction, {
					components: [container],
					files: [previewImageFile],
					flags: MessageFlags.IsComponentsV2,
				});
			}

			else if (btn.customId.includes("confirm")) {
				const decorationId = Number(btn.customId.replace("confirm", ""));
				const decoration = AvatarDecorationList[decorationId];

				await user.GetInfo();
				await user.SetAvatarDecoration(decoration);

				container = addHeader()
					.addTexts([
						`## ${decoration.Description[language]}`,
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
		title: "Avatar decorations",
		subtitle: "Like an angel wearing a halo!",
		selectDecoration: "Select decoration",
		dontHave: "You don't have decorations.",
		footer: "To buy decorations, access `/specialshop`",
		confirm: "Confirm",
		goBack: "Go back",
		applied: "Applied! Use `/inv` to see it",
	},
	[Language.Portuguese]: {
		title: "Decorações de avatar",
		subtitle: "Como um anjo usando uma auréola!",
		selectDecoration: "Selecionar decoração",
		dontHave: "Você não possui decorações.",
		footer: "Para comprar decorações, acesse a `/lojaespecial`",
		confirm: "Confirmar",
		goBack: "Voltar",
		applied: "Aplicado! Use `/inv` para visualizar",
	},
	[Language.Spanish]: {
		title: "Decoraciones de avatar",
		subtitle: "Como un ángel que lleva un halo",
		selectDecoration: "Seleccionar decoración",
		dontHave: "No tiene decoraciones.",
		footer: "¡Para comprar decoraciones, ve a `/specialshop`",
		confirm: "Confirmar",
		goBack: "Volver",
		applied: "Aplicado! Utilice `/inv` para ver",
	},
} as const satisfies Localization;