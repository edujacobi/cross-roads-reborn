"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientActivities = void 0;
exports.defaultComponent = defaultComponent;
exports.formattedDate = formattedDate;
exports.formatMoney = formatMoney;
exports.formatDate = formatDate;
exports.changeActivity = changeActivity;
exports.convertHexNumberToString = convertHexNumberToString;
exports.hexToRGB = hexToRGB;
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const Language_1 = require("#core/models/Language");
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
const discord_js_1 = require("discord.js");
/**
 * Creates a default UI component (container) with standard formatting.
 *
 * @param options - The configuration options for the component.
 * @returns A configured CustomContainerBuilder instance.
 */
function defaultComponent(options) {
    const container = new CustomContainerBuilder_1.CustomContainerBuilder();
    if (options.user) {
        container.setUser(options.user);
    }
    if (options.thumbnail) {
        const section = new CustomContainerBuilder_1.CustomSectionBuilder()
            .setId(1)
            .addTexts([
            options.description,
        ], 2)
            .setThumbnailAccessory(thumbnail => thumbnail
            .setURL(options.thumbnail));
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
        container.setAccentColor(options.color);
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
function formattedDate(date, language) {
    const locale = language === Language_1.Language.Portuguese ? locale_1.ptBR : (language === Language_1.Language.Spanish ? locale_1.es : locale_1.enUS);
    return (0, date_fns_1.formatDistanceToNow)(date, { addSuffix: true, locale: locale });
}
/**
 * Formats a number as a currency string.
 *
 * @param money - The amount of money.
 * @param lang - The language for formatting conventions (e.g., decimal separators).
 * @param prefix - The currency prefix (default: "Cr$").
 * @returns The formatted currency string.
 */
function formatMoney(money, lang, prefix = "Cr$") {
    let m = Math.floor(money).toLocaleString("en-US");
    if (lang === Language_1.Language.Portuguese) {
        m = Math.floor(money).toLocaleString("pt-BR").replace(/,/g, ".");
    }
    if (prefix === "") {
        return m;
    }
    return `${prefix} ${m}`;
}
/**
 * Formats a date object into a string representation based on the language.
 *
 * @param date - The date to format.
 * @param language - The language to determine the format (MM/DD/YYYY for English, DD/MM/YYYY for others).
 * @returns The formatted date string.
 */
function formatDate(date, language) {
    if (language === Language_1.Language.English) {
        return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()} ${String(date.getHours() % 12).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} ${date.getHours() > 12 ? "PM" : "AM"}`;
    }
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
exports.clientActivities = [{
        type: discord_js_1.ActivityType.Playing,
        name: "Jogando 🐓 Battle Roosters Arena",
        state: "Playing Battle Roosters Arena",
    }, {
        type: discord_js_1.ActivityType.Custom,
        name: "🪙 Apostando no Cassino",
        state: "Betting at the Casino",
    }, {
        type: discord_js_1.ActivityType.Custom,
        name: "🔪 Roubando a velhinha na esquina",
        state: "Robbing an old lady",
    }, {
        type: discord_js_1.ActivityType.Custom,
        name: "🏃‍➡️ Fugindo da prisão",
        state: "Escaping from prison",
    }, {
        type: discord_js_1.ActivityType.Watching,
        name: "Netflix",
    }];
/**
 * Sets up a loop to cycle through different activities for the Discord client user.
 *
 * @param client - The Discord client instance.
 */
function changeActivity(client) {
    let currentActivityId = 0;
    const currentActivity = exports.clientActivities[currentActivityId];
    client.user?.setActivity({
        name: currentActivity.name,
        type: currentActivity.type,
        state: currentActivity.state,
    });
    setInterval(() => {
        currentActivityId += 1;
        if (currentActivityId >= exports.clientActivities.length) {
            currentActivityId = 0;
        }
        const newActivity = exports.clientActivities[currentActivityId];
        client.user?.setActivity({
            name: newActivity.name,
            type: newActivity.type,
            state: newActivity.state,
        });
    }, 30_000_000);
}
/**
 * Converts a hexadecimal number to a hex color string (e.g., #FFFFFF).
 *
 * @param hex - The hexadecimal number.
 * @returns The hex color string.
 */
function convertHexNumberToString(hex) {
    const hexString = hex.toString(16).toUpperCase();
    return `#${hexString.padStart(6, "0")}`;
}
/**
 * Converts a hex color string to an RGB tuple.
 *
 * @param hex - The hex color string (e.g., "#FFFFFF").
 * @returns An array containing [r, g, b] values.
 */
function hexToRGB(hex) {
    return [
        parseInt(hex.substring(1, 3), 16),
        parseInt(hex.substring(3, 5), 16),
        parseInt(hex.substring(5, 7), 16),
    ];
}
//# sourceMappingURL=ui.js.map