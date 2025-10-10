import {
	ActionRowBuilder,
	ActivityType,
	ButtonBuilder,
	ButtonInteraction,
	Client,
	ColorResolvable,
	CommandInteraction,
	RGBTuple,
} from "discord.js";
import { CustomEmbedBuilder } from "../models/CustomEmbedBuilder";
import { Language } from "../models/Language";
import { enUS, es, ptBR } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";
import { User } from "../models/User";
import { Gang } from "../models/Gang";
import { Canvas, Image, loadImage } from "@napi-rs/canvas";
import fs from "node:fs";
import { GangColor } from "./colors";
import { CustomContainerBuilder } from "../ui/builders/CustomContainerBuilder";
import { logger } from "./log";

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

interface ComponentParams {
	user: User;
	color?: ColorResolvable;
	description: string;
	footer?: string;
	buttons?: ActionRowBuilder<ButtonBuilder>;
}

export function defaultComponent(options: ComponentParams): CustomContainerBuilder {
	const container = new CustomContainerBuilder()
		.setUser(options.user)
		.addTextDisplayComponents(text => text
			.setContent(options.description),
		);

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

export const DEFAULT_GANG_IMAGE = "https://i.imgur.com/xOUjOlZ.png";

export async function createUserGangImage(user: User, gang: Gang, language: Language) {
	const Strings = {
		[Language.English]: {
			of: "of",
			level: "Level",
		},
		[Language.Portuguese]: {
			of: "de",
			level: "Nível",
		},
		[Language.Spanish]: {
			of: "de",
			level: "Nivel",
		},
	} as const;

	const canvas = new Canvas(1024, 100);
	const ctx = canvas.getContext("2d");
	let image: Image;

	try {
		image = await loadImage(gang.Image ?? DEFAULT_GANG_IMAGE);
	}
	catch (error) {
		logger.error(`Error loading gang image. Default image used instead.`, error);
		image = await loadImage(DEFAULT_GANG_IMAGE);
	}

	// Background
	const color = hexToRGB(convertHexNumberToString(GangColor[gang.Color].Color));
	ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.15)`;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const padding = 22;
	const radius = 32;
	const imageSize = radius * 2;

	const circleX = padding + radius;
	const circleY = ctx.canvas.height / 2;

	// Draw circle
	ctx.beginPath();
	ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
	ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.5)`;
	ctx.fill();

	// Image
	ctx.save();
	ctx.clip();
	// Calculate the top-left corner to center the image inside the circle
	const imageX = circleX - radius;
	const imageY = circleY - radius;
	ctx.drawImage(image, imageX, imageY, imageSize, imageSize);
	ctx.restore();

	// Text
	const margin = 110;
	const roleText = `${gang.Members.find(member => member.UserId === user.Id)!.RoleName} ${Strings[language].of}`;
	ctx.font = "600 28px Inter";
	ctx.fillStyle = "#FFFFFF";
	ctx.textBaseline = "middle";
	ctx.fillText(roleText, margin, ctx.canvas.height / 2);

	ctx.fillStyle = convertHexNumberToString(GangColor[gang.Color].Color);
	ctx.fillText(gang.Name, margin + ctx.measureText(roleText).width + 10, ctx.canvas.height / 2);

	ctx.fillStyle = "#FFFFFF";
	ctx.font = "600 20px Inter";
	ctx.textAlign = "end";
	ctx.fillText(`${Strings[language].level} ${gang.Level}`, ctx.canvas.width - 32, ctx.canvas.height / 2);

	return canvas.encode("webp");
}

export async function testImage() {
	const user = await new User("332228051871989761").GetInfo();
	if (!user) {
		return;
	}
	const gang = await user.GetGang();
	if (!gang) {
		return;
	}

	const image = await createUserGangImage(user, gang, Language.English);

	fs.writeFile("image.webp", image, (err) => {
		logger.error(err);
	});

}