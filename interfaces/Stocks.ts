export interface StockDefinition {
	ticker: string;
	name: string;
	initialPrice: number;
}

export const STOCK_MAX_SHARES = 100;
export const STOCK_GLOBAL_SUPPLY = 5000;

export const StockList: StockDefinition[] = [
	{
		ticker: "PEAR",
		name: "Pear",
		initialPrice: 800,
	},
	{
		ticker: "MCRH",
		name: "Macrohard",
		initialPrice: 700,
	},
	{
		ticker: "GGLE",
		name: "Goggle",
		initialPrice: 600,
	},
	{
		ticker: "AMZF",
		name: "Amazoff",
		initialPrice: 500,
	},
	{
		ticker: "TSTA",
		name: "Testa Motors",
		initialPrice: 400,
	},
	{
		ticker: "CRSS",
		name: "Cross Enterprises",
		initialPrice: 300,
	},
	{
		ticker: "NFLX",
		name: "Netfleas",
		initialPrice: 200,
	},
	{
		ticker: "DCRD",
		name: "Discord",
		initialPrice: 100,
	},
];
