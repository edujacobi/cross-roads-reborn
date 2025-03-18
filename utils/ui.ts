import { ActivityType, ButtonInteraction, Client, ColorResolvable, CommandInteraction } from "discord.js";
import { CustomEmbedBuilder } from "../models/CustomEmbedBuilder";
import { Language } from "../models/Language";

interface EmbedParams {
	nickname: string;
	interaction: CommandInteraction | ButtonInteraction;
	color?: ColorResolvable;
	description?: string;
	footer?: string;
	thumbnail?: string;
}

export function defaultEmbed(options: EmbedParams): CustomEmbedBuilder {
	const embed = new CustomEmbedBuilder()
		.setUserFooter({
			nickname: options.nickname,
			image: options.interaction.user.avatarURL(),
			text: options.footer,
		});

	if (options.description) {
		embed.setDescription(options.description);
	}
	if (options.color) {
		embed.setColor(options.color);
	}
	if (options.thumbnail) {
		embed.setThumbnail(options.thumbnail);
	}

	return embed;
}

export function formatMoney(money: number, lang: Language, prefix = "Cr$") {
	let m = money.toLocaleString("en-US");

	if (lang === Language.Portuguese) {
		m = money.toLocaleString("pt-BR").replace(/,/g, ".");
	}

	return `${prefix} ${m}`;
}

export function showTime(time: number, humanized?: boolean) {
	return `<t:${Math.round(time / 1000)}:${humanized ? "R" : "f"}>`;
}

export function formatDate(date: Date, language: Language) {
	if (language === Language.English) {
		return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()} ${String(date.getHours() % 12).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} ${date.getHours() > 12 ? "PM" : "AM"}`;
	}
	return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

interface ClientActivity {
	type: ActivityType,
	label: string
}

export const clientActivities: ClientActivity[] = [{
	type: ActivityType.Playing,
	label: "Battle Roosters Arena",
}, {
	type: ActivityType.Custom,
	label: "🪙 Betting in Casino",
}, {
	type: ActivityType.Custom,
	label: "🔪 Robbing an old lady",
}, {
	type: ActivityType.Custom,
	label: "🏃‍➡️ Escaping from prison",
}, {
	type: ActivityType.Watching,
	label: "Netflix",
}];

export function changeActivity(client: Client) {
	let currentActivityId = 0;
	const currentActivity = clientActivities[currentActivityId];

	client.user?.setActivity(currentActivity.label, {
		type: currentActivity.type,
	});

	setInterval(() => {
		currentActivityId += 1;

		if (currentActivityId >= clientActivities.length) {
			currentActivityId = 0;
		}

		const newActivity = clientActivities[currentActivityId];

		client.user?.setActivity(newActivity.label, {
			type: newActivity.type,
		});

	}, 30_000_000);
}