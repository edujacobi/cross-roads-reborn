import {
	ActionRowBuilder,
	ActivityType,
	ButtonBuilder,
	Client,
	ColorResolvable,
	RGBTuple,
	SectionBuilder,
} from "discord.js";
import { Language } from "../models/Language";
import { enUS, es, ptBR } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";
import { User } from "../models/User";
import { CustomContainerBuilder } from "../ui/builders/CustomContainerBuilder";

interface ComponentParams {
	user: User;
	color?: ColorResolvable;
	description: string;
	footer?: string;
	thumbnail?: string;
	buttons?: ActionRowBuilder<ButtonBuilder>;
}

export function defaultComponent(options: ComponentParams): CustomContainerBuilder {
	const container = new CustomContainerBuilder()
		.setUser(options.user);

	if (options.thumbnail) {
		const section = new SectionBuilder()
			.setId(1)
			.addTextDisplayComponents(text => text
				.setId(2)
				.setContent(options.description),
			).setThumbnailAccessory(thumbnail => thumbnail
				.setURL(options.thumbnail!),
			);

		container.addSectionComponents(section);
	}
	else {
		container.addTextDisplayComponents(text => text
			.setId(1)
			.setContent(options.description),
		);
	}

	if (options.buttons) {
		container.addActionRowComponents(options.buttons);
	}

	container.addFooter({
		text: options.footer,
	});

	if (options.color) {
		container.setAccentColor(options.color as number);
	}

	return container;
}

export function formattedDate(date: Date, language: Language): string {
	const locale = language === Language.Portuguese ? ptBR : (language === Language.Spanish ? es : enUS);
	return formatDistanceToNow(date, { addSuffix: true, locale: locale });
}

export function formatMoney(money: number, lang: Language, prefix = "Cr$") {
	let m = money.toLocaleString("en-US");

	if (lang === Language.Portuguese) {
		m = money.toLocaleString("pt-BR").replace(/,/g, ".");
	}

	if (prefix === "") {
		return m;
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

export function convertHexNumberToString(hex: number): string {
	const hexString = hex.toString(16).toUpperCase();
	return `#${hexString.padStart(6, "0")}`;
}

export function hexToRGB(hex: string): RGBTuple {
	return [
		parseInt(hex.substring(1, 3), 16),
		parseInt(hex.substring(3, 5), 16),
		parseInt(hex.substring(5, 7), 16),
	];
}