import { APIEmbed, ButtonInteraction, Colors, CommandInteraction, EmbedBuilder } from "discord.js";

export class CustomEmbedBuilder extends EmbedBuilder {
	public readonly data: APIEmbed;

	constructor(data: APIEmbed = {}) {
		super();
		this.data = { ...data };
		this.setTimestamp();
		this.setAuthor({
			name: "Cross Roads Reborn",
			iconURL: "https://media.discordapp.net/attachments/1233604589064818808/1339586662107451523/CrossRoadsRebornLogo2.png?ex=67af42cc&is=67adf14c&hm=ed19f0da36816c7225ae9c038120a0a385f6385cb6f32c3827ab2545f18e4e69&=&format=webp&quality=lossless&width=671&height=671",
		});

		if (process.env.NODE_ENV !== "PROD") {
			this.setAuthor({
				name: "Cross Roads - Desenvolvimento",
				iconURL: "https://media.discordapp.net/attachments/1233604589064818808/1339586661453004842/CrossRoadsRebornDEVLogo.png?ex=67af42cc&is=67adf14c&hm=362189368fab488783bc21a02aa3c3e4d9f3194f8692111296b978b78934a577&=&format=webp&quality=lossless&width=671&height=671",
			});
			this.setColor(Colors.White);
		}
	}

	setDefaultFooter(interaction: CommandInteraction | ButtonInteraction, text?: string) {
		this.setFooter({
			text: text ? `${interaction.user.displayName} • ${text}` : interaction.user.displayName,
			iconURL: interaction.user.avatarURL() ?? undefined,
		});
		return this;
	}

}