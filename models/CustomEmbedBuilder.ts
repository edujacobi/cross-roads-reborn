import { APIEmbed, Colors, EmbedBuilder } from "discord.js";

export class CustomEmbedBuilder extends EmbedBuilder {
	public readonly data: APIEmbed;

	constructor(data: APIEmbed = {}) {
		super();
		this.data = { ...data };
		this.setTimestamp();
		this.setAuthor({
			name: "Cross Roads Reborn",
			iconURL: "https://media.discordapp.net/attachments/1233604589064818808/1339600176289021952/CrossRoadsRebornLogo2.png?ex=67af4f62&is=67adfde2&hm=9c4a43ac870d13978649b724865f60fe10285e285a253fd4ddfdc363b875d37e&=&format=webp&quality=lossless&width=671&height=671",
		});

		if (process.env.NODE_ENV !== "PROD") {
			this.setAuthor({
				name: "Cross Roads - Desenvolvimento",
				iconURL: "https://media.discordapp.net/attachments/1233604589064818808/1339600175735504956/CrossRoadsRebornDEVLogo.png?ex=67af4f62&is=67adfde2&hm=ae31bfeb6feab08b287d8066a7af246ecea1cd1b030c570ff3ec051f3d9e3f30&=&format=webp&quality=lossless&width=671&height=671",
			});
			this.setColor(Colors.White);
		}
	}

	setDefaultFooter(nickname: string, avatarUrl?: string | null, text?: string) {
		this.setFooter({
			text: text ? `${nickname} • ${text}` : nickname,
			iconURL: avatarUrl ?? undefined,
		});
		return this;
	}

}