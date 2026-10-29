"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = exports.LogManager = exports.LogType = exports.logger = void 0;
const client_1 = require("#bot/client");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const discord_js_1 = require("discord.js");
const pino_1 = __importDefault(require("pino"));
exports.logger = (0, pino_1.default)({
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
var LogType;
(function (LogType) {
    LogType[LogType["Info"] = 0] = "Info";
    LogType[LogType["Warning"] = 1] = "Warning";
    LogType[LogType["Error"] = 2] = "Error";
    LogType[LogType["Success"] = 3] = "Success";
})(LogType || (exports.LogType = LogType = {}));
class LogManager {
    static Queue = [];
    static Interval;
    static Initialize() {
        this.Interval = setInterval(() => this.Flush(), 10000);
    }
    static Push(log) {
        this.Queue.push(log);
    }
    static async Flush() {
        if (this.Queue.length === 0)
            return;
        const logsToSend = [...this.Queue];
        this.Queue = [];
        if (process.env.NODE_ENV !== "PROD")
            return;
        const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
        const channel = LOG_CHANNEL_ID ? (0, client_1.getClient)().channels.cache.get(LOG_CHANNEL_ID) : null;
        if (!channel || channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        let currentLength = 0;
        let currentTexts = [];
        const chunks = [];
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
            const container = new CustomContainerBuilder_1.CustomContainerBuilder()
                .addTexts(chunk);
            try {
                await channel.send({
                    components: [container],
                    flags: discord_js_1.MessageFlags.IsComponentsV2,
                });
            }
            catch (err) {
                exports.logger.error("Error sending batched log to log channel", err);
            }
        }
    }
}
exports.LogManager = LogManager;
class Log {
    Message;
    Type;
    Title = "Title";
    constructor(type, message) {
        this.Type = type;
        this.Message = message;
        switch (this.Type) {
            case LogType.Info:
                exports.logger.info(`\x1b[34m${message}\x1b[0m`);
                this.Title = "ℹ️";
                break;
            case LogType.Warning:
                exports.logger.warn(`\x1b[33m${message}\x1b[0m`);
                this.Title = "⚠️";
                break;
            case LogType.Error:
                exports.logger.error(`\x1b[31m${message}\x1b[0m`);
                this.Title = "⛔";
                break;
            case LogType.Success:
                exports.logger.info(`\x1b[32m${message}\x1b[0m`);
                this.Title = "❇️";
                break;
        }
        LogManager.Push(this);
    }
    static Info(message) {
        return new Log(LogType.Info, message);
    }
    static Warning(message) {
        return new Log(LogType.Warning, message);
    }
    static Error(message) {
        return new Log(LogType.Error, message);
    }
    static Success(message) {
        return new Log(LogType.Success, message);
    }
}
exports.Log = Log;
//# sourceMappingURL=log.js.map