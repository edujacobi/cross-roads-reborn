import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	Locale,
	MessageComponentInteraction,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { removeEmbedComponents, replyInteraction } from "../../utils/logic";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { EmoteString } from "../../utils/emotes";
import { formatMoney, showTime } from "../../utils/ui";
import { getJobList, JobId, JobList } from "../../interfaces/Jobs";
import { getItemList, ItemList } from "../../interfaces/Items";
import { Language } from "../../models/Language";
import { CrColors } from "../../utils/colors";
import { User } from "../../models/User";
import { Users } from "../../database/Users";
import { ClassList } from "../../interfaces/Classes";
import { LocationList } from "../../interfaces/Locations";
import { ScavengeId, ScavengeList } from "../../interfaces/Scavenge";

module.exports = {
	vip: true,
	data: new SlashCommandBuilder()
		.setName("jobs")
		.setDescription("Open the job list to work")
		.setNameLocalization(Locale.PortugueseBR, "trabalhos")
		.setDescriptionLocalization(Locale.PortugueseBR, "Abra a lista de trabalhos para ter um emprego"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];

		let description = `# ${s.title}\n-# ${s.description}`;
		if (user.IsWorking()) {
			description = `${s.workingOn(user.Job.Id!, user.Job.EndsIn)}`;
		}

		const embed = new CustomEmbedBuilder()
			.setDescription(description)
			.setThumbnail(user.IsWorking() ? null : "https://media.discordapp.net/attachments/1233604589064818808/1337166947250602047/Trabalhos2.png")
			.setColor(CrColors.Jobs)
			.setUserFooter({
				nickname: user.Nickname,
				image: interaction.user.avatarURL(),
				text: formatMoney(user.Money, language),
			});

		const select = new StringSelectMenuBuilder()
			.setCustomId("select")
			.setPlaceholder(s.placeholderSelect);

		const jobList = getJobList().filter(jobs => !jobs.Special);

		for (const job of jobList) {
			const weaponsNeeded = getItemList().filter(item => job.NeedItem?.includes(item.Id));

			const textSalary = `${s.salary}: ${formatMoney(job.Salary, language)}`;
			const textDuration = `${s.duration}: ${job.Duration}h`;
			const textNeeded = weaponsNeeded.length ? `\n-# ${s.necessary}: ${weaponsNeeded.map(weapon => weapon.Skin.Default.Emote.String).join("")}` : "";

			if (!user.IsWorking()) {
				embed.addFields({
					name: job.Description[language],
					value: `${textSalary}\n${textDuration}${textNeeded}`,
					inline: true,
				});
			}

			select.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(job.Description[language])
					.setValue(String(job.Id))
					.setDescription(`${s.salary}: ${formatMoney(job.Salary, language)} • ${s.duration}: ${job.Duration}h`),
			);
		}

		const rowSelect = new ActionRowBuilder<StringSelectMenuBuilder>()
			.setComponents(select);

		const buttonStop = new ButtonBuilder()
			.setCustomId("stop")
			.setLabel(s.stop)
			.setStyle(ButtonStyle.Danger);

		const rowButton = new ActionRowBuilder<ButtonBuilder>()
			.setComponents(buttonStop);

		const components = rowSelect.components[0].options.length > 0 ? [rowSelect] : [];

		const response = await replyInteraction(interaction, {
			embeds: [embed],
			components: user.IsWorking() ? [rowButton] : components,
		});

		const collectorSelect = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.StringSelect,
			time: 60_000,
		});

		collectorSelect?.on("collect", async select => {
			embed.setFields([]);

			await user.GetInfo();

			const job = JobList[Number(select.values[0])];

			const userItems = await user.GetItems();
			const hasAllItems = job.NeedItem?.every(neededItem => userItems.some(userItem => userItem.Id === neededItem));

			if (user.IsWorking()) {
				return await removeEmbedComponents(interaction, [
					embed
						.setThumbnail(null)
						.setDescription(s.workingOn(user.Job.Id!, user.Job.EndsIn)),
				]);
			}
			if (user.IsScavenging()) {
				return await removeEmbedComponents(interaction, [
					embed
						.setThumbnail(null)
						.setDescription(s.userScavenge(user.Scavenge.IsScavengingId!)),
				]);
			}
			if (user.IsInPrison()) {
				return await removeEmbedComponents(interaction, [
					embed
						.setThumbnail(null)
						.setDescription(s.userPrison(user.Prison.Time)),
				]);
			}
			if (user.IsInHospital()) {
				return await removeEmbedComponents(interaction, [
					embed
						.setThumbnail(null)
						.setDescription(s.userHospital(user.Hospital.Time)),
				]);
			}
			if (user.Robbery.IsRobbingId) {
				const u = await Users.findByPk(user.Robbery.IsRobbingId, { attributes: ["class", "nickname"] });
				return await removeEmbedComponents(interaction, [
					embed
						.setThumbnail(null)
						.setDescription(`${s.userIsRobbingId(`${ClassList[u!.class].Image.Emote.String} ${u!.nickname!}`)} ${EmoteString.Robbery}`),
				]);
			}
			if (user.Robbery.IsBeingRobbedById) {
				const u = await Users.findByPk(user.Robbery.IsBeingRobbedById, { attributes: ["class", "nickname"] });
				return await removeEmbedComponents(interaction, [
					embed
						.setThumbnail(null)
						.setDescription(`${s.userIsBeingRobbingId(`${ClassList[u!.class].Image.Emote.String} ${u!.nickname!}`)} ${EmoteString.Robbery}`),
				]);
			}
			if (user.Robbery.IsRobbingLocationId) {
				const location = LocationList[user.Robbery.IsRobbingLocationId];
				return await removeEmbedComponents(interaction, [
					embed
						.setThumbnail(null)
						.setDescription(`${s.userIsRobbingId(location.Description[language])} ${EmoteString.Robbery}`),
				]);
			}

			if (job.NeedItem && !hasAllItems) {
				const neededItems = job.NeedItem
					.filter(neededItem => !userItems.some(userItem => userItem.Id === neededItem))
					.map(neededItem => `${ItemList[neededItem].Skin.Default.Emote.String} ${ItemList[neededItem].Description[language]}`)
					.join(", ");
				return await removeEmbedComponents(interaction, [
					embed
						.setThumbnail(null)
						.setDescription(s.withoutItems(neededItems)),
				]);
			}

			await user.StartJob(job.Id);

			return await removeEmbedComponents(interaction, [
				embed
					.setThumbnail(null)
					.setDescription(s.jobStarted(job.Description[language], user.Job.EndsIn))
					.setUserFooter({
						nickname: user.Nickname,
						image: interaction.user.avatarURL(),
						text: `${s.salary}: ${formatMoney(job.Salary, language)} • ${s.duration}: ${job.Duration}h`,
					}),
			]);
		});

		collectorSelect?.on("end", async () => {
			await removeEmbedComponents(interaction);
		});

		const collectorButton = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			time: 60_000,
		});

		collectorButton?.on("collect", async btn => {
			embed.setFields([]);

			if (btn.customId === "stop") {
				await user.GetInfo();
				if (user.Job.Id === null) {
					return await removeEmbedComponents(interaction, [
						embed.setDescription(s.cannotStop),
					]);
				}

				const job = JobList[user.Job.Id];
				await user.CancelJob();

				await removeEmbedComponents(interaction, [
					embed
						.setThumbnail(null)
						.setDescription(`${s.stopped} **${job.Description[language]}** ${EmoteString.Jobs}`),
				]);
			}
		});

		collectorButton?.on("end", async () => {
			await removeEmbedComponents(interaction);
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
		workingOn: (jobId: JobId, jobTime: Date) => `You are working as **${JobList[jobId].Description[Language.English]}** ${EmoteString.Jobs}\n-# Will finish ${showTime(jobTime.getTime(), true)}`,
		userScavenge: (placeId: ScavengeId) => `You are scavenging ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.English]}**!`,
		placeholderSelect: "Select a job",
		stop: "Stop job",
		cannotStop: "You can't stop what you didn't start.",
		stopped: "You stopped your job of",
		salary: "Salary",
		duration: "Duration",
		necessary: "Necessary",
		withoutItems: (neededItems: string) => `You don't have the necessary items to start this job ${EmoteString.Jobs}\n-# You need ${neededItems}`,
		jobStarted: (jobDescription: string, jobTime: Date) => `You started working as **${jobDescription}** ${EmoteString.Jobs}\n-# Will finish ${showTime(jobTime.getTime(), true)}`,
	},
	[Language.Portuguese]: {
		title: "Trabalhos",
		description: `Você não pode apostar, roubar nem vasculhar enquanto trabalha!`,
		userPrison: (timerPrison: Date) => `Você está preso! ${EmoteString.Prison}\n-# Será solto ${showTime(timerPrison.getTime(), true)}`,
		userHospital: (timerHospital: Date) => `Você está hospitalizado ${EmoteString.Hospital}\n-# Será atendido ${showTime(timerHospital.getTime(), true)}`,
		userIsRobbingId: (nick: string) => `Você já está roubando **${nick}**!`,
		userIsBeingRobbingId: (nick: string) => `Você está sendo roubado por **${nick}**!`,
		workingOn: (jobId: JobId, jobTime: Date) => `Você está trabalhando como **${JobList[jobId].Description[Language.Portuguese]}** ${EmoteString.Jobs}\n-# Terminará ${showTime(jobTime.getTime(), true)}`,
		userScavenge: (placeId: ScavengeId) => `Você está vasculhando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Portuguese]}**!`,
		placeholderSelect: "Selecione um trabalho",
		stop: "Parar trabalho",
		cannotStop: "Você não pode parar o que não começou.",
		stopped: "Você parou seu trabalho de",
		salary: "Salário",
		duration: "Duração",
		necessary: "Necessário",
		withoutItems: (neededItems: string) => `Você não tem os itens necessários para começar este trabalho ${EmoteString.Jobs}\n-# Você precisa de ${neededItems}`,
		jobStarted: (jobDescription: string, jobTime: Date) => `Você começou a trabalhar como **${jobDescription}** ${EmoteString.Jobs}\n-# Terminará ${showTime(jobTime.getTime(), true)}`,
	},
	[Language.Spanish]: {
		title: "Trabajos",
		description: "Tu no puedes apostar, robar o buscar mientras trabajas!",
		userPrison: (timerPrison: Date) => `¡Estás preso! ${EmoteString.Prison}\n-# ¡Serás liberado ${showTime(timerPrison.getTime(), true)}`,
		userHospital: (timerHospital: Date) => `¡Estás hospitalizado ${EmoteString.Hospital}\n-# Serás atendido ${showTime(timerHospital.getTime(), true)}`,
		userIsRobbingId: (nick: string) => `¡Ya estás robando a **${nick}**!`,
		userIsBeingRobbingId: (nick: string) => `¡Estás siendo robado por **${nick}**!`,
		workingOn: (jobId: JobId, jobTime: Date) => `Usted está trabajando como **${JobList[jobId].Description[Language.Spanish]}** ${EmoteString.Jobs}\n-# Terminará ${showTime(jobTime.getTime(), true)}`,
		userScavenge: (placeId: ScavengeId) => `¡Estás buscando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}**!`,
		placeholderSelect: "Seleccione un trabajo",
		stop: "Detener trabajo",
		cannotStop: "Usted no puede detener lo que no comenzó.",
		stopped: "Usted detuvo su trabajo de",
		salary: "Salario",
		duration: "Duración",
		necessary: "Necesario",
		withoutItems: (neededItems: string) => `Usted no tiene los elementos necesarios para comenzar este trabajo ${EmoteString.Jobs}\n-# Usted necesita ${neededItems}`,
		jobStarted: (jobDescription: string, jobTime: Date) => `Usted comenzó a trabajar como **${jobDescription}** ${EmoteString.Jobs}\n-# Terminará ${showTime(jobTime.getTime(), true)}.`,
	},
} as const;