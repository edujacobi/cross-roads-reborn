import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { createButtonCollector, disableButtons } from "#bot/utils/collectors";
import { CrColors } from "#bot/utils/colors";
import { deferReply, deferUpdate, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteString } from "#bot/utils/emotes";
import { formatMoney, showTime } from "#bot/utils/ui";
import { Users } from "#core/database/Users";
import { BlackMarket } from "#core/models/BlackMarket";
import { Event, EventType } from "#core/models/Event";
import { globalStrings, Language, type Localization } from "#core/models/Language";
import type { User } from "#core/models/User";
import { ClassList, getJobClassModifier } from "#core/types/Classes";
import { getItemList, ItemList } from "#core/types/Items";
import { getJobList, type JobId, JobList, type Jobs } from "#core/types/Jobs";
import { LocationList } from "#core/types/Locations";
import { type ScavengeId, ScavengeList } from "#core/types/Scavenge";
import { ButtonStyle, type ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("jobs")
		.setDescription("Open the job list to work")
		.setNameLocalization(Locale.PortugueseBR, "trabalhos")
		.setDescriptionLocalization(Locale.PortugueseBR, "Abra a lista de trabalhos para ter um emprego"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		await deferReply(interaction);

		const s = Strings[language];

		let currentPage = 0;

		function addHeader(container = new CustomContainerBuilder()) {
			container
				.setUser(user)
				.setAccentColor(CrColors.Jobs)
				.addSectionComponents(header => header
					.addTexts([
						`# ${s.title}`,
						s.description,
					])
					.setThumbnailAccessory(thumb => thumb
						.setURL("https://media.discordapp.net/attachments/1233604589064818808/1337166947250602047/Trabalhos2.png"),
					),
				);

			container.addLargeSeparator();

			return container;
		}

		const blackMarket = new BlackMarket(user);

		const { isOpen } = blackMarket.IsBlackMarketOpen();

		const jobList = (isOpen ? getJobList() : getJobList().filter(jobs => !jobs.Special))
			.sort((a, b) => Number(a.Special) - Number(b.Special));

		const eventActiveValue = await Event.GetActiveFromType(EventType.JOB_TIME_MULTIPLIER);

		const pages: Jobs[][] = [];
		for (let i = 0; i < jobList.length; i += 6) {
			pages.push(jobList.slice(i, i + 6));
		}

		async function generateDefaultContainer() {
			await user.GetInfo();

			const container = addHeader();

			const currentPageJobs = pages[currentPage] || [];

			const userClassModifier = getJobClassModifier(user.Class);

			for (let i = 0; i < currentPageJobs.length; i++) {
				const job = currentPageJobs[i];
				const weaponsNeeded = getItemList().filter(item => job.NeedItem?.includes(item.Id));
				const jobDuration = job.Duration * eventActiveValue;
				const jobSalary = Math.round(job.Salary * userClassModifier);
				const hasAllItems = job.NeedItem?.every(neededItem => user.Items.some(userItem => userItem.Id === neededItem));

				const textSalary = `${s.salary}: ${formatMoney(jobSalary, language)}`;
				const textDuration = `${s.duration}: ${jobDuration}h`;
				const textNeeded = weaponsNeeded.length ? `\n-# ${s.necessary}:\n## ${weaponsNeeded.map(weapon => user.GetItemSkin(weapon)).join(" ")}` : "";
				const blackMarketText = job.Special ? ` • ${EmoteString.BlackMarket} ${s.blackMarket}` : "";

				container.addSectionComponents(section => section
					.addTexts([
						`### ${job.Description[language]}`,
						`${textSalary} • ${textDuration}${blackMarketText}${textNeeded}`,
					])
					.setButtonAccessory(btn => btn
						.setLabel(s.start)
						.setDisabled(!user.IsIdling())
						.setStyle(job.NeedItem && !hasAllItems ? ButtonStyle.Secondary : ButtonStyle.Success)
						.setCustomId(`start${job.Id}`)),
				);

				if (i != currentPageJobs.length - 1) {
					container.addLargeSeparator();
				}
			}

			if (pages.length > 1) {
				container
					.addLargeSeparator()
					.addButtonRow(
						btn => btn
							.setLabel(s.previous)
							.setStyle(ButtonStyle.Secondary)
							.setCustomId("previous")
							.setEmoji("⬅️")
							.setDisabled(currentPage === 0),
						btn => btn
							.setLabel(s.next)
							.setStyle(ButtonStyle.Secondary)
							.setCustomId("next")
							.setEmoji("➡️")
							.setDisabled(currentPage === pages.length - 1),
					);
			}

			if (user.IsWorking()) {
				const job = JobList[user.Job.Id!];
				const jobDuration = job.Duration * eventActiveValue;
				const jobSalary = Math.round(job.Salary * userClassModifier);

				container
					.addLargeSeparator()
					.addSectionComponents(working => working
						.addTexts([
							s.workingOn(user.Job.Id!, user.Job.EndsIn),
							`-# ${s.salary}: ${formatMoney(jobSalary, language)} • ${s.duration}: ${jobDuration}h`,
						])
						.setButtonAccessory(btn => btn
							.setCustomId("stop")
							.setLabel(s.stop)
							.setStyle(ButtonStyle.Danger),
						),
					);
			}

			container.addFooter({
				text: formatMoney(user.Money, language),
			});

			return container;
		}

		let container = await generateDefaultContainer();

		const response = await replyWithContainer(interaction, container);

		const collector = createButtonCollector(interaction, response);

		collector?.on("collect", async btn => {
			await deferUpdate(btn);

			if (btn.customId.includes("start")) {
				await user.GetInfo();
				const userClassModifier = getJobClassModifier(user.Class);

				const jobId = Number(btn.customId.replace("start", ""));
				const job = JobList[jobId];

				const hasAllItems = job.NeedItem?.every(neededItem => user.Items.some(userItem => userItem.Id === neededItem));

				let textResponse = "";

				container = addHeader();

				// TODO: This should be in Model.
				if (user.IsWorking()) {
					textResponse = s.workingOn(user.Job.Id!, user.Job.EndsIn);
				}
				else if (user.IsScavenging()) {
					textResponse = s.userScavenge(user.Scavenge.IsScavengingId!);
				}
				else if (user.IsInPrison()) {
					textResponse = s.userPrison(user.Prison.Time);
				}
				else if (user.IsInHospital()) {
					textResponse = s.userHospital(user.Hospital.Time);
				}
				else if (user.IsInCasinoGame()) {
					textResponse = s.userCasino;
				}
				else if (user.BeatUp.IsBeatingId) {
					const u = await Users.findByPk(user.BeatUp.IsBeatingId, { attributes: ["class", "nickname"] });
					textResponse = `${s.userIsBeatingId(`${ClassList[u!.class].Image.Emote.String} ${u!.nickname!}`)} ${EmoteString.Beat}`;
				}
				else if (user.BeatUp.IsBeingBeatUpById) {
					const u = await Users.findByPk(user.BeatUp.IsBeingBeatUpById, { attributes: ["class", "nickname"] });
					textResponse = `${s.userIsBeingBeatedId(`${ClassList[u!.class].Image.Emote.String} ${u!.nickname!}`)} ${EmoteString.Beat}`;
				}
				else if (user.Robbery.IsRobbingId) {
					const u = await Users.findByPk(user.Robbery.IsRobbingId, { attributes: ["class", "nickname"] });
					textResponse = `${s.userIsRobbingId(`${ClassList[u!.class].Image.Emote.String} ${u!.nickname!}`)} ${EmoteString.Robbery}`;
				}
				else if (user.Robbery.IsBeingRobbedById) {
					const u = await Users.findByPk(user.Robbery.IsBeingRobbedById, { attributes: ["class", "nickname"] });
					textResponse = `${s.userIsBeingRobbingId(`${ClassList[u!.class].Image.Emote.String} ${u!.nickname!}`)} ${EmoteString.Robbery}`;
				}
				else if (user.Robbery.IsRobbingLocationId !== null) {
					const location = LocationList[user.Robbery.IsRobbingLocationId];
					textResponse = `${s.userIsRobbingId(location.Name[language])} ${EmoteString.Robbery}`;
				}
				else if (user.IsDefendingInvestment()) {
					textResponse = globalStrings[language].attackerIsDefendingInvestment;
				}
				else if (user.IsParticipatingInGangAction()) {
					textResponse = globalStrings[language].attackerIsParticipatingInGangAction;
				}
				else if (job.NeedItem && !hasAllItems) {
					const neededItems = job.NeedItem
						.filter(neededItem => !user.Items.some(userItem => userItem.Id === neededItem))
						.map(neededItem => `${user.GetItemSkin(ItemList[neededItem])} ${ItemList[neededItem].Description[language]}`)
						.join(", ");

					textResponse = s.withoutItems(job.Description[language], neededItems);
				}

				if (textResponse != "") {
					container
						.addTexts([textResponse])
						.addButtonRow(btn => btn
							.setLabel(s.back)
							.setStyle(ButtonStyle.Secondary)
							.setCustomId("back"),
						)
						.addFooter({
							text: formatMoney(user.Money, language),
						});


					return replyWithContainer(interaction, container);
				}

				const jobDuration = job.Duration * eventActiveValue;
				const jobSalary = Math.round(job.Salary * userClassModifier);

				await user.StartJob(job.Id);

				container
					.addTexts([
						s.jobStarted(job.Description[language], user.Job.EndsIn),
					])
					.addButtonRow(btn => btn
						.setCustomId("stop")
						.setLabel(s.stop)
						.setStyle(ButtonStyle.Danger),
					)
					.addFooter({
						text: `${s.salary}: ${formatMoney(jobSalary, language)} • ${s.duration}: ${jobDuration}h`,
					});

				return replyWithContainer(interaction, container);
			}

			else if (btn.customId === "stop") {
				await user.GetInfo();

				container = addHeader();

				if (user.Job.Id === null) {
					container
						.addTexts([s.cannotStop])
						.addButtonRow(btn => btn
							.setCustomId("back")
							.setLabel(s.viewJobs)
							.setStyle(ButtonStyle.Secondary),
						)
						.addFooter({
							text: formatMoney(user.Money, language),
						});

					return replyWithContainer(interaction, container);
				}

				const job = JobList[user.Job.Id];
				await user.CancelJob();

				container
					.addTexts([
						`${s.stopped} **${job.Description[language]}**`,
					])
					.addButtonRow(btn => btn
						.setCustomId("back")
						.setLabel(s.viewJobs)
						.setStyle(ButtonStyle.Secondary),
					)
					.addFooter({
						text: formatMoney(user.Money, language),
					});

				return replyWithContainer(interaction, container);
			}

			else if (btn.customId === "previous") {
				currentPage -= 1;
				container = await generateDefaultContainer();
				return replyWithContainer(interaction, container);
			}
			else if (btn.customId === "next") {
				currentPage += 1;
				container = await generateDefaultContainer();
				return replyWithContainer(interaction, container);
			}
			else if (btn.customId === "back") {
				container = await generateDefaultContainer();
				return replyWithContainer(interaction, container);
			}
		});

		collector?.on("end", async () => {
			await disableButtons(interaction, container);
		});
	},
};

const Strings = {
	[Language.English]: {
		idling: "Idling",
		userDefending: `You're defending your investment! ${EmoteString.InvestmentActive}`,
		userParticipating: `You're participating in a gang action! ${EmoteString.Gang}`,
		title: "Jobs",
		description: "You cannot bet, steal or search while working!",
		userPrison: (timerPrison: Date) => `You are in prison! ${EmoteString.Prison}\n-# You will be released ${showTime(timerPrison.getTime(), true)}`,
		userHospital: (timerHospital: Date) => `You are hospitalized ${EmoteString.Hospital}\n-# You will be attended ${showTime(timerHospital.getTime(), true)}`,
		userCasino: `You are playing in casino! ${EmoteString.Casino}`,
		userIsBeatingId: (nick: string) => `You're already beating **${nick}**!`,
		userIsBeingBeatedId: (nick: string) => `You're being beated by **${nick}!`,
		userIsRobbingId: (nick: string) => `You're already robbing **${nick}**!`,
		userIsBeingRobbingId: (nick: string) => `You're being robbed by **${nick}**!`,
		workingOn: (jobId: JobId, jobTime: Date) => `You are working as **${JobList[jobId].Description[Language.English]}**\n-# Will finish ${showTime(jobTime.getTime(), true)}`,
		userScavenge: (placeId: ScavengeId) => `You are scavenging ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.English]}**!`,
		stop: "Stop job",
		cannotStop: "You can't stop what you didn't start.",
		stopped: "You stopped your job of",
		salary: "Salary",
		duration: "Duration",
		necessary: "Necessary",
		next: "Next",
		previous: "Previous",
		back: "Go back",
		viewJobs: "View jobs",
		start: "Start",
		blackMarket: "Black Market Job",
		withoutItems: (jobDescription: string, neededItems: string) => `You don't have the necessary items to start working as **${jobDescription}**\n-# You need ${neededItems}`,
		jobStarted: (jobDescription: string, jobTime: Date) => `You started working as **${jobDescription}**\n-# Will finish ${showTime(jobTime.getTime(), true)}`,
	},
	[Language.Portuguese]: {
		idling: "Vadiando",
		userDefending: `Você está defendendo seu investimento! ${EmoteString.InvestmentActive}`,
		userParticipating: `Você está participando de uma ação de gangue! ${EmoteString.Gang}`,
		title: "Trabalhos",
		description: `Você não pode apostar, roubar nem vasculhar enquanto trabalha!`,
		userPrison: (timerPrison: Date) => `Você está preso! ${EmoteString.Prison}\n-# Será solto ${showTime(timerPrison.getTime(), true)}`,
		userHospital: (timerHospital: Date) => `Você está hospitalizado ${EmoteString.Hospital}\n-# Será atendido ${showTime(timerHospital.getTime(), true)}`,
		userCasino: `Você está jogando no cassino! ${EmoteString.Casino}`,
		userIsBeatingId: (nick: string) => `Você já está espancando **${nick}**!`,
		userIsBeingBeatedId: (nick: string) => `Você está sendo espancado por **${nick}**!`,
		userIsRobbingId: (nick: string) => `Você já está roubando **${nick}**!`,
		userIsBeingRobbingId: (nick: string) => `Você está sendo roubado por **${nick}**!`,
		workingOn: (jobId: JobId, jobTime: Date) => `Você está trabalhando como **${JobList[jobId].Description[Language.Portuguese]}**\n-# Terminará ${showTime(jobTime.getTime(), true)}`,
		userScavenge: (placeId: ScavengeId) => `Você está vasculhando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Portuguese]}**!`,
		stop: "Parar trabalho",
		cannotStop: "Você não pode parar o que não começou.",
		stopped: "Você parou seu trabalho de",
		salary: "Salário",
		duration: "Duração",
		necessary: "Necessário",
		next: "Próximo",
		previous: "Anterior",
		back: "Voltar",
		viewJobs: "Ver trabalhos",
		start: "Iniciar",
		blackMarket: "Trabalho do Mercado Negro",
		withoutItems: (jobDescription: string, neededItems: string) => `Você não tem os itens necessários para começar a trabalhar como **${jobDescription}**\n-# Você precisa de ${neededItems}`,
		jobStarted: (jobDescription: string, jobTime: Date) => `Você começou a trabalhar como **${jobDescription}**\n-# Terminará ${showTime(jobTime.getTime(), true)}`,
	},
	[Language.Spanish]: {
		idling: "Vagando",
		userDefending: `¡Estás defendiendo tu inversión! ${EmoteString.InvestmentActive}`,
		userParticipating: `¡Estás participando en una acción de cuadrilla! ${EmoteString.Gang}`,
		title: "Trabajos",
		description: "Tu no puedes apostar, robar o buscar mientras trabajas!",
		userPrison: (timerPrison: Date) => `¡Estás preso! ${EmoteString.Prison}\n-# ¡Serás liberado ${showTime(timerPrison.getTime(), true)}`,
		userHospital: (timerHospital: Date) => `¡Estás hospitalizado ${EmoteString.Hospital}\n-# Serás atendido ${showTime(timerHospital.getTime(), true)}`,
		userCasino: `¡Estás jugando en el casino! ${EmoteString.Casino}`,
		userIsBeatingId: (nick: string) => `¡Ya estás golpeando a **${nick}**!`,
		userIsBeingBeatedId: (nick: string) => `¡Estás siendo golpeado por **${nick}**!`,
		userIsRobbingId: (nick: string) => `¡Ya estás robando a **${nick}**!`,
		userIsBeingRobbingId: (nick: string) => `¡Estás siendo robado por **${nick}**!`,
		workingOn: (jobId: JobId, jobTime: Date) => `Usted está trabajando como **${JobList[jobId].Description[Language.Spanish]}**\n-# Terminará ${showTime(jobTime.getTime(), true)}`,
		userScavenge: (placeId: ScavengeId) => `¡Estás buscando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}**!`,
		stop: "Detener trabajo",
		cannotStop: "Usted no puede detener lo que no comenzó.",
		stopped: "Usted detuvo su trabajo de",
		salary: "Salario",
		duration: "Duración",
		necessary: "Necesario",
		next: "Siguiente",
		previous: "Anterior",
		back: "Volver",
		viewJobs: "Ver trabajos",
		start: "Comenzar",
		blackMarket: "Trabajo del Mercado Negro",
		withoutItems: (jobDescription: string, neededItems: string) => `Usted no tiene los elementos necesarios para comenzar a trabajar como **${jobDescription}**\n-# Usted necesita ${neededItems}`,
		jobStarted: (jobDescription: string, jobTime: Date) => `Usted comenzó a trabajar como **${jobDescription}**\n-# Terminará ${showTime(jobTime.getTime(), true)}.`,
	},
} as const satisfies Localization;