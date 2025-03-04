import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction } from "discord.js";
import { User } from "./User";
import { CustomEmbedBuilder } from "./CustomEmbedBuilder";
import { CrColors } from "../utils/colors";
import { EmoteId, EmoteString } from "../utils/emotes";
import { replyInteraction } from "../utils/logic";
import { BadgeString } from "../utils/badges";
import { ItemId, ItemList } from "./Item";

export class Hospital {
	User: User;
	Interaction: ChatInputCommandInteraction;

	constructor(user: User, interaction: ChatInputCommandInteraction) {
		this.User = user;
		this.Interaction = interaction;
	}

	async GenerateEmbed() {
		// const s = Strings[this.User.Language];

		const embed = new CustomEmbedBuilder()
			.setThumbnail("https://media.discordapp.net/attachments/1233604589064818808/1346499466588328017/hospital5.png")
			.setDescription(`# Hospital
_Público, Gratuito e de Qualidade!_

-# Usuários hospitalizados possuem ${EmoteString.Defense}-5 DEF e ${EmoteString.Defense}-5% $DEF!.
### Serviço público
Infelizmente não temos mais leitos livres, então você precisará esperar no corredor até ser atendido.
### ${BadgeString.Season6.Hypocondriach} Atendimento particular
Caso você pague uma certa quantia, poderemos tratá-lo mais rapidamente!

-# Você não está hospitalizado!`)
			.setColor(CrColors.Hospital)
			.setDefaultFooter(this.User.Nickname, this.Interaction.user.avatarURL());

		const buttonHospitalized = new ButtonBuilder()
			.setCustomId("hospitalized")
			.setLabel("Hospitalizados")
			// .setDisabled(prisoners.length === 0)
			.setStyle(ButtonStyle.Secondary);

		const buttonPrivate = new ButtonBuilder()
			.setCustomId("private")
			.setLabel("Pagar particular")
			.setEmoji(BadgeString.Season6.Hypocondriach)
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(buttonHospitalized, buttonPrivate);

		await replyInteraction(this.Interaction, {
			embeds: [embed],
			components: [row],
		});
	}
}