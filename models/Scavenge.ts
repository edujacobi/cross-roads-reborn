import { User } from "./User";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	ComponentType,
	MessageComponentInteraction,
	MessageFlags,
} from "discord.js";
import { setTimeout as wait } from "timers/promises";
import { globalStrings, Language } from "./Language";
import { CrColors } from "../utils/colors";
import { disableButtons, replyInteraction } from "../utils/logic";
import { IScavenge, ScavengeId, ScavengeList } from "../interfaces/Scavenge";
import { ItemList, ItemType } from "../interfaces/Items";
import { EmoteString } from "../utils/emotes";
import { defaultComponent, formatMoney, showTime } from "../utils/ui";
import { LocationList } from "../interfaces/Locations";
import { JobId, JobList } from "../interfaces/Jobs";
import { Users } from "../database/Users";
import { ClassList, getScavengeChanceClassModifier, getScavengeDurationClassModifier } from "../interfaces/Classes";
import { addHours, addMinutes } from "date-fns";
import { Log } from "../utils/log";
import { Notification } from "./Notification";
import { UserItems } from "../database/UserItems";
import { BundleId } from "../interfaces/Ids";
import { CustomContainerBuilder } from "../ui/builders/CustomContainerBuilder";

export class Scavenge {
	User: User;
	Interaction: ChatInputCommandInteraction;
	Thumbnail = "https://media.discordapp.net/attachments/1233604589064818808/1353866194473582592/XeroqueHolmes.png";
	Place: IScavenge | undefined;
	Timer = {
		Prison: 0,
		Hospital: 0,
	};
	Container = new CustomContainerBuilder();

	constructor(user: User, interaction: ChatInputCommandInteraction) {
		this.User = user;
		this.Interaction = interaction;
	}

	SetPlace(place: IScavenge) {
		this.Place = place;
		this.Timer.Prison = 5 * (this.Place.Id + 1);
		this.Timer.Hospital = 3 * (this.Place.Id + 1);

		// Check here and not in constructor, because user can change class between openning the command and executing the action
		const userClassChanceModifier = getScavengeChanceClassModifier(this.User.Class);
		this.Place.SuccessChance += userClassChanceModifier;

		const userClassDurationModifier = getScavengeDurationClassModifier(this.User.Class);
		this.Place.Reward.Money.Min *= userClassDurationModifier;
		this.Place.Reward.Money.Max *= userClassDurationModifier;
		this.Place.Reward.Items.forEach(item => {
			const data = ItemList[item.Id];
			item.Duration.Min = data.Type === ItemType.Consumable ? item.Duration.Min + 1 : (item.Duration.Min * userClassDurationModifier);
			item.Duration.Max = data.Type === ItemType.Consumable ? item.Duration.Max + 1 : (item.Duration.Max * userClassDurationModifier);
		});
	}

	AddContainerHeader() {
		const s = Strings[this.User.Language];

		const defaultDescription = `# ${s.title}\n${s.description}`;

		this.Container = new CustomContainerBuilder()
			.setUser(this.User)
			.setAccentColor(CrColors.Scavenge)
			.addSectionComponents(section => section
				.addTextDisplayComponents(header => header
					.setContent(defaultDescription),
				)
				.setThumbnailAccessory(thumb => thumb
					.setURL(this.Thumbnail),
				),
			)
			.addLargeSeparator();
	}

	AddContainerFooter() {
		const s = Strings[this.User.Language];
		this.Container
			.addFooter({
				text: s.moreAtk,
			});
	}

	GenerateDefaultContainer() {
		const s = Strings[this.User.Language];

		const places = Object.values(ScavengeList) as IScavenge[];

		this.AddContainerHeader();

		let text = `${s.userFree}`;

		if (this.User.Scavenge.Time > new Date()) {
			text = `${s.userScavengeTime} ${showTime(this.User.Scavenge.Time.getTime(), true)} ${EmoteString.Scavenge}`;
		}
		if (this.User.IsScavenging()) {
			text = s.userScavenging(this.User.Scavenge.IsScavengingId!);
		}
		if (this.User.IsWorking()) {
			text = s.userWorking;
		}
		if (this.User.IsInPrison()) {
			text = s.userPrison(this.User.Prison.Time);
		}
		if (this.User.IsInHospital()) {
			text = s.userHospital(this.User.Hospital.Time);
		}

		for (let i = 0; i < places.length; i++) {
			const place = places[i];

			this.Container
				.addSectionComponents(section => section
					.addTextDisplayComponents(description => description
						.setContent(`### ${place.Emote.String} ${place.Description[this.User.Language]}\n${place.Subtitle[this.User.Language]}`),
					)
					.setButtonAccessory(new ButtonBuilder()
						.setLabel(s.title)
						.setEmoji(place.Emote.Id)
						.setStyle(ButtonStyle.Secondary)
						.setCustomId(`scavenge${place.Id}`),
					),
				);

			if (i !== places.length - 1) {
				this.Container.addLargeSeparator();
			}
		}

		this.Container.addLargeSeparator()
			.addTexts([`-# ${text}`]);

		this.AddContainerFooter();
	}

	async GenerateContainer() {
		const s = Strings[this.User.Language];

		this.GenerateDefaultContainer();

		const response = await replyInteraction(this.Interaction, {
			components: [this.Container],
			flags: MessageFlags.IsComponentsV2,
		});

		const collectorBtn = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === this.Interaction.user.id,
			componentType: ComponentType.Button,
			idle: 60_000,
		});

		collectorBtn?.on("collect", async btn => {
			await btn.deferUpdate();

			if (btn.customId === "back") {
				this.GenerateDefaultContainer();

				await replyInteraction(this.Interaction, {
					components: [this.Container],
				});
			}

			else if (btn.customId.includes("scavenge")) {
				const { canScavenge } = await this.CanScavenge();

				const placeId = Number(btn.customId.replace("scavenge", ""));
				const place = ScavengeList[placeId];

				const hospitalChance = place.Hospital.Chance > 0 ? `${EmoteString.Hospital} ${s.hospitalizationChance}: ${place.Hospital.Chance}%` : "";
				const prisonChance = place.Prison.Chance > 0 ? ` • ${EmoteString.Prison} ${s.prisonChance}: ${place.Prison.Chance}%` : "";

				const userClassDurationModifier = getScavengeDurationClassModifier(this.User.Class);

				const rewardMoneyMin = Math.floor(place.Reward.Money.Min * userClassDurationModifier);
				const rewardMoneyMax = Math.floor(place.Reward.Money.Max * userClassDurationModifier);

				const textMinToMax = `- ${formatMoney(rewardMoneyMin, this.User.Language)} - ${formatMoney(rewardMoneyMax, this.User.Language)}`;

				const textItems = place.Reward.Items.map(item => {
					const data = ItemList[item.Id];
					const emote = data.Skin[BundleId.Default].String;
					const hoursOrUnits = data.Type === ItemType.Consumable ? "un" : "h";
					const durationMin = data.Type === ItemType.Consumable ? item.Duration.Min + 1 : (item.Duration.Min * userClassDurationModifier).toFixed(1);
					const durationMax = data.Type === ItemType.Consumable ? item.Duration.Max + 1 : (item.Duration.Max * userClassDurationModifier).toFixed(1);

					return `- ${emote} ${data.Description[this.User.Language]}: ${durationMin}${hoursOrUnits} - ${durationMax}${hoursOrUnits}`;
				}).join("\n");

				const userClassChanceModifier = getScavengeChanceClassModifier(this.User.Class);
				const successChance = place.SuccessChance + userClassChanceModifier;

				const textChances = place.Hospital.Chance > 0 || place.Prison.Chance > 0 ? `### ${s.chances}: \n${hospitalChance}${prisonChance}` : "";

				const localeInfoDetailed = [
					`## ${place.Emote.String} ${place.Description[this.User.Language]}`,
					`${s.need} ${EmoteString.Attack}${place.NeedAttack} ATK`,
					`${successChance}% ${s.success}`,
					`### ${s.canFind}`,
					`${textMinToMax}`,
					`${textItems}`,
					`${textChances}`,
				].join("\n");

				this.AddContainerHeader();

				this.Container
					.addSectionComponents(section => section
						.addTextDisplayComponents(text => text
							.setContent(localeInfoDetailed),
						)
						.setButtonAccessory(btn => btn
							.setLabel(s.title)
							.setStyle(ButtonStyle.Success)
							.setDisabled(!canScavenge || this.User.Attributes.Attack < place.NeedAttack)
							.setCustomId(`confirm${place.Id}`),
						),
					)
					.addLargeSeparator()
					.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>()
						.addComponents(new ButtonBuilder()
							.setLabel(s.back)
							.setStyle(ButtonStyle.Secondary)
							.setCustomId("back"),
						),
					);

				this.AddContainerFooter();

				await replyInteraction(this.Interaction, {
					components: [this.Container],
				});
			}

			else if (btn.customId.includes("confirm")) {
				await this.User.GetInfo();

				const placeId = Number(btn.customId.replace("confirm", ""));
				const place = ScavengeList[placeId];

				const { canScavenge, message } = await this.CanScavenge();

				if (!canScavenge) {
					this.Container = defaultComponent({
						user: this.User,
						color: CrColors.Scavenge,
						description: message,
					});

					return await replyInteraction(this.Interaction, {
						components: [this.Container],
						flags: MessageFlags.IsComponentsV2,
					});
				}

				this.SetPlace(place);

				await this.StartScavenge();
			}
		});

		collectorBtn?.on("end", async () => {
			await disableButtons(this.Interaction, this.Container);
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

		// if (this.User.IsWanted()) {
		// 	message = s.isWanted(this.User.Wanted.Time);
		// 	canScavenge = false;
		// }

		if (this.User.IsInHospital()) {
			message = s.hospital(this.User.Hospital.Time);
			canScavenge = false;
		}

		if (this.User.BeatUp.IsBeatingId) {
			const user = await Users.findByPk(this.User.BeatUp.IsBeatingId, { attributes: ["class", "nickname"] });
			message = globalStrings[this.User.Language].attackerIsBeatingId(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname!}`);
			canScavenge = false;
		}

		if (this.User.BeatUp.IsBeingBeatUpById) {
			const user = await Users.findByPk(this.User.BeatUp.IsBeingBeatUpById, { attributes: ["class", "nickname"] });
			message = globalStrings[this.User.Language].attackerIsBeingBeatedById(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`);
			canScavenge = false;
		}

		if (this.User.Robbery.IsRobbingId) {
			const user = await Users.findByPk(this.User.Robbery.IsRobbingId, { attributes: ["nickname", "class"] });
			message = globalStrings[this.User.Language].attackerIsRobbingId(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname}`);
			canScavenge = false;
		}

		if (this.User.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.User.Robbery.IsBeingRobbedById, { attributes: ["nickname", "class"] });
			message = globalStrings[this.User.Language].attackerIsBeingRobbedById(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname}`);
			canScavenge = false;
		}

		if (this.User.Robbery.IsRobbingLocationId !== null) {
			const location = LocationList[this.User.Robbery.IsRobbingLocationId];
			message = globalStrings[this.User.Language].attackerIsRobbingId(location.Description[this.User.Language]);
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

		this.Container = new CustomContainerBuilder()
			.setUser(this.User)
			.setAccentColor(CrColors.Scavenge)
			.addTexts([`${s.scavenging} ${placeName} ${EmoteString.Waiting}`])
			.addFooter();

		await replyInteraction(this.Interaction, {
			components: [this.Container],
		});

		this.User.Scavenge.IsScavengingId = this.Place.Id;
		await this.User.Update();

		await wait(10_000 + (2_000 * this.Place.Id));

		await this.EndScavenge();
	}

	async EndScavenge() {
		if (!this.Place) {
			return;
		}

		await this.User.GetInfo();

		const s = Strings[this.User.Language];

		const placeName = `${this.Place.Emote.String} **${this.Place.Description[this.User.Language]}**`;

		const success = Math.random() * 100 < this.Place.SuccessChance;

		if (success) {
			const rewardMoney = Math.random() < 0.25;
			let rewardDescription: string;
			let rewardDescriptionLog: string;

			this.User.Scavenge.Found.Total += 1;

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

				const existingItem = await UserItems.findOne({
					where: {
						userId: this.User.Id,
						itemId: item.Id,
					},
				});

				const now = new Date();

				this.User.Scavenge.Found.Items += 1;

				if (data.Type === ItemType.Consumable) {
					const howMany = Math.floor(item.Duration.Min + Math.random() * (item.Duration.Max - item.Duration.Min));
					rewardDescription = `${howMany} ${data.Skin[BundleId.Default].String} ${data.Description[this.User.Language]}`;
					rewardDescriptionLog = `${howMany} ${data.Description[Language.English]}`;

					await UserItems.upsert({
						id: existingItem?.id ?? undefined,
						userId: this.User.Id,
						itemId: item.Id,
						quantity: (existingItem?.quantity ?? 0) + howMany,
						skin: BundleId.Default,
					});
				}
				else {
					const duration = item.Duration.Min + Math.random() * (item.Duration.Max - item.Duration.Min);
					rewardDescription = `${data.Skin[BundleId.Default].String} ${data.Description[this.User.Language]} (${duration.toFixed(1)}h)`;
					rewardDescriptionLog = `${duration.toFixed(1)}h ${data.Description[Language.English]}`;

					const remaining = existingItem?.remainingTime ?? new Date(0);

					const remainingTime = now > remaining ?
						addHours(now, duration) :
						addHours(remaining, duration);

					await UserItems.upsert({
						id: existingItem?.id ?? undefined,
						userId: this.User.Id,
						itemId: item.Id,
						remainingTime,
						skin: BundleId.Default,
					});
				}
			}

			this.Container = new CustomContainerBuilder()
				.setUser(this.User)
				.setAccentColor(Colors.Green)
				.addTexts([
					`### ${s.success}!`,
					`${s.youFound(rewardDescription)} ${placeName} ${EmoteString.Scavenge}`,
					`-# ${s.willBeAbleAgain} ${showTime(addHours(new Date(), 1).getTime(), true)}`,
				])
				.addFooter();

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
				this.User.Hospital.Count += 1;
				this.User.Scavenge.Found.FailureWithHospital += 1;
				await Notification.Hospital(this.User);

				hospitalText = `\n-# ${EmoteString.Hospital} ${this.Place.Hospital.Text[this.User.Language]} ${s.hospitalized} ${showTime(this.User.Hospital.Time.getTime(), true)}.`;
			}
			else if (inprisoned) {
				this.User.Prison.Time = addMinutes(new Date(), this.Timer.Prison);
				this.User.Prison.Count += 1;
				this.User.Prison.HasPaidBribe = false;
				this.User.Escape.HasTried = false;
				this.User.Scavenge.Found.FailureWithPrison += 1;
				await Notification.Free(this.User);

				prisonText = `\n-# ${EmoteString.Prison} ${this.Place.Prison.Text[this.User.Language]} ${s.inprisoned} ${showTime(this.User.Prison.Time.getTime(), true)}.`;
			}
			this.Container = new CustomContainerBuilder()
				.setUser(this.User)
				.setAccentColor(Colors.Red)
				.addTexts([
					`### ${s.failure}!`,
					`${s.youDidntFound} ${placeName} ${EmoteString.Scavenge}${hospitalText}${prisonText}`,
				])
				.addFooter();

			Log.Info(`User ${this.User.Nickname} (Id: ${this.User.Id}) failed to scavenge at ${this.Place.Description[Language.English]} (Id: ${this.Place.Id}). Hospitalized: ${hospitalized} (${this.Timer.Hospital}min) Inprisoned: ${inprisoned} (${this.Timer.Prison}min)`);
		}

		this.User.Scavenge.Count += 1;
		this.User.Scavenge.Time = addHours(new Date(), 1);
		this.User.Scavenge.IsScavengingId = null;

		await Notification.Scavenge(this.User);

		await this.User.Update();

		await replyInteraction(this.Interaction, {
			components: [this.Container],
		});
	}
}

const Strings = {
	[Language.English]: {
		moreAtk: `Get more ${EmoteString.Attack}ATK to unlock more places`,
		title: "Scavenge",
		userFree: "You can scagenge!",
		userScavengeTime: "You will be able to scagenge again",
		userWorking: `You cannot scagenge while working! ${EmoteString.Jobs}`,
		userPrison: (timerPrison: Date) => `You cannot scagenge while in prison! You will be released ${showTime(timerPrison.getTime(), true)} ${EmoteString.Prison}`,
		userHospital: (timerHospital: Date) => `You cannot scagenge while hospitalized! You will be healed ${showTime(timerHospital.getTime(), true)} ${EmoteString.Hospital}`,
		description: "I'm looking for brave people who aren't afraid to enter dirty and dangerous places. Many good things can be found!\n-# You can scavenge once every hour.",
		canFind: "You can find:",
		chances: "Chances",
		back: "Go back",
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
		scavenging: "Scavenging",
		youFound: (item: string) => `You found **${item}** while scavenging`,
		youDidntFound: "You didn't find anything while scavenging",
		willBeAbleAgain: "Will be able to scavenge again",
		hospitalized: "Will be healed",
		inprisoned: "Will be released",

	},
	[Language.Portuguese]: {
		moreAtk: `Tenha mais ${EmoteString.Attack}ATK para liberar mais lugares`,
		title: "Vasculhar",
		userFree: "Você pode vasculhar!",
		userScavengeTime: "Você poderá vasculhar novamente",
		userWorking: `Você não pode vasculhar enquanto trabalha! ${EmoteString.Jobs}`,
		userPrison: (timerPrison: Date) => `Você não pode vasculhar enquanto está preso! Será solto ${showTime(timerPrison.getTime(), true)} ${EmoteString.Prison}`,
		userHospital: (timerHospital: Date) => `Você não pode vasculhar enquanto está hospitalizado! Será curado ${showTime(timerHospital.getTime(), true)} ${EmoteString.Hospital}`,
		description: "Procuro pessoas corajosas e sem nojo de entrar em locais sujos e perigosos. Muitas coisas boas podem ser encontradas!\n-# Você pode vasculhar uma vez a cada hora.",
		canFind: "Pode encontrar:",
		chances: "Chances",
		back: "Voltar",
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
		scavenging: "Vasculhando",
		youFound: (item: string) => `Você encontrou **${item}** enquanto vasculhava`,
		youDidntFound: "Você não encontrou nada enquanto vasculhava",
		willBeAbleAgain: "Poderá vasculhar novamente",
		hospitalized: "Será curado",
		inprisoned: "Será solto",

	},
	[Language.Spanish]: {
		moreAtk: `Obtén más ${EmoteString.Attack}ATK para desbloquear más lugares`,
		title: "Buscar",
		userFree: "¡Puedes buscar!",
		userScavengeTime: "Podrás buscar de nuevo",
		userWorking: `¡No puedes navegar mientras trabajas! ${EmoteString.Jobs}`,
		userPrison: (timerPrison: Date) => `¡No puedes buscar mientras estés en prisión! Serás liberado ${showTime(timerPrison.getTime(), true)} ${EmoteString.Prison}`,
		userHospital: (timerHospital: Date) => `¡No puedes buscar mientras estás en el hospital! Serás curado ${showTime(timerHospital.getTime(), true)} ${EmoteString.Hospital}`,
		description: "Busco personas valientes que no tengan miedo de entrar en lugares sucios y peligrosos. ¡Muchas cosas buenas pueden encontrarse!\n-# Puedes buscar una vez cada hora.",
		canFind: "Puedes encontrar:",
		chances: "Posibilidades",
		back: "Volver",
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
		scavenging: "Buscando",
		youFound: (item: string) => `Encontraste **${item}** mientras buscabas`,
		youDidntFound: "No encontraste nada mientras buscabas",
		willBeAbleAgain: "Podrás buscar de nuevo",
		hospitalized: "Serás curado",
		inprisoned: "Serás liberado",

	},
} as const;