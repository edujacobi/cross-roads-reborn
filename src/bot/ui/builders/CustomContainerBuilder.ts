import {
	ActionRowBuilder,
	ButtonBuilder,
	ContainerBuilder,
	SectionBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
} from "discord.js";
import { User } from "@core/models/User";
import { EmoteBadgeString } from "@bot/utils/badges";

interface FooterOptions {
	text?: string;
	button?: ButtonBuilder;
	id?: number;
}

export class CustomSectionBuilder extends SectionBuilder {
	addTexts(texts: string[], id?: number) {
		this.addTextDisplayComponents(
			text => {
				text.setContent(texts.join("\n"));
				if (id) {
					text.setId(id);
				}
				return text;
			},
		);

		return this;
	}
}

export class CustomContainerBuilder extends ContainerBuilder {
	User?: User;

	constructor() {
		super();
	}

	setUser(user: User) {
		this.User = user;
		return this;
	}

	// @ts-expect-error: Override with narrower type for CustomSectionBuilder
	override addSectionComponents(...input: (CustomSectionBuilder | ((builder: CustomSectionBuilder) => CustomSectionBuilder))[]) {
		const sections: CustomSectionBuilder[] = [];

		input.forEach(builder => {
			if (builder instanceof CustomSectionBuilder) {
				sections.push(builder as CustomSectionBuilder);
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

	protected generateTextFooter(text = "") {
		const textUser = this.User ? this.User.GetNameWithImage() : "";
		const textDev = process.env.NODE_ENV !== "PROD" ? `${EmoteBadgeString.General.Developer}**DEV**` : "";

		const content = [
			textUser,
			text,
			textDev,
		].filter(s => s.length > 0)
			.join(" • ");

		return `-# ${content}`;
	}

	addTexts(texts: string[], id?: number) {
		this.addTextDisplayComponents(
			text => {
				text.setContent(texts.join("\n"));
				if (id) {
					text.setId(id);
				}
				return text;
			},
		);

		return this;
	}

	addFooter(options?: FooterOptions) {

		this.addLargeSeparator();

		const content = this.generateTextFooter(options?.text);

		if (options?.button) {
			return this.addSectionComponents(footerSection => footerSection
				.setId(100)
				.addTextDisplayComponents(footerText => footerText
					.setId(options.id || 101)
					.setContent(content))
				.setButtonAccessory(options.button!));
		}

		return this.addTextDisplayComponents(footerText => footerText
			.setId(options?.id || 100)
			.setContent(content));
	}

	changeFooterText(text: string) {
		const content = this.generateTextFooter(text);

		return this.changeTextFromSectionId(100, content);
	}

	/**
	 * Change the text from a specific section (or text component). To change a text inside a section, both need a id, and the text should be added 1.
	 * Example: Section: Id 30, Text inside Section: Id 31.
	 * @param id
	 * @param text
	 */
	changeTextFromSectionId(id: number, text: string) {
		const textComponent = this.components.find(component => component.data?.id === id);

		if (!textComponent) {
			return this;
		}

		if (textComponent instanceof TextDisplayBuilder) {
			textComponent.setContent(text);
		}
		else if (textComponent instanceof SectionBuilder) {
			const textComponentInside = textComponent.components.find(component => component.data?.id === id + 1);

			if (!textComponentInside) {
				return this;
			}

			if (textComponentInside instanceof TextDisplayBuilder) {
				textComponentInside.setContent(text);
			}

		}
		return this;
	}

	addLargeSeparator(visible = true) {
		this.addSeparatorComponents(separator => separator
			.setSpacing(SeparatorSpacingSize.Large)
			.setDivider(visible));
		return this;
	}

	addSmallSeparator(visible = true) {
		this.addSeparatorComponents(separator => separator
			.setSpacing(SeparatorSpacingSize.Small)
			.setDivider(visible));
		return this;
	}

	/**
	 * Add an image to the container.
	 * @param url
	 */
	addImage(url: string) {
		this.addMediaGalleryComponents(gallery => gallery
			.addItems(galleryItem => galleryItem
				.setURL(url),
			),
		);
		return this;
	}

	/**
	 * Add a button row to the container.
	 * @param buttons
	 */
	addButtonRow(...buttons: ((builder: ButtonBuilder) => ButtonBuilder)[]) {
		this.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>()
			.setComponents(...buttons.map(builder => builder(new ButtonBuilder()))));
		return this;
	}
}
