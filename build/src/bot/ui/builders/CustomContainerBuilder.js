"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomContainerBuilder = exports.CustomSectionBuilder = void 0;
const discord_js_1 = require("discord.js");
const badges_1 = require("#bot/utils/badges");
class CustomSectionBuilder extends discord_js_1.SectionBuilder {
    addTexts(texts, id) {
        this.addTextDisplayComponents(text => {
            text.setContent(texts.join("\n"));
            if (id) {
                text.setId(id);
            }
            return text;
        });
        return this;
    }
}
exports.CustomSectionBuilder = CustomSectionBuilder;
class CustomContainerBuilder extends discord_js_1.ContainerBuilder {
    User;
    constructor() {
        super();
    }
    setUser(user) {
        this.User = user;
        return this;
    }
    // @ts-expect-error: Override with narrower type for CustomSectionBuilder
    addSectionComponents(...input) {
        const sections = [];
        input.forEach(builder => {
            if (builder instanceof CustomSectionBuilder) {
                sections.push(builder);
            }
            else {
                const section = new CustomSectionBuilder();
                builder(section);
                sections.push(section);
            }
        });
        super.addSectionComponents(...sections);
        return this;
    }
    generateTextFooter(text = "") {
        const textUser = this.User ? this.User.GetNameWithImage() : "";
        const textDev = process.env.NODE_ENV !== "PROD" ? `${badges_1.EmoteBadgeString.General.Developer}**DEV**` : "";
        const content = [
            textUser,
            text,
            textDev,
        ].filter(s => s.length > 0)
            .join(" • ");
        return `-# ${content}`;
    }
    addTexts(texts, id) {
        this.addTextDisplayComponents(text => {
            text.setContent(texts.join("\n"));
            if (id) {
                text.setId(id);
            }
            return text;
        });
        return this;
    }
    addFooter(options) {
        this.addLargeSeparator();
        const content = this.generateTextFooter(options?.text);
        if (options?.button) {
            return this.addSectionComponents(footerSection => footerSection
                .setId(100)
                .addTextDisplayComponents(footerText => footerText
                .setId(options.id || 101)
                .setContent(content))
                .setButtonAccessory(options.button));
        }
        return this.addTextDisplayComponents(footerText => footerText
            .setId(options?.id || 100)
            .setContent(content));
    }
    changeFooterText(text) {
        const content = this.generateTextFooter(text);
        return this.changeTextFromSectionId(100, content);
    }
    /**
     * Change the text from a specific section (or text component). To change a text inside a section, both need a id, and the text should be added 1.
     * Example: Section: Id 30, Text inside Section: Id 31.
     * @param id
     * @param text
     */
    changeTextFromSectionId(id, text) {
        const textComponent = this.components.find(component => component.data?.id === id);
        if (!textComponent) {
            return this;
        }
        const content = Array.isArray(text) ? text.join("\n") : text;
        if (textComponent instanceof discord_js_1.TextDisplayBuilder) {
            textComponent.setContent(content);
        }
        else if (textComponent instanceof discord_js_1.SectionBuilder) {
            const textComponentInside = textComponent.components.find(component => component.data?.id === id + 1);
            if (!textComponentInside) {
                return this;
            }
            if (textComponentInside instanceof discord_js_1.TextDisplayBuilder) {
                textComponentInside.setContent(content);
            }
        }
        return this;
    }
    addLargeSeparator(visible = true) {
        this.addSeparatorComponents(separator => separator
            .setSpacing(discord_js_1.SeparatorSpacingSize.Large)
            .setDivider(visible));
        return this;
    }
    addSmallSeparator(visible = true) {
        this.addSeparatorComponents(separator => separator
            .setSpacing(discord_js_1.SeparatorSpacingSize.Small)
            .setDivider(visible));
        return this;
    }
    /**
     * Add an image to the container.
     * @param url
     * @param altText
     */
    addImage(url, altText) {
        this.addMediaGalleryComponents(gallery => gallery
            .addItems(galleryItem => {
            galleryItem
                .setURL(url);
            if (altText) {
                galleryItem.setDescription(altText);
            }
            return galleryItem;
        }));
        return this;
    }
    /**
     * Add a button row to the container.
     * @param buttons
     */
    addButtonRow(...buttons) {
        this.addActionRowComponents(new discord_js_1.ActionRowBuilder()
            .setComponents(...buttons.map(builder => builder(new discord_js_1.ButtonBuilder()))));
        return this;
    }
}
exports.CustomContainerBuilder = CustomContainerBuilder;
//# sourceMappingURL=CustomContainerBuilder.js.map