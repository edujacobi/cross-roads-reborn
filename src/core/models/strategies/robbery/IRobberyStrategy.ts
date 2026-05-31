import { type User } from "#core/models/User";
import { type LocationId } from "#core/types/Locations";
import { type ClashType, type RobberyInitData, type RobberyLocationOutcomeData, type RobberyOutcomeData } from "#core/types/Robbery";

export interface IRobberyStrategy {
	readonly Attacker: User;
	readonly Defender?: User;
	readonly LocationId?: LocationId;
	readonly Date: Date;
	readonly Type: ClashType;
	readonly Success: boolean;
	readonly MoneyRobbed: number;
	readonly Chance: number;

	CanRob(): Promise<{ canRob: boolean; message: string }>;
	LockStates(useGrenade?: boolean): Promise<RobberyInitData>;
	Resolve(defenderReaction?: "react" | "police" | "nothing"): Promise<RobberyLocationOutcomeData | RobberyOutcomeData>;
	ReleaseLocks(): Promise<void>;
}
