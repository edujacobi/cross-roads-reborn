import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { replyInteraction } from "../../utils/logic";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { EmoteString } from "../../utils/emotes";
import { CrColors } from "../../utils/colors";
import { User } from "../../models/User";
import { Language } from "../../models/Language";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("casino")
		.setDescription("Check the casino games")
		.setNameLocalization(Locale.PortugueseBR, "cassino")
		.setDescriptionLocalization(Locale.PortugueseBR, "Conheça os jogos do cassino"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const s = Strings[language];

		const embed = new CustomEmbedBuilder()
			.setThumbnail("https://media.discordapp.net/attachments/1233604589064818808/1337969966821146695/radar_mafiaCasino.png")
			.setDescription(s.description)
			.setColor(CrColors.Casino)
			.setDefaultFooter(user.Nickname, interaction.user.avatarURL());

		await replyInteraction(interaction, { embeds: [embed] });

	},
};

const Strings = {
	[Language.English]: {
		description: `# Casino
Den of iniquity! Bet, win, lose, break the bank!
-# Here you can bet and lose all your money!

### ${EmoteString.Heads} Heads or tails
Bet an amount on two coins that must fall on the same side. You have a 25% chance of winning. If you win, you get 3x the amount bet!
-# More games coming soon`,
	},
	[Language.Portuguese]: {
		description: `# Cassino
Antro da perdição! Aposte, ganhe, perca, quebre a banca!
-# Aqui você pode apostar e perder todo seu dinheiro!

### ${EmoteString.Heads} Cara ou coroa
Aposte um valor em duas moedas que devem cair no mesmo lado. Você tem 25% de chance de vencer. Se vencer, ganha 3x o valor apostado!
-# Mais jogos em breve`,
	},
	[Language.Spanish]: {
		description: `# Casino
Den de iniquidad! Apuesta, gana, pierde, rompe el banco!
-# ¡Aquí puedes apostar y perder todo tu dinero!

### ${EmoteString.Heads} Cara o cruz
Apostar una cantidad en dos monedas que deben caer del mismo lado. Tienes un 25% de posibilidades de ganar. ¡Si ganas, obtienes 3 veces la cantidad apostada!
-# ¡Más juegos próximamente!`,
	},
} as const;