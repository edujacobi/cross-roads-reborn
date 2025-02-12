import { APIEmbed, ButtonInteraction, CommandInteraction, EmbedBuilder } from "discord.js";

export class CustomEmbedBuilder extends EmbedBuilder {
	public readonly data: APIEmbed;

	constructor(data: APIEmbed = {}) {
		super();
		this.data = { ...data };
		this.setTimestamp();
		this.setAuthor({
			name: "Battle Roosters Arena",
			iconURL: "https://i.imgur.com/4wj6CFG.png",
		});
	}

	setDefaultFooter(interaction: CommandInteraction | ButtonInteraction, text?: string) {
		this.setFooter({
			text: text ? `${interaction.user.displayName} • ${text}` : interaction.user.displayName,
			iconURL: interaction.user.avatarURL() ?? undefined,
		});
		return this;
	}

}