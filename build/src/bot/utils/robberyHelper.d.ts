import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import type { RobberyInitData, RobberyOutcomeData } from "#core/types/Robbery";
import type { User } from "#core/models/User";
import { type ChatInputCommandInteraction } from "discord.js";
type RobberyDefenderPromptData = Pick<RobberyInitData, "attackerAditionalTimeCallPolice" | "defenderTimeInHospital" | "usedGunSkin" | "usedGunName" | "usedGrenade"> & {
    allowedResponses: string[];
};
export declare function buildRobberyDefenderPrompt(attacker: User, defender: User, data: RobberyDefenderPromptData): CustomContainerBuilder;
export declare function buildRobberyDefenderResponse(defender: User, response: string): CustomContainerBuilder;
export declare function buildRobberyDefenderResult(attacker: User, defender: User, outcome: RobberyOutcomeData): CustomContainerBuilder;
export declare function runUserRobbery(interaction: ChatInputCommandInteraction, attacker: User, defender: User): Promise<void>;
export {};
