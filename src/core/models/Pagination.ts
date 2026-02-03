import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { createButtonCollector, disableButtons, replyInteraction } from "@bot/utils/logic";
import { Language } from "./Language";
import { CustomContainerBuilder } from "@bot/ui/builders/CustomContainerBuilder";

export class Pagination {
	Interaction: ChatInputCommandInteraction;
	Language: Language;
	Offset: number = 0;
	Limit = 5;
	HowManyRecords: number = 0;
	CustomizeContainer: (() => Promise<CustomContainerBuilder>);

	constructor(interaction: ChatInputCommandInteraction, language: Language) {
		this.Interaction = interaction;
		this.Language = language;

		this.CustomizeContainer = () => {
			return Promise.resolve(new CustomContainerBuilder());
		};
	}

	public GenerateRow() {
		const rowButtons = new ActionRowBuilder<ButtonBuilder>();

		if (this.Offset != 0) {
			rowButtons.addComponents(
				new ButtonBuilder()
					.setCustomId("prev")
					.setLabel(Strings[this.Language].previous)
					.setStyle(ButtonStyle.Secondary)
					.setEmoji("⬅️"),
			);
		}

		if (this.HowManyRecords > (this.Offset + this.Limit)) {
			rowButtons.addComponents(
				new ButtonBuilder()
					.setCustomId("next")
					.setLabel(Strings[this.Language].next)
					.setStyle(ButtonStyle.Secondary)
					.setEmoji("➡️"),
			);
		}

		return rowButtons;
	}

	private Showing() {
		return Strings[this.Language].showing(this.Offset, this.Limit, this.HowManyRecords);
	}

	async BuildContainerWithRow(showFooter = true) {
		const row = this.GenerateRow();
		const container = await this.CustomizeContainer();

		if (row.components.length > 0) {
			container
				.addLargeSeparator()
				.addActionRowComponents(row);
		}

		if (showFooter) {
			container.addFooter({
				text: this.Showing(),
			});
		}

		return container;
	}

	async GenerateContainer(mainContainer?: CustomContainerBuilder) {
		let container = await this.BuildContainerWithRow(!mainContainer);

		const components: CustomContainerBuilder[] = mainContainer ? [mainContainer, container] : [container];

		const response = await replyInteraction(this.Interaction, {
			components,
			flags: MessageFlags.IsComponentsV2,
		});

		const collector = createButtonCollector(this.Interaction, response, 30_000);

		collector?.on("end", async () => {
			await disableButtons(this.Interaction, mainContainer ?? container);
		});

		collector?.on("collect", async btn => {
			await btn.deferUpdate();

			if (!["next", "prev"].includes(btn.customId)) {
				return;
			}

			if (btn.customId == "next") {
				this.Offset += this.Limit;
			}
			else if (btn.customId == "prev") {
				this.Offset -= this.Limit;
			}

			container = await this.BuildContainerWithRow();

			await replyInteraction(this.Interaction, {
				components: mainContainer ? [mainContainer, container] : [container],
			});
		});

		return { response, collector };
	}
}

const Strings = {
	[Language.English]: {
		showing: (offset: number, limit: number, howMany: number) => `Showing ${offset + 1} - ${offset + limit} of ${howMany} results.`,
		next: "Next",
		previous: "Previous",
	},
	[Language.Portuguese]: {
		showing: (offset: number, limit: number, howMany: number) => `Exibindo ${offset + 1} - ${offset + limit} de ${howMany} resultados.`,
		next: "Próximo",
		previous: "Anterior",
	},
	[Language.Spanish]: {
		showing: (offset: number, limit: number, howMany: number) => `Mostrando ${offset + 1} - ${offset + limit} de ${howMany} resultados.`,
		next: "Siguiente",
		previous: "Anterior",
	},
} as const;