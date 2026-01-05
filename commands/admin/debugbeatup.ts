import { ChatInputCommandInteraction, Locale, MessageFlags, SlashCommandBuilder } from "discord.js";
import { replyInteraction, searchUser } from "../../utils/logic";
import { defaultComponent } from "../../utils/ui";
import { CrColors } from "../../utils/colors";
import { User } from "../../models/User";
import { Language } from "../../models/Language";
import { BeatUp } from "../../models/BeatUp";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("debugbeatup")
		.setDescription("Test the beat up system")
		.setDescriptionLocalization(Locale.PortugueseBR, "Teste o sistema de espancamento")
		.addStringOption(target => target
			.setName("target")
			.setNameLocalization(Locale.PortugueseBR, "alvo")
			.setDescription("The user to beat you up")
			.setMinLength(3)
			.setRequired(true)
			.setDescriptionLocalization(Locale.PortugueseBR, "O usuário para te espancar"),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const nameOrId = interaction.options.getString("target", true);
		const target = await searchUser(nameOrId, interaction);

		await interaction.deferReply();

		if (!target) {
			return;
		}

		const robbery = new BeatUp(target, user);

		const { canBeat, message } = await robbery.CanBeatUser();

		if (!canBeat) {
			const container = defaultComponent({
				user,
				color: CrColors.BeatUp,
				description: message,
			});

			return await replyInteraction(interaction, {
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
		}

		await robbery.GetDiscordUser();

		await robbery.StartBeating(interaction);
	},
};