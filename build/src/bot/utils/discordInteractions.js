"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPrivateMessage = sendPrivateMessage;
exports.sendComplexPrivateMessage = sendComplexPrivateMessage;
exports.replyInteraction = replyInteraction;
exports.replyWithContainer = replyWithContainer;
exports.deferReply = deferReply;
exports.deferUpdate = deferUpdate;
exports.replyUserDontExist = replyUserDontExist;
const Language_1 = require("#core/models/Language");
const WebPush_1 = require("#core/models/WebPush");
const log_1 = require("#shared/log");
const discord_js_1 = require("discord.js");
const client_1 = require("../client");
/**
 * Sends a private message (DM) to a user with a simple embed.
 *
 * @param userId - The Id of the user to send the message to.
 * @param message - The content of the message description.
 * @param color - The color of the embed (default: DarkButNotBlack).
 * @param footer - Optional footer text for the embed.
 */
async function sendPrivateMessage(userId, message, color = discord_js_1.Colors.DarkButNotBlack, footer = "") {
    void WebPush_1.WebPush.Send(userId, message).catch(err => log_1.Log.Warning(`Web push to user ${userId} failed. Error: ${err}`));
    const client = (0, client_1.getClient)();
    try {
        const discordUser = await client.users.fetch(userId);
        const embed = new discord_js_1.EmbedBuilder()
            .setDescription(message);
        if (color) {
            embed.setColor(color);
        }
        if (footer) {
            embed.setFooter({ text: footer });
        }
        await discordUser.send({ embeds: [embed] });
    }
    catch (err) {
        log_1.Log.Warning(`Something went wrong with sending private message to user ${userId}. Error: ${err}`);
    }
}
/**
 * Sends a complex private message (DM) to a user.
 *
 * @param userId - The Id of the user to send the message to.
 * @param options - The message options (string, payload, or create options).
 * @returns The sent message or undefined if the user Id is missing or an error occurs.
 */
async function sendComplexPrivateMessage(userId, options) {
    if (!userId) {
        return;
    }
    const client = (0, client_1.getClient)();
    try {
        const discordUser = await client.users.fetch(userId);
        return await discordUser.send(options);
    }
    catch (err) {
        log_1.Log.Warning(`Something went wrong with sending private message to user ${userId}. Error: ${err}`);
    }
}
/**
 * Replies to an interaction, handling deferred or already replied states.
 *
 * @param interaction - The interaction to reply to.
 * @param options - The reply options.
 * @returns The reply message or undefined if an error occurs.
 */
async function replyInteraction(interaction, options) {
    try {
        if (interaction instanceof discord_js_1.ButtonInteraction) {
            if (interaction.replied || interaction.deferred) {
                return await interaction.followUp(options);
            }
            return await interaction.reply(options);
        }
        if (interaction.replied || interaction.deferred) {
            return await interaction.editReply(options);
        }
        if (interaction instanceof discord_js_1.MessageComponentInteraction) {
            return await interaction.update(options);
        }
        return await interaction.reply(options);
    }
    catch (err) {
        const error = err;
        log_1.logger.debug(error);
        const context = "commandName" in interaction ? `/${interaction.commandName}` : ("customId" in interaction ? `Component: ${interaction.customId}` : "Unknown Context");
        // Handle specific Discord errors gracefully (Console only)
        if (error.code === 10_008) {
            log_1.logger.warn(`[CONSOLE] Interaction reply failed: Deleted Message (Code 10008) [${context}] for user ${interaction.user.displayName} (Id: ${interaction.user.id}) in server ${interaction.guild?.name} (Id: ${interaction.guild?.id}).`);
            return;
        }
        if (error.code === 10_062) {
            log_1.logger.warn(`[CONSOLE] Interaction reply failed: Unknown Interaction (Code 10062) [${context}] for user ${interaction.user.displayName} (Id: ${interaction.user.id}) in server ${interaction.guild?.name} (Id: ${interaction.guild?.id}).`);
            return;
        }
        if (error.code === 50_027) {
            log_1.logger.warn(`[CONSOLE] Interaction reply failed: Token Expired (Code 50027) [${context}] for user ${interaction.user.displayName} (Id: ${interaction.user.id}) in server ${interaction.guild?.name} (Id: ${interaction.guild?.id}).`);
            return;
        }
        if (error.name === "AbortError") {
            log_1.logger.warn(`[CONSOLE] Interaction reply timed out (AbortError) [${context}] for user ${interaction.user.displayName} (Id: ${interaction.user.id}) in server ${interaction.guild?.name} (Id: ${interaction.guild?.id}). This is usually a temporary Discord API or network issue.`);
            return;
        }
        log_1.Log.Warning(`Something went wrong with replying interaction of user ${interaction.user.displayName} (Id: ${interaction.user.id}) [${context}] in server ${interaction.guild?.name} (Id: ${interaction.guild?.id}). Error: ${error.message}`);
    }
}
/**
 * Replies to an interaction with a custom container (UI).
 *
 * @param interaction - The interaction to reply to.
 * @param container - The container builder with components.
 * @param ephemeral - Whether the reply should be ephemeral (default: false).
 * @returns The reply message.
 */
async function replyWithContainer(interaction, container, ephemeral = false) {
    return await replyInteraction(interaction, {
        components: [container],
        flags: ephemeral ? [discord_js_1.MessageFlags.IsComponentsV2, discord_js_1.MessageFlags.Ephemeral] : discord_js_1.MessageFlags.IsComponentsV2,
    });
}
/**
 * Defers the reply to an interaction if it hasn't been deferred already.
 *
 * @param interaction - The interaction to defer.
 */
async function deferReply(interaction) {
    try {
        if (interaction.deferred) {
            return;
        }
        await interaction.deferReply();
    }
    catch (err) {
        const error = err;
        if (error.name === "AbortError") {
            log_1.Log.Warning(`Deferring reply timed out (AbortError) for interaction ${interaction.id} of user ${interaction.user.displayName}.`);
            return;
        }
        log_1.Log.Warning(`Something went wrong with deferring interaction ${interaction.id} of user ${interaction.user.displayName} in server ${interaction.guild?.name} (Id: ${interaction.guild?.id}). Error: ${err}`);
    }
}
/**
 * Defers the update to an interaction if it hasn't been deferred already.
 *
 * @param interaction - The interaction to defer.
 */
async function deferUpdate(interaction) {
    try {
        if (interaction.deferred) {
            return;
        }
        await interaction.deferUpdate();
    }
    catch (err) {
        const error = err;
        if (error.name === "AbortError") {
            log_1.Log.Warning(`Deferring update timed out (AbortError) for interaction ${interaction.id} of user ${interaction.user.displayName}.`);
            return;
        }
        // logger.warn(`[CONSOLE] Something went wrong with deferring interaction ${interaction.id} of user ${interaction.user.displayName} in server ${interaction.guild?.name} (Id: ${interaction.guild?.id}). Error: ${err}`);
    }
}
/**
 * Replies to an interaction indicating that the user does not exist.
 *
 * @param interaction - The interaction to reply to.
 * @param language - The language for the error message.
 * @returns The reply message.
 */
async function replyUserDontExist(interaction, language) {
    return await replyInteraction(interaction, {
        content: Strings[language].userDontExist,
        flags: [discord_js_1.MessageFlags.Ephemeral],
    });
}
const Strings = {
    [Language_1.Language.English]: {
        userDontExist: "This user doesn't exist in the database.",
    },
    [Language_1.Language.Portuguese]: {
        userDontExist: "Este usuário não existe no banco de dados.",
    },
    [Language_1.Language.Spanish]: {
        userDontExist: "Este usuario no existe en la base de datos.",
    },
};
//# sourceMappingURL=discordInteractions.js.map