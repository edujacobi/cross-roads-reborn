import { User } from "./User";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	MessageComponentInteraction,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { setTimeout as wait } from "timers/promises";
import { Language } from "./Language";
import { CustomEmbedBuilder } from "./CustomEmbedBuilder";
import { CrColors } from "../utils/colors";
import { removeEmbedComponents, replyInteraction } from "../utils/logic";
import { IScavenge, ScavengeId, ScavengeList } from "../interfaces/Scavenge";
import { ItemList, ItemType } from "../interfaces/Items";
import { EmoteString } from "../utils/emotes";
import { defaultEmbed, formatMoney, showTime } from "../utils/ui";
import { LocationList } from "../interfaces/Locations";
import { JobId, JobList } from "../interfaces/Jobs";
import { Users } from "../database/Users";
import { ClassList } from "../interfaces/Classes";
import { addHours, addMinutes } from "date-fns";
import { Log } from "../utils/log";
import { Notification } from "./Notification";

export class Scavenge {
	User: User;
	Interaction: ChatInputCommandInteraction;
	Thumbnail = "https://media.discordapp.net/attachments/1233604589064818808/1353866194473582592/XeroqueHolmes.png";
	Place: IScavenge | undefined;
	Timer = {
		Prison: 0,
		Hospital: 0,
	};

	constructor(user: User, interaction: ChatInputCommandInteraction) {
		this.User = user;
		this.Interaction = interaction;
	}

	SetPlace(place: IScavenge) {
		this.Place = place;
		this.Timer.Prison = 7 * (this.Place.Id + 1);
		this.Timer.Hospital = 4 * (this.Place.Id + 1);
	}

	async GenerateEmbed() {
		const s = Strings[this.User.Language];

		const select = new StringSelectMenuBuilder()
			.setCustomId("select")
			.setPlaceholder(s.placeholderSelect);

		const places = Object.values(ScavengeList) as IScavenge[];

		let localeInfoSimple = "";
		let localeInfoDetailed = "";

		for (const place of places) {
			if (place.NeedAttack > this.User.Attributes.Attack) {
				continue;
			}

			const textMinToMax = `${formatMoney(place.Reward.Money.Min, this.User.Language)} - ${formatMoney(place.Reward.Money.Max, this.User.Language)}`;
			const textSuccess = `${s.success}: ${place.SuccessChance}%`;
			const textNeedAtk = `${place.NeedAttack} ATK`;
			const hospitalChance = place.Hospital.Chance > 0 ? `${EmoteString.Hospital} ${s.hospitalizationChance}: ${place.Hospital.Chance}%` : "";
			const prisonChance = place.Prison.Chance > 0 ? ` • ${EmoteString.Prison} ${s.prisonChance}: ${place.Prison.Chance}%` : "";

			const textItems = place.Reward.Items.map(item => {
				const data = ItemList[item.Id];
				const emote = data.Skin.Default.Emote.String;
				const hoursOrUnits = data.Type === ItemType.Consumable ? "" : "h";

				return `${emote} ${item.Duration.Min}${hoursOrUnits} - ${item.Duration.Max}${hoursOrUnits}`;
			}).join(", ");

			const textChances = place.Hospital.Chance > 0 || place.Prison.Chance > 0 ? `\n-# ${hospitalChance}${prisonChance}\n` : "\n";
			localeInfoSimple += `### ${place.Emote.String} ${place.Description[this.User.Language]}\n-# ${place.Subtitle[this.User.Language]}\n`;
			localeInfoDetailed += `### ${place.Emote.String} ${place.Description[this.User.Language]}\n-# ${s.success}: ${place.SuccessChance}% • ${s.need}: ${EmoteString.Attack}${place.NeedAttack} ATK\n-# ${textMinToMax}\n-# ${textItems}${textChances}`;

			select.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(place.Description[this.User.Language])
					.setValue(String(place.Id))
					.setEmoji(place.Emote.Id)
					.setDescription(`${textSuccess} • ${textMinToMax} • ${textNeedAtk}`),
			);
		}

		let text = `${s.userFree}`;
		let canScavenge = true;

		if (this.User.Scavenge.Time > new Date()) {
			text = `${s.userScavengeTime} ${showTime(this.User.Scavenge.Time.getTime(), true)} ${EmoteString.Scavenge}`;
			canScavenge = false;
		}
		if (this.User.IsScavenging()) {
			text = s.userScavenging(this.User.Scavenge.IsScavengingId!);
			canScavenge = false;
		}
		if (this.User.IsWorking()) {
			text = s.userWorking;
			canScavenge = false;
		}
		if (this.User.IsInPrison()) {
			text = s.userPrison(this.User.Prison.Time);
			canScavenge = false;
		}
		if (this.User.IsInHospital()) {
			text = s.userHospital(this.User.Hospital.Time);
			canScavenge = false;
		}

		const defaultDescription = `# ${s.title}\n${s.description}`;

		const embed = new CustomEmbedBuilder()
			.setThumbnail(this.Thumbnail)
			.setColor(CrColors.Scavenge)
			.setDescription(`${defaultDescription}\n${localeInfoSimple}\n-# ${text}`)
			.setUserFooter({
				nickname: this.User.Nickname,
				image: this.Interaction.user.avatarURL(),
				text: s.moreAtk,
			});


		const rowSelect = new ActionRowBuilder<StringSelectMenuBuilder>()
			.setComponents(select.setDisabled(!canScavenge));

		const buttonMore = new ButtonBuilder()
			.setCustomId("more")
			.setLabel(s.more)
			.setEmoji("➕")
			.setStyle(ButtonStyle.Secondary);

		const buttonLess = new ButtonBuilder()
			.setCustomId("less")
			.setLabel(s.less)
			.setEmoji("➖")
			.setStyle(ButtonStyle.Secondary);

		const rowButtons = new ActionRowBuilder<ButtonBuilder>()
			.setComponents(buttonMore);

		const components = rowSelect.components[0].options.length > 0 ? [rowSelect, rowButtons] : [rowButtons];

		const response = await replyInteraction(this.Interaction, {
			embeds: [embed],
			components,
		});

		const collectorBtn = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === this.Interaction.user.id,
			componentType: ComponentType.Button,
			idle: 60_000,
		});

		const collectorSelect = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === this.Interaction.user.id,
			componentType: ComponentType.StringSelect,
			idle: 60_000,
		});

		collectorSelect?.on("collect", async select => {
			await select.deferUpdate();
			await this.User.GetInfo();

			const { canScavenge, message } = await this.CanScavenge();

			if (!canScavenge) {
				return await replyInteraction(this.Interaction, {
					embeds: [defaultEmbed({
						interaction: this.Interaction,
						color: CrColors.Scavenge,
						description: message,
						nickname: this.User.Nickname,
					})],
					components: [],
				});
			}

			this.SetPlace(ScavengeList[Number(select.values[0])]);

			await this.StartScavenge();
		});

		collectorSelect?.on("end", async () => {
			await removeEmbedComponents(this.Interaction);
		});

		collectorBtn?.on("collect", async btn => {
			if (btn.customId === "more") {
				embed.setDescription(`${defaultDescription}\n${localeInfoDetailed}`);
				rowButtons.setComponents(buttonLess);
			}
			else if (btn.customId === "less") {
				embed.setDescription(`${defaultDescription}\n${localeInfoSimple}`);
				rowButtons.setComponents(buttonMore);
			}

			await btn.update({ embeds: [embed], components });
		});

		collectorBtn?.on("end", async () => {
			await removeEmbedComponents(this.Interaction);
		});
	}

	async CanScavenge() {
		const s = Strings[this.User.Language];
		let canScavenge = true;
		let message = "";

		if (this.User.Scavenge.Time > new Date()) {
			message = `${s.willBeAbleAgain} ${showTime(this.User.Scavenge.Time.getTime(), true)} ${EmoteString.Scavenge}`;
			canScavenge = false;
		}

		if (this.User.IsScavenging()) {
			message = `${s.userScavenging(this.User.Scavenge.IsScavengingId!)} ${EmoteString.Scavenge}`;
			canScavenge = false;
		}

		if (this.User.IsWorking()) {
			message = `${s.working(this.User.Job.EndsIn, this.User.Job.Id!)} ${EmoteString.Jobs}`;
			canScavenge = false;
		}

		if (this.User.IsInPrison()) {
			message = s.prison(this.User.Prison.Time);
			canScavenge = false;
		}

		if (this.User.IsWanted()) {
			message = s.isWanted(this.User.Wanted.Time);
			canScavenge = false;
		}

		if (this.User.IsInHospital()) {
			message = s.hospital(this.User.Hospital.Time);
			canScavenge = false;
		}

		if (this.User.Robbery.IsRobbingId) {
			const user = await Users.findByPk(this.User.Robbery.IsRobbingId, { attributes: ["nickname", "class"] });
			message = `${s.isRobbingId(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname}`)} ${EmoteString.Robbery}`;
			canScavenge = false;
		}

		if (this.User.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.User.Robbery.IsBeingRobbedById, { attributes: ["nickname", "class"] });
			message = `${s.isBeingRobbedById(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname}`)} ${EmoteString.Robbery}`;
			canScavenge = false;
		}

		if (this.User.Robbery.IsRobbingLocationId) {
			const location = LocationList[this.User.Robbery.IsRobbingLocationId];
			message = `${s.isRobbingId(location.Description[this.User.Language])} ${EmoteString.Robbery}`;
			canScavenge = false;
		}

		return { canScavenge, message };
	}

	async StartScavenge() {
		if (!this.Place) {
			return;
		}

		const s = Strings[this.User.Language];

		const placeName = `${this.Place.Emote.String} **${this.Place.Description[this.User.Language]}**`;

		const scavengeEmbed = new CustomEmbedBuilder()
			.setColor(CrColors.Scavenge)
			.setDescription(`${s.scavenging} ${placeName}...`)
			.setUserFooter({
				nickname: this.User.Nickname,
				image: this.Interaction.user.avatarURL(),
			});

		await replyInteraction(this.Interaction, {
			embeds: [scavengeEmbed],
			components: [],
		});

		this.User.Scavenge.IsScavengingId = this.Place.Id;
		await this.User.Update();

		await wait(5_000 + (3_000 * this.Place.Id));

		await this.EndScavenge(scavengeEmbed);
	}

	async EndScavenge(embed: CustomEmbedBuilder) {
		if (!this.Place) {
			return;
		}

		const s = Strings[this.User.Language];

		const placeName = `${this.Place.Emote.String} **${this.Place.Description[this.User.Language]}**`;

		const success = Math.random() * 100 < this.Place.SuccessChance;

		if (success) {
			const rewardMoney = Math.random() < 0.5;
			let rewardDescription: string;
			let rewardDescriptionLog: string;

			if (rewardMoney) {
				const reward = this.Place.Reward.Money.Min + Math.floor(Math.random() * (this.Place.Reward.Money.Max - this.Place.Reward.Money.Min));

				this.User.Money += reward;
				this.User.Scavenge.Found.MoneyCount += 1;
				this.User.Scavenge.Found.MoneySum += reward;

				rewardDescription = formatMoney(reward, this.User.Language);
				rewardDescriptionLog = formatMoney(reward, Language.English);
			}
			else {
				const item = this.Place.Reward.Items[Math.floor(Math.random() * this.Place.Reward.Items.length)];
				const data = ItemList[item.Id];

				this.User.Scavenge.Found.Items += 1;

				if (data.Type === ItemType.Consumable) {
					const howMany = Math.floor(item.Duration.Min + Math.random() * (item.Duration.Max - item.Duration.Min));
					rewardDescription = `${howMany} ${data.Skin.Default.Emote.String} ${data.Description[this.User.Language]}`;
					rewardDescriptionLog = `${howMany} ${data.Description[Language.English]}`;
				}
				else {
					const duration = item.Duration.Min + Math.random() * (item.Duration.Max - item.Duration.Min);
					rewardDescription = `${data.Skin.Default.Emote.String} ${data.Description[this.User.Language]} (${duration.toFixed(1)}h)`;
					rewardDescriptionLog = `${duration.toFixed(1)}h ${data.Description[Language.English]}`;
				}
			}

			embed.setDescription(`### ${s.success}!\n${s.youFound(rewardDescription)} ${placeName} ${EmoteString.Scavenge}\n-# ${s.willBeAbleAgain} ${showTime(addHours(new Date(), 1).getTime(), true)}`);

			Log.Info(`User ${this.User.Nickname} (Id: ${this.User.Id}) found ${rewardDescriptionLog} while scavenging at ${this.Place.Description[Language.English]} (Id: ${this.Place.Id})`);
		}
		else {
			const hospitalized = Math.random() * 100 < this.Place.Hospital.Chance;
			const inprisoned = Math.random() * 100 < this.Place.Prison.Chance;

			this.User.Scavenge.Found.Failures += 1;

			let hospitalText = "";
			let prisonText = "";

			if (hospitalized) {
				this.User.Hospital.Time = addMinutes(new Date(), this.Timer.Hospital);
				this.User.Scavenge.Found.FailureWithHospital += 1;
				await Notification.Hospital(this.User);

				hospitalText = `\n-# ${EmoteString.Hospital} ${this.Place.Hospital.Text[this.User.Language]} ${s.hospitalized} ${showTime(this.User.Hospital.Time.getTime(), true)}.`;
			}
			else if (inprisoned) {
				this.User.Prison.Time = addMinutes(new Date(), this.Timer.Prison);
				this.User.Scavenge.Found.FailureWithPrison += 1;
				await Notification.Free(this.User);

				prisonText = `\n-# ${EmoteString.Prison} ${this.Place.Prison.Text[this.User.Language]} ${s.inprisoned} ${showTime(this.User.Prison.Time.getTime(), true)}.`;
			}

			embed.setDescription(`### ${s.failure}!\n${s.youDidntFound} ${placeName} ${EmoteString.Scavenge}${hospitalText}${prisonText}`);

			Log.Info(`User ${this.User.Nickname} (Id: ${this.User.Id}) failed to scavenge at ${this.Place.Description[Language.English]} (Id: ${this.Place.Id}). Hospitalized: ${hospitalized} (${this.Timer.Hospital}min) Inprisoned: ${inprisoned} (${this.Timer.Prison}min)`);
		}

		this.User.Scavenge.Count += 1;
		this.User.Scavenge.Time = addHours(new Date(), 1);
		this.User.Scavenge.IsScavengingId = null;

		await Notification.Scavenge(this.User);

		await this.User.Update();

		await replyInteraction(this.Interaction, {
			embeds: [embed],
		});
	}
}

const Strings = {
	[Language.English]: {
		moreAtk: "Get more ATK to unlock more places",
		title: "Scavenge",
		userFree: "You can scagenge!",
		userScavengeTime: "You will be able to scagenge again",
		userWorking: `You cannot scagenge while working! ${EmoteString.Jobs}`,
		userPrison: (timerPrison: Date) => `You cannot scagenge while in prison! You will be released ${showTime(timerPrison.getTime(), true)} ${EmoteString.Prison}`,
		userHospital: (timerHospital: Date) => `You cannot scagenge while hospitalized! You will be healed ${showTime(timerHospital.getTime(), true)} ${EmoteString.Hospital}`,
		description: "I'm looking for brave people who aren't afraid to enter dirty and dangerous places. Many good things can be found!\n-# You can scavenge once every hour.",
		success: "Success",
		failure: "Failure",
		hospitalizationChance: "Hospitalization",
		prisonChance: "Prison",
		need: "Needed",
		more: "More information",
		less: "Less information",
		placeholderSelect: "Select a place",
		userScavenging: (placeId: ScavengeId) => `You are already scavenging ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.English]}**!`,
		working: (jobTime: Date, jobId: JobId) => `You cannot scavenge while working! ${EmoteString.Jobs}\n-# Your job of **${JobList[jobId].Description[Language.English]}** will end ${showTime(jobTime.getTime(), true)}!`,
		prison: (prisonTime: Date) => `You cannot scavenge while in prison! ${EmoteString.Prison}\n-# Will be released ${showTime(prisonTime.getTime(), true)}!`,
		isWanted: (scavengeTime: Date) => `You cannot scavenge while wanted by the police! ${EmoteString.Police}\n-# You can scavenge again ${showTime(scavengeTime.getTime(), true)}!`,
		hospital: (hospitalTime: Date) => `You cannot scavenge while hospitalized! ${EmoteString.Hospital}\n-# Will be healed ${showTime(hospitalTime.getTime(), true)}!`,
		isRobbingId: (nick: string) => `You are robbing **${nick}** and cannot scavenge now!`,
		isBeingRobbedById: (nick: string) => `You are being robbed by **${nick}** and cannot scavenge now!`,
		scavenging: "Scavenging",
		youFound: (item: string) => `You found **${item}** while scavenging`,
		youDidntFound: "You didn't find anything while scavenging",
		willBeAbleAgain: "Will be able to scavenge again",
		hospitalized: "Will be healed",
		inprisoned: "Will be released",

	},
	[Language.Portuguese]: {
		moreAtk: "Tenha mais ATK para liberar mais lugares",
		title: "Vasculhar",
		userFree: "Você pode vasculhar!",
		userScavengeTime: "Você poderá vasculhar novamente",
		userWorking: `Você não pode vasculhar enquanto trabalha! ${EmoteString.Jobs}`,
		userPrison: (timerPrison: Date) => `Você não pode vasculhar enquanto está preso! Será solto ${showTime(timerPrison.getTime(), true)} ${EmoteString.Prison}`,
		userHospital: (timerHospital: Date) => `Você não pode vasculhar enquanto está hospitalizado! Será curado ${showTime(timerHospital.getTime(), true)} ${EmoteString.Hospital}`,
		description: "Procuro pessoas corajosas e sem nojo de entrar em locais sujos e perigosos. Muitas coisas boas podem ser encontradas!\n-# Você pode vasculhar uma vez a cada hora.",
		success: "Sucesso",
		failure: "Falha",
		hospitalizationChance: "Hospitalização",
		prisonChance: "Prisão",
		need: "Necessário",
		more: "Mais informações",
		less: "Menos informações",
		placeholderSelect: "Selecione um lugar",
		userScavenging: (placeId: ScavengeId) => `Você já está vasculhando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Portuguese]}**!`,
		working: (jobTime: Date, jobId: JobId) => `Você não pode vasculhar enquanto está trabalhando! ${EmoteString.Jobs}\n-# Terminará seu trabalho de **${JobList[jobId].Description[Language.Portuguese]}** ${showTime(jobTime.getTime(), true)}!`,
		prison: (prisonTime: Date) => `Você não pode vasculhar enquanto está preso! ${EmoteString.Prison}\n-# Será solto ${showTime(prisonTime.getTime(), true)}!`,
		isWanted: (scavengeTime: Date) => `Você não pode vasculhar enquanto está sendo procurado pela polícia! ${EmoteString.Police}\n-# Poderá vasculhar novamente ${showTime(scavengeTime.getTime(), true)}!`,
		hospital: (hospitalTime: Date) => `Você não pode vasculhar enquanto está hospitalizado! ${EmoteString.Hospital}\n-# Será curado ${showTime(hospitalTime.getTime(), true)}!`,
		isRobbingId: (nick: string) => `Você está roubando **${nick}** e não pode vasculhar agora!`,
		isBeingRobbedById: (nick: string) => `Você está sendo roubado por **${nick}** e não pode vasculhar agora!`,
		scavenging: "Vasculhando",
		youFound: (item: string) => `Você encontrou **${item}** enquanto vasculhava`,
		youDidntFound: "Você não encontrou nada enquanto vasculhava",
		willBeAbleAgain: "Poderá vasculhar novamente",
		hospitalized: "Será curado",
		inprisoned: "Será solto",

	},
	[Language.Spanish]: {
		moreAtk: "Obtén más ATK para desbloquear más lugares",
		title: "Buscar",
		userFree: "¡Puedes buscar!",
		userScavengeTime: "Podrás buscar de nuevo",
		userWorking: `¡No puedes navegar mientras trabajas! ${EmoteString.Jobs}`,
		userPrison: (timerPrison: Date) => `¡No puedes buscar mientras estés en prisión! Serás liberado ${showTime(timerPrison.getTime(), true)} ${EmoteString.Prison}`,
		userHospital: (timerHospital: Date) => `¡No puedes buscar mientras estás en el hospital! Serás curado ${showTime(timerHospital.getTime(), true)} ${EmoteString.Hospital}`,
		description: "Busco personas valientes que no tengan miedo de entrar en lugares sucios y peligrosos. ¡Muchas cosas buenas pueden encontrarse!\n-# Puedes buscar una vez cada hora.",
		success: "Éxito",
		failure: "Fracaso",
		hospitalizationChance: "Hospitalización",
		prisonChance: "Prisión",
		need: "Necesario",
		more: "Más información",
		less: "Menos información",
		placeholderSelect: "Seleccionar un lugar",
		userScavenging: (placeId: ScavengeId) => `¡Ya estás buscando en ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}**!`,
		working: (jobTime: Date, jobId: JobId) => `¡No puedes buscar mientras trabajas! ${EmoteString.Jobs}\n-# ¡Tu trabajo de **${JobList[jobId].Description[Language.Spanish]}** terminará ${showTime(jobTime.getTime(), true)}!`,
		prison: (prisonTime: Date) => `¡No puedes buscar mientras estás en prisión! ${EmoteString.Prison}\n-# ¡Serás liberado ${showTime(prisonTime.getTime(), true)}!`,
		isWanted: (scavengeTime: Date) => `¡No puedes buscar mientras eres buscado por la policía! ${EmoteString.Police}\n-# ¡Podrás buscar de nuevo ${showTime(scavengeTime.getTime(), true)}!`,
		hospital: (hospitalTime: Date) => `¡No puedes buscar mientras estás hospitalizado! ${EmoteString.Hospital}\n-# ¡Serás curado ${showTime(hospitalTime.getTime(), true)}!`,
		isRobbingId: (nick: string) => `¡Estás robando a **${nick}** y no puedes buscar ahora!`,
		isBeingRobbedById: (nick: string) => `¡Estás siendo robado por **${nick}** y no puedes buscar ahora!`,
		scavenging: "Buscando",
		youFound: (item: string) => `Encontraste **${item}** mientras buscabas`,
		youDidntFound: "No encontraste nada mientras buscabas",
		willBeAbleAgain: "Podrás buscar de nuevo",
		hospitalized: "Serás curado",
		inprisoned: "Serás liberado",

	},
} as const;