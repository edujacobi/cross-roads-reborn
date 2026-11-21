import { Locale } from "discord.js";
import type { CreationOptional } from "sequelize";
import { Language } from "#core/types/Ids";
export { Language } from "#core/types/Ids";
type LocalizationReturn = string | string[] | ((...param: never) => string) | ((...param: never) => string)[] | Record<string, string | ((...param: never) => string)>;
export type Localization = Record<Language, Record<string, LocalizationReturn>>;
export declare function getLanguageText(language: Language): "English" | "Portuguese" | "Spanish";
export declare function getLanguageFromLocale(locale: Locale): Language;
export declare function getLocaleFromLanguage(language: Language): import("date-fns/locale").Locale;
export declare const globalStrings: {
    readonly 0: {
        readonly attackerIsRobbingId: (nick: CreationOptional<string> | undefined) => string;
        readonly attackerIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => string;
        readonly defenderIsRobbingId: (nick: CreationOptional<string> | undefined) => string;
        readonly defenderIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => string;
        readonly attackerIsBeatingId: (nick: CreationOptional<string> | undefined) => string;
        readonly attackerIsBeingBeatedById: (nick: CreationOptional<string> | undefined) => string;
        readonly defenderIsBeatingId: (nick: CreationOptional<string> | undefined) => string;
        readonly defenderIsBeingBeatedById: (nick: CreationOptional<string> | undefined) => string;
        readonly attackerIsDefendingInvestment: `You're defending your investment! ${string}
-# Wait a few more seconds and try again!`;
        readonly attackerIsParticipatingInGangAction: `You're participating in a gang action! ${string}
-# Wait a few more seconds and try again!`;
        readonly defenderIsDefendingInvestment: (nick: string) => string;
        readonly defenderIsParticipatingInGangAction: (nick: string) => string;
    };
    readonly 1: {
        readonly attackerIsRobbingId: (nick: CreationOptional<string> | undefined) => string;
        readonly attackerIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => string;
        readonly defenderIsRobbingId: (nick: CreationOptional<string> | undefined) => string;
        readonly defenderIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => string;
        readonly attackerIsBeatingId: (nick: CreationOptional<string> | undefined) => string;
        readonly attackerIsBeingBeatedById: (nick: CreationOptional<string> | undefined) => string;
        readonly defenderIsBeatingId: (nick: CreationOptional<string> | undefined) => string;
        readonly defenderIsBeingBeatedById: (nick: CreationOptional<string> | undefined) => string;
        readonly attackerIsDefendingInvestment: `Você está defendendo seu investimento! ${string}
-# Espere mais alguns segundos e tente novamente!`;
        readonly attackerIsParticipatingInGangAction: `Você está participando de uma ação de gangue! ${string}
-# Espere mais alguns segundos e tente novamente!`;
        readonly defenderIsDefendingInvestment: (nick: string) => string;
        readonly defenderIsParticipatingInGangAction: (nick: string) => string;
    };
    readonly 2: {
        readonly attackerIsRobbingId: (nick: CreationOptional<string> | undefined) => string;
        readonly attackerIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => string;
        readonly defenderIsRobbingId: (nick: CreationOptional<string> | undefined) => string;
        readonly defenderIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => string;
        readonly attackerIsBeatingId: (nick: CreationOptional<string> | undefined) => string;
        readonly attackerIsBeingBeatedById: (nick: CreationOptional<string> | undefined) => string;
        readonly defenderIsBeatingId: (nick: CreationOptional<string> | undefined) => string;
        readonly defenderIsBeingBeatedById: (nick: CreationOptional<string> | undefined) => string;
        readonly attackerIsDefendingInvestment: `¡Estás defendiendo tu inversión! ${string}
-# ¡Espera unos segundos más y vuelve a intentarlo!`;
        readonly attackerIsParticipatingInGangAction: `¡Estás participando en una acción de cuadrilla! ${string}
-# ¡Espera unos segundos más y vuelve a intentarlo!`;
        readonly defenderIsDefendingInvestment: (nick: string) => string;
        readonly defenderIsParticipatingInGangAction: (nick: string) => string;
    };
};
