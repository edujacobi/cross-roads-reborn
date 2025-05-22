import { User } from "./User";
import { EmoteString } from "../utils/emotes";
import { showTime } from "../utils/ui";
import { JobList } from "../interfaces/Jobs";
import { globalStrings, Language } from "./Language";
import { ChatInputCommandInteraction } from "discord.js";
import { CustomEmbedBuilder } from "./CustomEmbedBuilder";
import { CrColors } from "../utils/colors";
import { replyInteraction } from "../utils/logic";
import { ScavengeId, ScavengeList } from "../interfaces/Scavenge";
import { Users } from "../database/Users";
import { ClassList } from "../interfaces/Classes";
import { LocationList } from "../interfaces/Locations";

export class Casino {
	User: User;

	constructor(user: User) {
		this.User = user;
	}

	async Start(interaction: ChatInputCommandInteraction) {
		const s = Strings[this.User.Language];

		const embed = new CustomEmbedBuilder()
			.setThumbnail("https://media.discordapp.net/attachments/1233604589064818808/1337969966821146695/radar_mafiaCasino.png")
			.setDescription(s.description)
			.setColor(CrColors.Casino)
			.setUserFooter({
				nickname: this.User.Nickname,
				image: interaction.user.avatarURL(),
			});

		await replyInteraction(interaction, { embeds: [embed] });
	}

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
			message = globalStrings[user.Language].attackerIsRobbingId(location.Description[user.Language]);
			canPlay = false;
		}

		return { canPlay, message };
	}
}

const Strings = {
	[Language.English]: {
		description: `# Casino
Den of iniquity! Bet, win, lose, break the bank!
-# Here you can bet and lose all your money!
### ${EmoteString.Heads} Heads or Tails
Bet an amount on a coin that must fall on the same side that you choose. You have a 50% chance of winning. If you win, you get 1.5x the amount bet!

### ${EmoteString.Casino} Horse Racing
Bet on one of the horses in a race. Races are held every 4 hours. If your horse wins, you share the prize pool with other winners. Maximum bet is based on your ATK.
Use \`/horserace\` to see the next race and to place your bet.`,
		noMoney: "You don't have enough money to bet",
		scavenging: (placeId: ScavengeId) => `You can't bet while scavenging ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.English]}** ${EmoteString.Scavenge}`,
		working: (job: string, time: Date) => `You are working as **${job}** and can't play on casino ${EmoteString.Jobs}\n-# Will end ${showTime(time.getTime(), true)}`,
		prison: (time: Date) => `You can't bet while in prison ${EmoteString.Prison}\n-# Will be free ${showTime(time.getTime(), true)}`,
		hospital: (time: Date) => `You can't bet while in hospital ${EmoteString.Hospital}\n-# Will be healed ${showTime(time.getTime(), true)}!`,
	},
	[Language.Portuguese]: {
		description: `# Cassino
Antro da perdição! Aposte, ganhe, perca, quebre a banca!
-# Aqui você pode apostar e perder todo seu dinheiro!
### ${EmoteString.Heads} Cara ou Coroa
Aposte um valor em uma moeda que deve cair no mesmo lado que você escolheu. Você tem 50% de chance de vencer. Se vencer, ganha 1.5x o valor apostado!

### ${EmoteString.Casino} Corrida de Cavalos
Aposte em um dos cavalos em uma corrida. As corridas acontecem a cada 4 horas. Se seu cavalo vencer, você divide o prêmio com outros vencedores. A aposta máxima é baseada no seu ATK.
Use \`/horserace\` para ver a próxima corrida e para fazer sua aposta.`,
		noMoney: "Você não possui dinheiro suficiente para apostar",
		scavenging: (placeId: ScavengeId) => `Você não pode apostar enquanto está vasculhando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Portuguese]}** ${EmoteString.Scavenge}`,
		working: (job: string, time: Date) => `Você está trabalhando como **${job}** e não pode apostar no cassino ${EmoteString.Jobs}\n-# Terminará ${showTime(time.getTime(), true)}`,
		prison: (time: Date) => `Você não pode apostar enquanto está preso ${EmoteString.Prison}\n-# Será solto ${showTime(time.getTime(), true)}`,
		hospital: (time: Date) => `Você não pode apostar enquanto está hospitalizado ${EmoteString.Hospital}\n-# Será atendido ${showTime(time.getTime(), true)}`,
	},
	[Language.Spanish]: {
		description: `# Casino
Den de iniquidad! Apuesta, gana, pierde, rompe el banco!
-# ¡Aquí puedes apostar y perder todo tu dinero!
### ${EmoteString.Heads} Cara o Cruz
Apostar una cantidad en una moneda que debe caer del mismo lado que elijas. Tienes un 50% de posibilidades de ganar. ¡Si ganas, obtienes 1.5 veces la cantidad apostada!

### ${EmoteString.Casino} Carrera de Caballos
Apuesta a uno de los caballos en una carrera. Las carreras se celebran cada 4 horas. Si tu caballo gana, compartes el premio con otros ganadores. La apuesta máxima se basa en tu ATK.
Usa \`/horserace\` para ver la próxima carrera y para hacer tu apuesta.`,
		noMoney: "No tienes suficiente dinero para apostar",
		scavenging: (placeId: ScavengeId) => `No puedes apostar mientras estás buscando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}** ${EmoteString.Scavenge}`,
		working: (job: string, time: Date) => `Estás trabajando como **${job}** y no puedes hacer jugar en casino ${EmoteString.Jobs}\n-# Terminará ${showTime(time.getTime(), true)}`,
		prison: (time: Date) => `No puedes apostar mientras estás en prisión ${EmoteString.Prison}\n-# Será liberado ${showTime(time.getTime(), true)}`,
		hospital: (time: Date) => `No puedes apostar mientras estás en el hospital ${EmoteString.Hospital}\n-# Será atendido ${showTime(time.getTime(), true)}`,
	},
} as const;
