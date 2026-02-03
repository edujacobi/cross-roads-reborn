import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { deferReply, replyWithContainer, searchUser } from "@bot/utils/logic";
import { defaultComponent } from "@bot/utils/ui";
import { CrColors } from "@bot/utils/colors";
import { User } from "@core/models/User";
import { Robbery } from "@core/models/Robbery";

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

		const robbery = new Robbery(target, user);

		const { canRob, message } = await robbery.CanRobUser();

		if (!canRob) {
			const container = defaultComponent({
				user,
				color: CrColors.Robbery,
				description: message,
			});

			return replyWithContainer(interaction, container);
		}

		await robbery.GetDiscordUser();

		await robbery.StartRobbery(interaction);
	},
};