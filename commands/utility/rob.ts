import { ChatInputCommandInteraction, Colors, Locale, SlashCommandBuilder, SlashCommandUserOption } from "discord.js";
import { checkUser, replyInteraction, replyUserDontExist } from "../../utils/logic";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { defaultEmbed, showTime } from "../../utils/ui";
import { EmoteString } from "../../utils/emotes";
import { CrColors } from "../../utils/colors";
import { User } from "../../models/User";
import { Language } from "../../models/Language";
import { Robbery } from "../../models/Robbery";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("rob")
		.setDescription("Rob a user")
		.setNameLocalization(Locale.PortugueseBR, "roubar")
		.setDescriptionLocalization(Locale.PortugueseBR, "Roube um usuário")
		.addUserOption((option: SlashCommandUserOption) =>
			option
				.setName("target")
				.setNameLocalization(Locale.PortugueseBR, "alvo")
				.setDescription("The user to rob")
				.setDescriptionLocalization(Locale.PortugueseBR, "O usuário para roubar"),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const target = interaction.options.getUser("target");

		const s = Strings[language];

		let text = `${s.userFree}`;
		if (user.IsWorking()) {
			text = s.userWorking;
		}
		if (user.IsWanted()) {
			text = s.userEscaping(user.Wanted.Time);
		}
		if (user.IsInPrison()) {
			text = s.userPrison(user.Prison.Time);
		}

		// Há uma pequena chance do alvo ser também espancado!
		// -# Elas possuem ${EmoteString.Attack}ATK e ${EmoteString.Defense}DEF!

		if (!target) {
			const instructions = new CustomEmbedBuilder()
				.setColor(CrColors.Robbery)
				.setThumbnail("https://media.discordapp.net/attachments/691019843159326757/791444366727708672/roubar_20201223201323.png")
				.setDescription(`${s.description}

-# ${text}`)
				.setDefaultFooter(user.Nickname, interaction.user.avatarURL(), `${user.Situation.Simple}`)
				.setTimestamp();

			return replyInteraction(interaction, { embeds: [instructions] });
		}

		if (user.IsWorking()) {
			return replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: user.Nickname,
					interaction,
					color: Colors.Yellow,
					description: `${s.userWorking} ${EmoteString.Working}`,
				})],
			});
		}

		const targetUser = await checkUser(target.id, interaction);

		if (!targetUser) {
			return await replyUserDontExist(interaction, language);
		}

		const robbery = new Robbery(user, targetUser);

		const { canRob, message } = await robbery.CanRobUser();

		if (!canRob) {
			return await replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: user.Nickname,
					interaction,
					color: CrColors.Robbery,
					description: message,
				})],
			});
		}

		await robbery.StartRobbery(interaction);
	},
};

const Strings = {
	[Language.English]: {
		userFree: "You can rob!",
		userWorking: "You can't rob while working!",
		userEscaping: (timerEscape: Date) => `You can't rob while being wanted by the police! You can rob again ${showTime(timerEscape.getTime(), true)}!`,
		userPrison: (timerPrison: Date) => `You can't rob while in prison! You will be released ${showTime(timerPrison.getTime(), true)}!`,
		description: `# Rob
### Find a target and steal everything!
The higher your ${EmoteString.Attack}ATK, the higher your chances of stealing from other players. The higher your ${EmoteString.Defense}DEF, the more protected you will be.

If you fail, you will be imprisoned for a time determined by your ${EmoteString.Attack}ATK.
If you succeed, you will be wanted by the police and will have to wait 1 hour to steal again.`,
	},
	[Language.Portuguese]: {
		userFree: "Você pode roubar!",
		userWorking: "Você não pode roubar enquanto trabalha!",
		userEscaping: (timerEscape: Date) => `Você não pode roubar enquanto estiver sendo procurado pela polícia! Poderá roubar novamente ${showTime(timerEscape.getTime(), true)}!`,
		userPrison: (timerPrison: Date) => `Você não pode roubar enquanto está preso! Será solto ${showTime(timerPrison.getTime(), true)}!`,
		description: `# Roubar
### Encontre um alvo e roube tudo!
Quanto maior seu ${EmoteString.Attack}ATK, maiores suas chances de roubo à outros jogadores. Quanto maior sua ${EmoteString.Defense}DEF, mais protegido você estará.

Se falhar, você será preso por um tempo definido pelo seu ${EmoteString.Attack}ATK.
Se conseguir, será procurado pela polícia e deverá esperar 1 hora para roubar novamente.`,
	},
	[Language.Spanish]: {
		userFree: "¡Puedes robar!",
		userWorking: "¡No puedes robar mientras trabajas!",
		userEscaping: (timerEscape: Date) => `¡No puedes robar mientras eres perseguido por la policía! ¡Puedes robar de nuevo ${showTime(timerEscape.getTime(), true)}!`,
		userPrison: (timerPrison: Date) => `¡No puedes robar mientras estás en prisión! ¡Serás liberado ${showTime(timerPrison.getTime(), true)}!`,
		description: `# Robar
### ¡Encuentra un objetivo y roba todo!
Cuanto mayor sea tu ${EmoteString.Attack}ATK, mayores serán tus posibilidades de robar a otros jugadores. Cuanto mayor sea tu ${EmoteString.Defense}DEF, más protegido estarás.

Si fallas, serás encarcelado por un tiempo determinado por tu ${EmoteString.Attack}ATK.
Si lo consigues, serás buscado por la policía y tendrás que esperar 1 hora para volver a robar.`,
	},
} as const;