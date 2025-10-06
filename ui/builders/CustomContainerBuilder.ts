import { ButtonBuilder, ContainerBuilder, SectionBuilder, SeparatorSpacingSize, TextDisplayBuilder } from "discord.js";
import { User } from "../../models/User";
import { EmoteBadgeString } from "../../utils/badges";

interface FooterOptions {
	text?: string;
	button?: ButtonBuilder;
	id?: number;
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
}