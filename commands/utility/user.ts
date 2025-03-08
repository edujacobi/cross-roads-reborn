import { ChatInputCommandInteraction, Colors, Locale, SlashCommandBuilder, SlashCommandUserOption } from "discord.js";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { checkUser, replyInteraction, replyUserDontExist } from "../../utils/logic";
import { Language } from "../../models/Language";
import { User } from "../../models/User";
import { ClassList } from "../../models/Class";
import { Badge } from "../../models/Badge";
import { formatMoney, showTime } from "../../utils/ui";
import { EmoteString } from "../../utils/emotes";
import { addDays } from "date-fns";

module.exports = {
	vip: true,
	data: new SlashCommandBuilder()
		.setName("user")
		.setDescription("Relevant informations about the user!")
		.setNameLocalization(Locale.PortugueseBR, "usuario")
		.setDescriptionLocalization(Locale.PortugueseBR, "Informações relevantes sobre o jogador!")
		.addUserOption((option: SlashCommandUserOption) =>
			option
				.setName("target")
				.setDescription("The user")
				.setNameLocalization(Locale.PortugueseBR, "alvo")
				.setDescriptionLocalization(Locale.PortugueseBR, "O usuário"),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const _user = interaction.options.getUser("target") || interaction.user;
		const target = _user ? await checkUser(_user.id, interaction) : user;

		if (!target) {
			return await replyUserDontExist(interaction, language);
		}

		const s = Strings[language];

		let badges = await Badge.GetList(target.Id);

		if (target.IsVip()) {
			badges = Badge.AddVIPBadgeInList(badges, target);
		}

		let badgeText = "";

		badges.forEach(badge => badgeText += `${badge.Emoji} `);

		const now = new Date();

		const embed = new CustomEmbedBuilder()
			// .setThumbnail(_user.avatarURL())
			.setColor(Colors.DarkButNotBlack)
			.setAuthor({
				name: `${s.title} ${target.Nickname}`,
				iconURL: _user.avatarURL() ?? undefined,
			})
			.setDescription(`\n${badges.length > 0 ? `### ${badgeText}\n` : ""} ### ${formatMoney(target.Money, language)}`)
			.setFields([{
				name: s.situation,
				value: `-# ${target.Situation.Complex}`,
				inline: true,
			}, {
				name: s.className,
				value: `-# ${ClassList[target.Class].Image.Emote.String} ${ClassList[target.Class].Description[user.Language]}`,
				inline: true,
			}, {
				// {
				// 	name: `${EmoteString.InvestmentActive} Investimento`,
				// 	value: `-# Não implementado`,
				// 	inline: true,
				// },
				name: `${EmoteString.Heads} Daily`,
				value: `-# ${target.CanReceiveDaily() ? s.available : showTime(addDays(target.Daily.LastReceived!, 1).getTime(), true)}
-# \`${target.Daily.CurrentStreak}\` ${s.currentStreak}
-# \`${target.Daily.MaxStreak}\` ${s.maxStreak}`,
				inline: true,
			}, {
				name: `${EmoteString.Prison} ${s.prison}`,
				value: `-# \`${target.Robbery.FailureCount}\` ${s.timesInPrison}
-# \`${target.Escape.Count}\` ${s.escapes}
-# \`${formatMoney(target.Prison.BriberySum, user.Language)}\` (\`${target.Prison.BriberyCount}\`) ${s.inBribery}`,
				inline: true,
			}, {
				name: `${EmoteString.Robbery} ${s.robberies}`,
				value: `-# ${target.Wanted.Time > now ? showTime(target.Wanted.Time.getTime(), true) : s.canRob}
-# \`${formatMoney(target.Robbery.SuccessRobbedSum, user.Language)}\` (\`${target.Robbery.SuccessCount}\`) ${s.robbed}
-# \`${formatMoney(target.Robbery.BeingRobbedSum, user.Language)}\` (\`${target.Robbery.BeingRobbedCount}\`) ${s.robLost}`,
				inline: true,
			}, {
				name: `${EmoteString.Hospital} Hospital`,
				value: `-# \`${target.Hospital.Count}\` ${s.timesInHospital}
-# \`${formatMoney(target.Hospital.TreatmentSum, user.Language)}\` (\`${target.Hospital.TreatmentCount}\`) ${s.spentInTreatments}`,
				inline: true,
			}, {
				name: `${EmoteString.Beat} ${s.beatUps}`,
				value: `-# ${target.BeatUp.Time > now ? showTime(target.BeatUp.Time.getTime(), true) : s.canBeat }
-# \`${target.BeatUp.SuccessCount}\` ${s.beatSuccess}
-# \`${target.BeatUp.FailureCount}\` ${s.beatFailure}
-# \`${target.BeatUp.BeatedUpCount}\` ${s.beatedUp}`,
				inline: true,
			}, {
				name: `${EmoteString.Bank} ${s.money}`,
				value: `-# \`${formatMoney(target.Job.ReceivedSum, user.Language)}\` (\`${target.Job.ReceivedCount}\`) ${s.fromJobs}
-# \`${formatMoney(target.Shop.SpentSum, user.Language)}\` (\`${target.Shop.SpentCount}\`) ${s.spent}`,
				inline: true,
			}, {
				name: `${EmoteString.Casino} ${s.casino}`,
				value: `-# \`${target.Casino.WinCount + target.Casino.LoseCount}\` ${s.games}
-# \`${formatMoney(target.Casino.WinSum, user.Language)}\` (\`${target.Casino.WinCount}\`) ${s.won}
-# \`${formatMoney(target.Casino.LoseSum, user.Language)}\` (\`${target.Casino.LoseCount}\`) ${s.lost}
-# \`${(target.Casino.WinCount / (target.Casino.LoseCount) * 100).toFixed(2)}%\` win rate`,
				inline: true,
			},
				// {
				// 	name: `${EmoteString.Philantrope} Esmolas`,
				// 	value: `-# Não implementado`,
				// 	inline: true,
				// },
				// {
				// 	name: `${EmoteString.Scavenge} Vasculhar`,
				// 	value: `-# Não implementado`,
				// 	inline: true,
				// },
			])
			.setDefaultFooter(user.Nickname, interaction.user.avatarURL(), `ID: ${target.Id} • ${s.playingSince}: ${target.CreatedAt.toLocaleDateString(interaction.locale)}`);

		await replyInteraction(interaction, { embeds: [embed] });
	},
};

const Strings = {
	[Language.English]: {
		title: "Informations of",
		situation: "Situation",
		className: "Class",
		available: "Available",
		currentStreak: "current streak",
		maxStreak: "max streak",
		prison: "Prison",
		timesInPrison: "times inprisoned",
		escapes: "escapes",
		inBribery: "in bribery",
		robberies: "Robberies",
		canRob: "Can rob",
		robbed: "robbed",
		robLost: "lost",
		timesInHospital: "times hospitalized",
		spentInTreatments: "in treatments",
		beatUps: "Beat ups",
		canBeat: "Can beat",
		beatSuccess: "successes",
		beatFailure: "failures",
		beatedUp: "times beated up",
		money: "Money",
		fromJobs: "from jobs",
		spent: "spent in shops",
		casino: "Casino",
		games: "games",
		won: "won",
		lost: "lost",
		playingSince: "Playing since",
	},

	[Language.Portuguese]: {
		title: "Informações de",
		situation: "Situação",
		className: "Classe",
		available: "Disponível",
		currentStreak: "sequência atual",
		maxStreak: "sequência máxima",
		prison: "Prisão",
		timesInPrison: "vezes preso",
		escapes: "fugas",
		inBribery: "em suborno",
		robberies: "Roubos",
		canRob: "Pode roubar",
		robbed: "roubados",
		robLost: "perdidos",
		timesInHospital: "vezes hospitalizado",
		spentInTreatments: "em tratamentos",
		beatUps: "Espancamentos",
		canBeat: "Pode espancar",
		beatSuccess: "sucessos",
		beatFailure: "falhas",
		beatedUp: "vezes espancado",
		money: "Dinheiro",
		fromJobs: "de trabalhos",
		spent: "gastos em lojas",
		casino: "Cassino",
		games: "jogos",
		won: "ganhos",
		lost: "perdidos",
		playingSince: "Jogando desde",
	},

	[Language.Spanish]: {
		title: "Informaciones de",
		situation: "Situación",
		className: "Clase",
		available: "Disponible",
		currentStreak: "racha actual",
		maxStreak: "racha máxima",
		prison: "Prisión",
		timesInPrison: "veces en prisión",
		escapes: "fugas",
		inBribery: "en soborno",
		robberies: "Robos",
		canRob: "Puede robar",
		robbed: "robados",
		robLost: "perdidos",
		timesInHospital: "veces hospitalizado",
		spentInTreatments: "en tratamientos",
		beatUps: "Golpiza",
		canBeat: "Puede golpear",
		beatSuccess: "sucesos",
		beatFailure: "fallos",
		beatedUp: "veces golpeado",
		money: "Dinero",
		fromJobs: "de trabajos",
		spent: "gastos en tiendas",
		casino: "Casino",
		games: "juegos",
		won: "ganados",
		lost: "perdidos",
		playingSince: "Jugando desde",
	},
} as const;