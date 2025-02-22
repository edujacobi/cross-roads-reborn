import { User } from "./User";
import { EmoteString } from "../utils/emotes";
import { showTime } from "../utils/ui";
import { JobList } from "./Job";
import { Language } from "./Language";
import { ChatInputCommandInteraction } from "discord.js";
import { CustomEmbedBuilder } from "./CustomEmbedBuilder";
import { CrColors } from "../utils/colors";
import { replyInteraction } from "../utils/logic";

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
			.setDefaultFooter(this.User.Nickname, interaction.user.avatarURL());

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

		if (user.IsWorking()) {
			message = `${s.working(JobList[user.Job.Id!].Description[user.Language], user.Job.EndsIn)} ${EmoteString.Jobs}`;
			canPlay = false;
		}

		if (user.IsInPrison()) {
			message = s.prison(user.Prison.Time);
			canPlay = false;
		}

		if (user.Robbery.IsRobbingId) {
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

### ${EmoteString.Heads} Heads or tails
Bet an amount on two coins that must fall on the same side. You have a 25% chance of winning. If you win, you get 3x the amount bet!
-# More games coming soon`,
		noMoney: "You don't have enough money to bet",
		working: (job: string, time: Date) => `You are working as ${job} and can't play on casino. Will end ${showTime(time.getTime(), true)}`,
		prison: (time: Date) => `You can't bet while in prison! ${EmoteString.Prison}\n-# Will be free ${showTime(time.getTime(), true)}!`,
		robbing: "You are robbing and can't play on casino now!",
		beingRobbed: "You are being robbed and can't play on casino now!",
	},
	[Language.Portuguese]: {
		description: `# Cassino
Antro da perdição! Aposte, ganhe, perca, quebre a banca!
-# Aqui você pode apostar e perder todo seu dinheiro!

### ${EmoteString.Heads} Cara ou coroa
Aposte um valor em duas moedas que devem cair no mesmo lado. Você tem 25% de chance de vencer. Se vencer, ganha 3x o valor apostado!
-# Mais jogos em breve`,
		noMoney: "Você não possui dinheiro suficiente para apostar",
		working: (job: string, time: Date) => `Você está trabalhando como ${job} e não pode apostar no cassino. Terminará ${showTime(time.getTime(), true)}`,
		prison: (time: Date) => `Você não pode apostar enquanto está preso! ${EmoteString.Prison}\n-# Será solto ${showTime(time.getTime(), true)}!`,
		robbing: "Você está roubando e não pode jogar no cassino agora!",
		beingRobbed: "Você está sendo roubado e não pode jogar no cassino agora!",
	},
	[Language.Spanish]: {
		description: `# Casino
Den de iniquidad! Apuesta, gana, pierde, rompe el banco!
-# ¡Aquí puedes apostar y perder todo tu dinero!

### ${EmoteString.Heads} Cara o cruz
Apostar una cantidad en dos monedas que deben caer del mismo lado. Tienes un 25% de posibilidades de ganar. ¡Si ganas, obtienes 3 veces la cantidad apostada!
-# ¡Más juegos próximamente!`,
		noMoney: "No tienes suficiente dinero para apostar",
		working: (job: string, time: Date) => `Estás trabajando como ${job} y no puedes hacer jugar en casino. Terminará ${showTime(time.getTime(), true)}`,
		prison: (time: Date) => `No puedes apostar mientras estás en prisión! ${EmoteString.Prison}\n-# Será liberado ${showTime(time.getTime(), true)}!`,
		robbing: "Estás robando y no puedes jugar en el casino ahora!",
		beingRobbed: "Estás siendo robado y no puedes jugar en el casino ahora!",
	},
} as const;
