import {
	ActionRowBuilder,
	type ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	Locale,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { deferUpdate, replyWithContainer } from "#bot/utils/discordInteractions";
import type { User } from "#core/models/User";
import { Language, type Localization } from "#core/models/Language";
import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { BundleList, getSkinBundleList } from "#core/types/Skins";
import { ItemList, type Items } from "#core/types/Items";
import { UserBundle } from "#core/models/UserBundle";
import { CrColors } from "#bot/utils/colors";
import { BundleId } from "#core/types/Ids";
import { createButtonCollector, createStringSelectCollector, disableButtons } from "#bot/utils/collectors";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("skins")
		.setNameLocalization(Locale.SpanishES, "skins")
		.setDescription("Choose the skins for your items")
		.setDescriptionLocalization(Locale.PortugueseBR, "Escolha as skins para seus itens")
		.setDescriptionLocalization(Locale.SpanishES, "Elige las skins para tus artículos"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const s = Strings[language];

		const userBundles = await UserBundle.GetList(user.Id, language);

		const itemsWithSkins = [...new Set(userBundles
			.filter(bundle => bundle.BundleId !== BundleId.Default)
			.flatMap(bundle => bundle.Items)
			.sort((a, b) => a.Id - b.Id),
		)];

		const userHasBundles = itemsWithSkins.length > 0;

		function addHeader(container = new CustomContainerBuilder()) {
			container
				.setUser(user)
				.setAccentColor(CrColors.Default)
				.addTexts([
					`# Skins`,
					userHasBundles ? s.subtitle : s.dontHave,
				]);

			if (userHasBundles) {
				container.addLargeSeparator();
			}

			return container;
		}

		async function generateDefaultContainer(itemPage = 0) {
			await user.GetInfo();

			// Split items into chunks of 4 buttons, then show 2 chunks per page
			const CHUNKS_PER_PAGE = 2;
			const ITEMS_PER_CHUNK = 4;
			const itemsWithSkinsChunks = [];

			for (let i = 0; i < itemsWithSkins.length; i += ITEMS_PER_CHUNK) {
				itemsWithSkinsChunks.push(itemsWithSkins.slice(i, i + ITEMS_PER_CHUNK));
			}

			const totalItemPages = Math.ceil(itemsWithSkinsChunks.length / CHUNKS_PER_PAGE);
			const clampedItemPage = Math.max(0, Math.min(itemPage, totalItemPages - 1));
			const pageChunks = itemsWithSkinsChunks.slice(clampedItemPage * CHUNKS_PER_PAGE, (clampedItemPage + 1) * CHUNKS_PER_PAGE);

			const container = addHeader();

			container.addTexts([
				`### ${s.selectItem}`,
				s.choose,
			]);

			for (const chunk of pageChunks) {
				container.addButtonRow(
					...chunk.map(item => (btn: ButtonBuilder) => btn
						.setLabel(item.Description[language])
						.setEmoji(item.Skin[BundleId.Default].Id)
						.setStyle(ButtonStyle.Secondary)
						.setCustomId("change-item" + item.Id),
					),
				);
			}

			// Item pagination nav — only shown when there is more than one page
			if (totalItemPages > 1) {
				const navButtons: ((btn: ButtonBuilder) => ButtonBuilder)[] = [];

				if (clampedItemPage > 0) {
					navButtons.push(btn => btn
						.setCustomId("items-prev")
						.setLabel(s.previous)
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("⬅️"),
					);
				}

				if (clampedItemPage < totalItemPages - 1) {
					navButtons.push(btn => btn
						.setCustomId("items-next")
						.setLabel(s.next)
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("➡️"),
					);
				}

				if (navButtons.length > 0) {
					container.addButtonRow(...navButtons);
				}
			}

			container.addLargeSeparator();

			container.addTexts([
				`### ${s.selectBundle}`,
				s.allItems,
			]);

			// Bundles are always shown in full (few enough to never hit the limit)
			const bundleList = getSkinBundleList();
			const userOwnedBundles = bundleList.filter(bundle => bundle.Id === BundleId.Default || userBundles.some(ub => ub.BundleId === bundle.Id));
			for (let i = 0; i < userOwnedBundles.length; i += 5) {
				const chunk = userOwnedBundles.slice(i, i + 5);
				container.addButtonRow(
					...chunk.map(bundle => (btn: ButtonBuilder) => btn
						.setLabel(bundle.Description[language])
						.setEmoji(ItemList[bundle.Items[0]].Skin[bundle.Id].Id)
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(userOwnedBundles.length === 1)
						.setCustomId("change-bundle" + bundle.Id),
					),
				);
			}

			container.addFooter();

			return { container, itemPage: clampedItemPage };
		}

		let { container, itemPage: currentItemPage } = await generateDefaultContainer();

		const response = await replyWithContainer(interaction, container);

		const collectorButton = createButtonCollector(interaction, response);

		const collectorSelect = createStringSelectCollector(interaction, response);

		let selectedItem: Items | null = null;

		collectorButton?.on("end", async () => {
			await disableButtons(interaction, container);
		});

		collectorButton?.on("collect", async btn => {
			await deferUpdate(btn);

			if (btn.customId === "items-prev" || btn.customId === "items-next") {
				const nextPage = btn.customId === "items-prev" ? currentItemPage - 1 : currentItemPage + 1;
				({ container, itemPage: currentItemPage } = await generateDefaultContainer(nextPage));
				return replyWithContainer(interaction, container);
			}

			else if (btn.customId === "back") {
				({ container, itemPage: currentItemPage } = await generateDefaultContainer(currentItemPage));

				selectedItem = null;

				return replyWithContainer(interaction, container);
			}

			else if (btn.customId.includes("change-item")) {
				const itemId = Number(btn.customId.replace("change-item", ""));
				const item = ItemList[itemId];

				const bundles = userBundles.filter(bundle => bundle.Items.includes(item));
				const userItem = await user.GetSpecificItem(item.Id);

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
					.addButtonRow(btn => btn
						.setLabel(s.goBack)
						.setStyle(ButtonStyle.Secondary)
						.setCustomId("back"),
					);

				container.addFooter();

				return replyWithContainer(interaction, container);
			}

			else if (btn.customId.includes("change-bundle")) {
				const bundleId = Number(btn.customId.replace("change-bundle", ""));
				const bundle = BundleList[bundleId];

				const itemData = bundle.Items.map(item => `- ${ItemList[item].Skin[bundle.Id].String} ${ItemList[item].Description[language]}`);

				container = addHeader()
					.addTexts([
						`## ${ItemList[bundle.Items[0]].Skin[bundle.Id].String} ${bundle.Description[language]}`,
						`-# ${s.willApplyTo}:\n${itemData.join("\n")}`,
					])
					.addButtonRow(
						btn => btn
							.setLabel(s.goBack)
							.setStyle(ButtonStyle.Secondary)
							.setCustomId("back"),
						btn => btn
							.setLabel(s.select)
							.setStyle(ButtonStyle.Primary)
							.setCustomId("confirm" + bundle.Id),
					);

				container.addFooter();

				return replyWithContainer(interaction, container);
			}
			else if (btn.customId.includes("confirm")) {
				const bundleId = Number(btn.customId.replace("confirm", ""));
				const bundle = BundleList[bundleId];

				await user.GetInfo();
				await user.SetBundleSkin(bundle);

				container = addHeader()
					.addTexts([
						`## ${ItemList[bundle.Items[0]].Skin[bundle.Id].String} ${bundle.Description[language]}`,
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

		collectorSelect?.on("collect", async select => {
			await select.deferUpdate();

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
				.addButtonRow(btn => btn
					.setLabel(s.goBack)
					.setStyle(ButtonStyle.Secondary)
					.setCustomId("back"),
				);

			container.addFooter();

			return replyWithContainer(interaction, container);
		});
	},
};

const Strings = {
	[Language.English]: {
		subtitle: "Show to everyone how different you are!",
		selectItem: "Select item",
		choose: "Choose the item and then the skin",
		dontHave: "You don't have skins. Buy at `/specialshop`!",
		selectBundle: "Select bundle",
		allItems: `All items in bundle will change skin`,
		goBack: "Go back",
		selectedSkin: "Selected skin",
		willApplyTo: "Will apply to items",
		select: "Select",
		applied: "Applied to all items",
		previous: "Previous",
		next: "Next",
	},
	[Language.Portuguese]: {
		subtitle: "Mostre à todos que você é diferentão!",
		selectItem: "Selecionar item",
		choose: "Escolha o item e depois a skin",
		dontHave: "Você não possui skins. Compre na `/lojaespecial`!",
		selectBundle: "Selecionar pacote",
		allItems: "Todos os itens no pacote irão alterar a skin",
		goBack: "Voltar",
		selectedSkin: "Skin selecionada",
		willApplyTo: "Irá aplicar aos itens",
		select: "Selecionar",
		applied: "Aplicado a todos os itens",
		previous: "Anterior",
		next: "Próximo",
	},
	[Language.Spanish]: {
		subtitle: "Muestra a todos lo diferente que eres",
		selectItem: "Seleccionar item",
		choose: "Elija el item y luego la skin",
		dontHave: "No tiene skins. Compre en `/tiendaespecial`!",
		selectBundle: "Seleccionar paquete",
		allItems: "Todos los artículos en el paquete cambiarán la skin",
		goBack: "Volver",
		selectedSkin: "Skin seleccionada",
		willApplyTo: "Irá aplicar a los artículos",
		select: "Seleccionar",
		applied: "Aplicado a todos los artículos",
		previous: "Anterior",
		next: "Siguiente",
	},
} as const satisfies Localization;