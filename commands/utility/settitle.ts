import { ChatInputCommandInteraction, Locale, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { checkRooster, replyInteraction } from "../../utils/logic";
import { defaultEmbed, getRarityColor } from "../../utils/ui";

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName("settitle")
		.setNameLocalization(Locale.PortugueseBR, "mudatitulo")
		.setDescription("Set a title to your rooster")
		.setDescriptionLocalization(Locale.PortugueseBR, "Muda o título do seu galo")
		.addStringOption((option: SlashCommandStringOption) =>
			option
				.setName("title")
				.setNameLocalization(Locale.PortugueseBR, "titulo")
				.setDescription("The new title")
				.setDescriptionLocalization(Locale.PortugueseBR, "O novo título")
				.setMaxLength(255)
				.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const userID = interaction.user.id;

		const rooster = await checkRooster(userID, interaction);

		if (!rooster) {
			return;
		}

		const newTitle = interaction.options.getString("title", true);

		rooster.Title = newTitle;

		await rooster.Update();

		const embed = defaultEmbed({
			interaction: interaction,
			thumbnail: rooster.GetImage(),
			color: getRarityColor(rooster.Rarity),
			description: `**${rooster.GetNameWithImage()}** now has the title **${newTitle}**!`,
		});


		await replyInteraction(interaction, { embeds: [embed] });
	},
};