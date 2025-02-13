import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { replyInteraction } from "../../utils/logic";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { EmoteString } from "../../utils/emotes";
import { CrColors } from "../../utils/colors";
import { User } from "../../models/User";

module.exports = {
	vip: true,
	data: new SlashCommandBuilder()
		.setName("casino")
		.setDescription("Check the casino games")
		.setNameLocalization(Locale.PortugueseBR, "cassino")
		.setDescriptionLocalization(Locale.PortugueseBR, "Conheça os jogos do cassino"),

	async execute(interaction: ChatInputCommandInteraction, user: User) {

		const embed = new CustomEmbedBuilder()
			.setThumbnail("https://media.discordapp.net/attachments/1233604589064818808/1337969966821146695/radar_mafiaCasino.png")
			.setDescription(`# Cassino
Antro da perdição! Aposte, ganhe, perca, quebre a banca!
-# Aqui você pode apostar e perder todo seu dinheiro!

### ${EmoteString.Heads} Cara ou coroa
Aposte um valor em duas moedas que devem cair no mesmo lado. Você tem 25% de chance de vencer. Se vencer, ganha 3x o valor apostado!
-# Mais jogos em breve`)
			.setColor(CrColors.Casino)
			.setDefaultFooter(user.Nickname, interaction.user.avatarURL());

		await replyInteraction(interaction, { embeds: [embed] });

	},
};
