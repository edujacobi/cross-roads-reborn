import { ButtonBuilder, ContainerBuilder, SeparatorSpacingSize } from "discord.js";
import { User } from "../../models/User";

interface FooterOptions {
	text?: string;
	button?: ButtonBuilder;
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

	addFooter(options?: FooterOptions) {
		const textUser = this.User ? this.User.GetNameWithImage() : "";
		const textDev = process.env.NODE_ENV !== "PROD" ? "Ambiente de Desenvolvimento" : "";

		const content = [
			textUser,
			options?.text ?? "",
			textDev,
		].filter(s => s.length > 0)
			.join(" • ");

		this.addLargeSeparator();

		if (options?.button) {
			return this.addSectionComponents(footerSection => footerSection
				.addTextDisplayComponents(footerText => footerText
					.setContent(`-# ${content}`))
				.setButtonAccessory(options.button!));
		}

		return this.addTextDisplayComponents(footerText => footerText
			.setContent(`-# ${content}`));
	}

	addLargeSeparator(visible = true) {
		this.addSeparatorComponents(separator => separator
			.setSpacing(SeparatorSpacingSize.Large)
			.setDivider(visible));
		return this;
	}
}