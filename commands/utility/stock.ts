import {
	ChatInputCommandInteraction, Colors,
	Locale,
	SlashCommandBuilder,
} from "discord.js";
import { User } from "../../models/User";
import { Language } from "../../models/Language";
import { Stock } from "../../models/Stock";
import { StockMarket } from "../../database/StockMarket";
import { STOCK_MAX_SHARES, StockList } from "../../interfaces/Stocks";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";
import { formatMoney, showTime } from "../../utils/ui";
import { CrColors } from "../../utils/colors";
import { deferReply, replyWithContainer } from "../../utils/logic";
import { EmoteString } from "../../utils/emotes";
import { EmoteBadgeString } from "../../utils/badges";
import { ItemList } from "../../interfaces/Items";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("stock")
		.setDescription("Manage your stock portfolio")
		.setNameLocalization(Locale.PortugueseBR, "acoes")
		.setDescriptionLocalization(Locale.PortugueseBR, "Gerencie seu portfólio de ações")
		.addSubcommand(sub => sub
			.setName("market")
			.setDescription("View the stock market")
			.setNameLocalization(Locale.PortugueseBR, "mercado")
			.setDescriptionLocalization(Locale.PortugueseBR, "Veja o mercado de ações"),
		)
		.addSubcommand(sub => sub
			.setName("portfolio")
			.setDescription("View your portfolio")
			.setNameLocalization(Locale.PortugueseBR, "portfolio")
			.setDescriptionLocalization(Locale.PortugueseBR, "Veja seu portfólio"),
		)
		.addSubcommand(sub => sub
			.setName("buy")
			.setDescription("Buy stocks")
			.setNameLocalization(Locale.PortugueseBR, "comprar")
			.setDescriptionLocalization(Locale.PortugueseBR, "Compre ações")
			.addStringOption(op => op
				.setName("ticker")
				.setDescription("The stock ticker")
				.setRequired(true)
				.addChoices(StockList.map(item => ({
					name: item.name,
					value: item.ticker,
				}))),
			)
			.addIntegerOption(op => op
				.setName("amount")
				.setDescription("Amount to buy")
				.setRequired(true)
				.setMinValue(1),
			),
		)
		.addSubcommand(sub => sub
			.setName("sell")
			.setDescription("Sell stocks")
			.setNameLocalization(Locale.PortugueseBR, "vender")
			.setDescriptionLocalization(Locale.PortugueseBR, "Venda ações")
			.addStringOption(op => op
				.setName("ticker")
				.setDescription("The stock ticker")
				.setRequired(true)
				.addChoices(StockList.map(item => ({
					name: item.name,
					value: item.ticker,
				}))),
			)
			.addIntegerOption(op => op
				.setName("amount")
				.setDescription("Amount to sell")
				.setRequired(true)
				.setMinValue(1),
			),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const subcommand = interaction.options.getSubcommand();
		const stockModel = new Stock(user);
		const s = Strings[language];

		if (subcommand === "market") {
			await deferReply(interaction);
			const stocks = await StockMarket.findAll();
			const next = await Stock.GetTimeNextRefresh();

			const container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.Default)
				.addSectionComponents(header => header
					.addTexts([
						`# ${s.marketTitle}`,
						s.marketDescription,
						`-# ${s.nextRefresh} ${showTime(next.getTime(), true)}`,
					])
					.setThumbnailAccessory(thumb => thumb
						.setURL("https://media.discordapp.net/attachments/1233604589064818808/1462966725803905219/Investidor.png"),
					),
				)
				.addLargeSeparator();

			for (let i = 0; i < stocks.length; i++) {
				const stock = stocks[i];
				const def = StockList.find(d => d.ticker === stock.ticker);
				const trend = stock.price >= stock.previousPrice ? EmoteString.Victory : EmoteString.Defeat;
				const change = stock.price - stock.previousPrice;
				const changeStr = change >= 0 ? `+${formatMoney(change, language)}` : formatMoney(change, language);

				container
					.addTexts([
						`### ${def?.name} (${stock.ticker})`,
						`${s.price}: ${formatMoney(stock.price, language)} ${trend} (${changeStr})`,
						`-# ${s.available}: ${formatMoney(stock.availableShares, language, "")}`,
					]);

				container.addLargeSeparator();

			}

			container
				.addTexts([
					s.toBuy,
				])
				.addFooter({ text: formatMoney(user.Money, language) });

			return replyWithContainer(interaction, container);
		}

		if (subcommand === "portfolio") {
			await deferReply(interaction);
			const portfolio = await stockModel.GetPortfolio();

			const container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.Default)
				.addSectionComponents(header => header
					.setId(1)
					.addTexts([
						`# ${s.portfolioTitle}`,
					], 2)
					.setThumbnailAccessory(thumb => thumb
						.setURL("https://media.discordapp.net/attachments/1233604589064818808/1462966725803905219/Investidor.png"),
					),
				)
				.addLargeSeparator();

			if (portfolio.length === 0) {
				container.changeTextFromSectionId(1, `# ${s.portfolioTitle}\n${s.emptyPortfolio}`);
			}
			else {
				let totalVal = 0;
				for (let i = 0; i < portfolio.length; i++) {
					const stock = portfolio[i];
					const def = StockList.find(d => d.ticker === stock.ticker);
					const profit = (stock.currentPrice - stock.averagePrice) * stock.quantity;
					const profitStr = profit >= 0 ? `+${formatMoney(profit, language)}` : formatMoney(profit, language);

					totalVal += stock.totalValue;

					container
						.addTexts([
							`### ${def?.name} (${stock.ticker}) \`x${stock.quantity}\``,
							`${s.avgPrice}: ${formatMoney(stock.averagePrice, language)}`,
							`${s.currPrice}: ${formatMoney(stock.currentPrice, language)}`,
							`${s.totalValue}: ${formatMoney(stock.totalValue, language)} (${profitStr})`,
						]);

					if (i !== portfolio.length - 1) {
						container.addLargeSeparator();
					}
				}

				container.changeTextFromSectionId(1, `# ${s.portfolioTitle}\n-# ${s.totalPortfolioValue}:\n## ${formatMoney(totalVal, language)}`);
			}

			container.addFooter({ text: formatMoney(user.Money, language) });
			return replyWithContainer(interaction, container);
		}

		if (subcommand === "buy") {
			await deferReply(interaction);
			const ticker = interaction.options.getString("ticker", true).toUpperCase();
			const amount = interaction.options.getInteger("amount", true);

			const result = await stockModel.Buy(ticker, amount);

			const container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(result.success ? CrColors.Default : Colors.Red)
				.addTexts([
					`-# ${EmoteBadgeString.Season6.Invester} ${s.marketTitle}`,
				])
				.addLargeSeparator()
				.addTexts([
					result.message,
				])
				.addFooter({
					text: formatMoney(user.Money, language),
				});

			return replyWithContainer(interaction, container);
		}

		if (subcommand === "sell") {
			await deferReply(interaction);
			const ticker = interaction.options.getString("ticker", true).toUpperCase();
			const amount = interaction.options.getInteger("amount", true);

			const result = await stockModel.Sell(ticker, amount);

			const container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(result.success ? CrColors.Default : Colors.Red)
				.addTexts([
					`-# ${EmoteBadgeString.Season6.Invester} ${s.marketTitle}`,
				])
				.addLargeSeparator()
				.addTexts([
					result.message,
				])
				.addFooter({
					text: formatMoney(user.Money, language),
				});

			return replyWithContainer(interaction, container);
		}
	},
};

const Strings = {
	[Language.English]: {
		marketTitle: "Stock Market",
		marketDescription: `The stock market is refreshed every hour!\nYou can hold a maximum of ${STOCK_MAX_SHARES} shares in total.`,
		nextRefresh: `Next refresh`,
		toBuy: "To buy, use `/stock buy <ticker> <amount>`",
		price: "Price",
		available: "Available",
		portfolioTitle: "Your portfolio",
		emptyPortfolio: "You don't own any stocks.",
		avgPrice: "Avg price",
		currPrice: "Current price",
		totalValue: "Value",
		totalPortfolioValue: "Total portfolio value",
	},
	[Language.Portuguese]: {
		marketTitle: "Mercado de Ações",
		marketDescription: `O mercado de ações é atualizado a cada hora!\nVocê pode ter no máximo ${STOCK_MAX_SHARES} ações no total.`,
		nextRefresh: `Próxima atualização`,
		toBuy: "Para comprar, use `/acoes comprar <ticker> <quantidade>`",
		price: "Preço",
		available: "Disponível",
		portfolioTitle: "Seu portfólio",
		emptyPortfolio: "Você não possui ações.",
		avgPrice: "Preço médio",
		currPrice: "Preço atual",
		totalValue: "Valor",
		totalPortfolioValue: "Valor total do portfólio",
	},
	[Language.Spanish]: {
		marketTitle: "Mercado de Valores",
		marketDescription: `El mercado de valores se actualiza cada hora!\nPuedes tener un máximo de ${STOCK_MAX_SHARES} acciones en total.`,
		nextRefresh: `Próxima actualización`,
		toBuy: "Para comprar, usa `/stock buy <ticker> <cantidad>`",
		price: "Precio",
		available: "Disponible",
		portfolioTitle: "Tu portafolio",
		emptyPortfolio: "No posees acciones.",
		avgPrice: "Precio promedio",
		currPrice: "Precio actual",
		totalValue: "Valor",
		totalPortfolioValue: "Valor total del portafolio",
	},
};
