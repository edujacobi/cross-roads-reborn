import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	Locale,
	MessageComponentInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { checkRooster, checkUser, HOURS_TO_HATCH, removeEmbedComponents, replyInteraction } from "../../utils/logic";
import { defaultEmbed, getRarityColor } from "../../utils/ui";
import { Language } from "../../models/Language";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("release")
		.setDescription("Releases your rooster to the wild")
		.setNameLocalization(Locale.PortugueseBR, "soltar")
		.setDescriptionLocalization(Locale.PortugueseBR, "Solta seu galo para viver no mato"),

	async execute(interaction: ChatInputCommandInteraction) {
		const user = await checkUser(interaction.user.id, interaction);

		if (!user) {
			return;
		}

		const s = Strings[user.Language];

		const userID: string = interaction.user.id;

		const rooster = await checkRooster(userID, interaction);

		if (!rooster) {
			return;
		}

		const embed = defaultEmbed({
			interaction,
			thumbnail: rooster.GetImage(),
			color: getRarityColor(rooster.Rarity),
			description: s.descriptionStart(rooster.GetNameWithImage(), HOURS_TO_HATCH),
		});

		const buttonDelete = new ButtonBuilder()
			.setCustomId("release")
			.setLabel(s.labelRelease)
			.setStyle(ButtonStyle.Danger);

		const buttonCancel = new ButtonBuilder()
			.setCustomId("cancel")
			.setLabel(s.labelCancel)
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder<ButtonBuilder>()
			.setComponents([buttonDelete, buttonCancel]);

		const response = await replyInteraction(interaction, { embeds: [embed], components: [row] });

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			time: 60_000,
		});

		collector?.on("collect", async btn => {
			if (!rooster) {
				return;
			}

			if (btn.customId === "release") {
				embed.setDescription(s.descriptionReleasedRooster(rooster.GetNameWithImage(), HOURS_TO_HATCH));

				await rooster.Release();

				await removeEmbedComponents(btn, [embed]);

			}
			else if (btn.customId === "cancel") {
				embed.setDescription(s.descriptionKeptRooster(rooster.GetNameWithImage()));

				await removeEmbedComponents(btn, [embed]);
			}
		});

		collector?.on("end", async () => {
			embed.setDescription(s.descriptionEnd(rooster.GetNameWithImage()));
			await removeEmbedComponents(interaction);
		});
	},
};

const Strings = {
	[Language.English]: {
		descriptionStart: (name: string, hoursHatch: number) => `Do you really want to release **${name}** to the Wild?\n\nIf you release it, you will receive an 🥚 Egg that will hatch in ${hoursHatch} hours.`,
		labelRelease: "Release",
		labelCancel: "Cancel",
		descriptionReleasedRooster: (name: string, hoursHatch: number) => `**${name}** was released to the Wild. Good bye!\n\nYou received an 🥚Egg that will hatch in ${hoursHatch} hours.`,
		descriptionKeptRooster: (name: string) => `You kept **${name}**. He is safe. For now.`,
		descriptionEnd: (name: string) => `You kept **${name}**. He is safe. For now.`,
	},
	[Language.Portuguese]: {
		descriptionStart: (name: string, hoursHatch: number) => `Você realmente quer soltar **${name}** para a Selva?\n\nSe você soltar, você irá receber um 🥚 Ovo que irá chocar em ${hoursHatch} horas.`,
		labelRelease: "Soltar",
		labelCancel: "Cancelar",
		descriptionReleasedRooster: (name: string, hoursHatch: number) => `**${name}** foi solto na Selva. Adeus!\n\nVocê recebeu um 🥚Ovo que irá chocar em ${hoursHatch} horas.`,
		descriptionKeptRooster: (name: string) => `Você manteve **${name}**. Ele está seguro. Por enquanto.`,
		descriptionEnd: (name: string) => `Você manteve **${name}**. Ele está seguro. Por enquanto.`,
	},
	[Language.Spanish]: {
		descriptionStart: (name: string, hoursHatch: number) => `Realmente quieres liberar **${name}** en la Selva?\n\nSi lo liberas, recibirás un 🥚 Huevo que eclosionará en ${hoursHatch} horas.`,
		labelRelease: "Liberar",
		labelCancel: "Cancelar",
		descriptionReleasedRooster: (name: string, hoursHatch: number) => `**${name}** Fue liberado en la Selva. Adiós!\n\nRecibiste un 🥚Huevo que eclosionará en ${hoursHatch} horas.`,
		descriptionKeptRooster: (name: string) => `Te quedaste **${name}**. Está a salvo. Por ahora.`,
		descriptionEnd: (name: string) => `Te quedaste **${name}**. Está a salvo. Por ahora.`,
	},
} as const;