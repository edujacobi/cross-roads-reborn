"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalStrings = exports.Language = void 0;
exports.getLanguageText = getLanguageText;
exports.getLanguageFromLocale = getLanguageFromLocale;
exports.getLocaleFromLanguage = getLocaleFromLanguage;
const discord_js_1 = require("discord.js");
const locale_1 = require("date-fns/locale");
const emotes_1 = require("#bot/utils/emotes");
const Ids_1 = require("#core/types/Ids");
var Ids_2 = require("#core/types/Ids");
Object.defineProperty(exports, "Language", { enumerable: true, get: function () { return Ids_2.Language; } });
function getLanguageText(language) {
    switch (language) {
        case Ids_1.Language.English:
            return "English";
        case Ids_1.Language.Portuguese:
            return "Portuguese";
        case Ids_1.Language.Spanish:
            return "Spanish";
    }
}
function getLanguageFromLocale(locale) {
    switch (locale) {
        case discord_js_1.Locale.PortugueseBR:
            return Ids_1.Language.Portuguese;
        case discord_js_1.Locale.SpanishES:
        case discord_js_1.Locale.SpanishLATAM:
            return Ids_1.Language.Spanish;
        default:
            return Ids_1.Language.English;
    }
}
function getLocaleFromLanguage(language) {
    switch (language) {
        case Ids_1.Language.Portuguese:
            return locale_1.ptBR;
        case Ids_1.Language.Spanish:
            return locale_1.es;
        default:
            return locale_1.enUS;
    }
}
exports.globalStrings = {
    [Ids_1.Language.English]: {
        attackerIsRobbingId: (nick) => `You're already robbing **${nick}**! ${emotes_1.EmoteString.Robbery}\n-# Wait a few more seconds and try again!`,
        attackerIsBeingRobbedById: (nick) => `You're being robbed by **${nick}**! ${emotes_1.EmoteString.Robbery}\n-# Wait a few more seconds and try again!`,
        defenderIsRobbingId: (nick) => `is robbing **${nick}**! ${emotes_1.EmoteString.Robbery}\n-# Wait a few more seconds to start your action!`,
        defenderIsBeingRobbedById: (nick) => `is being robbed by **${nick}**! ${emotes_1.EmoteString.Robbery}\n-# Wait a few more seconds to start your action!`,
        attackerIsBeatingId: (nick) => `You're beating **${nick}**! ${emotes_1.EmoteString.Beat}\n-# Wait a few more seconds and try again!`,
        attackerIsBeingBeatedById: (nick) => `You're being beated by **${nick}**! ${emotes_1.EmoteString.Beat}\n-# Wait a few more seconds and try again!`,
        defenderIsBeatingId: (nick) => `is beating **${nick}**! ${emotes_1.EmoteString.Beat}\n-# Wait a few more seconds to start your action!`,
        defenderIsBeingBeatedById: (nick) => `is being beated by **${nick}**! ${emotes_1.EmoteString.Beat}\n-# Wait a few more seconds to start your action!`,
        attackerIsDefendingInvestment: `You're defending your investment! ${emotes_1.EmoteString.InvestmentActive}\n-# Wait a few more seconds and try again!`,
        attackerIsParticipatingInGangAction: `You're participating in a gang action! ${emotes_1.EmoteString.Gang}\n-# Wait a few more seconds and try again!`,
        defenderIsDefendingInvestment: (nick) => `**${nick}** is defending their investment! ${emotes_1.EmoteString.InvestmentActive}\n-# Wait a few more seconds to start your action!`,
        defenderIsParticipatingInGangAction: (nick) => `**${nick}** is participating in a gang action! ${emotes_1.EmoteString.Gang}\n-# Wait a few more seconds to start your action!`,
    },
    [Ids_1.Language.Portuguese]: {
        attackerIsRobbingId: (nick) => `Você está roubando **${nick}**! ${emotes_1.EmoteString.Robbery}\n-# Espere mais alguns segundos e tente novamente!`,
        attackerIsBeingRobbedById: (nick) => `Você está sendo roubado por **${nick}**! ${emotes_1.EmoteString.Robbery}\n-# Espere mais alguns segundos e tente novamente!`,
        defenderIsRobbingId: (nick) => `está roubando **${nick}**! ${emotes_1.EmoteString.Robbery}\n-# Espere mais alguns segundos para iniciar sua ação!`,
        defenderIsBeingRobbedById: (nick) => `está sendo roubado por **${nick}**! ${emotes_1.EmoteString.Robbery}\n-# Espere mais alguns segundos para iniciar sua ação!`,
        attackerIsBeatingId: (nick) => `Você está espancando **${nick}**! ${emotes_1.EmoteString.Beat}\n-# Espere mais alguns segundos e tente novamente!`,
        attackerIsBeingBeatedById: (nick) => `Você está sendo espancado por **${nick}**! ${emotes_1.EmoteString.Beat}\n-# Espere mais alguns segundos e tente novamente!`,
        defenderIsBeatingId: (nick) => `está espancando **${nick}**! ${emotes_1.EmoteString.Beat}\n-# Espere mais alguns segundos para iniciar sua ação!`,
        defenderIsBeingBeatedById: (nick) => `está sendo espancado por **${nick}**! ${emotes_1.EmoteString.Beat}\n-# Espere mais alguns segundos para iniciar sua ação!`,
        attackerIsDefendingInvestment: `Você está defendendo seu investimento! ${emotes_1.EmoteString.InvestmentActive}\n-# Espere mais alguns segundos e tente novamente!`,
        attackerIsParticipatingInGangAction: `Você está participando de uma ação de gangue! ${emotes_1.EmoteString.Gang}\n-# Espere mais alguns segundos e tente novamente!`,
        defenderIsDefendingInvestment: (nick) => `**${nick}** está defendendo o investimento dele! ${emotes_1.EmoteString.InvestmentActive}\n-# Espere mais alguns segundos para iniciar sua ação!`,
        defenderIsParticipatingInGangAction: (nick) => `**${nick}** está participando de uma ação de gangue! ${emotes_1.EmoteString.Gang}\n-# Espere mais alguns segundos para iniciar sua ação!`,
    },
    [Ids_1.Language.Spanish]: {
        attackerIsRobbingId: (nick) => `¡Estás robando a **${nick}**! ${emotes_1.EmoteString.Robbery}\n-# ¡Espera unos segundos más y vuelve a intentarlo!`,
        attackerIsBeingRobbedById: (nick) => `¡Estás siendo robado por **${nick}**! ${emotes_1.EmoteString.Robbery}\n-# ¡Espera unos segundos más y vuelve a intentarlo!`,
        defenderIsRobbingId: (nick) => `está robando a **${nick}**! ${emotes_1.EmoteString.Robbery}\n-# ¡Espera unos segundos más para iniciar tu acción!`,
        defenderIsBeingRobbedById: (nick) => `está siendo robado por **${nick}**! ${emotes_1.EmoteString.Robbery}\n-# ¡Espera unos segundos más para iniciar tu acción!`,
        attackerIsBeatingId: (nick) => `¡Estás golpeando a **${nick}**! ${emotes_1.EmoteString.Beat}\n-# ¡Espera unos segundos más y vuelve a intentarlo!`,
        attackerIsBeingBeatedById: (nick) => `¡Estás siendo golpeado por **${nick}**! ${emotes_1.EmoteString.Beat}\n-# ¡Espera unos segundos más y vuelve a intentarlo!`,
        defenderIsBeatingId: (nick) => `está golpeando a **${nick}**! ${emotes_1.EmoteString.Beat}\n-# ¡Espera unos segundos más para iniciar tu acción!`,
        defenderIsBeingBeatedById: (nick) => `está siendo golpeado por **${nick}**! ${emotes_1.EmoteString.Beat}\n-# ¡Espera unos segundos más para iniciar tu acción!`,
        attackerIsDefendingInvestment: `¡Estás defendiendo tu inversión! ${emotes_1.EmoteString.InvestmentActive}\n-# ¡Espera unos segundos más y vuelve a intentarlo!`,
        attackerIsParticipatingInGangAction: `¡Estás participando en una acción de cuadrilla! ${emotes_1.EmoteString.Gang}\n-# ¡Espera unos segundos más y vuelve a intentarlo!`,
        defenderIsDefendingInvestment: (nick) => `**${nick}** está defendiendo su inversión! ${emotes_1.EmoteString.InvestmentActive}\n-# ¡Espera unos segundos más para iniciar tu acción!`,
        defenderIsParticipatingInGangAction: (nick) => `**${nick}** está participando en una acción de cuadrilla! ${emotes_1.EmoteString.Gang}\n-# ¡Espera unos segundos más para iniciar tu acción!`,
    },
};
//# sourceMappingURL=Language.js.map