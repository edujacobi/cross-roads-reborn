import { User } from "./User";
import { EmoteString } from "../utils/emotes";
import { showTime } from "../utils/ui";
import { JobList } from "../interfaces/Jobs";
import { Language } from "./Language";
import { ChatInputCommandInteraction } from "discord.js";
import { CustomEmbedBuilder } from "./CustomEmbedBuilder";
import { CrColors } from "../utils/colors";
import { replyInteraction } from "../utils/logic";
import { ScavengeId, ScavengeList } from "../interfaces/Scavenge";

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

	static CanUserPlayBet(user: User, amount: number) {
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

		if (user.Robbery.IsRobbingId || user.Robbery.IsRobbingLocationId) {
			message = `${s.robbing} ${EmoteString.Robbery}`;
			canPlay = false;
		}

		if (user.Robbery.IsBeingRobbedById) {
			message = `${s.beingRobbed} ${EmoteString.Robbery}`;
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

-# More games coming soon`,
		noMoney: "You don't have enough money to bet",
		scavenging: (placeId: ScavengeId) => `You can't bet while scavenging ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.English]}** ${EmoteString.Scavenge}`,
		working: (job: string, time: Date) => `You are working as **${job}** and can't play on casino ${EmoteString.Jobs}\n-# Will end ${showTime(time.getTime(), true)}`,
		prison: (time: Date) => `You can't bet while in prison ${EmoteString.Prison}\n-# Will be free ${showTime(time.getTime(), true)}`,
		hospital: (time: Date) => `You can't bet while in hospital ${EmoteString.Hospital}\n-# Will be healed ${showTime(time.getTime(), true)}!`,
		robbing: "You are robbing and can't play on casino now!",
		beingRobbed: "You are being robbed and can't play on casino now!",
	},
	[Language.Portuguese]: {
		description: `# Cassino
Antro da perdição! Aposte, ganhe, perca, quebre a banca!
-# Aqui você pode apostar e perder todo seu dinheiro!
### ${EmoteString.Heads} Cara ou Coroa
Aposte um valor em uma moeda que deve cair no mesmo lado que você escolheu. Você tem 50% de chance de vencer. Se vencer, ganha 1.5x o valor apostado!

-# Mais jogos em breve`,
		noMoney: "Você não possui dinheiro suficiente para apostar",
		scavenging: (placeId: ScavengeId) => `Você não pode apostar enquanto está vasculhando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Portuguese]}** ${EmoteString.Scavenge}`,
		working: (job: string, time: Date) => `Você está trabalhando como **${job}** e não pode apostar no cassino ${EmoteString.Jobs}\n-# Terminará ${showTime(time.getTime(), true)}`,
		prison: (time: Date) => `Você não pode apostar enquanto está preso ${EmoteString.Prison}\n-# Será solto ${showTime(time.getTime(), true)}`,
		hospital: (time: Date) => `Você não pode apostar enquanto está hospitalizado ${EmoteString.Hospital}\n-# Será atendido ${showTime(time.getTime(), true)}`,
		robbing: "Você está roubando e não pode jogar no cassino agora!",
		beingRobbed: "Você está sendo roubado e não pode jogar no cassino agora!",
	},
	[Language.Spanish]: {
		description: `# Casino
Den de iniquidad! Apuesta, gana, pierde, rompe el banco!
-# ¡Aquí puedes apostar y perder todo tu dinero!
### ${EmoteString.Heads} Cara o Cruz
Apostar una cantidad en una moneda que debe caer del mismo lado que elijas. Tienes un 50% de posibilidades de ganar. ¡Si ganas, obtienes 1.5 veces la cantidad apostada!

-# ¡Más juegos próximamente!`,
		noMoney: "No tienes suficiente dinero para apostar",
		scavenging: (placeId: ScavengeId) => `No puedes apostar mientras estás buscando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}** ${EmoteString.Scavenge}`,
		working: (job: string, time: Date) => `Estás trabajando como **${job}** y no puedes hacer jugar en casino ${EmoteString.Jobs}\n-# Terminará ${showTime(time.getTime(), true)}`,
		prison: (time: Date) => `No puedes apostar mientras estás en prisión ${EmoteString.Prison}\n-# Será liberado ${showTime(time.getTime(), true)}`,
		hospital: (time: Date) => `No puedes apostar mientras estás en el hospital ${EmoteString.Hospital}\n-# Será atendido ${showTime(time.getTime(), true)}`,
		robbing: "Estás robando y no puedes jugar en el casino ahora!",
		beingRobbed: "Estás siendo robado y no puedes jugar en el casino ahora!",
	},
} as const;
