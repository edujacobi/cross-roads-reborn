import { User } from "./User";
import { EmoteString } from "@bot/utils/emotes";
import { showTime } from "@bot/utils/ui";
import { JobList } from "@core/types/Jobs";
import { globalStrings, Language, Localization } from "./Language";
import { ScavengeId, ScavengeList } from "@core/types/Scavenge";
import { Users } from "@core/database/Users";
import { ClassList } from "@core/types/Classes";
import { LocationList } from "@core/types/Locations";
import { Log } from "@shared/log";

export class Casino {
	static async CanUserPlayGame(user: User, amount: number) {
		const s = Strings[user.Language];
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
			message = s.working(JobList[user.Job.Id!].Description[user.Language], user.Job.EndsIn);
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
			const _user = await Users.findByPk(user.BeatUp.IsBeatingId, { attributes: ["class", "nickname"] });
			message = globalStrings[user.Language].attackerIsBeatingId(`${ClassList[_user!.class].Image.Emote.String} ${_user!.nickname!}`);
			canPlay = false;
		}

		if (user.BeatUp.IsBeingBeatUpById) {
			const _user = await Users.findByPk(user.BeatUp.IsBeingBeatUpById, { attributes: ["class", "nickname"] });
			message = globalStrings[user.Language].attackerIsBeingBeatedById(`${ClassList[_user!.class!].Image.Emote.String} ${_user!.nickname!}`);
			canPlay = false;
		}

		if (user.Robbery.IsRobbingId) {
			const _user = await Users.findByPk(user.Robbery.IsRobbingId, { attributes: ["class", "nickname"] });
			message = globalStrings[user.Language].attackerIsRobbingId(`${ClassList[_user!.class].Image.Emote.String} ${_user!.nickname!}`);
			canPlay = false;
		}

		if (user.Robbery.IsBeingRobbedById) {
			const _user = await Users.findByPk(user.Robbery.IsBeingRobbedById, { attributes: ["class", "nickname"] });
			message = globalStrings[user.Language].attackerIsBeingRobbedById(`${ClassList[_user!.class!].Image.Emote.String} ${_user!.nickname!}`);
			canPlay = false;
		}

		if (user.Robbery.IsRobbingLocationId !== null) {
			const location = LocationList[user.Robbery.IsRobbingLocationId];
			message = globalStrings[user.Language].attackerIsRobbingId(location.Name[user.Language]);
			canPlay = false;
		}

		return { canPlay, message };
	}

	static async StartUserGame(user: User) {
		user.Casino.IsInGame = true;
		await user.Update();
		Log.Info(`User ${user.Nickname} (ID: ${user.Id}) is now in a Casino Game.`);
	}

	static async FinishUserGameWithWin(user: User, prize: number) {
		user.Casino.IsInGame = false;
		user.Money += prize;
		user.Casino.WinCount += 1;
		user.Casino.WinSum += prize;
		await user.Update();
		Log.Success(`User ${user.Nickname} (ID: ${user.Id}) won ${prize} in a Casino Game.`);
	}

	static async FinishUserGameWithLoss(user: User, amount: number) {
		user.Casino.IsInGame = false;
		user.Money -= amount;
		user.Casino.LoseSum += amount;
		user.Casino.LoseCount += 1;
		await user.Update();
		Log.Success(`User ${user.Nickname} (ID: ${user.Id}) lost ${amount} in a Casino Game.`);
	}
}

const Strings = {
	[Language.English]: {
		noMoney: "You don't have enough money to bet",
		scavenging: (placeId: ScavengeId) => `You can't bet while scavenging ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.English]}** ${EmoteString.Scavenge}`,
		working: (job: string, time: Date) => `You are working as **${job}** and can't play on casino ${EmoteString.Jobs}\n-# Will end ${showTime(time.getTime(), true)}`,
		prison: (time: Date) => `You can't bet while in prison ${EmoteString.Prison}\n-# Will be free ${showTime(time.getTime(), true)}`,
		hospital: (time: Date) => `You can't bet while in hospital ${EmoteString.Hospital}\n-# Will be healed ${showTime(time.getTime(), true)}!`,
		casino: `You are playing another game in the casino! ${EmoteString.Casino}`,
	},
	[Language.Portuguese]: {
		noMoney: "Você não possui dinheiro suficiente para apostar",
		scavenging: (placeId: ScavengeId) => `Você não pode apostar enquanto está vasculhando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Portuguese]}** ${EmoteString.Scavenge}`,
		working: (job: string, time: Date) => `Você está trabalhando como **${job}** e não pode apostar no cassino ${EmoteString.Jobs}\n-# Terminará ${showTime(time.getTime(), true)}`,
		prison: (time: Date) => `Você não pode apostar enquanto está preso ${EmoteString.Prison}\n-# Será solto ${showTime(time.getTime(), true)}`,
		hospital: (time: Date) => `Você não pode apostar enquanto está hospitalizado ${EmoteString.Hospital}\n-# Será atendido ${showTime(time.getTime(), true)}`,
		casino: `Você está jogando em outro jogo no cassino! ${EmoteString.Casino}`,
	},
	[Language.Spanish]: {
		noMoney: "No tienes suficiente dinero para apostar",
		scavenging: (placeId: ScavengeId) => `No puedes apostar mientras estás buscando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}** ${EmoteString.Scavenge}`,
		working: (job: string, time: Date) => `Estás trabajando como **${job}** y no puedes hacer jugar en casino ${EmoteString.Jobs}\n-# Terminará ${showTime(time.getTime(), true)}`,
		prison: (time: Date) => `No puedes apostar mientras estás en prisión ${EmoteString.Prison}\n-# Será liberado ${showTime(time.getTime(), true)}`,
		hospital: (time: Date) => `No puedes apostar mientras estás en el hospital ${EmoteString.Hospital}\n-# Será atendido ${showTime(time.getTime(), true)}`,
		casino: `Estás jugando en otro juego en el casino! ${EmoteString.Casino}`,
	},
} as const satisfies Localization;
