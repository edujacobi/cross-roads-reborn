import {
	ChatInputCommandInteraction,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandStringOption,
} from "discord.js";
import { defaultEmbed, EmoteString } from "../../utils/ui";
import { checkRooster, replyInteraction, sendPrivateMessage } from "../../utils/logic";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("setattributes")
		.setDescription("Set Attributes for a rooster!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Configure Atributos para um galo!")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption((option: SlashCommandStringOption) =>
			option
				.setName("userid")
				.setDescription("The user ID to set the rooster attributes")
				.setDescriptionLocalization(Locale.PortugueseBR, "O ID do usuário para configurar os atributos do galo")
				.setRequired(true),
		)
		.addIntegerOption((option: SlashCommandIntegerOption) =>
			option
				.setName("attack")
				.setDescription("How many ATK points")
				.setMinValue(0)
				.setRequired(true),
		)
		.addIntegerOption((option: SlashCommandIntegerOption) =>
			option
				.setName("defense")
				.setDescription("How many DEF points")
				.setMinValue(0)
				.setRequired(true),
		)
		.addIntegerOption((option: SlashCommandIntegerOption) =>
			option
				.setName("speed")
				.setDescription("How many SPD points")
				.setMinValue(0)
				.setRequired(true),
		)
		.addIntegerOption((option: SlashCommandIntegerOption) =>
			option
				.setName("critical")
				.setDescription("How many CRT points")
				.setMinValue(0)
				.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction) {

		const userId = interaction.options.getString("userid", true);
		const atk = interaction.options.getInteger("attack", true);
		const def = interaction.options.getInteger("defense", true);
		const spd = interaction.options.getInteger("speed", true);
		const crt = interaction.options.getInteger("critical", true);

		const rooster = await checkRooster(userId, interaction);

		if (!rooster) {
			return await interaction.reply("Didn't find this rooster");
		}

		rooster.Stats.Attack = atk;
		rooster.Stats.Defense = def;
		rooster.Stats.Speed = spd;
		rooster.Stats.Critical = crt;

		await rooster.Update();

		await sendPrivateMessage(userId, `${rooster.GetNameWithImage()} now has stats ${EmoteString.Attack}${atk} ${EmoteString.Defense}${def} ${EmoteString.Speed}${spd} ${EmoteString.CritChange}${crt}!`);

		await replyInteraction(interaction, {
			embeds: [defaultEmbed({
				interaction: interaction,
				description: `${rooster.GetNameWithImage()} now has stats ${EmoteString.Attack}${atk} ${EmoteString.Defense}${def} ${EmoteString.Speed}${spd} ${EmoteString.CritChange}${crt}!`,
			})],
		});
	},
};
