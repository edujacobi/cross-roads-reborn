import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { deferReply, replyWithContainer, searchUser } from "../../utils/logic";
import { defaultComponent } from "../../utils/ui";
import { CrColors } from "../../utils/colors";
import { User } from "../../models/User";
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

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const nameOrId = interaction.options.getString("target", true);

		await deferReply(interaction);

		const target = await searchUser(nameOrId, interaction);

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

			return replyWithContainer(interaction, container);
		}

		await robbery.GetDiscordUser();

		await robbery.StartBeating(interaction);
	},
};