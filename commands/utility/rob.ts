import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	Locale,
	SlashCommandBuilder,
	SlashCommandUserOption,
} from "discord.js";
import { checkUser, replyInteraction } from "../../utils/logic";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { defaultEmbed, showTime } from "../../utils/ui";
import { EmoteId, EmoteString } from "../../utils/emotes";
import { CrColors } from "../../utils/colors";
import { User } from "../../models/User";

module.exports = {
	vip: true,
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

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const target = interaction.options.getUser("target");

		let texto = "Você pode roubar!";
		if (user.IsWorking()) {
			texto = "Você não pode roubar enquanto trabalha!";
		}
		if (user.IsEscaping()) {
			texto = `Você não pode roubar enquanto estiver sendo procurado pela polícia! Poderá roubar novamente ${showTime(user.Timers.Escape.getTime(), true)}!`;
		}
		if (user.IsInPrison()) {
			texto = `Você não pode roubar enquanto está preso! Será solto ${showTime(user.Timers.Prison.getTime(), true)}!`;
		}

		// Há uma pequena chance do alvo ser também espancado!
		// -# Elas possuem ${EmoteString.Attack}ATK e ${EmoteString.Defense}DEF!

		if (!target) {
			const instructions = new CustomEmbedBuilder()
				.setColor(CrColors.Robbery)
				.setThumbnail("https://media.discordapp.net/attachments/691019843159326757/791444366727708672/roubar_20201223201323.png")
				.setDescription(`# Roubar
### Encontre um alvo e roube tudo!
Quanto maior seu ${EmoteString.Attack}ATK, maiores suas chances de roubo à outros jogadores. Quanto maior sua ${EmoteString.Defense}DEF, mais protegido você estará.

Se falhar, você será preso por um tempo definido pelo seu ${EmoteString.Attack}ATK.
Se conseguir, ficará em fuga e deverá esperar 1 hora para roubar novamente.

-# ${texto}`)
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
					description: `${EmoteString.Working} Você está trabalhando e não pode fazer isto agora!`,
				})],
			});
		}

		const targetUser = await checkUser(target.id, interaction);

		if (!targetUser) {
			return;
		}

		await user.RobUser(targetUser, interaction);

		// channelEmbed.setDescription(`### Acerte seu alvo!`);
		//
		// for (let i = 0; i < 3; i++) {
		// 	await replyInteraction(interaction, {
		// 		embeds: [channelEmbed],
		// 		components: createButtonGrid(),
		// 	});
		//
		// 	await wait(3000);
		// }
	},
};

function createButtonGrid() {
	const buttons = Array.from({ length: 25 }, (_, i) =>
		new ButtonBuilder()
			.setCustomId(`button_${i}`)
			.setEmoji(i === 0 ? EmoteId.Attack : EmoteId.Defense)
			.setStyle(i === 0 ? ButtonStyle.Danger : ButtonStyle.Secondary),
	);

	// Shuffle the buttons array
	for (let i = buttons.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[buttons[i], buttons[j]] = [buttons[j], buttons[i]];
	}

	const rows = Array.from({ length: 5 }, (_, i) =>
		new ActionRowBuilder<ButtonBuilder>()
			.addComponents(...buttons.slice(i * 5, i * 5 + 5)),
	);

	return rows;
}