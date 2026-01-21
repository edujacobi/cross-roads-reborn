import { ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { User } from "../../models/User";
import { Scavenge } from "../../models/Scavenge";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";
import { CrColors } from "../../utils/colors";
import { EmoteString } from "../../utils/emotes";
import { createButtonCollector, disableButtons, replyWithContainer } from "../../utils/logic";
import { IScavenge, ScavengeFailureReason, ScavengeList } from "../../interfaces/Scavenge";
import { defaultComponent, formatMoney, showTime } from "../../utils/ui";
import { globalStrings, Language } from "../../models/Language";
import { getScavengeChanceClassModifier, getScavengeDurationClassModifier, ClassList } from "../../interfaces/Classes";
import { ItemList, ItemType } from "../../interfaces/Items";
import { setTimeout as wait } from "timers/promises";
import { addHours } from "date-fns";
import { JobList } from "../../interfaces/Jobs";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("scavenge")
		.setDescription("Many things to find in the most unexpected places")
		.setNameLocalization(Locale.PortugueseBR, "vasculhar")
		.setDescriptionLocalization(Locale.PortugueseBR, "Muitas coisas para encontrar nos lugares mais inesperados"),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const scavenge = new Scavenge(user);
		let container = new CustomContainerBuilder();
		const thumbnail = "https://media.discordapp.net/attachments/1233604589064818808/1353866194473582592/XeroqueHolmes.png";

		const addMainHeader = () => {
			const s = Strings[user.Language];
			const defaultDescription = `# ${s.title}\n${s.description}`;

			container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.Scavenge)
				.addSectionComponents(section => section
					.addTexts([
						defaultDescription,
					])
					.setThumbnailAccessory(thumb => thumb
						.setURL(thumbnail),
					),
				)
				.addLargeSeparator();
		};

		const addActionHeader = (text: string) => {
			container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.Scavenge)
				.addTexts([
					`${EmoteString.Scavenge} ${text}`,
				])
				.addLargeSeparator();
		};

		const addContainerFooter = () => {
			const s = Strings[user.Language];
			container
				.addFooter({
					text: s.moreAtk,
				});
		};

		const generateDefaultContainer = () => {
			const s = Strings[user.Language];
			const places = Object.values(ScavengeList) as IScavenge[];

			addMainHeader();

			let text = `${s.userFree}`;

			if (user.Scavenge.Time > new Date()) {
				text = `${s.userScavengeTime} ${showTime(user.Scavenge.Time.getTime(), true)} ${EmoteString.Scavenge}`;
			}
			if (user.IsScavenging()) {
				text = s.userScavenging(user.Scavenge.IsScavengingId!);
			}
			if (user.IsWorking()) {
				text = s.userWorking;
			}
			if (user.IsInPrison()) {
				text = s.userPrison(user.Prison.Time);
			}
			if (user.IsInHospital()) {
				text = s.userHospital(user.Hospital.Time);
			}

			for (let i = 0; i < places.length; i++) {
				const place = places[i];

				container
					.addSectionComponents(section => section
						.addTexts([
							`### ${place.Emote.String} ${place.Description[user.Language]}`,
							place.Subtitle[user.Language],
						])
						.setButtonAccessory(new ButtonBuilder()
							.setLabel(s.title)
							.setEmoji(place.Emote.Id)
							.setStyle(user.Attributes.Attack < place.NeedAttack ? ButtonStyle.Secondary : ButtonStyle.Success)
							.setCustomId(`scavenge${place.Id}`),
						),
					);

				if (i !== places.length - 1) {
					container.addLargeSeparator();
				}
			}

			container.addLargeSeparator()
				.addTexts([`-# ${text}`]);

			addContainerFooter();
		};

		const generateContainer = async () => {
			const s = Strings[user.Language];

			generateDefaultContainer();

			const response = await replyWithContainer(interaction, container);

			const collector = createButtonCollector(interaction, response);

			collector?.on("collect", async btn => {
				await btn.deferUpdate();

				if (btn.customId === "back") {
					generateDefaultContainer();

					return replyWithContainer(interaction, container);
				}

				else if (btn.customId.includes("scavenge")) {
					const { canScavenge } = await scavenge.CanScavenge();

					const placeId = Number(btn.customId.replace("scavenge", ""));
					const place = ScavengeList[placeId];

					const hospitalChance = place.Hospital.Chance > 0 ? `${EmoteString.Hospital} ${s.hospitalizationChance}: ${place.Hospital.Chance}%` : "";
					const prisonChance = place.Prison.Chance > 0 ? ` • ${EmoteString.Prison} ${s.prisonChance}: ${place.Prison.Chance}%` : "";

					const userClassDurationModifier = getScavengeDurationClassModifier(user.Class);

					const rewardMoneyMin = Math.floor(place.Reward.Money.Min * userClassDurationModifier);
					const rewardMoneyMax = Math.floor(place.Reward.Money.Max * userClassDurationModifier);

					const textMinToMax = `- ${formatMoney(rewardMoneyMin, user.Language)} - ${formatMoney(rewardMoneyMax, user.Language)}`;

					const textItems = place.Reward.Items.map(item => {
						const data = ItemList[item.Id];
						const emote = user.GetItemSkin(data);
						const hoursOrUnits = data.Type === ItemType.Consumable ? "un" : "h";
						const durationMin = data.Type === ItemType.Consumable ? item.Duration.Min + 1 : (item.Duration.Min * userClassDurationModifier).toFixed(1);
						const durationMax = data.Type === ItemType.Consumable ? item.Duration.Max + 1 : (item.Duration.Max * userClassDurationModifier).toFixed(1);

						return `- ${emote} ${data.Description[user.Language]}: ${durationMin}${hoursOrUnits} - ${durationMax}${hoursOrUnits}`;
					}).join("\n");

					const userClassChanceModifier = getScavengeChanceClassModifier(user.Class);
					const successChance = place.SuccessChance + userClassChanceModifier;

					const textChances = place.Hospital.Chance > 0 || place.Prison.Chance > 0 ? `### ${s.chances}: \n${hospitalChance}${prisonChance}` : "";

					const localeInfoDetailed = [
						`## ${place.Emote.String} ${place.Description[user.Language]}`,
						`${s.need} ${EmoteString.Attack}${place.NeedAttack} ATK`,
						`${successChance}% ${s.success}`,
						`### ${s.canFind}`,
						`${textMinToMax}`,
						`${textItems}`,
						`${textChances}`,
					].join("\n");

					addMainHeader();

					container
						.addSectionComponents(section => section
							.addTexts([
								localeInfoDetailed,
							])
							.setButtonAccessory(btn => btn
								.setLabel(s.title)
								.setStyle(ButtonStyle.Success)
								.setDisabled(!canScavenge || user.Attributes.Attack < place.NeedAttack)
								.setCustomId(`confirm${place.Id}`),
							),
						)
						.addLargeSeparator()
						.addButtonRow(btn => btn
							.setLabel(s.back)
							.setStyle(ButtonStyle.Secondary)
							.setCustomId("back"),
						);

					addContainerFooter();

					return replyWithContainer(interaction, container);
				}

				else if (btn.customId.includes("confirm")) {
					await user.GetInfo();

					const placeId = Number(btn.customId.replace("confirm", ""));

					const { canScavenge, reason, attacker, location } = await scavenge.CanScavenge();

					if (!canScavenge) {
						let message = "";
						if (reason === ScavengeFailureReason.UserScavengeTime) message = `${s.willBeAbleAgain} ${showTime(user.Scavenge.Time.getTime(), true)} ${EmoteString.Scavenge}`;
						else if (reason === ScavengeFailureReason.UserScavenging) message = `${s.userScavenging(user.Scavenge.IsScavengingId!)} ${EmoteString.Scavenge}`;
						else if (reason === ScavengeFailureReason.UserWorking) message = `${s.working(user.Job.EndsIn, user.Job.Id!)} ${EmoteString.Jobs}`;
						else if (reason === ScavengeFailureReason.UserPrison) message = s.prison(user.Prison.Time);
						else if (reason === ScavengeFailureReason.UserHospital) message = s.hospital(user.Hospital.Time);
						else if (reason === ScavengeFailureReason.AttackerIsBeatingId) message = globalStrings[user.Language].attackerIsBeatingId(`${ClassList[attacker!.class].Image.Emote.String} ${attacker!.nickname!}`);
						else if (reason === ScavengeFailureReason.AttackerIsBeingBeatedById) message = globalStrings[user.Language].attackerIsBeingBeatedById(`${ClassList[attacker!.class!].Image.Emote.String} ${attacker!.nickname!}`);
						else if (reason === ScavengeFailureReason.AttackerIsRobbingId) message = globalStrings[user.Language].attackerIsRobbingId(`${ClassList[attacker!.class].Image.Emote.String} ${attacker!.nickname}`);
						else if (reason === ScavengeFailureReason.AttackerIsBeingRobbedById) message = globalStrings[user.Language].attackerIsBeingRobbedById(`${ClassList[attacker!.class].Image.Emote.String} ${attacker!.nickname}`);
						else if (reason === ScavengeFailureReason.AttackerIsRobbingLocationId) message = globalStrings[user.Language].attackerIsRobbingId(location!.Name[user.Language]);

						container = defaultComponent({
							user: user,
							color: CrColors.Scavenge,
							description: message,
						});

						return replyWithContainer(interaction, container);
					}

					scavenge.SetPlace(placeId);

					const place = ScavengeList[placeId];
					const placeName = `${place.Emote.String} **${place.Description[user.Language]}**`;

					addActionHeader(s.scavengeStart);

					container
						.addTexts([
							`${s.scavenging} ${placeName} ${EmoteString.Waiting}`,
						])
						.addFooter();

					await replyWithContainer(interaction, container);

					await scavenge.StartScavenge();

					await wait(10_000 + (2_000 * placeId));

					const result = await scavenge.EndScavenge();

					if (result.success) {
						addActionHeader(s.scavengeEndSuccess);

						container
							.addTexts([
								`### ${EmoteString.Victory} ${s.success}!`,
								`${s.youFound(result.rewardDescription)} ${placeName} ${EmoteString.Scavenge}`,
								`-# ${s.willBeAbleAgain} ${showTime(addHours(new Date(), 1).getTime(), true)}`,
							])
							.addFooter();
					}
					else {
						let hospitalText = "";
						let prisonText = "";

						if (result.hospitalized) {
							hospitalText = `\n-# ${EmoteString.Hospital} ${place.Hospital.Text[user.Language]} ${s.hospitalized} ${showTime(result.hospitalTime.getTime(), true)}.`;
						}
						else if (result.inprisoned) {
							prisonText = `\n-# ${EmoteString.Prison} ${place.Prison.Text[user.Language]} ${s.inprisoned} ${showTime(result.prisonTime.getTime(), true)}.`;
						}

						addActionHeader(s.scavengeEndFailure);

						container
							.addTexts([
								`### ${EmoteString.Defeat} ${s.failure}!`,
								`${s.youDidntFound} ${placeName} ${EmoteString.Scavenge}${hospitalText}${prisonText}`,
							])
							.addFooter();
					}

					return replyWithContainer(interaction, container);
				}
			});

			collector?.on("end", async () => {
				await disableButtons(interaction, container);
			});
		};

		await generateContainer();
	},
};

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
		userScavenging: (placeId: number) => `You are already scavenging ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.English]}**!`,
		working: (jobTime: Date, jobId: number) => `You cannot scavenge while working! ${EmoteString.Jobs}\n-# Your job of **${JobList[jobId].Description[Language.English]}** will end ${showTime(jobTime.getTime(), true)}!`,
		prison: (prisonTime: Date) => `You cannot scavenge while in prison! ${EmoteString.Prison}\n-# Will be released ${showTime(prisonTime.getTime(), true)}!`,
		isWanted: (scavengeTime: Date) => `You cannot scavenge while wanted by the police! ${EmoteString.Police}\n-# You can scavenge again ${showTime(scavengeTime.getTime(), true)}!`,
		hospital: (hospitalTime: Date) => `You cannot scavenge while hospitalized! ${EmoteString.Hospital}\n-# Will be healed ${showTime(hospitalTime.getTime(), true)}!`,
		scavenging: "Scavenging",
		scavengeStart: "Scavenge in progress",
		scavengeEndSuccess: "Scavenge successful",
		scavengeEndFailure: "Scavenge unsuccessful",
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
		userScavenging: (placeId: number) => `Você já está vasculhando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Portuguese]}**!`,
		working: (jobTime: Date, jobId: number) => `Você não pode vasculhar enquanto está trabalhando! ${EmoteString.Jobs}\n-# Terminará seu trabalho de **${JobList[jobId].Description[Language.Portuguese]}** ${showTime(jobTime.getTime(), true)}!`,
		prison: (prisonTime: Date) => `Você não pode vasculhar enquanto está preso! ${EmoteString.Prison}\n-# Será solto ${showTime(prisonTime.getTime(), true)}!`,
		isWanted: (scavengeTime: Date) => `Você não pode vasculhar enquanto está sendo procurado pela polícia! ${EmoteString.Police}\n-# Poderá vasculhar novamente ${showTime(scavengeTime.getTime(), true)}!`,
		hospital: (hospitalTime: Date) => `Você não pode vasculhar enquanto está hospitalizado! ${EmoteString.Hospital}\n-# Será curado ${showTime(hospitalTime.getTime(), true)}!`,
		scavenging: "Vasculhando",
		scavengeStart: "Vasculho em andamento",
		scavengeEndSuccess: "Vasculho bem-sucedido",
		scavengeEndFailure: "Vasculho mal-sucedido",
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
		userScavenging: (placeId: number) => `¡Ya estás buscando en ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}**!`,
		working: (jobTime: Date, jobId: number) => `¡No puedes buscar mientras trabajas! ${EmoteString.Jobs}\n-# ¡Tu trabajo de **${JobList[jobId].Description[Language.Spanish]}** terminará ${showTime(jobTime.getTime(), true)}!`,
		prison: (prisonTime: Date) => `¡No puedes buscar mientras estás en prisión! ${EmoteString.Prison}\n-# ¡Serás liberado ${showTime(prisonTime.getTime(), true)}!`,
		isWanted: (scavengeTime: Date) => `¡No puedes buscar mientras eres buscado por la policía! ${EmoteString.Police}\n-# ¡Podrás buscar de nuevo ${showTime(scavengeTime.getTime(), true)}!`,
		hospital: (hospitalTime: Date) => `¡No puedes buscar mientras estás hospitalizado! ${EmoteString.Hospital}\n-# ¡Serás curado ${showTime(hospitalTime.getTime(), true)}!`,
		scavenging: "Buscando",
		scavengeStart: "Búsqueda en curso",
		scavengeEndSuccess: "Búsqueda exitosa",
		scavengeEndFailure: "Búsqueda fallida",
		youFound: (item: string) => `Encontraste **${item}** mientras buscabas`,
		youDidntFound: "No encontraste nada mientras buscabas",
		willBeAbleAgain: "Podrás buscar de nuevo",
		hospitalized: "Serás curado",
		inprisoned: "Serás liberado",

	},
} as const;
