import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction, Colors,
	ComponentType,
	Locale,
	MessageComponentInteraction,
	SlashCommandBuilder,
	SlashCommandUserOption,
} from "discord.js";
import { checkRooster, checkUser, removeEmbedComponents, replyInteraction } from "../../utils/logic";
import { EmoteString, formatDate, getRarityColor } from "../../utils/ui";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { getLanguageFromLocale, Language } from "../../models/Language";

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName("rooster")
		.setDescription("See the rooster of an user")
		.setNameLocalization(Locale.PortugueseBR, "galo")
		.setDescriptionLocalization(Locale.PortugueseBR, "Visualize o galo de um usuário")
		.addUserOption((option: SlashCommandUserOption) =>
			option
				.setName("target")
				.setDescription("The user's rooster to show")
				.setNameLocalization(Locale.PortugueseBR, "alvo")
				.setDescriptionLocalization(Locale.PortugueseBR, "O dono do galo para mostrar"),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const target = interaction.options.getUser("target") ?? interaction.user;

		const user = await checkUser(interaction.user.id, interaction);

		if (!user) {
			return;
		}

		const rooster = await checkRooster(target.id, interaction);

		if (!rooster) {
			return;
		}

		const s = Strings[user.Language];
		const s2 = Strings[getLanguageFromLocale(interaction.locale)];

		const values = await rooster.GenerateEmbedValues();

		const embedRooster = new CustomEmbedBuilder()
			.setAuthor({
				name: s.roosterOf(target.displayName),
				iconURL: target.avatarURL() ?? undefined,
			})
			.setColor(getRarityColor(rooster.Rarity))
			.setThumbnail(rooster.GetImage())
			.setDescription(values.description.small)
			.setDefaultFooter(interaction, s.roosterFooter(rooster.Level, rooster.Exp, rooster.GetExpNeededToLevelUp(), values.train.small));

		const buttonLessInfo = new ButtonBuilder()
			.setCustomId("lessInfo")
			.setLabel(s.lessInfo)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("➖");

		const buttonMoreInfo = new ButtonBuilder()
			.setCustomId("moreInfo")
			.setLabel(s.moreInfo)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("➕");

		const buttonChampionship = new ButtonBuilder()
			.setCustomId("championship")
			.setLabel(s.championshipTitle)
			.setStyle(ButtonStyle.Success)
			.setEmoji(EmoteString.CampeaoCanja);

		const rowRooster = new ActionRowBuilder<ButtonBuilder>()
			.setComponents([buttonMoreInfo, buttonChampionship]);

		const response = await replyInteraction(interaction, { embeds: [embedRooster], components: [rowRooster] });

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			time: 60_000,
		});

		collector?.on("collect", async btn => {
			if (!rooster) {
				return;
			}

			if (btn.customId === "moreInfo") {
				embedRooster
					.setDescription(values.description.big)
					.setDefaultFooter(interaction, s.roosterFooterMore(formatDate(rooster.BirthDate)));

				rowRooster.setComponents([buttonLessInfo, buttonChampionship]);

				await btn.update({ embeds: [embedRooster], components: [rowRooster] });

			}
			else if (btn.customId === "lessInfo") {

				embedRooster
					.setDescription(values.description.small)
					.setDefaultFooter(interaction, s.roosterFooter(rooster.Level, rooster.Exp, rooster.GetExpNeededToLevelUp(), values.train.small));

				rowRooster.setComponents([buttonMoreInfo, buttonChampionship]);

				await btn.update({ embeds: [embedRooster], components: [rowRooster] });
			}
			else if (btn.customId === "championship") {
				const embedChampionship = new CustomEmbedBuilder()
					.setTitle(s2.championshipTitle)
					.setColor(Colors.Yellow)
					.setImage("https://s4.ezgif.com/tmp/ezgif-46023f595c4e0.gif")
					.setDescription(s2.championshipDescription);

				buttonChampionship.setDisabled(true);

				await btn.update({ embeds: [embedRooster, embedChampionship], components: [rowRooster] });
			}
		});

		collector?.on("end", async () => {
			await removeEmbedComponents(interaction);
		});
	},
};

const Strings = {
	[Language.English]: {
		roosterOf: (name: string) => `Rooster of ${name}`,
		roosterFooter: (level: number, exp: number, expNeeded: number, train: string) => `Level: ${level} (${exp}/${expNeeded}) ${train}`,
		roosterFooterMore: (birthDate: string) => `Born ${birthDate}`,
		lessInfo: "Less info",
		moreInfo: "More info",
		championshipTitle: "Announcement",
		championshipDescription: `# ${EmoteString.CampeaoCanja} Cross City Cup\n` +
			"The Cross City Hall has just dropped a bombshell that is already stirring the streets and causing a stir among lovers of the great cockfight!\n" +
			"## The long-awaited 2nd Edition of the Cross City Cup has been officially announced! \n" +
			"\n" +
			"Posters and banners are already being spread all over the city, bringing the competition's flame to every corner. People are talking, trainers are preparing, and the roosters can already feel the tension in the air... and the big news?\n" +
			"\n" +
			"The tournament will be held at the **Conmegalo Arena**, specially provided for this grand event! A stage worthy of the greatest warriors, where only the strongest will write their names in history!\n" +
			"\n" +
			"The Cup will start in **02/12/2025!**\n" +
			"### [Join the official server to participate](https://discord.com/invite/sNf8avn)\n" +
			"-# Registrations and further details will be revealed soon, stay tuned!",
	},

	[Language.Portuguese]: {
		roosterOf: (name: string) => `Galo de ${name}`,
		roosterFooter: (level: number, exp: number, expNeeded: number, train: string) => `Nível: ${level} (${exp}/${expNeeded}) ${train}`,
		roosterFooterMore: (birthDate: string) => `Nascido em ${birthDate}`,
		lessInfo: "Menos informações",
		moreInfo: "Mais informações",
		championshipTitle: "Anúncio",
		championshipDescription: `# ${EmoteString.CampeaoCanja} Taça Cidade da Cruz\n` +
			"A Prefeitura da Cruz acaba de soltar uma bomba que já está movimentando as ruas e causando alvoroço entre os amantes da grande rinha!\n" +
			"## A tão esperada 2ª Edição da Taça Cidade da Cruz foi oficialmente anunciada! \n" +
			"\n" +
			"Posters e banners já estão sendo espalhados por toda a cidade, levando a chama da competição a cada canto. O povo comenta, os treinadores se preparam e os galos já sentem a tensão no ar... e a grande novidade?\n" +
			"\n" +
			"O torneio será realizado na **Arena Conmegalo**, cedida especialmente para este grandioso evento! Um palco digno dos maiores guerreiros, onde apenas os mais fortes escreverão seus nomes na história!\n" +
			"\n" +
			"A Copa irá começar no dia **12/02/2025!**\n" +
			"### [Entre no servidor oficial para participar!](https://discord.com/invite/sNf8avn)\n" +
			"-# Inscrições e demais detalhes serão revelados em breve, mantenha-se atento!",
	},

	[Language.Spanish]: {
		roosterOf: (name: string) => `Gallo de ${name}`,
		roosterFooter: (level: number, exp: number, expNeeded: number, train: string) => `Nivel: ${level} (${exp}/${expNeeded}) ${train}`,
		roosterFooterMore: (birthDate: string) => `Nacido en ${birthDate}`,
		lessInfo: "Menos información",
		moreInfo: "Más información",
		championshipTitle: "Únete al servidor oficial!",
		championshipDescription: `# ${EmoteString.CampeaoCanja} Copa Ciudad de la Cruz\n` +
			"¡La Municipalidad de la Cruz acaba de lanzar una bomba que ya está agitando las calles y causando revuelo entre los amantes de la gran pelea de gallos!\n" +
			"## La tan esperada 2ª Edición de la Copa Ciudad de la Cruz ha sido oficialmente anunciada!\n" +
			"\n" +
			"Pósteres y pancartas ya están siendo distribuidos por toda la ciudad, llevando la llama de la competencia a cada rincón. La gente comenta, los entrenadores se preparan y los gallos ya sienten la tensión en el aire... ¿y la gran noticia?\n" +
			"\n" +
			"¡El torneo se realizará en la **Arena-Conmegalo**, especialmente cedida para este gran evento! ¡Un escenario digno de los más grandes guerreros, donde solo los más fuertes escribirán sus nombres en la historia!\n" +
			"\n" +
			"La Copa comenzará el **12/02/2025!**\n" +
			"### [Únete al servidor oficial para participar!](https://discord.com/invite/sNf8avn)\n" +
			"Las inscripciones y demás detalles serán revelados pronto, ¡mantente atento!",
	},
} as const;