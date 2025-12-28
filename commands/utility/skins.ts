import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	Locale,
	MessageComponentInteraction,
	MessageFlags,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { disableButtons, replyInteraction } from "../../utils/logic";
import { User } from "../../models/User";
import { Language } from "../../models/Language";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";
import { BundleList } from "../../interfaces/Skins";
import { ItemList, Items } from "../../interfaces/Items";
import { UserBundle } from "../../models/UserBundle";
import { CrColors } from "../../utils/colors";
import { BundleId } from "../../interfaces/Ids";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("skins")
		.setDescription("Choose the skins for your items")
		.setDescriptionLocalization(Locale.PortugueseBR, "Escolha as skins para seus itens"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const s = Strings[language];

		const userBundles = await UserBundle.GetList(user.Id, language);

		const itemsWithSkins = [...new Set(userBundles
			.filter(bundle => bundle.BundleId !== BundleId.Default)
			.map(bundle => bundle.Items)
			.flat()
			.sort((a, b) => a.Id - b.Id),
		)];

		const userHasBundles = userBundles.length > 0;

		function addHeader(container = new CustomContainerBuilder()) {
			container.setUser(user)
				.setAccentColor(CrColors.Default)
				.addTexts([
					`# Skins`,
					userHasBundles ? s.choose : s.dontHave,
				])
				.addLargeSeparator();

			return container;
		}

		async function generateDefaultContainer() {
			await user.GetInfo();

			// separate itemsWithSkins in different arrays with length = 5
			const itemsWithSkinsChunks = [];
			for (let i = 0; i < itemsWithSkins.length; i += 5) {
				itemsWithSkinsChunks.push(itemsWithSkins.slice(i, i + 5));
			}

			const container = addHeader();

			for (const chunk of itemsWithSkinsChunks) {
				container.addActionRowComponents(row => row
					.addComponents(
						chunk.map(item => new ButtonBuilder()
							.setLabel(item.Description[language])
							.setEmoji(item.Skin[BundleId.Default].Id)
							.setStyle(ButtonStyle.Secondary)
							.setCustomId("change" + item.Id),
						),
					),
				);
			}

			container.addFooter();

			return container;
		}

		let container = await generateDefaultContainer();

		const response = await replyInteraction(interaction, {
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});

		const collectorButton = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			idle: 60_000,
		});

		const collectorSelect = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.StringSelect,
			idle: 60_000,
		});

		let selectedItem: Items | null = null;

		collectorButton?.on("end", async () => {
			await disableButtons(interaction, container);
		});

		collectorButton?.on("collect", async btn => {
			await btn.deferUpdate({
				withResponse: true,
			});

			if (btn.customId === "back") {
				container = await generateDefaultContainer();

				selectedItem = null;

				await replyInteraction(interaction, {
					components: [container],
					flags: MessageFlags.IsComponentsV2,
				});
			}

			else if (btn.customId.includes("change")) {
				const itemId = Number(btn.customId.replace("change", ""));
				const item = ItemList[itemId];

				const bundles = userBundles.filter(bundle => bundle.Items.includes(item));
				const userItems = await user.GetAllItems();
				const userItem = userItems.find(item => item.Id === itemId);

				if (!userItem) {
					return;
				}

				selectedItem = item;

				const currentSkin = BundleList[userItem.SelectedSkin];

				container = addHeader()
					.addTexts([
						`## ${item.Skin[BundleId.Default].String} ${item.Description[language]}`,
					])
					.addActionRowComponents(new ActionRowBuilder<StringSelectMenuBuilder>()
						.addComponents([
							new StringSelectMenuBuilder()
								.setCustomId("select")
								.addOptions(bundles.map(bundle => new StringSelectMenuOptionBuilder()
									.setDefault(currentSkin.Id === bundle.BundleId)
									.setLabel(bundle.Description)
									.setValue(String(bundle.BundleId)),
								)),
						]),
					)
					.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>()
						.addComponents([
							new ButtonBuilder()
								.setLabel(s.goBack)
								.setStyle(ButtonStyle.Secondary)
								.setCustomId("back"),
						]),
					);

				container.addFooter();

				await replyInteraction(interaction, {
					components: [container],
					flags: MessageFlags.IsComponentsV2,
				});
			}
		});

		collectorSelect?.on("collect", async select => {
			await select.deferUpdate({
				withResponse: true,
			});

			await user.GetInfo();

			const skin = BundleList[Number(select.values[0])];

			if (!selectedItem) {
				return;
			}

			await user.SetItemSkin(selectedItem, skin);

			container = addHeader()
				.addTexts([
					`## ${selectedItem.Skin[skin.Id].String} ${selectedItem.Description[language]} - ${skin.Description[language]}`,
					`-# ${s.selectedSkin}`,
				])
				.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>()
					.addComponents([
						new ButtonBuilder()
							.setLabel(s.goBack)
							.setStyle(ButtonStyle.Secondary)
							.setCustomId("back"),
					]),
				);

			container.addFooter();

			await replyInteraction(interaction, {
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});

		});
	},
};

const Strings = {
	[Language.English]: {
		choose: "Choose the item and then the skin",
		dontHave: "You don't have skins. Buy at `/specialshop`!",
		goBack: "Go back",
		selectedSkin: "Selected skin",
	},
	[Language.Portuguese]: {
		choose: "Escolha o item e depois a skin",
		dontHave: "Você não possui skins. Compre na `/lojaespecial`!",
		goBack: "Voltar",
		selectedSkin: "Skin selecionada",
	},
	[Language.Spanish]: {
		choose: "Elija el item y luego la skin",
		dontHave: "No tiene skins. Compre en `/tiendaespecial`!",
		goBack: "Volver",
		selectedSkin: "Skin seleccionada",
	},
} as const;