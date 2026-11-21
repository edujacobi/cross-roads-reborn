"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAME_TIME_ZONE = exports.GAME_TIME_OFFSET = void 0;
exports.getGameTime = getGameTime;
exports.isGameNight = isGameNight;
const gameTimeZone_1 = require("./gameTimeZone");
var gameTimeZone_2 = require("./gameTimeZone");
Object.defineProperty(exports, "GAME_TIME_OFFSET", { enumerable: true, get: function () { return gameTimeZone_2.GAME_TIME_OFFSET; } });
Object.defineProperty(exports, "GAME_TIME_ZONE", { enumerable: true, get: function () { return gameTimeZone_2.GAME_TIME_ZONE; } });
function getGameTime(date = new Date()) {
    return Temporal.Instant.fromEpochMilliseconds(date.getTime()).toZonedDateTimeISO(gameTimeZone_1.GAME_TIME_ZONE);
}
function isGameNight(date = new Date()) {
    const hour = getGameTime(date).hour;
    return hour < 6 || hour >= 18;
}
//# sourceMappingURL=gameTime.js.map