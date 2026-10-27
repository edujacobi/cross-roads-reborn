import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { Language } from "#core/models/Language";
import type { User } from "#core/models/User";
import { type ActionRowBuilder, type ActivityOptions, type ButtonBuilder, type Client, type ColorResolvable, type RGBTuple } from "discord.js";
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
export declare function defaultComponent(options: ComponentParams): CustomContainerBuilder;
/**
 * Formats a date to a relative time string (e.g., "5 minutes ago") based on the language.
 *
 * @param date - The date to format.
 * @param language - The language to use for localization.
 * @returns The formatted relative time string.
 */
export declare function formattedDate(date: Date, language: Language): string;
/**
 * Formats a number as a currency string.
 *
 * @param money - The amount of money.
 * @param lang - The language for formatting conventions (e.g., decimal separators).
 * @param prefix - The currency prefix (default: "Cr$").
 * @returns The formatted currency string.
 */
export declare function formatMoney(money: number, lang: Language, prefix?: string): string;
/**
 * Formats a date object into a string representation based on the language.
 *
 * @param date - The date to format.
 * @param language - The language to determine the format (MM/DD/YYYY for English, DD/MM/YYYY for others).
 * @returns The formatted date string.
 */
export declare function formatDate(date: Date, language: Language): string;
export declare const clientActivities: ActivityOptions[];
/**
 * Sets up a loop to cycle through different activities for the Discord client user.
 *
 * @param client - The Discord client instance.
 */
export declare function changeActivity(client: Client): void;
/**
 * Converts a hexadecimal number to a hex color string (e.g., #FFFFFF).
 *
 * @param hex - The hexadecimal number.
 * @returns The hex color string.
 */
export declare function convertHexNumberToString(hex: number): string;
/**
 * Converts a hex color string to an RGB tuple.
 *
 * @param hex - The hex color string (e.g., "#FFFFFF").
 * @returns An array containing [r, g, b] values.
 */
export declare function hexToRGB(hex: string): RGBTuple;
export {};
