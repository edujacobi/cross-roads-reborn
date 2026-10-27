import type { User } from "./User";
import { EmoteString } from "#bot/utils/emotes";
import { formatMoney } from "#bot/utils/ui";
import { JobList } from "#core/types/Jobs";
import { globalStrings, Language, type Localization } from "./Language";
import { type ScavengeId, ScavengeList } from "#core/types/Scavenge";
import { UserRepository } from "#core/repositories/UserRepository";
import { ClassList } from "#core/types/Classes";
import { LocationList } from "#core/types/Locations";
import { Log } from "#shared/log";
import { time, TimestampStyles } from "discord.js";
import { Vault } from "./Vault";

export class Casino {
	static async CanUserPlayGame(user: User, amount: number, language = user.Language) {
		const s = Strings[language];
		let canPlay = true;
		let message = "";

		if (user.Money < amount) {
			message = `${s.noMoney} ${EmoteString.Casino}`;
			canPlay = false;
		}

		if (user.IsScavenging()) {
			message = s.scavenging(user.Scavenge.IsScavengingId!);
			canPlay = false;
		}

		if (user.IsWorking()) {
			message = s.working(JobList[user.Job.Id!].Description[language], user.Job.EndsIn);
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
			const _user = await UserRepository.FindById(user.BeatUp.IsBeatingId, ["class", "nickname"]);
			message = globalStrings[language].attackerIsBeatingId(`${ClassList[_user!.class].Image.Emote.String} ${_user!.nickname!}`);
			canPlay = false;
		}

		if (user.BeatUp.IsBeingBeatUpById) {
			const _user = await UserRepository.FindById(user.BeatUp.IsBeingBeatUpById, ["class", "nickname"]);
			message = globalStrings[language].attackerIsBeingBeatedById(`${ClassList[_user!.class!].Image.Emote.String} ${_user!.nickname!}`);
			canPlay = false;
		}

		if (user.Robbery.IsRobbingId) {
			const _user = await UserRepository.FindById(user.Robbery.IsRobbingId, ["class", "nickname"]);
			message = globalStrings[language].attackerIsRobbingId(`${ClassList[_user!.class].Image.Emote.String} ${_user!.nickname!}`);
			canPlay = false;
		}

		if (user.Robbery.IsBeingRobbedById) {
			const _user = await UserRepository.FindById(user.Robbery.IsBeingRobbedById, ["class", "nickname"]);
			message = globalStrings[language].attackerIsBeingRobbedById(`${ClassList[_user!.class!].Image.Emote.String} ${_user!.nickname!}`);
			canPlay = false;
		}

		if (user.Robbery.IsRobbingLocationId !== null) {
			const location = LocationList[user.Robbery.IsRobbingLocationId];
			message = globalStrings[language].attackerIsRobbingId(location.Name[language]);
			canPlay = false;
		}

		if (user.IsDefendingInvestment()) {
			message = globalStrings[language].attackerIsDefendingInvestment;
			canPlay = false;
		}

		if (user.IsParticipatingInGangAction()) {
			message = globalStrings[language].attackerIsParticipatingInGangAction;
			canPlay = false;
		}

		return { canPlay, message };
	}

	static async StartUserGame(user: User): Promise<boolean> {
		const started = await UserRepository.TryStartCasinoGame(user.Id);
		if (!started) {
			return false;
		}

		user.Casino.IsInGame = true;
		Log.Info(`User ${user.Nickname} (Id: ${user.Id}) is now in a Casino Game.`);
		return true;
	}

	static async FinishUserGameWithWin(user: User, prize: number, betAmount?: number) {
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
		Log.Success(`User ${user.Nickname} (Id: ${user.Id}) won ${formatMoney(prize, Language.English)} in a Casino Game.`);

		if (betAmount && betAmount > 0) {
			const tax = Math.floor(betAmount * 0.10);
			if (tax > 0) {
				await Vault.AddCasinoFunds(tax);
			}
		}
	}

	static async FinishUserGameWithLoss(user: User, amount: number) {
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
		Log.Success(`User ${user.Nickname} (Id: ${user.Id}) lost ${formatMoney(amount, Language.English)} in a Casino Game.`);

		const tax = Math.floor(amount * 0.10);
		if (tax > 0) {
			await Vault.AddCasinoFunds(tax);
		}
	}

	static async FinishUserGameWithLossNoSubtraction(user: User, amount: number) {
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
		Log.Success(`User ${user.Nickname} (Id: ${user.Id}) lost ${formatMoney(amount, Language.English)} in a Casino Game.`);

		const tax = Math.floor(amount * 0.10);
		if (tax > 0) {
			await Vault.AddCasinoFunds(tax);
		}
	}
}

const Strings = {
	[Language.English]: {
		noMoney: "You don't have enough money to bet",
		scavenging: (placeId: ScavengeId) => `You can't bet while scavenging ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.English]}** ${EmoteString.Scavenge}`,
		working: (job: string, date: Date) => `You are working as **${job}** and can't play on casino ${EmoteString.Jobs}\n-# Will end ${time(date, TimestampStyles.RelativeTime)}`,
		prison: (date: Date) => `You can't bet while in prison ${EmoteString.Prison}\n-# Will be free ${time(date, TimestampStyles.RelativeTime)}`,
		hospital: (date: Date) => `You can't bet while in hospital ${EmoteString.Hospital}\n-# Will be healed ${time(date, TimestampStyles.RelativeTime)}!`,
		casino: `You are playing another game in the casino! ${EmoteString.Casino}`,
	},
	[Language.Portuguese]: {
		noMoney: "Você não possui dinheiro suficiente para apostar",
		scavenging: (placeId: ScavengeId) => `Você não pode apostar enquanto está vasculhando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Portuguese]}** ${EmoteString.Scavenge}`,
		working: (job: string, date: Date) => `Você está trabalhando como **${job}** e não pode apostar no cassino ${EmoteString.Jobs}\n-# Terminará ${time(date, TimestampStyles.RelativeTime)}`,
		prison: (date: Date) => `Você não pode apostar enquanto está preso ${EmoteString.Prison}\n-# Será solto ${time(date, TimestampStyles.RelativeTime)}`,
		hospital: (date: Date) => `Você não pode apostar enquanto está hospitalizado ${EmoteString.Hospital}\n-# Será atendido ${time(date, TimestampStyles.RelativeTime)}`,
		casino: `Você está jogando em outro jogo no cassino! ${EmoteString.Casino}`,
	},
	[Language.Spanish]: {
		noMoney: "No tienes suficiente dinero para apostar",
		scavenging: (placeId: ScavengeId) => `No puedes apostar mientras estás buscando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}** ${EmoteString.Scavenge}`,
		working: (job: string, date: Date) => `Estás trabajando como **${job}** y no puedes hacer jugar en casino ${EmoteString.Jobs}\n-# Terminará ${time(date, TimestampStyles.RelativeTime)}`,
		prison: (date: Date) => `No puedes apostar mientras estás en prisión ${EmoteString.Prison}\n-# Será liberado ${time(date, TimestampStyles.RelativeTime)}`,
		hospital: (date: Date) => `No puedes apostar mientras estás en el hospital ${EmoteString.Hospital}\n-# Será atendido ${time(date, TimestampStyles.RelativeTime)}`,
		casino: `Estás jugando en otro juego en el casino! ${EmoteString.Casino}`,
	},
} as const satisfies Localization;
