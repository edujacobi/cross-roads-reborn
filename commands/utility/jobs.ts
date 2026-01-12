import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	Locale,
	MessageComponentInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { disableButtons, replyInteraction } from "../../utils/logic";
import { EmoteString } from "../../utils/emotes";
import { formatMoney, showTime } from "../../utils/ui";
import { getJobList, JobId, JobList, Jobs } from "../../interfaces/Jobs";
import { getItemList, ItemList } from "../../interfaces/Items";
import { Language } from "../../models/Language";
import { CrColors } from "../../utils/colors";
import { User } from "../../models/User";
import { Users } from "../../database/Users";
import { ClassList, getJobClassModifier } from "../../interfaces/Classes";
import { LocationList } from "../../interfaces/Locations";
import { ScavengeId, ScavengeList } from "../../interfaces/Scavenge";
import { Event, EventType } from "../../models/Event";
import { BlackMarket } from "../../models/BlackMarket";
import { BundleId } from "../../interfaces/Ids";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("jobs")
		.setDescription("Open the job list to work")
		.setNameLocalization(Locale.PortugueseBR, "trabalhos")
		.setDescriptionLocalization(Locale.PortugueseBR, "Abra a lista de trabalhos para ter um emprego"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];

		let currentPage = 0;

		function addHeader(container = new CustomContainerBuilder()) {
			container
				.setUser(user)
				.setAccentColor(CrColors.Jobs)
				.addSectionComponents(header => header
					.addTextDisplayComponents(text => text
						.setContent(`# ${s.title}\n${s.description}`),
					)
					.setThumbnailAccessory(thumb => thumb
						.setURL("https://media.discordapp.net/attachments/1233604589064818808/1337166947250602047/Trabalhos2.png"),
					),
				);

			container.addLargeSeparator();

			return container;
		}

		await interaction.deferReply();

		const blackMarket = new BlackMarket(user);

		const { isOpen } = blackMarket.IsBlackMarketOpen();

		const jobList = isOpen ? getJobList() : getJobList().filter(jobs => !jobs.Special);

		const eventActiveValue = await Event.GetActiveFromType(EventType.JOB_TIME_MULTIPLIER);

		const pages: Jobs[][] = [];
		for (let i = 0; i < jobList.length; i += 6) {
			pages.push(jobList.slice(i, i + 6));
		}

		async function generateDefaultContainer() {
			await user.GetInfo();

			const container = addHeader();

			const currentPageJobs = pages[currentPage];

			const userClassModifier = getJobClassModifier(user.Class);

			if (user.IsWorking()) {
				const job = JobList[user.Job.Id!];
				const jobDuration = job.Duration * eventActiveValue;
				const jobSalary = job.Salary * userClassModifier;

				container
					.addTexts([
						s.workingOn(user.Job.Id!, user.Job.EndsIn),
					])
					.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>()
						.addComponents(new ButtonBuilder()
							.setCustomId("stop")
							.setLabel(s.stop)
							.setStyle(ButtonStyle.Danger),
						),
					)
					.addFooter({
						text: `${s.salary}: ${formatMoney(jobSalary, language)} • ${s.duration}: ${jobDuration}h`,
					});

				return container;
			}
			else {
				for (let i = 0; i < currentPageJobs.length; i++) {
					const job = currentPageJobs[i];
					const weaponsNeeded = getItemList().filter(item => job.NeedItem?.includes(item.Id));
					const jobDuration = job.Duration * eventActiveValue;
					const jobSalary = job.Salary * userClassModifier;

					const textSalary = `${s.salary}: ${formatMoney(jobSalary, language)}`;
					const textDuration = `${s.duration}: ${jobDuration}h`;
					const textNeeded = weaponsNeeded.length ? `\n-# ${s.necessary}:\n## ${weaponsNeeded.map(weapon => weapon.Skin[BundleId.Default].String).join(" ")}` : "";
					const blackMarketText = job.Special ? ` • ${EmoteString.BlackMarket} ${s.blackMarket}` : "";

					container.addSectionComponents(section => section
						.addTextDisplayComponents(text => text
							.setContent(`### ${job.Description[language]}\n${textSalary} • ${textDuration}${blackMarketText}${textNeeded}`),
						)
						.setButtonAccessory(btn => btn
							.setLabel(s.start)
							.setStyle(ButtonStyle.Secondary)
							.setCustomId(`start${job.Id}`)),
					);

					if (i != currentPageJobs.length - 1) {
						container.addLargeSeparator();
					}
				}

				if (pages.length > 1) {
					container.addLargeSeparator();

					container.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>()
						.addComponents(new ButtonBuilder()
							.setLabel(s.previous)
							.setStyle(ButtonStyle.Secondary)
							.setCustomId("previous")
							.setEmoji("⬅️")
							.setDisabled(currentPage === 0),
						)
						.addComponents(new ButtonBuilder()
							.setLabel(s.next)
							.setStyle(ButtonStyle.Secondary)
							.setCustomId("next")
							.setEmoji("➡️")
							.setDisabled(currentPage === pages.length - 1),
						));
				}

				container.addFooter({
					text: formatMoney(user.Money, language),
				});

				return container;
			}
		}

		let container = await generateDefaultContainer();

		const response = await replyInteraction(interaction, {
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});

		const collectorButton = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			idle: 60_000,
		});

		collectorButton?.on("collect", async btn => {
			await btn.deferUpdate();


			if (btn.customId.includes("start")) {
				await user.GetInfo();
				const userClassModifier = getJobClassModifier(user.Class);

				const jobId = Number(btn.customId.replace("start", ""));
				const job = JobList[jobId];

				const userItems = await user.GetItems();
				const hasAllItems = job.NeedItem?.every(neededItem => userItems.some(userItem => userItem.Id === neededItem));

				let textResponse = "";

				container = addHeader();

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
					textResponse = `${s.userIsRobbingId(location.Description[language])} ${EmoteString.Robbery}`;
				}
				else if (job.NeedItem && !hasAllItems) {
					const neededItems = job.NeedItem
						.filter(neededItem => !userItems.some(userItem => userItem.Id === neededItem))
						.map(neededItem => `${ItemList[neededItem].Skin[BundleId.Default].String} ${ItemList[neededItem].Description[language]}`)
						.join(", ");

					textResponse = s.withoutItems(job.Description[language], neededItems);
				}

				if (textResponse != "") {
					container
						.addTexts([textResponse])
						.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>()
							.addComponents(
								new ButtonBuilder()
									.setLabel(s.back)
									.setStyle(ButtonStyle.Secondary)
									.setCustomId("back"),
							),
						)
						.addFooter({
							text: formatMoney(user.Money, language),
						});


					return replyInteraction(interaction, { components: [container] });
				}

				const jobDuration = job.Duration * eventActiveValue;
				const jobSalary = job.Salary * userClassModifier;

				await user.StartJob(job.Id);

				container
					.addTexts([
						s.jobStarted(job.Description[language], user.Job.EndsIn),
					])
					.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>()
						.addComponents(new ButtonBuilder()
							.setCustomId("stop")
							.setLabel(s.stop)
							.setStyle(ButtonStyle.Danger),
						),
					)
					.addFooter({
						text: `${s.salary}: ${formatMoney(jobSalary, language)} • ${s.duration}: ${jobDuration}h`,
					});

				return replyInteraction(interaction, { components: [container] });
			}

			else if (btn.customId === "stop") {
				await user.GetInfo();

				container = addHeader();

				if (user.Job.Id === null) {
					container
						.addTexts([s.cannotStop])
						.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>()
							.addComponents(new ButtonBuilder()
								.setCustomId("back")
								.setLabel(s.viewJobs)
								.setStyle(ButtonStyle.Secondary),
							),
						)
						.addFooter({
							text: formatMoney(user.Money, language),
						});

					return replyInteraction(interaction, { components: [container] });
				}

				const job = JobList[user.Job.Id];
				await user.CancelJob();

				container
					.addTexts([
						`${s.stopped} **${job.Description[language]}**`,
					])
					.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>()
						.addComponents(new ButtonBuilder()
							.setCustomId("back")
							.setLabel(s.viewJobs)
							.setStyle(ButtonStyle.Secondary),
						),
					)
					.addFooter({
						text: formatMoney(user.Money, language),
					});

				return replyInteraction(interaction, { components: [container] });
			}

			else if (btn.customId === "previous") {
				currentPage -= 1;
				container = await generateDefaultContainer();
				return replyInteraction(interaction, { components: [container] });
			}
			else if (btn.customId === "next") {
				currentPage += 1;
				container = await generateDefaultContainer();
				return replyInteraction(interaction, { components: [container] });
			}
			else if (btn.customId === "back") {
				container = await generateDefaultContainer();
				return replyInteraction(interaction, { components: [container] });
			}
		});

		collectorButton?.on("end", async () => {
			await disableButtons(interaction, container);
		});
	},
};

const Strings = {
	[Language.English]: {
		title: "Jobs",
		description: "You cannot bet, steal or search while working!",
		userPrison: (timerPrison: Date) => `You are in prison! ${EmoteString.Prison}\n-# You will be released ${showTime(timerPrison.getTime(), true)}`,
		userHospital: (timerHospital: Date) => `You are hospitalized ${EmoteString.Hospital}\n-# You will be attended ${showTime(timerHospital.getTime(), true)}`,
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
		title: "Trabalhos",
		description: `Você não pode apostar, roubar nem vasculhar enquanto trabalha!`,
		userPrison: (timerPrison: Date) => `Você está preso! ${EmoteString.Prison}\n-# Será solto ${showTime(timerPrison.getTime(), true)}`,
		userHospital: (timerHospital: Date) => `Você está hospitalizado ${EmoteString.Hospital}\n-# Será atendido ${showTime(timerHospital.getTime(), true)}`,
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
		title: "Trabajos",
		description: "Tu no puedes apostar, robar o buscar mientras trabajas!",
		userPrison: (timerPrison: Date) => `¡Estás preso! ${EmoteString.Prison}\n-# ¡Serás liberado ${showTime(timerPrison.getTime(), true)}`,
		userHospital: (timerHospital: Date) => `¡Estás hospitalizado ${EmoteString.Hospital}\n-# Serás atendido ${showTime(timerHospital.getTime(), true)}`,
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
} as const;