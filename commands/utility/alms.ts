import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { replyInteraction, searchUser, sendPrivateMessage } from "../../utils/logic";
import { User } from "../../models/User";
import { Language } from "../../models/Language";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { defaultEmbed, formatMoney } from "../../utils/ui";
import { EmoteString } from "../../utils/emotes";
import { CrColors } from "../../utils/colors";
import { Alms } from "../../models/Alms";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("alms")
		.setDescription("Donate some money to another user")
		.setNameLocalization(Locale.PortugueseBR, "esmola")
		.setDescriptionLocalization(Locale.PortugueseBR, "Doe algum dinheiro para outro usuário")
		.addStringOption(target => target
			.setName("target")
			.setDescription("The user to donate")
			.setNameLocalization(Locale.PortugueseBR, "alvo")
			.setDescriptionLocalization(Locale.PortugueseBR, "O avatar para doar")
			.setMinLength(3)
			.setRequired(true)),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const nameOrId = interaction.options.getString("target", true);
		const target = await searchUser(nameOrId, interaction);

		if (!target) {
			return;
		}

		const sG = Strings[language];
		const sR = Strings[target?.Language];

		const alms = new Alms(user, target);

		const { canGive, message } = alms.CanGiveAlms();

		if (!canGive) {
			return await replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: user.Nickname,
					interaction,
					color: CrColors.Default,
					description: message,
					footer: formatMoney(user.Money, language),
				})],
				components: [],
			});
		}

		await alms.GiveAlms();

		const privateMessage = `**${user.GetNameWithImage()}** ${interaction.guild ? sR.receivedServer(interaction.guild.name, alms.Value) : sR.received(alms.Value)} ${EmoteString.Alms}`;

		await sendPrivateMessage(target.Id, privateMessage, CrColors.Default);

		const embed = new CustomEmbedBuilder()
			.setDescription(`${sG.donated(alms.Value)} **${target.GetNameWithImage()}** ${EmoteString.Alms}`)
			.setColor(CrColors.Default)
			.setUserFooter({
				nickname: user.Nickname,
				image: interaction.user.avatarURL(),
				text: formatMoney(user.Money, language),
			});

		return replyInteraction(interaction, {
			embeds: [embed],
		});
	},
};

const Strings = {
	[Language.English]: {
		donated: (money: number) => `You donated ${formatMoney(money, Language.English)} to`,
		received: (money: number) => `gave you a alms of ${formatMoney(money, Language.English)}`,
		receivedServer: (serverName: string, money: number) => `from server ${serverName} gave you a alms of ${formatMoney(money, Language.English)}`,
	},
	[Language.Portuguese]: {
		donated: (money: number) => `Você doou ${formatMoney(money, Language.Portuguese)} para`,
		received: (money: number) => `te deu uma esmola de ${formatMoney(money, Language.Portuguese)}`,
		receivedServer: (serverName: string, money: number) => `do servidor ${serverName} te deu uma esmola de ${formatMoney(money, Language.Portuguese)}`,
	},
	[Language.Spanish]: {
		donated: (money: number) => `Has donado ${formatMoney(money, Language.Spanish)} a`,
		received: (money: number) => `te ha dado una limosna de ${formatMoney(money, Language.Spanish)}`,
		receivedServer: (serverName: string, money: number) => `del servidor ${serverName} te ha dado una limosna de ${formatMoney(money, Language.Spanish)}`,
	},
} as const;