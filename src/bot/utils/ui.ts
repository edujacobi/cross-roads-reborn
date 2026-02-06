import { ActionRowBuilder, ActivityType, ButtonBuilder, Client, ColorResolvable, RGBTuple } from "discord.js";
import { Language } from "@core/models/Language";
import { enUS, es, ptBR } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";
import { User } from "@core/models/User";
import { CustomContainerBuilder, CustomSectionBuilder } from "@bot/ui/builders/CustomContainerBuilder";

interface ComponentParams {
	user?: User;
	color?: ColorResolvable;
	description: string;
	footer?: string;
	thumbnail?: string;
	buttons?: ActionRowBuilder<ButtonBuilder>;
}

/**
 * Creates a default UI component (container) with standard formatting.
 *
 * @param options - The configuration options for the component.
 * @returns A configured CustomContainerBuilder instance.
 */
export function defaultComponent(options: ComponentParams): CustomContainerBuilder {
	const container = new CustomContainerBuilder();

	if (options.user) {
		container.setUser(options.user);
	}

	if (options.thumbnail) {
		const section = new CustomSectionBuilder()
			.setId(1)
			.addTexts([
				options.description,
			], 2)
			.setThumbnailAccessory(thumbnail => thumbnail
				.setURL(options.thumbnail!),
			);

		container.addSectionComponents(section);
	}
	else {
		container.addTexts([
			options.description,
		], 1);
	}

	if (options.buttons) {
		container.addActionRowComponents(options.buttons);
	}

	if (options.footer || options.user) {
		container.addFooter({
			text: options.footer,
		});
	}

	if (options.color) {
		container.setAccentColor(options.color as number);
	}

	return container;
}

/**
 * Formats a date to a relative time string (e.g., "5 minutes ago") based on the language.
 *
 * @param date - The date to format.
 * @param language - The language to use for localization.
 * @returns The formatted relative time string.
 */
export function formattedDate(date: Date, language: Language): string {
	const locale = language === Language.Portuguese ? ptBR : (language === Language.Spanish ? es : enUS);
	return formatDistanceToNow(date, { addSuffix: true, locale: locale });
}

/**
 * Formats a number as a currency string.
 *
 * @param money - The amount of money.
 * @param lang - The language for formatting conventions (e.g., decimal separators).
 * @param prefix - The currency prefix (default: "Cr$").
 * @returns The formatted currency string.
 */
export function formatMoney(money: number, lang: Language, prefix = "Cr$") {
	let m = Math.floor(money).toLocaleString("en-US");

	if (lang === Language.Portuguese) {
		m = Math.floor(money).toLocaleString("pt-BR").replace(/,/g, ".");
	}

	if (prefix === "") {
		return m;
	}

	return `${prefix} ${m}`;
}

/**
 * Generates a Discord timestamp string.
 *
 * @param time - The timestamp in milliseconds.
 * @param humanized - Whether to use relative time (R) or full date/time (f).
 * @returns The Discord timestamp string.
 */
export function showTime(time: number, humanized?: boolean) {
	return `<t:${Math.round(time / 1000)}:${humanized ? "R" : "f"}>`;
}

/**
 * Formats a date object into a string representation based on the language.
 *
 * @param date - The date to format.
 * @param language - The language to determine the format (MM/DD/YYYY for English, DD/MM/YYYY for others).
 * @returns The formatted date string.
 */
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
	label: "Playing 🐓 Battle Roosters Arena",
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

/**
 * Sets up a loop to cycle through different activities for the Discord client user.
 *
 * @param client - The Discord client instance.
 */
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

/**
 * Converts a hexadecimal number to a hex color string (e.g., #FFFFFF).
 *
 * @param hex - The hexadecimal number.
 * @returns The hex color string.
 */
export function convertHexNumberToString(hex: number): string {
	const hexString = hex.toString(16).toUpperCase();
	return `#${hexString.padStart(6, "0")}`;
}

/**
 * Converts a hex color string to an RGB tuple.
 *
 * @param hex - The hex color string (e.g., "#FFFFFF").
 * @returns An array containing [r, g, b] values.
 */
export function hexToRGB(hex: string): RGBTuple {
	return [
		parseInt(hex.substring(1, 3), 16),
		parseInt(hex.substring(3, 5), 16),
		parseInt(hex.substring(5, 7), 16),
	];
}