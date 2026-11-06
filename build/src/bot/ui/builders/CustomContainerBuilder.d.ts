import { ButtonBuilder, ContainerBuilder, SectionBuilder } from "discord.js";
import type { User } from "#core/models/User";
interface FooterOptions {
    text?: string;
    button?: ButtonBuilder;
    id?: number;
}
export declare class CustomSectionBuilder extends SectionBuilder {
    addTexts(texts: string[], id?: number): this;
}
export declare class CustomContainerBuilder extends ContainerBuilder {
    User?: User;
    constructor();
    setUser(user: User): this;
    addSectionComponents(...input: (CustomSectionBuilder | ((builder: CustomSectionBuilder) => CustomSectionBuilder))[]): this;
    protected generateTextFooter(text?: string): string;
    addTexts(texts: string[], id?: number): this;
    addFooter(options?: FooterOptions): this;
    changeFooterText(text: string): this;
    /**
     * Change the text from a specific section (or text component). To change a text inside a section, both need a id, and the text should be added 1.
     * Example: Section: Id 30, Text inside Section: Id 31.
     * @param id
     * @param text
     */
    changeTextFromSectionId(id: number, text: string | string[]): this;
    addLargeSeparator(visible?: boolean): this;
    addSmallSeparator(visible?: boolean): this;
    /**
     * Add an image to the container.
     * @param url
     * @param altText
     */
    addImage(url: string, altText?: string): this;
    /**
     * Add a button row to the container.
     * @param buttons
     */
    addButtonRow(...buttons: ((builder: ButtonBuilder) => ButtonBuilder)[]): this;
}
export {};
