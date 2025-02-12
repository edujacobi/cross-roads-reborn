import { ChatInputCommandInteraction, Locale, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { checkRooster, replyInteraction } from "../../utils/logic";
import { defaultEmbed, getRarityColor } from "../../utils/ui";

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName("setname")
		.setNameLocalization(Locale.PortugueseBR, "mudanome")
		.setDescription("Set a new name to your rooster")
		.setDescriptionLocalization(Locale.PortugueseBR, "Muda o nome do seu galo")
		.addStringOption((option: SlashCommandStringOption) =>
			option
				.setName("name")
				.setNameLocalization(Locale.PortugueseBR, "nome")
				.setDescription("The new name")
				.setDescriptionLocalization(Locale.PortugueseBR, "O novo nome")
				.setMaxLength(32)
				.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const userID = interaction.user.id;

		const rooster = await checkRooster(userID, interaction);

		if (!rooster) {
			return;
		}

		const newName = interaction.options.getString("name", true);

		const oldName = rooster.GetNameWithImage();
		rooster.Name = newName;

		await rooster.Update();

		const embed = defaultEmbed({
			interaction,
			thumbnail: rooster.GetImage(),
			color: getRarityColor(rooster.Rarity),
			description: `**${oldName}** is now called **${newName}**!`,
		});


		await replyInteraction(interaction, { embeds: [embed] });
	},
};