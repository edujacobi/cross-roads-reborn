import { CrColors } from "#bot/utils/colors";
import { deferReply, replyWithContainer } from "#bot/utils/discordInteractions";
import { runUserRobbery } from "#bot/utils/robberyHelper";
import { defaultComponent } from "#bot/utils/ui";
import { searchUser } from "#bot/utils/userUtils";
import { type User } from "#core/models/User";
import { UserRobberyStrategy } from "#core/models/strategies/robbery/UserRobberyStrategy";
import { type ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("debugrobbery")
		.setDescription("Test the robbery system")
		.setDescriptionLocalization(Locale.PortugueseBR, "Teste o sistema de roubos")
		.addStringOption(target => target
			.setName("target")
			.setNameLocalization(Locale.PortugueseBR, "alvo")
			.setDescription("The user to rob you")
			.setMinLength(3)
			.setRequired(true)
			.setDescriptionLocalization(Locale.PortugueseBR, "O usuário para te roubar"),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const nameOrId = interaction.options.getString("target", true);

		await deferReply(interaction);

		const target = await searchUser(nameOrId, interaction);

		if (!target) {
			return;
		}

		const robbery = new UserRobberyStrategy(target, user);

		const { canRob, message } = await robbery.CanRob();

		if (!canRob) {
			const container = defaultComponent({
				user,
				color: CrColors.Robbery,
				description: message,
			});

			return replyWithContainer(interaction, container);
		}

		await runUserRobbery(interaction, robbery, target, user);
	},
};