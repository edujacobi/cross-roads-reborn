import { UserRepository } from "#core/repositories/UserRepository";
import { globalStrings, type Language } from "#core/models/Language";
import type { AvailabilityResult } from "#core/models/User";
import { ClassList } from "#core/types/Classes";
import { type LocationId, LocationList } from "#core/types/Locations";

type AvailabilityConflict = Extract<AvailabilityResult, { available: false }>;

type UserConflictReason = "beating" | "beingBeatUp" | "robbing" | "beingRobbed";

type ConflictActor =
	| { type: "attacker" }
	| { type: "defender"; name: string };

export async function getAvailabilityConflictMessage(
	availability: AvailabilityConflict,
	language: Language,
	actor: ConflictActor,
): Promise<string | undefined> {
	const strings = globalStrings[language];
	const isAttacker = actor.type === "attacker";

	switch (availability.reason) {
	case "defendingInvestment":
		return isAttacker
			? strings.attackerIsDefendingInvestment
			: strings.defenderIsDefendingInvestment(actor.name);
	case "gangAction":
		return isAttacker
			? strings.attackerIsParticipatingInGangAction
			: strings.defenderIsParticipatingInGangAction(actor.name);
	case "robbingLocation": {
		const location = LocationList[availability.referenceId as LocationId];
		const message = isAttacker
			? strings.attackerIsRobbingId(location.Name[language])
			: strings.defenderIsRobbingId(location.Name[language]);
		return isAttacker ? message : `**${actor.name}** ${message}`;
	}
	case "beating":
	case "beingBeatUp":
	case "robbing":
	case "beingRobbed": {
		const user = await UserRepository.FindById(availability.targetId!, ["class", "nickname"]);
		const name = `${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`;
		const messageByReason: Record<UserConflictReason, (name: string) => string> = {
			beating: name => isAttacker ? strings.attackerIsBeatingId(name) : strings.defenderIsBeatingId(name),
			beingBeatUp: name => isAttacker ? strings.attackerIsBeingBeatedById(name) : strings.defenderIsBeingBeatedById(name),
			robbing: name => isAttacker ? strings.attackerIsRobbingId(name) : strings.defenderIsRobbingId(name),
			beingRobbed: name => isAttacker ? strings.attackerIsBeingRobbedById(name) : strings.defenderIsBeingRobbedById(name),
		};
		const message = messageByReason[availability.reason](name);
		return isAttacker ? message : `**${actor.name}** ${message}`;
	}
	default:
		return undefined;
	}
}
