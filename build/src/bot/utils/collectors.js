"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createButtonCollector = createButtonCollector;
exports.createStringSelectCollector = createStringSelectCollector;
exports.disableButtons = disableButtons;
const discord_js_1 = require("discord.js");
const log_1 = require("#shared/log");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
/**
 * Creates a button interaction collector for a message.
 *
 * @param interaction - The original interaction.
 * @param response - The message or interaction response to collect from.
 * @param options - Optional settings for the collector (idleTime and maxClicks).
 * @returns The collector or undefined if response is missing.
 */
function createButtonCollector(interaction, response, options) {
    if (!response) {
        return;
    }
    return response.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        componentType: discord_js_1.ComponentType.Button,
        idle: options?.idleTime ?? 60_000,
        max: options?.maxClicks,
    });
}
/**
 * Creates a string select menu interaction collector for a message.
 *
 * @param interaction - The original interaction.
 * @param response - The message or interaction response to collect from.
 * @param idleTime - The idle time in milliseconds before the collector stops (default: 60_000).
 * @returns The collector or undefined if response is missing.
 */
function createStringSelectCollector(interaction, response, idleTime = 60_000) {
    if (!response) {
        return;
    }
    return response.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        componentType: discord_js_1.ComponentType.StringSelect,
        idle: idleTime,
    });
}
/**
 * Disables all buttons and select menus in a container and updates the interaction.
 *
 * @param interaction - The interaction to update.
 * @param container - The container with components to disable.
 */
async function disableButtons(interaction, container) {
    try {
        for (const component of container.components) {
            if (component instanceof discord_js_1.SectionBuilder) {
                if (!component.accessory) {
                    continue;
                }
                if (component.accessory.data.type === discord_js_1.ComponentType.Button) {
                    component.accessory.data.disabled = true;
                }
            }
            if (component instanceof discord_js_1.ActionRowBuilder) {
                if (component.components.length === 0) {
                    continue;
                }
                for (const c of component.components) {
                    if (c instanceof discord_js_1.ButtonBuilder || c instanceof discord_js_1.StringSelectMenuBuilder) {
                        c.setDisabled(true);
                    }
                }
            }
        }
        await (0, discordInteractions_1.replyWithContainer)(interaction, container);
    }
    catch (err) {
        log_1.Log.Warning(`Something went wrong with disabling buttons from container ${container.data.id} of user ${interaction.user.displayName} in server ${interaction.guild?.name} (Id: ${interaction.guild?.id}). Error: ${err}`);
    }
}
//# sourceMappingURL=collectors.js.map