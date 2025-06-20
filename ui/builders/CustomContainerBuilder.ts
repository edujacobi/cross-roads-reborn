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

		const footerTextComponent = this.components.find(component => component.data?.id === 100);

		if (!footerTextComponent) {
			return this;
		}

		if (footerTextComponent instanceof TextDisplayBuilder) {
			footerTextComponent.setContent(content);
		}
		else if (footerTextComponent instanceof SectionBuilder) {
			const footerTextComponentInside = footerTextComponent.components.find(component => component.data?.id === 101);

			if (!footerTextComponentInside) {
				return this;
			}

			if (footerTextComponentInside instanceof TextDisplayBuilder) {
				footerTextComponentInside.setContent(content);
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