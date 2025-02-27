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
				name: `Informações de ${target.Nickname}`,
				iconURL: _user.avatarURL() ?? undefined,
			})
			.setDescription(`\n${badges.length > 0 ? `### ${badgeText}\n` : ""} ### ${formatMoney(target.Money, language)}`)
			.setFields([{
				name: "Situação",
				value: `-# ${target.Situation.Complex}`,
				inline: true,
			}, {
				name: "Classe",
				value: `-# ${ClassList[target.Class].Image.Emote.String} ${ClassList[target.Class].Description[user.Language]}`,
				inline: true,
			}, {
				name: `${EmoteString.InvestmentActive} Investimento`,
				value: `-# Não implementado`,
				inline: true,
			}, {
				name: `${EmoteString.Heads} Daily`,
				value: `-# ${target.CanReceiveDaily() ? `Disponível` : showTime(addDays(target.Daily.LastReceived!, 1).getTime(), true)}`,
				inline: true,
			}, {
				name: `${EmoteString.Prison} Prisão`,
				value: `-# \`${target.Robbery.FailureCount}\` vezes preso
-# \`${target.Prison.BriberyCount}\` subornos
-# \`${formatMoney(target.Prison.BriberySum, user.Language)}\` em suborno`,
				inline: true,
			}, {
				name: `${EmoteString.Robbery} Roubos`,
				value: `-# ${target.Escape.Time > now ? showTime(target.Escape.Time.getTime(), true) : `Pode roubar`}
-# \`${formatMoney(target.Robbery.SuccessRobbedSum, user.Language)}\` (\`${target.Robbery.SuccessCount}\`) roubados
-# \`${formatMoney(target.Robbery.BeingRobbedSum, user.Language)}\` (\`${target.Robbery.BeingRobbedCount}\`) perdidos`,
				inline: true,
			}, {
				name: `${EmoteString.Beat} Espancamentos`,
				value: `-# Não implementado`,
				inline: true,
			}, {
				name: `${EmoteString.Bank} Dinheiro`,
				value: `-# \`${formatMoney(target.Job.ReceivedSum, user.Language)}\` (\`${target.Job.ReceivedCount}\`) de trabalhos
-# \`${formatMoney(target.Shop.SpentSum, user.Language)}\` (\`${target.Shop.SpentCount}\`) gastos em lojas`,
				inline: true,
			}, {
				name: `${EmoteString.Casino} Cassino`,
				value: `-# \`${target.Casino.WinCount + target.Casino.LoseCount}\` jogos
-# \`${formatMoney(target.Casino.WinSum, user.Language)}\` (\`${target.Casino.WinCount}\`) ganhos
-# \`${formatMoney(target.Casino.LoseSum, user.Language)}\` (\`${target.Casino.LoseCount}\`) perdidos
-# \`${(target.Casino.WinCount / (target.Casino.LoseCount) * 100).toFixed(2)}%\` win rate`,
				inline: true,
			}, {
				name: `${EmoteString.Philantrope} Esmolas`,
				value: `-# Não implementado`,
				inline: true,
			}, {
				name: `${EmoteString.Hospital} Hospital`,
				value: `-# Não implementado`,
				inline: true,
			}, {
				name: `${EmoteString.Scavenge} Vasculhar`,
				value: `-# Não implementado`,
				inline: true,
			}])
			.setDefaultFooter(user.Nickname, interaction.user.avatarURL(), `ID: ${target.Id} • Jogando desde: ${target.CreatedAt.toLocaleDateString(interaction.locale)}`);

		await replyInteraction(interaction, { embeds: [embed] });
	},
};

const Strings = {
	[Language.English]: {
		title: "About",
		credits: "Credits",
		direction: "Direction",
		programming: "Programming",
		art: "Art",
		disclaimer: "Some images were made using Image Creator from Microsoft Designer (Bing).",
	},

	[Language.Portuguese]: {
		title: "Sobre",
		credits: "Créditos",
		direction: "Direção",
		programming: "Programação",
		art: "Arte",
		disclaimer: "Algumas imagens foram criadas utilizando o Image Creator do Microsoft Designer (Bing).",
	},

	[Language.Spanish]: {
		title: "Acerca de",
		credits: "Créditos",
		direction: "Dirección",
		programming: "Programación",
		art: "Arte",
		disclaimer: "Algunas imágenes se crearon utilizando Image Creator de Microsoft Designer (Bing).",
	},
} as const;