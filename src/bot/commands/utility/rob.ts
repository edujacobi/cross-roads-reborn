import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { createButtonCollector, disableButtons } from "#bot/utils/collectors";
import { CrColors } from "#bot/utils/colors";
import { deferReply, deferUpdate, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteString } from "#bot/utils/emotes";
import { defaultComponent, formatMoney, showTime } from "#bot/utils/ui";
import { searchUser } from "#bot/utils/userUtils";
import { Language, type Localization } from "#core/models/Language";
import { Pagination } from "#core/models/Pagination";
import { Robbery } from "#core/models/Robbery";
import { RobberyLocation, Strings as RobberyLocationStrings } from "#core/models/RobberyLocation";
import type { User } from "#core/models/User";
import { getRobberyClassModifier } from "#core/types/Classes";
import { getLocationList, LocationList } from "#core/types/Locations";
import { ButtonBuilder, ButtonStyle, type ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { setTimeout as wait } from "timers/promises";
import { runUserRobbery } from "#bot/utils/robberyHelper";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("rob")
		.setNameLocalization(Locale.SpanishES, "robar")
		.setDescription("Rob a user or a location")
		.setNameLocalization(Locale.PortugueseBR, "roubar")
		.setDescriptionLocalization(Locale.PortugueseBR, "Roube um usuário ou um lugar")
		.setDescriptionLocalization(Locale.SpanishES, "Robar a un usuario o un lugar")
		.addStringOption(target => target
			.setName("target")
			.setNameLocalization(Locale.PortugueseBR, "alvo")
			.setNameLocalization(Locale.SpanishES, "objetivo")
			.setDescription("The user to rob")
			.setMinLength(3)
			.setDescriptionLocalization(Locale.PortugueseBR, "O usuário para roubar")
			.setDescriptionLocalization(Locale.SpanishES, "El usuario a robar"),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		await deferReply(interaction);

		const nameOrId = interaction.options.getString("target");
		const target = nameOrId ? await searchUser(nameOrId, interaction, language) : null;

		const s = Strings[language];

		let text = `${s.userFree}`;

		if (user.IsScavenging()) {
			text = s.userScavenging;
		}
		if (user.IsWorking()) {
			text = s.userWorking;
		}
		if (user.IsWanted()) {
			text = s.userEscaping(user.Wanted.Time);
		}
		if (user.IsInPrison()) {
			text = s.userPrison(user.Prison.Time);
		}
		if (user.IsInHospital()) {
			text = s.userHospital(user.Hospital.Time);
		}
		if (user.IsInCasinoGame()) {
			text = s.userCasino;
		}

		function generateDefaultHeader() {
			return new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.Robbery)
				.addSectionComponents(section => section
					.addTexts([
						`# ${s.title}`,
						s.description,
					])
					.setThumbnailAccessory(thumb => thumb
						.setURL("https://media.discordapp.net/attachments/691019843159326757/791444366727708672/roubar_20201223201323.png"),
					),
				)
				.addLargeSeparator();
		}

		function generateDefaultContainer() {
			return generateDefaultHeader()
				.addSectionComponents(section => section
					.addTexts([
						`-# ${text}`,
					])
					.setButtonAccessory(btn => btn
						.setLabel(s.availableLocations)
						.setCustomId("available")
						.setStyle(ButtonStyle.Secondary),
					),
				)
				.addFooter({
					text: `${formatMoney(user.Money, language)} • ${user.Situation.Simple}`,
				});
		}

		if (!nameOrId) {
			let robLocationStarted = false;

			let container = generateDefaultContainer();

			const response = await replyWithContainer(interaction, container);

			const collector = createButtonCollector(interaction, response);

			collector?.on("end", async () => {
				if (!robLocationStarted) {
					await disableButtons(interaction, container);
				}
			});

			const pagination = new Pagination(interaction, language);
			pagination.HowManyRecords = getLocationList().length;
			pagination.Limit = 4;

			pagination.CustomizeContainer = async () => {
				const locationList = getLocationList();
				const currentPageLocations = locationList.slice(pagination.Offset, pagination.Offset + pagination.Limit);

				const container = generateDefaultHeader();

				for (let i = 0; i < currentPageLocations.length; i++) {
					const location = currentPageLocations[i];
					container
						.addSectionComponents(section => section
							.addTexts([
								`### ${location.Emote.String} ${location.Name[language]}`,
								location.Description[language],
							])
							.setButtonAccessory(new ButtonBuilder()
								.setLabel(s.title)
								.setEmoji(location.Emote.Id)
								.setStyle(location.NeedAttack > user.Attributes.Attack ? ButtonStyle.Secondary : ButtonStyle.Success)
								.setCustomId(`location${location.Id}`),
							),
						);

					if (i < currentPageLocations.length - 1) {
						container.addLargeSeparator();
					}
				}

				return container;
			};

			collector?.on("collect", async btn => {
				await deferUpdate(btn);

				if (btn.customId === "available" || btn.customId === "next" || btn.customId === "prev") {
					if (btn.customId === "next") {
						pagination.Offset += pagination.Limit;
					}
					else if (btn.customId === "prev") {
						pagination.Offset -= pagination.Limit;
					}

					container = await pagination.BuildContainerWithRow();

					return replyWithContainer(interaction, container);
				}

				else if (btn.customId.includes("location")) {
					const locationId = Number(btn.customId.replace("location", ""));
					const location = LocationList[locationId];
					const robbery = new RobberyLocation(user, locationId);
					const { canRob } = await robbery.CanRobLocation();

					const userClassModifier = getRobberyClassModifier(user.Class);

					const rewardMin = Math.floor(location.Reward.Min * userClassModifier);
					const rewardMax = Math.floor(location.Reward.Max * userClassModifier);

					const textMinToMax = `- ${formatMoney(rewardMin, language)} - ${formatMoney(rewardMax, language)}`;
					const textSuccess = `${location.SuccessChance}% ${s.success}`;
					const textNeedAtk = `${s.need} ${EmoteString.Attack}${location.NeedAttack} ATK`;

					container = generateDefaultHeader()
						.addSectionComponents(section => section
							.addTexts([
								`## ${location.Emote.String} ${location.Name[language]}`,
								textNeedAtk,
								textSuccess,
								`### ${s.canRob}`,
								textMinToMax,
							])
							.setButtonAccessory(btn => btn
								.setLabel(s.title)
								.setStyle(ButtonStyle.Success)
								.setDisabled(!canRob || location.NeedAttack > user.Attributes.Attack)
								.setCustomId(`confirm${locationId}`)),
						)
						.addLargeSeparator()
						.addButtonRow(btn => btn
							.setLabel(s.goBack)
							.setStyle(ButtonStyle.Secondary)
							.setCustomId("available"),
						)
						.addFooter({
							text: formatMoney(user.Money, language),
						});

					return replyWithContainer(interaction, container);

				}

				else if (btn.customId.includes("confirm")) {
					const locationId = Number(btn.customId.replace("confirm", ""));
					await user.GetInfo();

					const robbery = new RobberyLocation(user, locationId);

					const { canRob, message } = await robbery.CanRobLocation();

					if (!canRob) {
						container = defaultComponent({
							user,
							color: CrColors.Robbery,
							description: message,
							footer: formatMoney(user.Money, language),
						});

						return replyWithContainer(interaction, container);
					}

					robLocationStarted = true;

					const sRL = RobberyLocationStrings[user.Language];
					const location = LocationList[locationId];

					await robbery.LockStates();

					try {
						const channelContainer = new CustomContainerBuilder()
							.setUser(user)
							.setAccentColor(CrColors.Robbery)
							.addSectionComponents(section => section
								.addTexts([
									`# ${s.title}`,
									s.description,
								])
								.setThumbnailAccessory(thumb => thumb
									.setURL("https://media.discordapp.net/attachments/691019843159326757/791444366727708672/roubar_20201223201323.png"),
								),
							)
							.addLargeSeparator()
							.addTexts([
								`${EmoteString.Robbery} ${sRL.robberyInProgress}`,
							], 1)
							.addLargeSeparator()
							.addTexts([
								`${sRL.tryingToRob} ${location.Emote.String} **${location.Name[user.Language]}** ${EmoteString.Waiting}`,
							], 50)
							.addFooter({
								text: `${formatMoney(user.Money, language)} • ${user.Situation.Simple}`,
							});

						await replyWithContainer(interaction, channelContainer);

						await wait(10_000 + (5_000 * locationId));

						const outcome = await robbery.ResolveLocation();

						const locationEmote = location.Emote.String;
						const locationName = location.Name[user.Language];

						if (outcome.success) {
							const resultTexts = [
								`### ${EmoteString.Victory} ${sRL.success}!`,
								sRL.youRobbed(formatMoney(outcome.moneyRobbed, user.Language), `${locationEmote} ${locationName}`),
								`-# ${sRL.willBeAbleAgain} ${showTime(outcome.attackerWantedTime!.getTime(), true)}`,
							].join("\n");

							channelContainer.changeTextFromSectionId(50, resultTexts);
						}
						else {
							const prisonTextList = location.Prison.Text;
							const prisonText = prisonTextList[Math.floor(Math.random() * prisonTextList.length)][user.Language];

							const resultTexts = [
								`### ${EmoteString.Defeat} ${sRL.failure}!`,
								`${sRL.youFailed(`${locationEmote} ${locationName}`)}!`,
								`-# ${EmoteString.Prison} ${prisonText} ${sRL.prisonTime(outcome.attackerPrisonTime!)}`,
							].join("\n");

							channelContainer.changeTextFromSectionId(50, resultTexts);
						}

						channelContainer
							.changeTextFromSectionId(1, `${EmoteString.Robbery} ${sRL.finishedRobberyAttacker(outcome.success)}`)
							.changeFooterText(formatMoney(user.Money, user.Language));

						await replyWithContainer(interaction, channelContainer);
					}
					finally {
						await robbery.ReleaseLocks();
					}
				}
			});
		}

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
				footer: formatMoney(user.Money, language),
			});

			return replyWithContainer(interaction, container);
		}

		await runUserRobbery(interaction, robbery, user, target);
	},
};

const Strings = {
	[Language.English]: {
		userFree: "You can rob!",
		userScavenging: `You can't rob while scavenging! ${EmoteString.Scavenge}`,
		userWorking: `You can't rob while working! ${EmoteString.Jobs}`,
		userEscaping: (timerEscape: Date) => `You can't rob while being wanted by the police! You can rob again ${showTime(timerEscape.getTime(), true)} ${EmoteString.Police}`,
		userPrison: (timerPrison: Date) => `You can't rob while in prison! You will be released ${showTime(timerPrison.getTime(), true)} ${EmoteString.Prison}`,
		userHospital: (timerHospital: Date) => `You can't rob while in hospital! You will be healed ${showTime(timerHospital.getTime(), true)} ${EmoteString.Hospital}`,
		userCasino: `You can't rob while playing in casino! ${EmoteString.Casino}`,
		title: `Rob`,
		description: `### Find a target and steal everything!
The higher your ${EmoteString.Attack}ATK, the higher your chances of stealing from other players and the more locations become available. The higher your ${EmoteString.Defense}DEF, the more protected you will be.

If you fail, you will be imprisoned for a time determined by your ${EmoteString.Attack}ATK.
If you succeed, you will be wanted by the police and will have to wait 1 hour to steal again.
There is a small chance the target will also be beaten up!`,
		availableLocations: "Available locations",
		success: "Success",
		goBack: "Go back",
		need: "Needed",
		canRob: "You can rob:",
		next: "Next",
		previous: "Previous",
	},
	[Language.Portuguese]: {
		userFree: "Você pode roubar!",
		userScavenging: `Você não pode roubar enquanto vasculha! ${EmoteString.Scavenge}`,
		userWorking: `Você não pode roubar enquanto trabalha! ${EmoteString.Jobs}`,
		userEscaping: (timerEscape: Date) => `Você não pode roubar enquanto estiver sendo procurado pela polícia! Poderá roubar novamente ${showTime(timerEscape.getTime(), true)} ${EmoteString.Police}`,
		userPrison: (timerPrison: Date) => `Você não pode roubar enquanto está preso! Será solto ${showTime(timerPrison.getTime(), true)} ${EmoteString.Prison}`,
		userHospital: (timerHospital: Date) => `Você não pode roubar enquanto está hospitalizado! Será curado ${showTime(timerHospital.getTime(), true)} ${EmoteString.Hospital}`,
		userCasino: `Você não pode roubar enquanto está jogando no cassino! ${EmoteString.Casino}`,
		title: `Roubar`,
		description: `### Encontre um alvo e roube tudo!
Quanto maior seu ${EmoteString.Attack}ATK, maiores suas chances de roubo à outros jogadores e mais locais ficam disponíveis. Quanto maior sua ${EmoteString.Defense}DEF, mais protegido você estará.

Se falhar, você será preso por um tempo definido pelo seu ${EmoteString.Attack}ATK.
Se conseguir, será procurado pela polícia e deverá esperar 1 hora para roubar novamente.
Há uma pequena chance do alvo ser também espancado!`,
		availableLocations: "Locais disponíveis",
		success: "Sucesso",
		goBack: "Voltar",
		need: "Necessário",
		canRob: "Pode roubar:",
		next: "Próximo",
		previous: "Anterior",
	},
	[Language.Spanish]: {
		userFree: "¡Puedes robar!",
		userScavenging: `¡No puedes robar mientras buscas! ${EmoteString.Scavenge}`,
		userWorking: `¡No puedes robar mientras trabajas! ${EmoteString.Jobs}`,
		userEscaping: (timerEscape: Date) => `¡No puedes robar mientras eres perseguido por la policía! ¡Puedes robar de nuevo ${showTime(timerEscape.getTime(), true)} ${EmoteString.Police}`,
		userPrison: (timerPrison: Date) => `¡No puedes robar mientras estás en prisión! ¡Serás liberado ${showTime(timerPrison.getTime(), true)} ${EmoteString.Prison}`,
		userHospital: (timerHospital: Date) => `¡No puedes robar mientras estás en el hospital! ¡Serás curado ${showTime(timerHospital.getTime(), true)} ${EmoteString.Hospital}`,
		userCasino: `¡No puedes robar mientras estás jugando en el casino! ${EmoteString.Casino}`,
		title: `Robar`,
		description: `### ¡Encuentra un objetivo y roba todo!
Cuanto mayor sea tu ${EmoteString.Attack}ATK, mayores serán tus posibilidades de robar a otros jugadores y más lugares estarán disponibles. Cuanto mayor sea tu ${EmoteString.Defense}DEF, más protegido estarás.

Si fallas, serás encarcelado por un tiempo determinado por tu ${EmoteString.Attack}ATK.
Si lo consigues, serás buscado por la policía y tendrás que esperar 1 hora para volver a robar.
¡Hay una pequeña posibilidad de que el objetivo también sea golpeado!`,
		availableLocations: "Lugares disponibles",
		success: "Éxito",
		goBack: "Volver",
		need: "Necesario",
		canRob: "Puedes robar:",
		next: "Siguiente",
		previous: "Anterior",
	},
} as const satisfies Localization;