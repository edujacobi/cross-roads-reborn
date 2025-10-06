import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	ContainerBuilder,
	MessageComponentInteraction,
	MessageFlags,
} from "discord.js";
import { disableButtons, replyInteraction } from "../utils/logic";
import { Language } from "./Language";

export class Pagination {
	Interaction: ChatInputCommandInteraction;
	Language: Language;
	Offset: number = 0;
	Limit = 5;
	HowManyRecords: number = 0;
	CustomizeContainer: (() => Promise<ContainerBuilder>);

	constructor(interaction: ChatInputCommandInteraction, language: Language) {
		this.Interaction = interaction;
		this.Language = language;

		this.CustomizeContainer = () => {
			return Promise.resolve(new ContainerBuilder());
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

	Showing() {
		return Strings[this.Language].showing(this.Offset, this.Limit, this.HowManyRecords);
	}

	async GenerateContainer(mainContainer?: ContainerBuilder) {
		let row = this.GenerateRow();
		let container = await this.CustomizeContainer();

		const components: (ContainerBuilder | ActionRowBuilder<ButtonBuilder>)[] = mainContainer ? [mainContainer, container] : [container];
		if (row.components.length > 0) {
			components.push(row);
		}

		const response = await this.Interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});

		const collector = response.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === this.Interaction.user.id,
			componentType: ComponentType.Button,
			idle: 30_000,
		});

		collector.on("collect", async btn => {
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

			container = await this.CustomizeContainer();
			row = this.GenerateRow();

			await replyInteraction(this.Interaction, {
				components: mainContainer ? [mainContainer, container, row] : [container, row],
				flags: MessageFlags.IsComponentsV2,
			});
		});

		collector.on("end", async () => {
			await disableButtons(this.Interaction, mainContainer ?? container);
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