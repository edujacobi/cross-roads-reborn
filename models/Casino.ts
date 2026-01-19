import { User } from "./User";
import { EmoteString } from "../utils/emotes";
import { showTime } from "../utils/ui";
import { JobList } from "../interfaces/Jobs";
import { globalStrings, Language } from "./Language";
import { ScavengeId, ScavengeList } from "../interfaces/Scavenge";
import { Users } from "../database/Users";
import { ClassList } from "../interfaces/Classes";
import { LocationList } from "../interfaces/Locations";

export class Casino {
	static async CanUserPlayBet(user: User, amount: number) {
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
}

const Strings = {
	[Language.English]: {
		noMoney: "You don't have enough money to bet",
		scavenging: (placeId: ScavengeId) => `You can't bet while scavenging ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.English]}** ${EmoteString.Scavenge}`,
		working: (job: string, time: Date) => `You are working as **${job}** and can't play on casino ${EmoteString.Jobs}\n-# Will end ${showTime(time.getTime(), true)}`,
		prison: (time: Date) => `You can't bet while in prison ${EmoteString.Prison}\n-# Will be free ${showTime(time.getTime(), true)}`,
		hospital: (time: Date) => `You can't bet while in hospital ${EmoteString.Hospital}\n-# Will be healed ${showTime(time.getTime(), true)}!`,
	},
	[Language.Portuguese]: {
		noMoney: "Você não possui dinheiro suficiente para apostar",
		scavenging: (placeId: ScavengeId) => `Você não pode apostar enquanto está vasculhando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Portuguese]}** ${EmoteString.Scavenge}`,
		working: (job: string, time: Date) => `Você está trabalhando como **${job}** e não pode apostar no cassino ${EmoteString.Jobs}\n-# Terminará ${showTime(time.getTime(), true)}`,
		prison: (time: Date) => `Você não pode apostar enquanto está preso ${EmoteString.Prison}\n-# Será solto ${showTime(time.getTime(), true)}`,
		hospital: (time: Date) => `Você não pode apostar enquanto está hospitalizado ${EmoteString.Hospital}\n-# Será atendido ${showTime(time.getTime(), true)}`,
	},
	[Language.Spanish]: {
		noMoney: "No tienes suficiente dinero para apostar",
		scavenging: (placeId: ScavengeId) => `No puedes apostar mientras estás buscando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}** ${EmoteString.Scavenge}`,
		working: (job: string, time: Date) => `Estás trabajando como **${job}** y no puedes hacer jugar en casino ${EmoteString.Jobs}\n-# Terminará ${showTime(time.getTime(), true)}`,
		prison: (time: Date) => `No puedes apostar mientras estás en prisión ${EmoteString.Prison}\n-# Será liberado ${showTime(time.getTime(), true)}`,
		hospital: (time: Date) => `No puedes apostar mientras estás en el hospital ${EmoteString.Hospital}\n-# Será atendido ${showTime(time.getTime(), true)}`,
	},
} as const;
