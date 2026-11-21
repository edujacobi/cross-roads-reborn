"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Casino = void 0;
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const Jobs_1 = require("#core/types/Jobs");
const Language_1 = require("./Language");
const Scavenge_1 = require("#core/types/Scavenge");
const UserRepository_1 = require("#core/repositories/UserRepository");
const Classes_1 = require("#core/types/Classes");
const Locations_1 = require("#core/types/Locations");
const log_1 = require("#shared/log");
const discord_js_1 = require("discord.js");
const Vault_1 = require("./Vault");
class Casino {
    static async CanUserPlayGame(user, amount, language = user.Language) {
        const s = Strings[language];
        let canPlay = true;
        let message = "";
        if (user.Money < amount) {
            message = `${s.noMoney} ${emotes_1.EmoteString.Casino}`;
            canPlay = false;
        }
        if (user.IsScavenging()) {
            message = s.scavenging(user.Scavenge.IsScavengingId);
            canPlay = false;
        }
        if (user.IsWorking()) {
            message = s.working(Jobs_1.JobList[user.Job.Id].Description[language], user.Job.EndsIn);
            canPlay = false;
        }
        if (user.IsInPrison()) {
            message = s.prison(user.Prison.Time);
            canPlay = false;
        }
        if (user.IsInHospital()) {
            message = s.hospital(user.Hospital.Time);
            canPlay = false;
        }
        if (user.IsInCasinoGame()) {
            message = s.casino;
            canPlay = false;
        }
        if (user.BeatUp.IsBeatingId) {
            const _user = await UserRepository_1.UserRepository.FindById(user.BeatUp.IsBeatingId, ["class", "nickname"]);
            message = Language_1.globalStrings[language].attackerIsBeatingId(`${Classes_1.ClassList[_user.class].Image.Emote.String} ${_user.nickname}`);
            canPlay = false;
        }
        if (user.BeatUp.IsBeingBeatUpById) {
            const _user = await UserRepository_1.UserRepository.FindById(user.BeatUp.IsBeingBeatUpById, ["class", "nickname"]);
            message = Language_1.globalStrings[language].attackerIsBeingBeatedById(`${Classes_1.ClassList[_user.class].Image.Emote.String} ${_user.nickname}`);
            canPlay = false;
        }
        if (user.Robbery.IsRobbingId) {
            const _user = await UserRepository_1.UserRepository.FindById(user.Robbery.IsRobbingId, ["class", "nickname"]);
            message = Language_1.globalStrings[language].attackerIsRobbingId(`${Classes_1.ClassList[_user.class].Image.Emote.String} ${_user.nickname}`);
            canPlay = false;
        }
        if (user.Robbery.IsBeingRobbedById) {
            const _user = await UserRepository_1.UserRepository.FindById(user.Robbery.IsBeingRobbedById, ["class", "nickname"]);
            message = Language_1.globalStrings[language].attackerIsBeingRobbedById(`${Classes_1.ClassList[_user.class].Image.Emote.String} ${_user.nickname}`);
            canPlay = false;
        }
        if (user.Robbery.IsRobbingLocationId !== null) {
            const location = Locations_1.LocationList[user.Robbery.IsRobbingLocationId];
            message = Language_1.globalStrings[language].attackerIsRobbingId(location.Name[language]);
            canPlay = false;
        }
        if (user.IsDefendingInvestment()) {
            message = Language_1.globalStrings[language].attackerIsDefendingInvestment;
            canPlay = false;
        }
        if (user.IsParticipatingInGangAction()) {
            message = Language_1.globalStrings[language].attackerIsParticipatingInGangAction;
            canPlay = false;
        }
        return { canPlay, message };
    }
    static async StartUserGame(user) {
        const started = await UserRepository_1.UserRepository.TryStartCasinoGame(user.Id);
        if (!started) {
            return false;
        }
        user.Casino.IsInGame = true;
        log_1.Log.Info(`User ${user.Nickname} (Id: ${user.Id}) is now in a Casino Game.`);
        return true;
    }
    static async FinishUserGameWithWin(user, prize, betAmount) {
        user.Casino.IsInGame = false;
        user.Money += prize;
        user.Casino.WinCount += 1;
        user.Casino.WinSum += prize;
        await user.Update({
            money: user.Money,
            casinoIsInGame: user.Casino.IsInGame,
            casinoWinCount: user.Casino.WinCount,
            casinoWinSum: user.Casino.WinSum,
        });
        log_1.Log.Success(`User ${user.Nickname} (Id: ${user.Id}) won ${(0, ui_1.formatMoney)(prize, Language_1.Language.English)} in a Casino Game.`);
        if (betAmount && betAmount > 0) {
            const tax = Math.floor(betAmount * 0.10);
            if (tax > 0) {
                await Vault_1.Vault.AddCasinoFunds(tax);
            }
        }
    }
    static async FinishUserGameWithLoss(user, amount) {
        user.Casino.IsInGame = false;
        user.Money -= amount;
        user.Casino.LoseSum += amount;
        user.Casino.LoseCount += 1;
        await user.Update({
            money: user.Money,
            casinoIsInGame: user.Casino.IsInGame,
            casinoLoseCount: user.Casino.LoseCount,
            casinoLoseSum: user.Casino.LoseSum,
            // Russian Roulette
            hospitalTime: user.Hospital.Time,
            hospitalCount: user.Hospital.Count,
        });
        log_1.Log.Success(`User ${user.Nickname} (Id: ${user.Id}) lost ${(0, ui_1.formatMoney)(amount, Language_1.Language.English)} in a Casino Game.`);
        const tax = Math.floor(amount * 0.10);
        if (tax > 0) {
            await Vault_1.Vault.AddCasinoFunds(tax);
        }
    }
    static async FinishUserGameWithLossNoSubtraction(user, amount) {
        user.Casino.IsInGame = false;
        user.Casino.LoseSum += amount;
        user.Casino.LoseCount += 1;
        await user.Update({
            casinoIsInGame: user.Casino.IsInGame,
            casinoLoseCount: user.Casino.LoseCount,
            casinoLoseSum: user.Casino.LoseSum,
            // Russian Roulette
            hospitalTime: user.Hospital.Time,
            hospitalCount: user.Hospital.Count,
        });
        log_1.Log.Success(`User ${user.Nickname} (Id: ${user.Id}) lost ${(0, ui_1.formatMoney)(amount, Language_1.Language.English)} in a Casino Game.`);
        const tax = Math.floor(amount * 0.10);
        if (tax > 0) {
            await Vault_1.Vault.AddCasinoFunds(tax);
        }
    }
}
exports.Casino = Casino;
const Strings = {
    [Language_1.Language.English]: {
        noMoney: "You don't have enough money to bet",
        scavenging: (placeId) => `You can't bet while scavenging ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.English]}** ${emotes_1.EmoteString.Scavenge}`,
        working: (job, date) => `You are working as **${job}** and can't play on casino ${emotes_1.EmoteString.Jobs}\n-# Will end ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        prison: (date) => `You can't bet while in prison ${emotes_1.EmoteString.Prison}\n-# Will be free ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        hospital: (date) => `You can't bet while in hospital ${emotes_1.EmoteString.Hospital}\n-# Will be healed ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}!`,
        casino: `You are playing another game in the casino! ${emotes_1.EmoteString.Casino}`,
    },
    [Language_1.Language.Portuguese]: {
        noMoney: "Você não possui dinheiro suficiente para apostar",
        scavenging: (placeId) => `Você não pode apostar enquanto está vasculhando ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.Portuguese]}** ${emotes_1.EmoteString.Scavenge}`,
        working: (job, date) => `Você está trabalhando como **${job}** e não pode apostar no cassino ${emotes_1.EmoteString.Jobs}\n-# Terminará ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        prison: (date) => `Você não pode apostar enquanto está preso ${emotes_1.EmoteString.Prison}\n-# Será solto ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        hospital: (date) => `Você não pode apostar enquanto está hospitalizado ${emotes_1.EmoteString.Hospital}\n-# Será atendido ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        casino: `Você está jogando em outro jogo no cassino! ${emotes_1.EmoteString.Casino}`,
    },
    [Language_1.Language.Spanish]: {
        noMoney: "No tienes suficiente dinero para apostar",
        scavenging: (placeId) => `No puedes apostar mientras estás buscando ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.Spanish]}** ${emotes_1.EmoteString.Scavenge}`,
        working: (job, date) => `Estás trabajando como **${job}** y no puedes hacer jugar en casino ${emotes_1.EmoteString.Jobs}\n-# Terminará ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        prison: (date) => `No puedes apostar mientras estás en prisión ${emotes_1.EmoteString.Prison}\n-# Será liberado ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        hospital: (date) => `No puedes apostar mientras estás en el hospital ${emotes_1.EmoteString.Hospital}\n-# Será atendido ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        casino: `Estás jugando en otro juego en el casino! ${emotes_1.EmoteString.Casino}`,
    },
};
//# sourceMappingURL=Casino.js.map