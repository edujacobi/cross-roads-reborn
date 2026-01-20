export interface StockDefinition {
	ticker: string;
	name: string;
	initialPrice: number;
}

export const STOCK_MAX_SHARES = 25;
export const STOCK_GLOBAL_SUPPLY = 1000;

export const StockList: StockDefinition[] = [
	{
		ticker: "PEAR",
		name: "Pear",
		initialPrice: 150,
	},
	{
		ticker: "MCRH",
		name: "Microhard",
		initialPrice: 280,
	},
	{
		ticker: "GGLE",
		name: "Goggle",
		initialPrice: 200,
	},
	{
		ticker: "AMZN",
		name: "Amazoff",
		initialPrice: 180,
	},
	{
		ticker: "TSLA",
		name: "Tuskla",
		initialPrice: 220,
	},
	{
		ticker: "META",
		name: "Fetal",
		initialPrice: 170,
	},
	{
		ticker: "NFLX",
		name: "Netfleas",
		initialPrice: 130,
	},
	{
		ticker: "NVDA",
		name: "Invidia",
		initialPrice: 250,
	},
];
