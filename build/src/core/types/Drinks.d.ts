export declare const BarBeverages: string[];
export declare const DrinkSensations: string[];
export declare function isHappyHour(date?: Date): boolean;
export type DrinkCountMessageLanguage = "English" | "Portuguese" | "Spanish";
export declare function getDrinkCountMessages(count: number, adjective: string, language: DrinkCountMessageLanguage): string[];
