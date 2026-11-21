"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeistTargets = exports.HeistMissionId = void 0;
exports.getWeeklyTarget = getWeeklyTarget;
exports.isMainHeistDay = isMainHeistDay;
const emotes_1 = require("#bot/utils/emotes");
const Language_1 = require("#core/models/Language");
const gameTime_1 = require("../../shared/gameTime");
var HeistMissionId;
(function (HeistMissionId) {
    HeistMissionId[HeistMissionId["Blueprint"] = 1] = "Blueprint";
    HeistMissionId[HeistMissionId["GetawayCars"] = 2] = "GetawayCars";
    HeistMissionId[HeistMissionId["HackCameras"] = 3] = "HackCameras";
    HeistMissionId[HeistMissionId["MainHeist"] = 4] = "MainHeist";
})(HeistMissionId || (exports.HeistMissionId = HeistMissionId = {}));
exports.HeistTargets = [
    {
        Id: "bank",
        Name: {
            [Language_1.Language.English]: "Central Bank",
            [Language_1.Language.Portuguese]: "Banco Central",
            [Language_1.Language.Spanish]: "Banco Central",
        },
        Description: {
            [Language_1.Language.English]: "The city's main financial repository, containing huge reserves of paper currency.",
            [Language_1.Language.Portuguese]: "O principal repositório financeiro da cidade, contendo grandes reservas de papel-moeda.",
            [Language_1.Language.Spanish]: "El principal repositorio financiero de la ciudad, con enormes reservas de papel moneda.",
        },
        VaultType: "bank",
        BaseChanceDivisor: 50,
        Thumbnail: "https://media.discordapp.net/attachments/1233604589064818808/1540819271054270504/CentralBank.png",
        Emote: {
            Id: emotes_1.EmoteId.CentralBank,
            String: emotes_1.EmoteString.CentralBank,
        }
    },
    {
        Id: "casino",
        Name: {
            [Language_1.Language.English]: "Casino Vault",
            [Language_1.Language.Portuguese]: "Cofre do Cassino",
            [Language_1.Language.Spanish]: "Caja Fuerte del Casino",
        },
        Description: {
            [Language_1.Language.English]: "A secure vault filled with chips, gold bullion, and loose high-roller cash.",
            [Language_1.Language.Portuguese]: "Um cofre seguro cheio de fichas, barras de ouro e dinheiro de grandes apostadores.",
            [Language_1.Language.Spanish]: "Una bóveda de seguridad llena de fichas, lingotes de oro y dinero de grandes apostadores.",
        },
        VaultType: "casino",
        BaseChanceDivisor: 48,
        Thumbnail: "https://media.discordapp.net/attachments/1233604589064818808/1547950330820432033/CasinoVault.png",
        Emote: {
            Id: emotes_1.EmoteId.CasinoVault,
            String: emotes_1.EmoteString.CasinoVault,
        }
    },
];
function getGameWeek(date) {
    const gameDate = (0, gameTime_1.getGameTime)(date).toPlainDate();
    const firstDayOfYear = Temporal.PlainDate.from({ year: gameDate.year, month: 1, day: 1 });
    const firstWeekStart = firstDayOfYear.subtract({ days: firstDayOfYear.dayOfWeek % 7 });
    const nextYearFirstDay = Temporal.PlainDate.from({ year: gameDate.year + 1, month: 1, day: 1 });
    const nextYearFirstWeekStart = nextYearFirstDay.subtract({ days: nextYearFirstDay.dayOfWeek % 7 });
    const currentWeekStart = gameDate.subtract({ days: gameDate.dayOfWeek % 7 });
    if (Temporal.PlainDate.compare(currentWeekStart, nextYearFirstWeekStart) >= 0)
        return 1;
    return Math.floor(firstWeekStart.until(currentWeekStart, { largestUnit: "day" }).days / 7) + 1;
}
/**
 * Gets the current weekly heist target deterministically.
 */
function getWeeklyTarget(date = new Date()) {
    const currentWeek = getGameWeek(date);
    const index = currentWeek % exports.HeistTargets.length;
    return exports.HeistTargets[index];
}
function isMainHeistDay(date = new Date()) {
    const day = (0, gameTime_1.getGameTime)(date).dayOfWeek;
    return day === 1 || day === 3 || day === 5;
}
//# sourceMappingURL=Heist.js.map