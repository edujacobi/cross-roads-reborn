import { ButtonStyle, ChatInputCommandInteraction, Colors, Locale, SlashCommandBuilder } from "discord.js";
import { Op } from "sequelize";
import { defaultComponent, formatMoney } from "@bot/utils/ui";
import { Users } from "@core/database/Users";
import { User } from "@core/models/User";
import { Language } from "@core/models/Language";
import { ClassList } from "@core/types/Classes";
import { EmoteBadgeString } from "@bot/utils/badges";
import { Pagination } from "@core/models/Pagination";
import { IDescription } from "@core/types/Interfaces";
import { EmoteId, EmoteString } from "@bot/utils/emotes";
import { CustomContainerBuilder } from "@bot/ui/builders/CustomContainerBuilder";
import { CrColors, GangColor } from "@bot/utils/colors";
import Gangs from "@core/database/Gangs";
import { Gang } from "@core/models/Gang";
import { DEFAULT_GANG_IMAGE } from "@bot/ui/builders/GangImageCanvasBuilder";
import { deferReply, replyWithContainer, searchUser } from "@bot/utils/logic";
import { Robbery } from "@core/models/Robbery";
import { BeatUp } from "@core/models/BeatUp";

enum TopSubcommand {
	Money = "money",
	Gamblers = "gamblers",
	Spenders = "spenders",
	Thieves = "thieves",
	Workers = "workers",
	Drunkers = "drunkers",
	Beaters = "beaters",
	Scavengers = "scavengers",
	Hospital = "hospital",
	Bribers = "bribers",
	Escapers = "escapers",
	Gangs = "gangs",
}

interface TopSubcommandConfig {
	attributes: string[];
	orderField: string;
	valueField: string;
	valueModifier?: (value: number, language: Language) => string;
	valuePrefix?: IDescription;
	valueSufix?: IDescription;
	countField?: string;
	countPrefix?: IDescription;
	countSufix?: IDescription;
	badge: string;
	strings: IDescription;
}

interface ITopSubcommandConfig {
	[key: string]: TopSubcommandConfig;
}

module.exports = {
	cooldown: 10,
	data: new SlashCommandBuilder()
		.setName("top")
		.setNameLocalization(Locale.PortugueseBR, "top")
		.setDescription("View various top rankings")
		.setDescriptionLocalization(Locale.PortugueseBR, "Veja vários rankings de top")
		.addSubcommand(money => money
			.setName(TopSubcommand.Money)
			.setNameLocalization(Locale.PortugueseBR, "grana")
			.setDescription("List the top users with money")
			.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários com mais dinheiro"),
		)
		.addSubcommand(gamblers => gamblers
			.setName(TopSubcommand.Gamblers)
			.setNameLocalization(Locale.PortugueseBR, "apostadores")
			.setDescription("List of users who have won the most at the casino")
			.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários que mais ganharam no cassino"),
		)
		.addSubcommand(spenders => spenders
			.setName(TopSubcommand.Spenders)
			.setNameLocalization(Locale.PortugueseBR, "gastadores")
			.setDescription("List the users who spend the most in the shops")
			.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários que mais gastaram nas lojas"),
		)
		.addSubcommand(thieves => thieves
			.setName(TopSubcommand.Thieves)
			.setNameLocalization(Locale.PortugueseBR, "ladroes")
			.setDescription("List the users who stole the most")
			.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários que mais roubaram"),
		)
		.addSubcommand(workers => workers
			.setName(TopSubcommand.Workers)
			.setNameLocalization(Locale.PortugueseBR, "trabalhadores")
			.setDescription("List the users who work the most")
			.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários que mais trabalharam"),
		)
		.addSubcommand(drunkers => drunkers
			.setName(TopSubcommand.Drunkers)
			.setNameLocalization(Locale.PortugueseBR, "bêbados")
			.setDescription("List the users who drank the most")
			.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários que mais beberam"),
		)
		.addSubcommand(beaters => beaters
			.setName(TopSubcommand.Beaters)
			.setNameLocalization(Locale.PortugueseBR, "espancadores")
			.setDescription("List the users who beat up the most")
			.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários que mais espancaram"),
		)
		.addSubcommand(scavengers => scavengers
			.setName(TopSubcommand.Scavengers)
			.setNameLocalization(Locale.PortugueseBR, "vasculhadores")
			.setDescription("List the users who scavenge the most")
			.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários que mais vasculharam"),
		)
		.addSubcommand(hospital => hospital
			.setName(TopSubcommand.Hospital)
			.setNameLocalization(Locale.PortugueseBR, "doentes")
			.setDescription("List the users who paid the most in hospital treatments")
			.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários que mais pagaram por tratamentos no hospital"),
		)
		.addSubcommand(bribers => bribers
			.setName(TopSubcommand.Bribers)
			.setNameLocalization(Locale.PortugueseBR, "subornadores")
			.setDescription("List the users who paid the most in prison bribes")
			.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários que mais pagaram por subornos na prisão"),
		)
		.addSubcommand(escapers => escapers
			.setName(TopSubcommand.Escapers)
			.setNameLocalization(Locale.PortugueseBR, "fujões")
			.setDescription("List the users who escape the most in prison")
			.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários que mais fugiram da prisão"),
		)
		.addSubcommand(gang => gang
			.setName(TopSubcommand.Gangs)
			.setNameLocalization(Locale.PortugueseBR, "gangues")
			.setDescription("List the gangs")
			.setDescriptionLocalization(Locale.PortugueseBR, "Lista as gangues"),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const subcommand = interaction.options.getSubcommand();

		await deferReply(interaction);

		const defaultAttributes = ["nickname", "id", "class"];

		// Define configuration for each subcommand
		const config: ITopSubcommandConfig = {
			[TopSubcommand.Money]: {
				attributes: [...defaultAttributes, "money"],
				orderField: "money",
				valueField: "money",
				valueModifier: formatMoney,
				badge: EmoteBadgeString.Season1.Top1Money,
				strings: {
					[Language.English]: "Money",
					[Language.Portuguese]: "Grana",
					[Language.Spanish]: "Dinero",
				},
			},
			[TopSubcommand.Gamblers]: {
				attributes: [...defaultAttributes, "casinoWinSum", "casinoWinCount"],
				orderField: "casinoWinSum",
				valueField: "casinoWinSum",
				valueModifier: formatMoney,
				countField: "casinoWinCount",
				badge: EmoteBadgeString.Season6.EliteTrader,
				strings: {
					[Language.English]: "Gamblers",
					[Language.Portuguese]: "Apostadores",
					[Language.Spanish]: "Apostadores",
				},
			},
			[TopSubcommand.Spenders]: {
				attributes: [...defaultAttributes, "shopSpentSum", "shopSpentCount"],
				orderField: "shopSpentSum",
				valueField: "shopSpentSum",
				valueModifier: formatMoney,
				countField: "shopSpentCount",
				badge: EmoteBadgeString.Season6.Preppy,
				strings: {
					[Language.English]: "Spenders",
					[Language.Portuguese]: "Gastadores",
					[Language.Spanish]: "Gastadores",
				},
			},
			[TopSubcommand.Thieves]: {
				attributes: [...defaultAttributes, "robberySuccessRobbedSum", "robberySuccessCount"],
				orderField: "robberySuccessRobbedSum",
				valueField: "robberySuccessRobbedSum",
				valueModifier: formatMoney,
				countField: "robberySuccessCount",
				badge: EmoteBadgeString.Season6.SillyHand,
				strings: {
					[Language.English]: "Thieves",
					[Language.Portuguese]: "Ladrões",
					[Language.Spanish]: "Ladrones",
				},
			},
			[TopSubcommand.Workers]: {
				attributes: [...defaultAttributes, "jobReceivedSum", "jobReceivedCount"],
				orderField: "jobReceivedSum",
				valueField: "jobReceivedSum",
				valueModifier: formatMoney,
				countField: "jobReceivedCount",
				badge: EmoteBadgeString.Season6.Workaholic,
				strings: {
					[Language.English]: "Workers",
					[Language.Portuguese]: "Trabalhadores",
					[Language.Spanish]: "Trabajadores",
				},
			},
			// Todo: drunkCount?
			[TopSubcommand.Drunkers]: {
				attributes: [...defaultAttributes, "drunkCount", "drinkNormal", "drinkHappyHour"],
				orderField: "drinkHappyHour",
				valueField: "drinkHappyHour",
				valuePrefix: {
					[Language.English]: "Drank",
					[Language.Portuguese]: "Bebeu",
					[Language.Spanish]: "Bebió",
				},
				valueSufix: {
					[Language.English]: "at Happy Hour",
					[Language.Portuguese]: "no Happy Hour",
					[Language.Spanish]: "en Happy Hour",
				},
				countField: "drunkCount",
				countPrefix: {
					[Language.English]: "Drunk",
					[Language.Portuguese]: "Bêbado",
					[Language.Spanish]: "Bebido",
				},
				countSufix: {
					[Language.English]: "times",
					[Language.Portuguese]: "vezes",
					[Language.Spanish]: "veces",
				},
				badge: EmoteString.Idle,
				strings: {
					[Language.English]: "Drunkers",
					[Language.Portuguese]: "Bêbados",
					[Language.Spanish]: "Bebedores",
				},
			},
			[TopSubcommand.Beaters]: {
				attributes: [...defaultAttributes, "beatUpSuccessCount", "beatUpBeatedUpCount"],
				orderField: "beatUpSuccessCount",
				valueField: "beatUpSuccessCount",
				valuePrefix: {
					[Language.English]: "Beated",
					[Language.Portuguese]: "Espancou",
					[Language.Spanish]: "Golpeó",
				},
				countField: "beatUpBeatedUpCount",
				countPrefix: {
					[Language.English]: "Was beated",
					[Language.Portuguese]: "Foi espancado",
					[Language.Spanish]: "Fue golpeado",
				},
				badge: EmoteBadgeString.Season6.HeadSmasher,
				strings: {
					[Language.English]: "Beaters",
					[Language.Portuguese]: "Espancadores",
					[Language.Spanish]: "Golpeadores",
				},
			},
			[TopSubcommand.Scavengers]: {
				attributes: [...defaultAttributes, "scavengeFoundTotal", "scavengeCount"],
				orderField: "scavengeFoundTotal",
				valueField: "scavengeFoundTotal",
				valuePrefix: {
					[Language.English]: "Found",
					[Language.Portuguese]: "Encontrou",
					[Language.Spanish]: "Encontró",
				},
				countField: "scavengeCount",
				countSufix: {
					[Language.English]: "attempts",
					[Language.Portuguese]: "tentativas",
					[Language.Spanish]: "intentos",
				},
				badge: EmoteBadgeString.Season6.SherlockHolmes,
				strings: {
					[Language.English]: "Scavengers",
					[Language.Portuguese]: "Vasculhadores",
					[Language.Spanish]: "Buscadores",
				},
			},
			[TopSubcommand.Hospital]: {
				attributes: [...defaultAttributes, "hospitalTreatmentSum", "hospitalTreatmentCount"],
				orderField: "hospitalTreatmentSum",
				valueField: "hospitalTreatmentSum",
				valueModifier: formatMoney,
				countField: "hospitalTreatmentCount",
				badge: EmoteBadgeString.Season6.Hypochondriac,
				strings: {
					[Language.English]: "Hospital",
					[Language.Portuguese]: "Doentes",
					[Language.Spanish]: "Enfermos",
				},
			},
			[TopSubcommand.Bribers]: {
				attributes: [...defaultAttributes, "prisonBriberySum", "prisonBriberyCount"],
				orderField: "prisonBriberySum",
				valueField: "prisonBriberySum",
				valueModifier: formatMoney,
				countField: "prisonBriberyCount",
				badge: EmoteBadgeString.Season6.Politician,
				strings: {
					[Language.English]: "Bribers",
					[Language.Portuguese]: "Subornadores",
					[Language.Spanish]: "Sobornadores",
				},
			},
			[TopSubcommand.Escapers]: {
				attributes: [...defaultAttributes, "escapeCount", "prisonCount"],
				orderField: "escapeCount",
				valueField: "escapeCount",
				valuePrefix: {
					[Language.English]: "Escaped",
					[Language.Portuguese]: "Fugiu",
					[Language.Spanish]: "Encontró",
				},
				valueSufix: {
					[Language.English]: "times",
					[Language.Portuguese]: "vezes",
					[Language.Spanish]: "veces",
				},
				countField: "prisonCount",
				countPrefix: {
					[Language.English]: "Inprisoned",
					[Language.Portuguese]: "Preso",
					[Language.Spanish]: "Encarcelado",
				},
				countSufix: {
					[Language.English]: "times",
					[Language.Portuguese]: "vezes",
					[Language.Spanish]: "veces",
				},
				badge: EmoteBadgeString.Season6.Escapist,
				strings: {
					[Language.English]: "Escapers",
					[Language.Portuguese]: "Fujões",
					[Language.Spanish]: "Fugitivos",
				},
			},
			[TopSubcommand.Gangs]: {
				attributes: ["id"],
				orderField: "level",
				valueField: "level",
				badge: EmoteBadgeString.Season6.TopGang,
				valuePrefix: {
					[Language.English]: "Leader",
					[Language.Portuguese]: "Líder",
					[Language.Spanish]: "Líder",
				},
				countPrefix: {
					[Language.English]: "Level",
					[Language.Portuguese]: "Nível",
					[Language.Spanish]: "Nivel",
				},
				strings: {
					[Language.English]: "Gangs",
					[Language.Portuguese]: "Gangues",
					[Language.Spanish]: "Cuadrillas",
				},
			},
		};

		const s = Strings[language];

		// Get the configuration for the current subcommand
		const currentConfig = config[subcommand];
		const title = currentConfig.strings[language];

		let users: Users[] = [];
		let gangs: Gang[] = [];
		const pagination = new Pagination(interaction, language);

		async function findList() {
			users = await Users.findAll({
				attributes: currentConfig.attributes,
				limit: pagination.Limit,
				order: [[currentConfig.orderField, "DESC"]],
				offset: pagination.Offset,
				where: {
					[currentConfig.orderField]: {
						[Op.gt]: 0,
					},
				},
			});
		}

		async function findGangs() {
			const list = await Gangs.findAll({
				attributes: currentConfig.attributes,
				order: [[currentConfig.orderField, "DESC"], ["experience", "DESC"]],
				limit: pagination.Limit,
				offset: pagination.Offset,
				where: {
					[currentConfig.orderField]: {
						[Op.gt]: 0,
					},
				},
			});

			gangs = [];

			for (const g of list) {
				const gang = await Gang.GetBasicById(g.id);
				if (!gang) {
					continue;
				}
				gangs.push(gang);
			}

			return gangs;
		}

		async function getTextFromIndex(i: number) {
			const user = users[i];
			const underscore = user.id == interaction.user.id ? "__" : "";
			const emoteClass = ClassList[user.class].Image.Emote.String;

			const position = i + pagination.Offset + 1;
			let positionText = `\`${position}.\``;
			if (i + pagination.Offset == 0) {
				positionText = currentConfig.badge;
			}
			// Special case for money ranking which has badges for top 3
			if (subcommand === TopSubcommand.Money) {
				if (i + pagination.Offset == 1) {
					positionText = EmoteBadgeString.Season1.Top2Money;
				}
				else if (i + pagination.Offset == 2) {
					positionText = EmoteBadgeString.Season1.Top3Money;
				}
			}

			const userGang = await Gang.GetByUserId(user.id);
			const gPrefix = userGang ? `[${userGang.Acronym}]` : "";
			const gSufix = userGang ? GangColor[userGang.Color].Emote.String : "";

			const value = user[currentConfig.valueField as keyof Users] as number;
			const valueModified = currentConfig.valueModifier ? currentConfig.valueModifier(value, language) : value;

			const vPrefix = currentConfig.valuePrefix ? `${currentConfig.valuePrefix[language]} ` : "";
			const vSufix = currentConfig.valueSufix ? ` ${currentConfig.valueSufix[language]}` : "";
			const cPrefix = currentConfig.countPrefix ? `${currentConfig.countPrefix[language]} ` : "";
			const cSufix = currentConfig.countSufix ? ` ${currentConfig.countSufix[language]}` : "";

			const count = currentConfig.countField ? ` (${cPrefix}${user[currentConfig.countField as keyof Users]}${cSufix})` : "";

			return [
				`### ${positionText} ${gPrefix} ${emoteClass} ${underscore}${user.nickname}${underscore}${gSufix}`,
				`${vPrefix}${valueModified}${vSufix}${count}`,
				`-# \`ID: ${user.id}\``,
			].join("\n");
		}

		if (subcommand === TopSubcommand.Gangs) {
			pagination.HowManyRecords = await Gangs.count();
		}
		else {
			pagination.HowManyRecords = await Users.count({
				where: {
					[currentConfig.orderField]: {
						[Op.gt]: 0,
					},
				},
			});
		}

		if (subcommand === TopSubcommand.Gangs) {
			pagination.CustomizeContainer = async () => {
				await findGangs();

				const container = new CustomContainerBuilder()
					.setUser(user)
					.setAccentColor(Colors.Green)
					.addTexts([
						`# Ranking ${title}`,
					])
					.addLargeSeparator();

				for (let i = 0; i < gangs.length; i++) {
					const gang = gangs[i];
					const underscore = gang.Id == user.GangId ? "__" : "";

					const position = i + pagination.Offset + 1;
					let positionText = `\`${position}.\``;
					if (i + pagination.Offset == 0) {
						positionText = currentConfig.badge;
					}

					const level = currentConfig.countPrefix?.[language] ?? "";
					const leader = currentConfig.valuePrefix?.[language] ?? "";

					const leaderUser = await User.Search(gang.LeaderId);

					if (!leaderUser) {
						continue;
					}

					container
						.addSectionComponents(list => list
							.addTexts([
								`### ${positionText} ${underscore}[${gang.Acronym}] ${gang.Name}${underscore}${GangColor[gang.Color].Emote.String}`,
								`-# ${level} ${gang.Level}`,
								`-# ${gang.GetExpBar(6, language)}`,
								`-# ${leader}: **${leaderUser.GetNameWithImage()}**`,
							])
							.setThumbnailAccessory(thumb => thumb
								.setURL(gang.Image || DEFAULT_GANG_IMAGE),
							),
						);

					if (i != gangs.length - 1) {
						container.addLargeSeparator();
					}
				}

				return container;
			};
		}
		else {
			pagination.CustomizeContainer = async () => {
				await findList();

				const container = new CustomContainerBuilder()
					.setUser(user)
					.setAccentColor(Colors.Green)
					.addTexts([
						`# Ranking ${title}`,
					])
					.addLargeSeparator();

				for (let i = 0; i < users.length; i++) {
					const text = await getTextFromIndex(i);
					const position = i + pagination.Offset + 1;

					container
						.addSectionComponents(list => list
							.addTexts([
								text,
							])
							.setButtonAccessory(btn => btn
								.setLabel(s.options)
								.setCustomId("position" + position)
								.setStyle(ButtonStyle.Secondary),
							),
						);

					if (i != users.length - 1) {
						container.addLargeSeparator();
					}
				}

				return container;
			};
		}

		const { collector } = await pagination.GenerateContainer();

		let position: number;

		collector?.on("collect", async btn => {
			if (btn.customId.includes("position")) {
				const positionId = Number(btn.customId.replace("position", ""));
				position = (positionId - 1) % pagination.Limit;

				const text = await getTextFromIndex(position);

				const newContainer = new CustomContainerBuilder()
					.setUser(user)
					.setAccentColor(CrColors.Default)
					.addTexts([
						`# Ranking ${title}`,
					])
					.addLargeSeparator()
					.addTexts([
						text,
					])
					.addLargeSeparator()
					.addButtonRow(
						btn => btn
							.setLabel(s.goback)
							.setCustomId("goback")
							.setStyle(ButtonStyle.Secondary),
						btn => btn
							.setLabel(s.rob)
							.setEmoji(EmoteId.Robbery)
							.setCustomId("rob")
							.setStyle(ButtonStyle.Secondary),
						btn => btn
							.setLabel(s.beat)
							.setEmoji(EmoteId.Beat)
							.setCustomId("beat")
							.setStyle(ButtonStyle.Secondary),
					)
					.addFooter();

				await replyWithContainer(interaction, newContainer);
			}

			else if (btn.customId === "rob") {
				const target = await searchUser(users[position].id, interaction);
				if (!target) {
					return;
				}

				const robbery = new Robbery(user, target);

				const { canRob, message } = await robbery.CanRobUser();

				if (!canRob) {
					const container = defaultComponent({
						user,
						color: CrColors.Robbery,
						description: message,
					});

					return replyWithContainer(interaction, container);
				}

				await robbery.GetDiscordUser();

				await robbery.StartRobbery(interaction);

			}

			else if (btn.customId === "beat") {
				const target = await searchUser(users[position].id, interaction);
				if (!target) {
					return;
				}

				const beatUp = new BeatUp(user, target);

				const { canBeat, message } = await beatUp.CanBeatUser();

				if (!canBeat) {
					const container = defaultComponent({
						user,
						color: CrColors.BeatUp,
						description: message,
					});

					return replyWithContainer(interaction, container);
				}

				await beatUp.GetDiscordUser();

				await beatUp.StartBeating(interaction);

			}

			else if (btn.customId === "goback") {
				const container = await pagination.BuildContainerWithRow();
				return replyWithContainer(interaction, container);
			}

		});
	},
};

const Strings = {
	[Language.English]: {
		options: "Options",
		rob: "Rob",
		beat: "Beat",
		goback: "Go back",
	},
	[Language.Portuguese]: {
		options: "Opções",
		rob: "Roubar",
		beat: "Espancar",
		goback: "Voltar",
	},
	[Language.Spanish]: {
		options: "Opciones",
		rob: "Robar",
		beat: "Golpear",
		goback: "Volver",
	},
} as const;