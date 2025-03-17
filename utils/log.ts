import { ChannelType, Colors, EmbedBuilder } from "discord.js";
import { getClient } from "../client";

export enum LogType {
	Info,
	Warning,
	Error,
	Success
}

export class Log {
	Message: string;
	Type: LogType;
	Date: Date;

	constructor(type: LogType, message: string) {
		this.Type = type;
		this.Message = message;
		this.Date = new Date;

		const embed = new EmbedBuilder()
			.setFooter({
				text: "Cross Roads Reborn",
				iconURL: "https://media.discordapp.net/attachments/1233604589064818808/1339600176289021952/CrossRoadsRebornLogo2.png?ex=67af4f62&is=67adfde2&hm=9c4a43ac870d13978649b724865f60fe10285e285a253fd4ddfdc363b875d37e&=&format=webp&quality=lossless&width=671&height=671",
			})
			.setDescription(message);

		switch (this.Type) {
		case LogType.Info:
			console.log(`[ℹ️ INFO] ${this.Date}: \x1b[34m${message}\x1b[0m`);
			embed.setTitle("ℹ️ INFO").setColor(Colors.Blue);
			break;

		case LogType.Warning:
			console.warn(`[⚠️ WARNING] ${this.Date}: \x1b[33m${message}\x1b[0m`);
			embed.setTitle("⚠️ WARNING").setColor(Colors.Yellow);
			break;

		case LogType.Error:
			console.error(`[⛔ ERROR] ${this.Date}: \x1b[31m${message}\x1b[0m`);
			embed.setTitle("⛔ ERROR").setColor(Colors.Red);
			break;

		case LogType.Success:
			console.log(`[❇️ SUCCESS] ${this.Date}: \x1b[32m${message}\x1b[0m`);
			embed.setTitle("❇️ SUCCESS").setColor(Colors.Green);
			break;
		}

		try {
			if (process.env.NODE_ENV !== "PROD") {
				return;
			}
			const LOG_CHANNEL_ID = "564988393713303579";
			const channel = getClient().channels.cache.get(LOG_CHANNEL_ID);

			if (!channel) {
				return;
			}

			if (channel.type == ChannelType.GuildText) {
				channel.send({ embeds: [embed] });
			}
		}
		catch (err) {
			console.error("ERROR SENDING LOG TO LOG CHANNEL");
		}

	}

	static Info(message: string) {
		return new Log(LogType.Info, message);
	}

	static Warning(message: string) {
		return new Log(LogType.Warning, message);
	}

	static Error(message: string) {
		return new Log(LogType.Error, message);
	}

	static Success(message: string) {
		return new Log(LogType.Success, message);
	}
}