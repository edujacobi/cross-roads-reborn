export const STOCK_MAX_SHARES = 100;
export const STOCK_GLOBAL_SUPPLY = 5000;

export enum StockId {
	Pear = 1,
	Macrohard,
	Goggle,
	Amazoff,
	TestaMotors,
	CrossEnterprises,
	Netfleas,
	Discord,
}

export interface StockDefinition {
	readonly Id: StockId;
	readonly CompanyName: string;
	readonly InitialPrice: number;
}

interface StockListType {
	[key: number]: StockDefinition,
}

export const StockList: StockListType = {
	[StockId.Pear]: {
		Id: StockId.Pear,
		CompanyName: "Pear",
		InitialPrice: 800,
	},
	[StockId.Macrohard]: {
		Id: StockId.Macrohard,
		CompanyName: "Macrohard",
		InitialPrice: 700,
	},
	[StockId.Goggle]: {
		Id: StockId.Goggle,
		CompanyName: "Goggle",
		InitialPrice: 600,
	},
	[StockId.Amazoff]: {
		Id: StockId.Amazoff,
		CompanyName: "Amazoff",
		InitialPrice: 500,
	},
	[StockId.TestaMotors]: {
		Id: StockId.TestaMotors,
		CompanyName: "Testa Motors",
		InitialPrice: 400,
	},
	[StockId.CrossEnterprises]: {
		Id: StockId.CrossEnterprises,
		CompanyName: "Cross Enterprises",
		InitialPrice: 300,
	},
	[StockId.Netfleas]: {
		Id: StockId.Netfleas,
		CompanyName: "Netfleas",
		InitialPrice: 200,
	},
	[StockId.Discord]: {
		Id: StockId.Discord,
		CompanyName: "Discord",
		InitialPrice: 100,
	},
} as const;

export function getStockList(): StockDefinition[] {
	return Object.values(StockList);
}
