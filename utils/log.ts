import { ChannelType, ColorResolvable, Colors, MessageFlags } from "discord.js";
import { getClient } from "../client";
import pino from "pino";
import { CustomContainerBuilder } from "../ui/builders/CustomContainerBuilder";

export const logger = pino({
	transport: {
		target: "pino-pretty",
		options: {
			colorize: true,
		},
	},
	formatters: {
		level: (label) => {
			return {
				level: label,
			};
		},
	},
});

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
	Title = "Title";
	Color: ColorResolvable = Colors.DarkButNotBlack;

	constructor(type: LogType, message: string) {
		this.Type = type;
		this.Message = message;
		this.Date = new Date;

		switch (this.Type) {
		case LogType.Info:
			logger.info(`\x1b[34m${message}\x1b[0m`);
			this.Title = "ℹ️ INFO";
			this.Color = Colors.Blue;
			break;

		case LogType.Warning:
			logger.warn(`\x1b[33m${message}\x1b[0m`);
			this.Title = "⚠️ WARNING";
			this.Color = Colors.Yellow;
			break;

		case LogType.Error:
			logger.error(`\x1b[31m${message}\x1b[0m`);
			this.Title = "⛔ ERROR";
			this.Color = Colors.Red;
			break;

		case LogType.Success:
			logger.info(`\x1b[32m${message}\x1b[0m`);
			this.Title = "❇️ SUCCESS";
			this.Color = Colors.Green;
			break;
		}

		const container = new CustomContainerBuilder()
			.setAccentColor(this.Color)
			.addTexts([
				`### ${this.Title}`,
				this.Message,
				`-# Cross Roads Reborn`,
			]);

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
				channel.send({
					components: [container],
					flags: MessageFlags.IsComponentsV2,
				});
			}
		}
		catch (err) {
			logger.error("Error sending log to log channel", err);
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