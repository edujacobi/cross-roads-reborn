import {
	ChatInputCommandInteraction,
	Locale,
	SlashCommandBuilder,
} from "discord.js";
import { User } from "../../models/User";
import { Language } from "../../models/Language";
import { Stock } from "../../models/Stock";
import { StockMarket } from "../../database/StockMarket";
import { StockList } from "../../interfaces/Stocks";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";
import { formatMoney } from "../../utils/ui";
import { CrColors } from "../../utils/colors";
import { deferReply, replyWithContainer } from "../../utils/logic";

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
			.setDescriptionLocalization(Locale.PortugueseBR, "Veja o mercado de ações"))
		.addSubcommand(sub => sub
			.setName("portfolio")
			.setDescription("View your portfolio")
			.setNameLocalization(Locale.PortugueseBR, "portfolio")
			.setDescriptionLocalization(Locale.PortugueseBR, "Veja seu portfólio"))
		.addSubcommand(sub => sub
			.setName("buy")
			.setDescription("Buy stocks")
			.setNameLocalization(Locale.PortugueseBR, "comprar")
			.setDescriptionLocalization(Locale.PortugueseBR, "Compre ações")
			.addStringOption(op => op
				.setName("ticker")
				.setDescription("The stock ticker")
				.setRequired(true)
				.setAutocomplete(true))
			.addIntegerOption(op => op
				.setName("amount")
				.setDescription("Amount to buy")
				.setRequired(true)
				.setMinValue(1)))
		.addSubcommand(sub => sub
			.setName("sell")
			.setDescription("Sell stocks")
			.setNameLocalization(Locale.PortugueseBR, "vender")
			.setDescriptionLocalization(Locale.PortugueseBR, "Venda ações")
			.addStringOption(op => op
				.setName("ticker")
				.setDescription("The stock ticker")
				.setRequired(true)
				.setAutocomplete(true))
			.addIntegerOption(op => op
				.setName("amount")
				.setDescription("Amount to sell")
				.setRequired(true)
				.setMinValue(1))),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const subcommand = interaction.options.getSubcommand();
		const stockModel = new Stock(user);
		const s = Strings[language];

		if (subcommand === "market") {
			await deferReply(interaction);
			const stocks = await StockMarket.findAll();

			const container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.Job) // Using Job color (Greenish) for money related stuff
				.setTitle(s.marketTitle);

			let desc = "";
			for (const stock of stocks) {
				const def = StockList.find(d => d.ticker === stock.ticker);
				const trend = stock.price >= stock.previousPrice ? "📈" : "📉";
				const change = stock.price - stock.previousPrice;
				const changeStr = change >= 0 ? `+${formatMoney(change, language)}` : formatMoney(change, language);

				let history: number[] = [];
				try {
					history = JSON.parse(stock.history);
				}
				catch {
					history = [];
				}

				const historyStr = history.length > 0 ? `\n${s.history}: ${history.map(p => formatMoney(p, language)).join(" ➡ ")} ➡ **${formatMoney(stock.price, language)}**` : "";

				desc += `**${def?.name} (${stock.ticker})**\n`;
				desc += `${s.price}: ${formatMoney(stock.price, language)} ${trend} (${changeStr})`;
				desc += historyStr + "\n";
				desc += `${s.available}: ${stock.availableShares}\n\n`;
			}

			container.setDescription(desc);
			container.addFooter({ text: formatMoney(user.Money, language) });

			return replyWithContainer(interaction, container);
		}

		if (subcommand === "portfolio") {
			await deferReply(interaction);
			const portfolio = await stockModel.GetPortfolio();

			const container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.Job)
				.setTitle(s.portfolioTitle);

			if (portfolio.length === 0) {
				container.setDescription(s.emptyPortfolio);
			}
			else {
				let desc = "";
				let totalVal = 0;
				for (const item of portfolio) {
					const def = StockList.find(d => d.ticker === item.ticker);
					const profit = (item.currentPrice - item.averagePrice) * item.quantity;
					const profitStr = profit >= 0 ? `+${formatMoney(profit, language)}` : formatMoney(profit, language);

					desc += `**${def?.name} (${item.ticker})** x${item.quantity}\n`;
					desc += `${s.avgPrice}: ${formatMoney(item.averagePrice, language)}\n`;
					desc += `${s.currPrice}: ${formatMoney(item.currentPrice, language)}\n`;
					desc += `${s.totalValue}: ${formatMoney(item.totalValue, language)} (${profitStr})\n\n`;

					totalVal += item.totalValue;
				}
				desc += `\n**${s.totalPortfolioValue}: ${formatMoney(totalVal, language)}**`;
				container.setDescription(desc);
			}

			container.addFooter({ text: formatMoney(user.Money, language) });
			return replyWithContainer(interaction, container);
		}

		if (subcommand === "buy") {
			await deferReply(interaction);
			const ticker = interaction.options.getString("ticker")!.toUpperCase();
			const amount = interaction.options.getInteger("amount")!;

			const result = await stockModel.Buy(ticker, amount);

			const container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(result.success ? CrColors.Job : CrColors.Red)
				.setDescription(result.message);

			return replyWithContainer(interaction, container);
		}

		if (subcommand === "sell") {
			await deferReply(interaction);
			const ticker = interaction.options.getString("ticker")!.toUpperCase();
			const amount = interaction.options.getInteger("amount")!;

			const result = await stockModel.Sell(ticker, amount);

			const container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(result.success ? CrColors.Job : CrColors.Red)
				.setDescription(result.message);

			return replyWithContainer(interaction, container);
		}
	},

	async autocomplete(interaction: ChatInputCommandInteraction) {
		// @ts-expect-error - options exists on autocomplete interaction
		const focusedValue = interaction.options.getFocused();
		const choices = StockList.map(s => ({ name: `${s.name} (${s.ticker})`, value: s.ticker }));
		const filtered = choices.filter((choice: { name: string }) => choice.name.toLowerCase().includes(focusedValue.toLowerCase()));
		// @ts-expect-error - respond exists on autocomplete interaction
		await interaction.respond(
			filtered.slice(0, 25)
		);
	}
};

const Strings = {
	[Language.English]: {
		marketTitle: "Stock Market",
		price: "Price",
		available: "Available",
		portfolioTitle: "Your Portfolio",
		emptyPortfolio: "You don't own any stocks.",
		avgPrice: "Avg Price",
		currPrice: "Current Price",
		totalValue: "Value",
		totalPortfolioValue: "Total Portfolio Value",
		history: "History",
	},
	[Language.Portuguese]: {
		marketTitle: "Mercado de Ações",
		price: "Preço",
		available: "Disponível",
		portfolioTitle: "Seu Portfólio",
		emptyPortfolio: "Você não possui ações.",
		avgPrice: "Preço Médio",
		currPrice: "Preço Atual",
		totalValue: "Valor",
		totalPortfolioValue: "Valor Total do Portfólio",
		history: "Histórico",
	},
	[Language.Spanish]: {
		marketTitle: "Mercado de Valores",
		price: "Precio",
		available: "Disponible",
		portfolioTitle: "Tu Portafolio",
		emptyPortfolio: "No posees acciones.",
		avgPrice: "Precio Promedio",
		currPrice: "Precio Actual",
		totalValue: "Valor",
		totalPortfolioValue: "Valor Total del Portafolio",
		history: "Historial",
	},
};
