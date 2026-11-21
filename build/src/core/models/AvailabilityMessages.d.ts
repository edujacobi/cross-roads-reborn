import { type Language } from "#core/models/Language";
import type { AvailabilityResult } from "#core/models/User";
type AvailabilityConflict = Extract<AvailabilityResult, {
    available: false;
}>;
type ConflictActor = {
    type: "attacker";
} | {
    type: "defender";
    name: string;
};
export declare function getAvailabilityConflictMessage(availability: AvailabilityConflict, language: Language, actor: ConflictActor): Promise<string | undefined>;
export {};
