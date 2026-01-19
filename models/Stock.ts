import { StockMarket } from "../database/StockMarket";
import { UserStocks } from "../database/UserStocks";
import { StockList, STOCK_GLOBAL_SUPPLY, STOCK_MAX_SHARES } from "../interfaces/Stocks";
import { User } from "./User";
import { Log } from "../utils/log";
import { formatMoney } from "../utils/ui";
import { Language } from "./Language";
import { Op } from "sequelize";

export class Stock {
	User: User;

	constructor(user: User) {
		this.User = user;
	}

	static async Initialize() {
		for (const stockDef of StockList) {
			const [_, created] = await StockMarket.findOrCreate({
				where: { ticker: stockDef.ticker },
				defaults: {
					ticker: stockDef.ticker,
					price: stockDef.initialPrice,
					previousPrice: stockDef.initialPrice,
					availableShares: STOCK_GLOBAL_SUPPLY,
				},
			});

			if (created) {
				Log.Info(`Stock ${stockDef.name} (${stockDef.ticker}) initialized with price ${stockDef.initialPrice}.`);
			}
		}

		// Set up hourly refresh
		setInterval(() => {
			Stock.RefreshMarket();
		}, 1000 * 60 * 60);

		// Run once on startup if needed, or just let the interval handle it.
		// Actually, let's just log that it's running.
		Log.Info("Stock market system initialized.");
	}

	static async RefreshMarket() {
		Log.Info("Refreshing stock market...");
		const stocks = await StockMarket.findAll();

		for (const stock of stocks) {
			const oldPrice = stock.price;

			// 1. Random Volatility: +/- 5%
			const volatility = 0.05;
			const randomFactor = 1 + (Math.random() * (volatility * 2) - volatility);

			// Calculate New Price
			// We base it on the *current* price to simulate drift, but dampen it with the scarcity logic so it doesn't spiral.
			// Or we can base it on InitialPrice * Scarcity * RandomTrend.
			// Let's stick to the prompt: "The fewer the stocks, more expensive it gets."

			// Let's modify the current price
			let newPrice = Math.floor(stock.price * randomFactor);

			// Apply scarcity adjustment to the *change*.
			// If scarce, we bias the random factor upwards.
			// Let's try: NewPrice = CurrentPrice * (Random(-0.05, 0.05) + ScarcityBias)
			// ScarcityBias = (1000 - Available) / 5000.
			// If 0 sold: Bias 0. If 500 sold: Bias 0.025 (2.5% upward pressure).
			const scarcityBias = (STOCK_GLOBAL_SUPPLY - stock.availableShares) / 20000;

			newPrice = Math.floor(stock.price * (randomFactor + scarcityBias));

			// Ensure price doesn't drop below 1
			newPrice = Math.max(1, newPrice);

			stock.previousPrice = oldPrice;
			stock.price = newPrice;
			await stock.save();
		}
		Log.Info("Stock market refreshed.");
	}

	async GetPortfolio() {
		const stocks = await UserStocks.findAll({
			where: { userId: this.User.Id, quantity: { [Op.gt]: 0 } }
		});

		const portfolio = [];
		for (const s of stocks) {
			const marketData = await StockMarket.findByPk(s.ticker);
			portfolio.push({
				ticker: s.ticker,
				quantity: s.quantity,
				averagePrice: s.averagePrice,
				currentPrice: marketData?.price || 0,
				totalValue: (marketData?.price || 0) * s.quantity
			});
		}
		return portfolio;
	}

	async Buy(ticker: string, quantity: number) {
		const s = Strings[this.User.Language];

		if (quantity <= 0) return { success: false, message: s.invalidQuantity };

		// Check global user limit
		const userStocks = await UserStocks.findAll({ where: { userId: this.User.Id } });
		const totalShares = userStocks.reduce((sum, stock) => sum + stock.quantity, 0);

		if (totalShares + quantity > STOCK_MAX_SHARES) {
			return { success: false, message: s.limitReached(STOCK_MAX_SHARES, totalShares) };
		}

		// Get stock data
		const stock = await StockMarket.findByPk(ticker);
		if (!stock) return { success: false, message: s.stockNotFound };

		if (stock.availableShares < quantity) {
			return { success: false, message: s.notEnoughShares(stock.availableShares) };
		}

		const cost = stock.price * quantity;
		if (this.User.Money < cost) {
			return { success: false, message: s.notEnoughMoney(formatMoney(cost, this.User.Language)) };
		}

		// Execute Trade
		this.User.Money -= cost;
		await this.User.Update();

		stock.availableShares -= quantity;
		await stock.save();

		// Update User Portfolio
		const userStock = await UserStocks.findOne({
			where: { userId: this.User.Id, ticker: ticker }
		});

		if (userStock) {
			// Calculate new average price
			const totalValue = (userStock.quantity * userStock.averagePrice) + cost;
			const newQuantity = userStock.quantity + quantity;
			userStock.averagePrice = Math.floor(totalValue / newQuantity);
			userStock.quantity = newQuantity;
			await userStock.save();
		}
		else {
			await UserStocks.create({
				userId: this.User.Id,
				ticker: ticker,
				quantity: quantity,
				averagePrice: stock.price
			});
		}

		return {
			success: true,
			message: s.buySuccess(quantity, ticker, formatMoney(cost, this.User.Language))
		};
	}

	async Sell(ticker: string, quantity: number) {
		const s = Strings[this.User.Language];

		if (quantity <= 0) return { success: false, message: s.invalidQuantity };

		const userStock = await UserStocks.findOne({
			where: { userId: this.User.Id, ticker: ticker }
		});

		if (!userStock || userStock.quantity < quantity) {
			return { success: false, message: s.notEnoughOwned };
		}

		const stock = await StockMarket.findByPk(ticker);
		if (!stock) return { success: false, message: s.stockNotFound };

		const revenue = stock.price * quantity;
		const profit = revenue - (userStock.averagePrice * quantity);

		// Execute Trade
		this.User.Money += revenue;
		await this.User.Update();

		stock.availableShares += quantity;
		await stock.save();

		userStock.quantity -= quantity;
		if (userStock.quantity === 0) {
			await userStock.destroy();
		}
		else {
			await userStock.save();
		}

		return {
			success: true,
			message: s.sellSuccess(quantity, ticker, formatMoney(revenue, this.User.Language), formatMoney(profit, this.User.Language))
		};
	}
}

const Strings = {
	[Language.English]: {
		invalidQuantity: "Invalid quantity.",
		stockNotFound: "Stock not found.",
		limitReached: (max: number, current: number) => `You can only hold ${max} shares in total. You currently have ${current}.`,
		notEnoughShares: (available: number) => `Not enough shares available. Only ${available} left.`,
		notEnoughMoney: (cost: string) => `You don't have enough money. You need ${cost}.`,
		notEnoughOwned: "You don't own enough shares of this stock.",
		buySuccess: (qty: number, ticker: string, cost: string) => `Successfully bought ${qty} shares of ${ticker} for ${cost}.`,
		sellSuccess: (qty: number, ticker: string, revenue: string, profit: string) => `Successfully sold ${qty} shares of ${ticker} for ${revenue}. Profit/Loss: ${profit}.`,
	},
	[Language.Portuguese]: {
		invalidQuantity: "Quantidade inválida.",
		stockNotFound: "Ação não encontrada.",
		limitReached: (max: number, current: number) => `Você só pode ter ${max} ações no total. Você tem atualmente ${current}.`,
		notEnoughShares: (available: number) => `Ações insuficientes disponíveis. Restam apenas ${available}.`,
		notEnoughMoney: (cost: string) => `Você não tem dinheiro suficiente. Você precisa de ${cost}.`,
		notEnoughOwned: "Você não possui ações suficientes desta empresa.",
		buySuccess: (qty: number, ticker: string, cost: string) => `Comprou com sucesso ${qty} ações de ${ticker} por ${cost}.`,
		sellSuccess: (qty: number, ticker: string, revenue: string, profit: string) => `Vendeu com sucesso ${qty} ações de ${ticker} por ${revenue}. Lucro/Prejuízo: ${profit}.`,
	},
	[Language.Spanish]: {
		invalidQuantity: "Cantidad inválida.",
		stockNotFound: "Acción no encontrada.",
		limitReached: (max: number, current: number) => `Solo puedes tener ${max} acciones en total. Actualmente tienes ${current}.`,
		notEnoughShares: (available: number) => `No hay suficientes acciones disponibles. Solo quedan ${available}.`,
		notEnoughMoney: (cost: string) => `No tienes suficiente dinero. Necesitas ${cost}.`,
		notEnoughOwned: "No posees suficientes acciones de esta empresa.",
		buySuccess: (qty: number, ticker: string, cost: string) => `Compraste con éxito ${qty} acciones de ${ticker} por ${cost}.`,
		sellSuccess: (qty: number, ticker: string, revenue: string, profit: string) => `Vendiste con éxito ${qty} acciones de ${ticker} por ${revenue}. Ganancia/Pérdida: ${profit}.`,
	},
};
