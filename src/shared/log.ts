import { getClient } from "#bot/client";
import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { ChannelType, MessageFlags } from "discord.js";
import pino from "pino";

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

export class LogManager {
	private static Queue: Log[] = [];
	private static Interval: NodeJS.Timeout;

	static Initialize() {
		this.Interval = setInterval(() => this.Flush(), 10000);
	}

	static Push(log: Log) {
		this.Queue.push(log);
	}

	private static async Flush() {
		if (this.Queue.length === 0) return;

		const logsToSend = [...this.Queue];
		this.Queue = [];

		if (process.env.NODE_ENV !== "PROD") return;

		const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
		const channel = LOG_CHANNEL_ID ? getClient().channels.cache.get(LOG_CHANNEL_ID) : null;

		if (!channel || channel.type !== ChannelType.GuildText) return;

		let currentLength = 0;
		let currentTexts: string[] = [];
		const chunks: string[][] = [];

		for (const log of logsToSend) {
			const text = `\\${log.Title} ${log.Message}`;

			if (currentLength + text.length > 3800) {
				chunks.push(currentTexts);
				currentTexts = [];
				currentLength = 0;
			}

			currentTexts.push(text);
			currentLength += text.length;
		}

		if (currentTexts.length > 0) {
			chunks.push(currentTexts);
		}

		for (const chunk of chunks) {
			const container = new CustomContainerBuilder()
				.addTexts(chunk);

			try {
				await channel.send({
					components: [container],
					flags: MessageFlags.IsComponentsV2,
				});
			}
			catch (err) {
				logger.error("Error sending batched log to log channel", err);
			}
		}
	}
}

export class Log {
	Message: string;
	Type: LogType;
	Title = "Title";

	constructor(type: LogType, message: string) {
		this.Type = type;
		this.Message = message;

		switch (this.Type) {
		case LogType.Info:
			logger.info(`\x1b[34m${message}\x1b[0m`);
			this.Title = "ℹ️";
			break;

		case LogType.Warning:
			logger.warn(`\x1b[33m${message}\x1b[0m`);
			this.Title = "⚠️";
			break;

		case LogType.Error:
			logger.error(`\x1b[31m${message}\x1b[0m`);
			this.Title = "⛔";
			break;

		case LogType.Success:
			logger.info(`\x1b[32m${message}\x1b[0m`);
			this.Title = "❇️";
			break;
		}

		LogManager.Push(this);
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