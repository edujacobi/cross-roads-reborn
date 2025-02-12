import {
	ActionRowBuilder,
	ChatInputCommandInteraction,
	Colors,
	ComponentType,
	Locale,
	MessageComponentInteraction,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { checkRooster, checkUser, removeEmbedComponents, replyInteraction } from "../../utils/logic";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { RoosterImage } from "../../models/RoosterImage";
import { EmoteString } from "../../utils/ui";
import { Language } from "../../models/Language";

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName("setimage")
		.setDescription("Set the image to your rooster")
		.setNameLocalization(Locale.PortugueseBR, "mudarimagem")
		.setDescriptionLocalization(Locale.PortugueseBR, "Muda a imagem do seu galo"),

	async execute(interaction: ChatInputCommandInteraction) {
		const user = await checkUser(interaction.user.id, interaction);

		if (!user) {
			return;
		}

		const s = Strings[user.Language];

		const rooster = await checkRooster(interaction.user.id, interaction);

		if (!rooster) {
			return;
		}

		let aditionalMessage = "";

		if (rooster.Level >= 5) {
			aditionalMessage = s.roosterLevel5;
		}

		if (rooster.Level >= 15) {
			aditionalMessage = s.roosterlevel15;
		}

		if (user.IsVip()) {
			aditionalMessage += s.roosterVIP;
		}

		const embed = new CustomEmbedBuilder()
			.setTitle(s.title)
			.setDescription(`${s.descriptionStart}
			
${aditionalMessage}`)
			.setThumbnail("https://i.imgur.com/Q9Rj5IS.jpeg")
			.setColor(Colors.White)
			.setDefaultFooter(interaction, s.footerStart);

		const selectSmall = new StringSelectMenuBuilder()
			.setCustomId("selectSmall")
			.setPlaceholder(s.placeholderSmall);

		const selectMedium = new StringSelectMenuBuilder()
			.setCustomId("selectMedium")
			.setPlaceholder(s.placeholderMedium);

		const selectBig = new StringSelectMenuBuilder()
			.setCustomId("selectBig")
			.setPlaceholder(s.placeholderBig);

		selectSmall.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(RoosterImage.White.Small.Label)
				.setValue(String(RoosterImage.White.Small.Id))
				.setDescription(RoosterImage.White.Small.Description)
				.setEmoji(RoosterImage.White.Small.EmoteId),
			new StringSelectMenuOptionBuilder()
				.setLabel(RoosterImage.Brown.Small.Label)
				.setValue(String(RoosterImage.Brown.Small.Id))
				.setDescription(RoosterImage.Brown.Small.Description)
				.setEmoji(RoosterImage.Brown.Small.EmoteId),
			new StringSelectMenuOptionBuilder()
				.setLabel(RoosterImage.Black.Small.Label)
				.setValue(String(RoosterImage.Black.Small.Id))
				.setDescription(RoosterImage.Black.Small.Description)
				.setEmoji(RoosterImage.Black.Small.EmoteId),
			new StringSelectMenuOptionBuilder()
				.setLabel(RoosterImage.Gray.Small.Label)
				.setValue(String(RoosterImage.Gray.Small.Id))
				.setDescription(RoosterImage.Gray.Small.Description)
				.setEmoji(RoosterImage.Gray.Small.EmoteId));
		if (user.IsVip()) {
			selectSmall.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(RoosterImage.Green.Small.Label)
					.setValue(String(RoosterImage.Green.Small.Id))
					.setDescription(RoosterImage.Green.Small.Description)
					.setEmoji(RoosterImage.Green.Small.EmoteId),
				new StringSelectMenuOptionBuilder()
					.setLabel(RoosterImage.Owl.Small.Label)
					.setValue(String(RoosterImage.Owl.Small.Id))
					.setDescription(RoosterImage.Owl.Small.Description)
					.setEmoji(RoosterImage.Owl.Small.EmoteId),
				new StringSelectMenuOptionBuilder()
					.setLabel(RoosterImage.Peaky.Small.Label)
					.setValue(String(RoosterImage.Peaky.Small.Id))
					.setDescription(RoosterImage.Peaky.Small.Description)
					.setEmoji(RoosterImage.Peaky.Small.EmoteId),
				new StringSelectMenuOptionBuilder()
					.setLabel(RoosterImage.Jedi.Small.Label)
					.setValue(String(RoosterImage.Jedi.Small.Id))
					.setDescription(RoosterImage.Jedi.Small.Description)
					.setEmoji(RoosterImage.Jedi.Small.EmoteId),
				new StringSelectMenuOptionBuilder()
					.setLabel(RoosterImage.Tenis.Small.Label)
					.setValue(String(RoosterImage.Tenis.Small.Id))
					.setDescription(RoosterImage.Tenis.Small.Description)
					.setEmoji(RoosterImage.Tenis.Small.EmoteId),
				new StringSelectMenuOptionBuilder()
					.setLabel(RoosterImage.Soccer.Small.Label)
					.setValue(String(RoosterImage.Soccer.Small.Id))
					.setDescription(RoosterImage.Soccer.Small.Description)
					.setEmoji(RoosterImage.Soccer.Small.EmoteId),
			);
		}

		if (rooster.Level >= 5) {
			selectMedium.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(RoosterImage.White.Medium.Label)
					.setValue(String(RoosterImage.White.Medium.Id))
					.setDescription(RoosterImage.White.Medium.Description)
					.setEmoji(RoosterImage.White.Medium.EmoteId),
				new StringSelectMenuOptionBuilder()
					.setLabel(RoosterImage.Brown.Medium.Label)
					.setValue(String(RoosterImage.Brown.Medium.Id))
					.setDescription(RoosterImage.Brown.Medium.Description)
					.setEmoji(RoosterImage.Brown.Medium.EmoteId),
				new StringSelectMenuOptionBuilder()
					.setLabel(RoosterImage.Black.Medium.Label)
					.setValue(String(RoosterImage.Black.Medium.Id))
					.setDescription(RoosterImage.Black.Medium.Description)
					.setEmoji(RoosterImage.Black.Medium.EmoteId),
				new StringSelectMenuOptionBuilder()
					.setLabel(RoosterImage.Gray.Medium.Label)
					.setValue(String(RoosterImage.Gray.Medium.Id))
					.setDescription(RoosterImage.Gray.Medium.Description)
					.setEmoji(RoosterImage.Gray.Medium.EmoteId));

			if (user.IsVip()) {
				selectMedium.addOptions(
					new StringSelectMenuOptionBuilder()
						.setLabel(RoosterImage.Green.Medium.Label)
						.setValue(String(RoosterImage.Green.Medium.Id))
						.setDescription(RoosterImage.Green.Medium.Description)
						.setEmoji(RoosterImage.Green.Medium.EmoteId),
					new StringSelectMenuOptionBuilder()
						.setLabel(RoosterImage.Owl.Medium.Label)
						.setValue(String(RoosterImage.Owl.Medium.Id))
						.setDescription(RoosterImage.Owl.Medium.Description)
						.setEmoji(RoosterImage.Owl.Medium.EmoteId),
					new StringSelectMenuOptionBuilder()
						.setLabel(RoosterImage.Peaky.Medium.Label)
						.setValue(String(RoosterImage.Peaky.Medium.Id))
						.setDescription(RoosterImage.Peaky.Medium.Description)
						.setEmoji(RoosterImage.Peaky.Medium.EmoteId),
					new StringSelectMenuOptionBuilder()
						.setLabel(RoosterImage.Jedi.Medium.Label)
						.setValue(String(RoosterImage.Jedi.Medium.Id))
						.setDescription(RoosterImage.Jedi.Medium.Description)
						.setEmoji(RoosterImage.Jedi.Medium.EmoteId),
					new StringSelectMenuOptionBuilder()
						.setLabel(RoosterImage.Tenis.Medium.Label)
						.setValue(String(RoosterImage.Tenis.Medium.Id))
						.setDescription(RoosterImage.Tenis.Medium.Description)
						.setEmoji(RoosterImage.Tenis.Medium.EmoteId),
					new StringSelectMenuOptionBuilder()
						.setLabel(RoosterImage.Soccer.Medium.Label)
						.setValue(String(RoosterImage.Soccer.Medium.Id))
						.setDescription(RoosterImage.Soccer.Medium.Description)
						.setEmoji(RoosterImage.Soccer.Medium.EmoteId),
				);
			}
		}

		if (rooster.Level >= 15) {
			selectBig.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(RoosterImage.White.Big.Label)
					.setValue(String(RoosterImage.White.Big.Id))
					.setDescription(RoosterImage.White.Big.Description)
					.setEmoji(RoosterImage.White.Big.EmoteId),
				new StringSelectMenuOptionBuilder()
					.setLabel(RoosterImage.Brown.Big.Label)
					.setValue(String(RoosterImage.Brown.Big.Id))
					.setDescription(RoosterImage.Brown.Big.Description)
					.setEmoji(RoosterImage.Brown.Big.EmoteId),
				new StringSelectMenuOptionBuilder()
					.setLabel(RoosterImage.Black.Big.Label)
					.setValue(String(RoosterImage.Black.Big.Id))
					.setDescription(RoosterImage.Black.Big.Description)
					.setEmoji(RoosterImage.Black.Big.EmoteId),
				new StringSelectMenuOptionBuilder()
					.setLabel(RoosterImage.Gray.Big.Label)
					.setValue(String(RoosterImage.Gray.Big.Id))
					.setDescription(RoosterImage.Gray.Big.Description)
					.setEmoji(RoosterImage.Gray.Big.EmoteId));

			if (user.IsVip()) {
				selectBig.addOptions(
					new StringSelectMenuOptionBuilder()
						.setLabel(RoosterImage.Green.Big.Label)
						.setValue(String(RoosterImage.Green.Big.Id))
						.setDescription(RoosterImage.Green.Big.Description)
						.setEmoji(RoosterImage.Green.Big.EmoteId),
					new StringSelectMenuOptionBuilder()
						.setLabel(RoosterImage.Owl.Big.Label)
						.setValue(String(RoosterImage.Owl.Big.Id))
						.setDescription(RoosterImage.Owl.Big.Description)
						.setEmoji(RoosterImage.Owl.Big.EmoteId),
					new StringSelectMenuOptionBuilder()
						.setLabel(RoosterImage.Peaky.Big.Label)
						.setValue(String(RoosterImage.Peaky.Big.Id))
						.setDescription(RoosterImage.Peaky.Big.Description)
						.setEmoji(RoosterImage.Peaky.Big.EmoteId),
					new StringSelectMenuOptionBuilder()
						.setLabel(RoosterImage.Jedi.Big.Label)
						.setValue(String(RoosterImage.Jedi.Big.Id))
						.setDescription(RoosterImage.Jedi.Big.Description)
						.setEmoji(RoosterImage.Jedi.Big.EmoteId),
					new StringSelectMenuOptionBuilder()
						.setLabel(RoosterImage.Tenis.Big.Label)
						.setValue(String(RoosterImage.Tenis.Big.Id))
						.setDescription(RoosterImage.Tenis.Big.Description)
						.setEmoji(RoosterImage.Tenis.Big.EmoteId),
					new StringSelectMenuOptionBuilder()
						.setLabel(RoosterImage.Soccer.Big.Label)
						.setValue(String(RoosterImage.Soccer.Big.Id))
						.setDescription(RoosterImage.Soccer.Big.Description)
						.setEmoji(RoosterImage.Soccer.Big.EmoteId),
				);
			}
		}

		const rowSmall = new ActionRowBuilder<StringSelectMenuBuilder>()
			.setComponents(selectSmall);

		const rowMedium = new ActionRowBuilder<StringSelectMenuBuilder>()
			.setComponents(selectMedium);

		const rowBig = new ActionRowBuilder<StringSelectMenuBuilder>()
			.setComponents(selectBig);

		const components = [rowSmall, rowMedium, rowBig].filter(row => row.components[0].options.length > 0);

		const response = await replyInteraction(interaction, {
			embeds: [embed],
			components,
			ephemeral: true,
		});

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.StringSelect,
			time: 60_000,
		});

		collector?.on("collect", async select => {
			if (!rooster) {
				return;
			}

			await rooster.SetImage(Number(select.values[0]));

			embed.setFields([])
				.setDescription(s.descriptionEnd)
				.setThumbnail(rooster.GetImage());

			await removeEmbedComponents(interaction, [embed]);
		});

		collector?.on("end", async () => {
			await removeEmbedComponents(interaction);
		});
	},
};

const Strings = {
	[Language.English]: {
		title: "Mysterious man",
		descriptionStart: "So, do you wanna change how your rooster looks? Heh, let me show you what I can do.",
		roosterLevel5: "Your rooster has reached level 5, so I can make some special treatments!",
		roosterlevel15: "Your rooster has reached level 15! He's all grown up with more options to you to choose.",
		roosterVIP: `\n### ${EmoteString.VIP} Oh, you are a Very Important Person!\n**I can arrange some new options for you.**`,
		footerStart: "Level up your rooster to see more options",
		placeholderSmall: "Select a image of a small rooster",
		placeholderMedium: "Select a image of a medium rooster",
		placeholderBig: "Select a image of a big rooster",
		descriptionEnd: "Look how beautiful it is!",
	},

	[Language.Portuguese]: {
		title: "Homem misterioso",
		descriptionStart: "Então, quererendo mudar o visual do seu galo? KK vou te mostrar o que posso fazer.",
		roosterLevel5: "Seu galo já alcançou o nível 5, então vou te mostrar umas opções especiais!",
		roosterlevel15: "Seu galo alcançou o nível 15! Ele agora tá grandão com mais opções para você escolher",
		roosterVIP: `\n### ${EmoteString.VIP} Ora, ora, se não temos um VIP por aqui...\n**Consigo arrumar umas opções a mais pra você**`,
		footerStart: "Aumente o nível do seu galo para liberar mais opções",
		placeholderSmall: "Selecione uma imagem de um galo pequeno",
		placeholderMedium: "Selecione uma imagem de um galo médio",
		placeholderBig: "Selecione uma imagem de um galo grande",
		descriptionEnd: "Olha como ficou bonitinho!",
	},

	[Language.Spanish]: {
		title: "Hombre misterioso",
		descriptionStart: "Entonces, ¿quieres cambiar el aspecto de tu gallo? Déjame mostrarte lo que puedo hacer.",
		roosterLevel5: "¡Tu gallo ha alcanzado el nivel 5, así que puedo hacerle algunos tratamientos especiales!",
		roosterlevel15: "¡Tu gallo ha alcanzado el nivel 15! Ya ha crecido y ahora tienes más opciones para elegir.",
		roosterVIP: `\n### ${EmoteString.VIP} ¡Oh, eres un VIP!\n**Puedo ofrecerle algunas opciones nuevas.**`,
		footerStart: "Mejora tu gallo para ver más opciones",
		placeholderSmall: "Seleccione una imagen de un gallo pequeño",
		placeholderMedium: "Seleccione una imagen de un gallo mediano",
		placeholderBig: "Selecciona una imagen de un gallo grande",
		descriptionEnd: "Mira que hermosito es",
	},
} as const;