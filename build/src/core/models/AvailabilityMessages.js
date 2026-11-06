"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailabilityConflictMessage = getAvailabilityConflictMessage;
const UserRepository_1 = require("#core/repositories/UserRepository");
const Language_1 = require("#core/models/Language");
const Classes_1 = require("#core/types/Classes");
const Locations_1 = require("#core/types/Locations");
async function getAvailabilityConflictMessage(availability, language, actor) {
    const strings = Language_1.globalStrings[language];
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
            const location = Locations_1.LocationList[availability.referenceId];
            const message = isAttacker
                ? strings.attackerIsRobbingId(location.Name[language])
                : strings.defenderIsRobbingId(location.Name[language]);
            return isAttacker ? message : `**${actor.name}** ${message}`;
        }
        case "beating":
        case "beingBeatUp":
        case "robbing":
        case "beingRobbed": {
            const user = await UserRepository_1.UserRepository.FindById(availability.targetId, ["class", "nickname"]);
            const name = `${Classes_1.ClassList[user.class].Image.Emote.String} ${user.nickname}`;
            const messageByReason = {
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
//# sourceMappingURL=AvailabilityMessages.js.map