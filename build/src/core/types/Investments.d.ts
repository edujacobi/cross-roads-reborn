import { InvestmentId } from "./Ids";
import type { IDescription, IEmote } from "./Interfaces";
export { InvestmentId } from "./Ids";
export interface Investment {
    readonly Id: InvestmentId;
    readonly Name: IDescription;
    readonly Description: IDescription;
    readonly Emote: IEmote;
    readonly ImageUrl: string;
    readonly Price: number;
    readonly HourlyYield: number;
    readonly BaseDefense: number;
    readonly PrisonSeverity: number;
    readonly HenchmanFee: number;
}
export declare const InvestmentList: Record<number, Investment>;
export declare function getInvestmentList(): Investment[];
export type InvestmentActionReason = "insufficient_funds" | "already_has_investment" | "no_investment" | "already_has_henchman" | "unknown";
export interface InvestmentActionResult {
    success: boolean;
    reason?: InvestmentActionReason;
}
