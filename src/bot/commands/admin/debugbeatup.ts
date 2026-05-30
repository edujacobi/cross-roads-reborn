import { type ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { deferReply, replyWithContainer } from "#bot/utils/discordInteractions";
import { defaultComponent } from "#bot/utils/ui";
import { CrColors } from "#bot/utils/colors";
import type { User } from "#core/models/User";
import { BeatUp } from "#core/models/BeatUp";
import { searchUser } from "#bot/utils/userUtils";
import { runUserBeatUp } from "#bot/utils/beatupHelper";

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

		const beatUp = new BeatUp(target, user);

		const { canBeat, message } = await beatUp.CanBeatUser();

		if (!canBeat) {
			const container = defaultComponent({
				user,
				color: CrColors.BeatUp,
				description: message,
			});

			return replyWithContainer(interaction, container);
		}

		await runUserBeatUp(interaction, beatUp, target, user);
	},
};