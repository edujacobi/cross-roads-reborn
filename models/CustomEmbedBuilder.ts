import { APIEmbed, Colors, EmbedBuilder } from "discord.js";

interface UserFooter {
	nickname: string,
	image?: string | null,
	text?: string,
}

export class CustomEmbedBuilder extends EmbedBuilder {
	public readonly data: APIEmbed;

	constructor(data: APIEmbed = {}) {
		super();
		this.data = { ...data };
		this.setColor(Colors.DarkButNotBlack);
	}

	setUserFooter(props: UserFooter) {
		const textDev = process.env.NODE_ENV !== "PROD" ? "\nAmbiente de Desenvolvimento" : "";

		this.setFooter({
			text: `${props.text ? `${props.nickname} • ${props.text}` : props.nickname}${textDev}`,
			iconURL: props.image ?? undefined,
		});
		return this;
	}
}