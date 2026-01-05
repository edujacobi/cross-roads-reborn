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
} from "discord.js";
import { disableButtons, replyInteraction } from "../../utils/logic";
import { User } from "../../models/User";
import { Language } from "../../models/Language";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";
import { BundleList, getSkinBundleList } from "../../interfaces/Skins";
import { EmoteId, EmoteString } from "../../utils/emotes";
import { formatMoney } from "../../utils/ui";
import { ItemList } from "../../interfaces/Items";
import { UserBundle } from "../../models/UserBundle";
import { CrColors } from "../../utils/colors";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("specialshop")
		.setNameLocalization(Locale.PortugueseBR, "lojaespecial")
		.setDescription("Buy permanent customizations using the special coin")
		.setDescriptionLocalization(Locale.PortugueseBR, "Compre customizações permanentes utilizando a moeda especial"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const s = Strings[language];

		function addHeader(container = new CustomContainerBuilder()) {
			container.setUser(user)
				.setAccentColor(CrColors.SpecialShop)
				.addTexts([
					`# ${s.title}`,
					s.permanent,
				])
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
						.addTextDisplayComponents(title => title
							.setContent(`### ${rarityEmote}${bundle.Description[language]}\n-# ${s.howManyItems(itemEmotes)}\n# ${itemEmotes.join(" ")}`),
						)
						.setButtonAccessory(new ButtonBuilder()
							.setLabel(formatMoney(bundle.Price, language, ""))
							.setEmoji(EmoteId.SpecialCoinShop)
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(userHasBundle)
							.setCustomId("buy" + bundle.Id)),
					);

					if (idx !== skinBundles.length - 1) {
						container.addSmallSeparator();
					}
				}
			}

			container
				.addLargeSeparator()
				.addTexts([
					`## ${EmoteString.VIP} VIP`,
					s.vipDescription,
					`-# ${s.vipMoreInfo}`,
				]);

			const row = new ActionRowBuilder<ButtonBuilder>();

			for (let idx = 1; idx <= 3; idx++) {
				row.addComponents(new ButtonBuilder()
					.setLabel(`${s.months(idx)}: ${formatMoney(idx * VIP_BASE_PRICE, language, "")}`)
					.setEmoji(EmoteId.SpecialCoinShop)
					.setStyle(ButtonStyle.Secondary)
					.setCustomId("vip" + idx));
			}

			container
				.addActionRowComponents(row)
				.addLargeSeparator()
				.addTexts([
					`### ${s.howToAcquireTitle}`,
					`-# ${s.howToAcquireDescription}`,
				]);

			container = addFooter(container);

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

		collectorButton?.on("end", async () => {
			await disableButtons(interaction, container);
		});

		collectorButton?.on("collect", async btn => {
			await btn.deferUpdate({
				withResponse: true,
			});

			if (btn.customId === "back") {
				container = await generateDefaultContainer();

				await replyInteraction(interaction, {
					components: [container],
					flags: MessageFlags.IsComponentsV2,
				});
			}

			else if (btn.customId.includes("confirmbuy")) {
				const bundleId = Number(btn.customId.replace("confirmbuy", ""));
				const bundle = BundleList[bundleId];
				await user.GetInfo();

				const userHasBundle = await UserBundle.HasBundle(user.Id, bundle.Id);

				if (userHasBundle) {
					container = addHeader()
						.addTexts([
							`${s.alreadyHave} **${bundle.Description[language]}**!`,
						]);

					container = addFooter(container);

					return replyInteraction(interaction, {
						components: [container],
					});
				}

				if (user.SpecialCoin < bundle.Price) {
					container = addHeader()
						.addTexts([
							s.dontHaveCoins(bundle.Price),
						]);

					container = addFooter(container);

					return replyInteraction(interaction, {
						components: [container],
					});
				}

				const success = await user.BuySkinBundle(bundleId);

				if (!success) {
					container = addHeader()
						.addTexts([
							`${s.error} **${bundle.Description[language]}**`,
						]);

					container = addFooter(container);

					return replyInteraction(interaction, {
						components: [container],
					});
				}

				container = addHeader()
					.addTexts([
						`${s.bundleBought} **${bundle.Description[language]}**!`,
					]);

				container = addFooter(container);

				return replyInteraction(interaction, {
					components: [container],
				});
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
					.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>()
						.addComponents([
							new ButtonBuilder()
								.setLabel(s.goBack)
								.setStyle(ButtonStyle.Secondary)
								.setCustomId("back"),
							new ButtonBuilder()
								.setLabel(s.buy)
								.setStyle(ButtonStyle.Success)
								.setDisabled(!canBuy)
								.setCustomId("confirmbuy" + bundle.Id),
						]),
					);

				container = addFooter(container);

				await replyInteraction(interaction, {
					components: [container],
					flags: MessageFlags.IsComponentsV2,
				});
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

					return replyInteraction(interaction, {
						components: [container],
					});
				}

				await user.AddVip(vipMonths * 30);

				container = addHeader()
					.addTexts([
						`${s.vipBought(vipMonths)}`,
					]);

				container = addFooter(container);

				return replyInteraction(interaction, {
					components: [container],
				});
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
					.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>()
						.addComponents([
							new ButtonBuilder()
								.setLabel(s.goBack)
								.setStyle(ButtonStyle.Secondary)
								.setCustomId("back"),
							new ButtonBuilder()
								.setLabel(s.buy)
								.setStyle(ButtonStyle.Success)
								.setDisabled(!canBuy)
								.setCustomId("confirmvip" + vipMonths),
						]),
					);

				container = addFooter(container);

				await replyInteraction(interaction, {
					components: [container],
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
		alreadyHave: "You already own the skin bundle",
		dontHaveCoins: (price: number) => `You don't have ${EmoteString.SpecialCoinShop}${formatMoney(price, Language.English, "")} to buy this skin bundle`,
		error: "An error occurred while trying to buy the skin bundle",
		bundleBought: "You bought the skin bundle",
		skinBundleUnit: "Skin Bundle",
		price: "Price",
		content: "Content",
		goBack: "Go back",
		months: (months: number) => `${months} ${months === 1 ? "Month" : "Months"}`,
		vipDescription: `All that a new aristrocrat needs!`,
		vipMoreInfo: `For more information, see \`/vip\``,
		vipBought: (months: number) => `You bought **${Strings[Language.English].months(months)}** of ${EmoteString.VIP} VIP!`,
		buy: "Buy",
		howToAcquireTitle: "How to acquire",
		howToAcquireDescription: "On the official server, in the #vip-special-coins channel",
	},
	[Language.Portuguese]: {
		title: "Loja especial",
		permanent: "Todas as customizações são permanentes!",
		youHaveCoins: (coins: number) => `Você possui ${EmoteString.SpecialCoinShop}${formatMoney(coins, Language.Portuguese, "")} Moedas Especiais`,
		skinBundles: "Pacotes de skins",
		howManyItems: (itemArray: string[]) => `${itemArray.length} ${itemArray.length === 1 ? "item" : "itens"}`,
		alreadyHave: "Você já possui o pacote de skins",
		dontHaveCoins: (price: number) => `Você não possui ${EmoteString.SpecialCoinShop}${formatMoney(price, Language.Portuguese, "")} para comprar este pacote de skins`,
		error: "Ocorreu um erro ao tentar comprar o pacote de skins",
		bundleBought: "Você comprou o pacote de skins",
		skinBundleUnit: "Pacote de skins",
		price: "Preço",
		content: "Conteúdo",
		goBack: "Voltar",
		months: (months: number) => `${months} ${months === 1 ? "Mês" : "Meses"}`,
		vipDescription: `Tudo que um novo aristocrata precisa!`,
		vipMoreInfo: `Para mais informações, veja \`/vip\``,
		vipBought: (months: number) => `Você comprou **${Strings[Language.Portuguese].months(months)}** de ${EmoteString.VIP} VIP!`,
		buy: "Comprar",
		howToAcquireTitle: "Como adquirir",
		howToAcquireDescription: "No servidor oficial, no canal #vip-moedas-especiais",
	},
	[Language.Spanish]: {
		title: "Comercio especial",
		permanent: "¡Todas las personalizaciones son permanentes!",
		youHaveCoins: (coins: number) => `Tienes ${EmoteString.SpecialCoinShop}${formatMoney(coins, Language.Spanish, "")} Monedas Especiales`,
		skinBundles: "Paquetes de skins",
		howManyItems: (itemArray: string[]) => `${itemArray.length} ${itemArray.length === 1 ? "artículo" : "artículos"}`,
		alreadyHave: "Ya tienes el paquete de skins",
		dontHaveCoins: (price: number) => `No tienes ${EmoteString.SpecialCoinShop}${formatMoney(price, Language.Spanish, "")} para comprar este paquete de skins`,
		error: "Ocurrió un error al intentar comprar el paquete de skins",
		bundleBought: "Compraste el paquete de skins",
		skinBundleUnit: "Paquete de skins",
		price: "Precio",
		content: "Contenido",
		goBack: "Volver",
		months: (months: number) => `${months} ${months === 1 ? "Mes" : "Meses"}`,
		vipDescription: `Todo lo que necesita un nuevo aristócrata!`,
		vipMoreInfo: `Para obtener más información, consulte \`/vip\``,
		vipBought: (months: number) => `Compraste **${Strings[Language.English].months(months)}** de ${EmoteString.VIP} VIP!`,
		buy: "Comprar",
		howToAcquireTitle: "Cómo adquirir",
		howToAcquireDescription: "En el servidor oficial, en el canal #vip-special-coins.",
	},
} as const;