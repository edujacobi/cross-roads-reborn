import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	ComponentType,
	EmbedBuilder,
	Locale,
	MessageComponentInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { removeEmbedComponents, replyInteraction } from "../../utils/logic";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { EmoteString } from "../../utils/emotes";
import { ItemId, ItemList } from "../../models/Item";
import { CrColors } from "../../utils/colors";
import { showTime } from "../../utils/ui";
import { Users } from "../../database/Users";
import { Op } from "sequelize";
import { User } from "../../models/User";
import { Language } from "../../models/Language";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("prison")
		.setDescription("Visit the prison and meet the inmates")
		.setNameLocalization(Locale.PortugueseBR, "prisao")
		.setDescriptionLocalization(Locale.PortugueseBR, "Conheça a prisão e seus presidiários"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];

		const hasJetpack = await user.GetItems().then(items => items.some(item => item.Id === ItemId.Jetpack));

		const baseChance = 20;
		const baseJetpackChance = 30;
		const userChance = hasJetpack ? baseJetpackChance : 0;

		const totalChance = baseChance + userChance;

		let text = `${s.userFree}`;
		if (user.IsEscaping()) {
			text = s.userEscaping(user.Timers.Escape);
		}
		if (user.IsInPrison()) {
			text = s.userPrison(user.Timers.Prison);
		}

		const embed = new CustomEmbedBuilder()
			.setThumbnail("https://media.discordapp.net/attachments/1233604589064818808/1339946455913205871/Prison.png")
			.setDescription(s.description(baseChance, baseJetpackChance + baseChance, language, text))
			.setColor(CrColors.Police)
			.setDefaultFooter(user.Nickname, interaction.user.avatarURL(), `${s.currentChance}: ${totalChance}%`);

		const button = new ButtonBuilder()
			.setCustomId("prisoners")
			.setLabel(s.prisoners)
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(button);

		const response = await replyInteraction(interaction, { embeds: [embed], components: [row] });

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			time: 60_000,
		});

		collector?.on("collect", async btn => {

			if (btn.customId === "prisoners") {
				const prisoners = await getPrisoners();

				const embedPrisoners = new EmbedBuilder()
					.setColor(Colors.DarkButNotBlack)
					.setTitle(s.prisoners);

				if (prisoners.length === 0) {
					embedPrisoners.setDescription(s.empty);
				}

				prisoners.forEach((prisoner, index) => {
					embedPrisoners.addFields({
						name: prisoner.nickname,
						value: `${s.free} ${showTime(new Date(prisoner.prisonTime).getTime(), true)}`,
					});
				});


				await replyInteraction(interaction, { embeds: [embed, embedPrisoners], components: [] });
			}
		});

		collector?.on("end", async () => {
			await removeEmbedComponents(interaction);
		});

	},
};

// Todo melhorar sistema de paginação
async function getPrisoners() {
	return await Users.findAll({
		attributes: ["nickname", "prisonTime"],
		order: [["prisonTime", "DESC"]],
		where: {
			prisonTime: {
				[Op.gt]: new Date(),
			},
		},
	});
}

const Strings = {
	[Language.English]: {
		userFree: "You are free!",
		userEscaping: (timerEscape: Date) => `You are being hunted by the police! You can steal again ${showTime(timerEscape.getTime(), true)}!`,
		userPrison: (timerPrison: Date) => `You are in prison! You will be released ${showTime(timerPrison.getTime(), true)}!`,
		description: (chance: number, jetpackChance: number, language: Language, text: string) => `# Prison
When trying to rob someone and failing, you will be imprisoned for a time determined by your ${EmoteString.Attack}ATK.

-# Being imprisoned limits many of your actions in the game, such as working, investing, betting, scavenging, and of course, stealing.
### ${EmoteString.Scapist} Escape
You have a ${chance}% (${jetpackChance}% if you have a ${ItemList[ItemId.Jetpack].Skin.Default.Emote.String} **${ItemList[ItemId.Jetpack].Description[language]}**) chance of escaping from prison!
### ${EmoteString.Politician} Bribe
The guards are greedy, and the higher your ${EmoteString.Attack}ATK, the more they will ask for! They can also refuse your bribe, but they will keep your money.

-# ${text}`,
		currentChance: "Current chance",
		prisoners: "Prisoners",
		free: "Free",
		empty: "We're kinda empty today...",
	},
	[Language.Portuguese]: {
		userFree: "Você está livre!",
		userEscaping: (timerEscape: Date) => `Você está sendo procurado pela polícia! Poderá roubar novamente ${showTime(timerEscape.getTime(), true)}!`,
		userPrison: (timerPrison: Date) => `Você está preso! Será solto ${showTime(timerPrison.getTime(), true)}!`,
		description: (chance: number, jetpackChance: number, language: Language, text: string) => `# Prisão
Ao tentar roubar alguém e falhar, você será preso por um tempo determinado pelo seu ${EmoteString.Attack}ATK.

-# Estar preso limita muitas de suas ações no jogo, como trabalhar, investir, apostar, vasculhar, e claro, roubar.
### ${EmoteString.Scapist} Fugir
Você tem ${chance}% (${jetpackChance}% se possuir uma ${ItemList[ItemId.Jetpack].Skin.Default.Emote.String} **${ItemList[ItemId.Jetpack].Description[language]}**) de chance de fugir da prisão!
### ${EmoteString.Politician} Subornar
Os guardas são gananciosos, e quanto maior o seu ${EmoteString.Attack}ATK, mais eles pedirão! Eles também podem recusar seu suborno, mas ficarão com seu dinheiro.

-# ${text}`,
		currentChance: "Chance atual",
		prisoners: "Prisioneiros",
		free: "Livre",
		empty: "Estamos meio vazios hoje...",
	},
	[Language.Spanish]: {
		userFree: "¡Estás libre!",
		userEscaping: (timerEscape: Date) => `¡Estás siendo buscado por la policía! ¡Puedes robar de nuevo ${showTime(timerEscape.getTime(), true)}!`,
		userPrison: (timerPrison: Date) => `¡Estás en prisión! ¡Serás liberado ${showTime(timerPrison.getTime(), true)}!`,
		description: (chance: number, jetpackChance: number, language: Language, text: string) => `# Prisión
Al intentar robar a alguien y fallar, serás encarcelado por un tiempo determinado por tu ${EmoteString.Attack}ATK.

-# Estar encarcelado limita muchas de tus acciones en el juego, como trabajar, invertir, apostar, buscar, y por supuesto, robar.
### ${EmoteString.Scapist} Escapar
Tienes un ${chance}% (${jetpackChance}% si tienes un ${ItemList[ItemId.Jetpack].Skin.Default.Emote.String} **${ItemList[ItemId.Jetpack].Description[language]}**) de escapar de la prisión!
### ${EmoteString.Politician} Sobornar
Los guardias son codiciosos, y cuanto mayor sea tu ${EmoteString.Attack}ATK, más te pedirán! También pueden rechazar tu soborno, pero se quedarán con tu dinero.

-# ${text}`,
		currentChance: "Chance actual",
		prisoners: "Prisioneros",
		free: "Libre",
		empty: "Estamos un poco vacíos hoy...",
	},
} as const;