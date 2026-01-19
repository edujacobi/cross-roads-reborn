import {
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
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
} from "../../utils/logic";
import { User } from "../../models/User";
import { Language } from "../../models/Language";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";
import { BundleList, getSkinBundleList } from "../../interfaces/Skins";
import { EmoteId, EmoteString } from "../../utils/emotes";
import { formatMoney } from "../../utils/ui";
import { ItemList } from "../../interfaces/Items";
import { UserBundle } from "../../models/UserBundle";
import { CrColors } from "../../utils/colors";
import { AvatarDecorationList, getAvatarDecorationList } from "../../interfaces/AvatarDecorations";
import { UserImageCanvasBuilder } from "../../ui/builders/UserImageCanvasBuilder";
import { UserAvatarDecoration } from "../../models/UserAvatarDecoration";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("specialshop")
		.setNameLocalization(Locale.PortugueseBR, "lojaespecial")
		.setDescription("Buy permanent customizations using the special coin")
		.setDescriptionLocalization(Locale.PortugueseBR, "Compre customizações permanentes utilizando a moeda especial"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		await deferReply(interaction);

		const s = Strings[language];

		function addHeader(container = new CustomContainerBuilder()) {
			container.setUser(user)
				.setAccentColor(CrColors.SpecialShop)
				.addSectionComponents(section => section
					.addTexts([
						`# ${s.title}`,
						s.permanent,
					])
					.setThumbnailAccessory(thumb => thumb
						.setURL("https://media.discordapp.net/attachments/1233604589064818808/1458922510782431507/SpecialCoinShop.png"),
					),
				)
				.addLargeSeparator();

			return container;
		}

		function addFooter(container: CustomContainerBuilder) {
			container.addFooter({
				text: s.youHaveCoins(user.SpecialCoin),
			});

			return container;
		}

		const VIP_BASE_PRICE = 5_000;

		async function generateDefaultContainer() {
			await user.GetInfo();

			// --- Pacotes de Skins

			let container = addHeader()
				.addTexts([`## ${s.skinBundles}`]);

			const skinBundles = getSkinBundleList().filter(bundle => bundle.Shop);
			for (let idx = 0; idx < skinBundles.length; idx++) {
				const bundle = skinBundles[idx];
				if (bundle.Items.length > 0) {
					const itemEmotes = bundle.Items.map(item => ItemList[item].Skin[bundle.Id].String);

					const userHasBundle = await UserBundle.HasBundle(user.Id, bundle.Id);

					const meanValuePerSkin = bundle.Price / bundle.Items.length;

					let rarityEmote = EmoteString.Common;
					if (meanValuePerSkin > 500) {
						rarityEmote = EmoteString.Mythic;
					}
					else if (meanValuePerSkin > 400) {
						rarityEmote = EmoteString.Legendary;
					}
					else if (meanValuePerSkin > 300) {
						rarityEmote = EmoteString.Rare;
					}
					else if (meanValuePerSkin > 200) {
						rarityEmote = EmoteString.Uncommon;
					}

					container.addSectionComponents(section => section
						.addTexts([
							`### ${rarityEmote}${bundle.Description[language]}`,
							`-# ${s.howManyItems(itemEmotes)}`,
							`# ${itemEmotes.join(" ")}`,
						])
						.setButtonAccessory(new ButtonBuilder()
							.setLabel(formatMoney(bundle.Price, language, ""))
							.setEmoji(EmoteId.SpecialCoinShop)
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(userHasBundle)
							.setCustomId("buy" + bundle.Id)),
					);

					if (idx !== skinBundles.length - 1) {
						container.addLargeSeparator();
					}
				}
			}

			// --- VIP

			container
				.addLargeSeparator()
				.addSectionComponents(section => section
					.addTexts([
						`# VIP`,
						s.vipDescription,
						`-# ${s.vipMoreInfo}`,
					])
					.setThumbnailAccessory(thumb => thumb
						.setURL("https://media.discordapp.net/attachments/531174573463306240/799060089503875072/VIP.png"),
					),
				);

			const vipButtons = [];
			for (let idx = 1; idx <= 3; idx++) {
				vipButtons.push((btn: ButtonBuilder) => btn
					.setLabel(`${s.months(idx)}: ${formatMoney(idx * VIP_BASE_PRICE, language, "")}`)
					.setEmoji(EmoteId.SpecialCoinShop)
					.setStyle(ButtonStyle.Secondary)
					.setCustomId("vip" + idx));
			}

			container.addButtonRow(...vipButtons);

			// --- Decoração de Avatar
			container
				.addLargeSeparator()
				.addSectionComponents(section => section
					.addTexts([
						`# ${s.avatarDecoration}`,
						s.defeatDecoration,
						`-# ${s.testDecoration}`
					])
					.setThumbnailAccessory(thumb => thumb
						.setURL("https://media.discordapp.net/attachments/1455628323848851639/1458923128968445983/preview.webp"),
					),
				);

			const avatarDecorations = getAvatarDecorationList().filter(decoration => decoration.Shop);

			const avatarDecorationsChunks = [];
			for (let i = 0; i < avatarDecorations.length; i += 5) {
				avatarDecorationsChunks.push(avatarDecorations.slice(i, i + 5));
			}

			for (const chunk of avatarDecorationsChunks) {
				const buttons = await Promise.all(chunk.map(async decoration => {
					const disabled = await UserAvatarDecoration.HasAvatarDecoration(user.Id, decoration.Id);
					return (btn: ButtonBuilder) => btn
						.setLabel(`${decoration.Description[language]}: ${formatMoney(decoration.Price, language, "")}`)
						.setEmoji(EmoteId.SpecialCoinShop)
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(disabled)
						.setCustomId("decoration" + decoration.Id);
				}));

				container.addButtonRow(...buttons);
			}

			// --- Footer

			container.addLargeSeparator()
				.addTexts([
					`### ${s.howToAcquireTitle}`,
					`-# ${s.howToAcquireDescription}`,
				]);

			container = addFooter(container);

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

			else if (btn.customId.includes("confirmbuy")) {
				const bundleId = Number(btn.customId.replace("confirmbuy", ""));
				const bundle = BundleList[bundleId];
				await user.GetInfo();

				const userHasBundle = await UserBundle.HasBundle(user.Id, bundle.Id);

				if (userHasBundle) {
					container = addHeader()
						.addTexts([
							`${s.alreadyHaveBundle} **${bundle.Description[language]}**!`,
						]);

					container = addFooter(container);

					return replyWithContainer(interaction, container);
				}

				if (user.SpecialCoin < bundle.Price) {
					container = addHeader()
						.addTexts([
							s.dontHaveCoins(bundle.Price),
						]);

					container = addFooter(container);

					return replyWithContainer(interaction, container);
				}

				const success = await user.BuySkinBundle(bundleId);

				if (!success) {
					container = addHeader()
						.addTexts([
							`${s.error} **${bundle.Description[language]}**`,
						]);

					container = addFooter(container);

					return replyWithContainer(interaction, container);
				}

				container = addHeader()
					.addTexts([
						`${s.bundleBought} **${bundle.Description[language]}**!`,
					]);

				container = addFooter(container);

				return replyWithContainer(interaction, container);
			}

			else if (btn.customId.includes("buy")) {
				const bundleId = Number(btn.customId.replace("buy", ""));
				const bundle = BundleList[bundleId];

				const itemData = bundle.Items.map(item => `- ${ItemList[item].Skin[bundle.Id].String} ${ItemList[item].Description[language]}`);

				const canBuy = bundle.Price <= user.SpecialCoin;

				container = addHeader(new CustomContainerBuilder())
					.addTexts([
						`## ${s.skinBundleUnit} - ${bundle.Description[language]}`,
						`${s.price}: ${EmoteString.SpecialCoinShop}${formatMoney(bundle.Price, language, "")}`,
						`-# ${s.content}:\n${itemData.join("\n")}`,
					])
					.addButtonRow(
						btn => btn
							.setLabel(s.goBack)
							.setStyle(ButtonStyle.Secondary)
							.setCustomId("back"),
						btn => btn
							.setLabel(s.buy)
							.setStyle(ButtonStyle.Success)
							.setDisabled(!canBuy)
							.setCustomId("confirmbuy" + bundle.Id),
					);

				container = addFooter(container);

				return replyWithContainer(interaction, container);
			}

			else if (btn.customId.includes("confirmvip")) {
				const vipMonths = Number(btn.customId.replace("confirmvip", ""));
				const price = vipMonths * VIP_BASE_PRICE;
				await user.GetInfo();

				if (user.SpecialCoin < price) {
					container = addHeader()
						.addTexts([
							s.dontHaveCoins(price),
						]);

					container = addFooter(container);

					return replyWithContainer(interaction, container);
				}

				await user.AddVip(vipMonths * 30);

				container = addHeader()
					.addTexts([
						`${s.vipBought(vipMonths)}`,
					]);

				container = addFooter(container);

				return replyWithContainer(interaction, container);
			}

			else if (btn.customId.includes("vip")) {
				const vipMonths = Number(btn.customId.replace("vip", ""));
				const price = vipMonths * VIP_BASE_PRICE;
				const canBuy = price <= user.SpecialCoin;

				container = addHeader(new CustomContainerBuilder())
					.addTexts([
						`## ${EmoteString.VIP} VIP - ${s.months(vipMonths)}`,
						`${s.price}: ${EmoteString.SpecialCoinShop}${formatMoney(price, language, "")}`,
					])
					.addButtonRow(
						btn => btn
							.setLabel(s.goBack)
							.setStyle(ButtonStyle.Secondary)
							.setCustomId("back"),
						btn => btn
							.setLabel(s.buy)
							.setStyle(ButtonStyle.Success)
							.setDisabled(!canBuy)
							.setCustomId("confirmvip" + vipMonths),
					);

				container = addFooter(container);

				return replyWithContainer(interaction, container);
			}

			else if (btn.customId.includes("confirmdecoration")) {
				const decorationId = Number(btn.customId.replace("confirmdecoration", ""));
				const decoration = AvatarDecorationList[decorationId];
				await user.GetInfo();

				const userHasDecoration = await UserAvatarDecoration.HasAvatarDecoration(user.Id, decoration.Id);

				if (userHasDecoration) {
					container = addHeader()
						.addTexts([
							`${s.alreadyHaveDecoration} **${decoration.Description[language]}**!`,
						]);

					container = addFooter(container);

					return replyWithContainer(interaction, container);
				}

				if (user.SpecialCoin < decoration.Price) {
					container = addHeader()
						.addTexts([
							s.dontHaveCoins(decoration.Price),
						]);

					container = addFooter(container);

					return replyWithContainer(interaction, container);
				}

				const success = await user.BuyAvatarDecoration(decorationId);

				if (!success) {
					container = addHeader()
						.addTexts([
							`${s.error} **${decoration.Description[language]}**`,
						]);

					container = addFooter(container);

					return replyWithContainer(interaction, container);
				}

				container = addHeader()
					.addTexts([
						`${s.decorationBought} **${decoration.Description[language]}**!`,
						`-# ${s.activateDecoration}`,
					]);

				container = addFooter(container);

				return replyWithContainer(interaction, container);
			}

			else if (btn.customId.includes("decoration")) {
				const decorationId = Number(btn.customId.replace("decoration", ""));
				const decoration = AvatarDecorationList[decorationId];

				const canBuy = decoration.Price <= user.SpecialCoin;

				const previewImage = await new UserImageCanvasBuilder(user, interaction.user.avatarURL({ size: 512 }))
					.SetDecoration(decoration.Id)
					.GenerateImage();

				const previewImageFile = new AttachmentBuilder(previewImage, { name: "preview.webp" });

				container = addHeader(new CustomContainerBuilder())
					.addSectionComponents(section => section
						.addTexts([
							`## ${s.avatarDecoration} - ${decoration.Description[language]}`,
							`${s.price}: ${EmoteString.SpecialCoinShop}${formatMoney(decoration.Price, language, "")}`,
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
							.setLabel(s.buy)
							.setStyle(ButtonStyle.Success)
							.setDisabled(!canBuy)
							.setCustomId("confirmdecoration" + decoration.Id),
					);

				container = addFooter(container);

				await replyInteraction(interaction, {
					components: [container],
					files: [previewImageFile],
					flags: MessageFlags.IsComponentsV2,
				});
			}
		});
	},
};

const Strings = {
	[Language.English]: {
		title: "Special shop",
		permanent: "All customizations are permanent!",
		youHaveCoins: (coins: number) => `You have ${EmoteString.SpecialCoinShop}${formatMoney(coins, Language.English, "")} Special Coins`,
		skinBundles: "Skin Bundles",
		howManyItems: (itemArray: string[]) => `${itemArray.length} ${itemArray.length === 1 ? "item" : "items"}`,
		alreadyHaveBundle: "You already own the skin bundle",
		alreadyHaveDecoration: "You already own the avatar decoration",
		dontHaveCoins: (price: number) => `You don't have ${EmoteString.SpecialCoinShop}${formatMoney(price, Language.English, "")} to buy this item`,
		error: "An error occurred while trying to buy this item",
		bundleBought: "You bought the skin bundle",
		decorationBought: "You bought the avatar decoration",
		activateDecoration: "Activate in `/decorations`",
		skinBundleUnit: "Skin Bundle",
		price: "Price",
		content: "Content",
		goBack: "Go back",
		months: (months: number) => `${months} ${months === 1 ? "Month" : "Months"}`,
		vipDescription: `All that a new aristrocrat needs!`,
		vipMoreInfo: `For more information, see \`/vip\``,
		vipBought: (months: number) => `You bought **${Strings[Language.English].months(months)}** of ${EmoteString.VIP} VIP!`,
		buy: "Buy",
		avatarDecoration: "Avatar decorations",
		defeatDecoration: "Defeat your opponents in style",
		testDecoration: "You can preview the decor before you buy",
		howToAcquireTitle: "How to acquire",
		howToAcquireDescription: "On the official server, in the #vip-special-coins channel",
	},
	[Language.Portuguese]: {
		title: "Loja especial",
		permanent: "Todas as customizações são permanentes!",
		youHaveCoins: (coins: number) => `Você possui ${EmoteString.SpecialCoinShop}${formatMoney(coins, Language.Portuguese, "")} Moedas Especiais`,
		skinBundles: "Pacotes de skins",
		howManyItems: (itemArray: string[]) => `${itemArray.length} ${itemArray.length === 1 ? "item" : "itens"}`,
		alreadyHaveBundle: "Você já possui o pacote de skins",
		alreadyHaveDecoration: "Você já possui a decoração de avatar",
		dontHaveCoins: (price: number) => `Você não possui ${EmoteString.SpecialCoinShop}${formatMoney(price, Language.Portuguese, "")} para comprar este item`,
		error: "Ocorreu um erro ao tentar comprar este item",
		bundleBought: "Você comprou o pacote de skins",
		decorationBought: "Você comprou a decoração de avatar",
		activateDecoration: "Ative em `/decorações`",
		skinBundleUnit: "Pacote de skins",
		price: "Preço",
		content: "Conteúdo",
		goBack: "Voltar",
		months: (months: number) => `${months} ${months === 1 ? "Mês" : "Meses"}`,
		vipDescription: `Tudo que um novo aristocrata precisa!`,
		vipMoreInfo: `Para mais informações, veja \`/vip\``,
		vipBought: (months: number) => `Você comprou **${Strings[Language.Portuguese].months(months)}** de ${EmoteString.VIP} VIP!`,
		buy: "Comprar",
		avatarDecoration: "Decorações de avatar",
		defeatDecoration: "Derrote seus oponentes com estilo",
		testDecoration: "Você pode pré visualizar a decoração antes de comprar",
		howToAcquireTitle: "Como adquirir",
		howToAcquireDescription: "No servidor oficial, no canal #vip-moedas-especiais",
	},
	[Language.Spanish]: {
		title: "Comercio especial",
		permanent: "¡Todas las personalizaciones son permanentes!",
		youHaveCoins: (coins: number) => `Tienes ${EmoteString.SpecialCoinShop}${formatMoney(coins, Language.Spanish, "")} Monedas Especiales`,
		skinBundles: "Paquetes de skins",
		howManyItems: (itemArray: string[]) => `${itemArray.length} ${itemArray.length === 1 ? "artículo" : "artículos"}`,
		alreadyHaveBundle: "Ya tienes el paquete de skins",
		alreadyHaveDecoration: "Ya tienes la decoración del avatar",
		dontHaveCoins: (price: number) => `No tienes ${EmoteString.SpecialCoinShop}${formatMoney(price, Language.Spanish, "")} para comprar este artículo`,
		error: "Ocurrió un error al intentar comprar este artículo",
		bundleBought: "Compraste el paquete de skins",
		decorationBought: "Compraste la decoración del avatar",
		activateDecoration: "Activar en `/decorations`",
		skinBundleUnit: "Paquete de skins",
		price: "Precio",
		content: "Contenido",
		goBack: "Volver",
		months: (months: number) => `${months} ${months === 1 ? "Mes" : "Meses"}`,
		vipDescription: `Todo lo que necesita un nuevo aristócrata!`,
		vipMoreInfo: `Para obtener más información, consulte \`/vip\``,
		vipBought: (months: number) => `Compraste **${Strings[Language.English].months(months)}** de ${EmoteString.VIP} VIP!`,
		buy: "Comprar",
		avatarDecoration: "Decoraciones de avatar",
		defeatDecoration: "Derrota a tus oponentes con estilo",
		testDecoration: "Puedes obtener una vista previa de la decoración antes de comprarla",
		howToAcquireTitle: "Cómo adquirir",
		howToAcquireDescription: "En el servidor oficial, en el canal #vip-special-coins.",
	},
} as const;