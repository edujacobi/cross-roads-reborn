import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import type { BeatUpInitData, BeatUpOutcomeData } from "#core/models/BeatUp";
import type { User } from "#core/models/User";
import { type ChatInputCommandInteraction } from "discord.js";
type BeatUpDefenderPromptData = Pick<BeatUpInitData, "timeInHospitalAditional" | "usedGunSkin" | "usedGunName" | "usedGrenade"> & {
    allowedResponses: string[];
};
export declare function buildBeatUpDefenderPrompt(attacker: User, defender: User, data: BeatUpDefenderPromptData): CustomContainerBuilder;
export declare function buildBeatUpDefenderResponse(defender: User, response: string): CustomContainerBuilder;
export declare function buildBeatUpDefenderResult(attacker: User, defender: User, outcome: BeatUpOutcomeData): CustomContainerBuilder;
export declare function runUserBeatUp(interaction: ChatInputCommandInteraction, attacker: User, defender: User): Promise<void>;
export {};
