import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	EmbedBuilder,
	MessageComponentInteraction,
} from "discord.js";
import { removeEmbedComponents } from "../utils/logic";
import { Language } from "./Language";

export class Pagination {
	Interaction: ChatInputCommandInteraction;
	Language: Language;
	Offset: number = 0;
	Limit = 5;
	HowManyRecords: number = 0;
	CustomizeEmbed: (() => Promise<EmbedBuilder>);

	constructor(interaction: ChatInputCommandInteraction, language: Language) {
		this.Interaction = interaction;
		this.Language = language;

		this.CustomizeEmbed = () => {
			return Promise.resolve(new EmbedBuilder());
		};
	}

	private GenerateRow() {
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

	async GenerateEmbed(mainEmbed?: EmbedBuilder) {
		let row = this.GenerateRow();
		let embed = await this.CustomizeEmbed();

		const response = await this.Interaction.editReply({
			embeds: mainEmbed ? [mainEmbed, embed] : [embed],
			components: row.components.length > 0 ? [row] : [],
		});

		const collector = response.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === this.Interaction.user.id,
			componentType: ComponentType.Button,
			idle: 30_000,
		});

		collector.on("collect", async btn => {
			await btn.deferUpdate();

			if (btn.customId == "next") {
				this.Offset += this.Limit;
			}
			else if (btn.customId == "prev") {
				this.Offset -= this.Limit;
			}

			embed = await this.CustomizeEmbed();
			row = this.GenerateRow();

			await this.Interaction.editReply({ embeds: mainEmbed ? [mainEmbed, embed] : [embed], components: [row] });
		});

		collector.on("end", async () => {
			await removeEmbedComponents(this.Interaction);
		});
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