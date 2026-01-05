import {
	ActionRowBuilder,
	ChatInputCommandInteraction,
	ComponentType,
	Locale,
	MessageComponentInteraction,
	MessageFlags,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { disableButtons, replyInteraction, searchUser } from "../../utils/logic";
import { defaultComponent, formatMoney, showTime } from "../../utils/ui";
import { EmoteString } from "../../utils/emotes";
import { CrColors } from "../../utils/colors";
import { User } from "../../models/User";
import { Language } from "../../models/Language";
import { Robbery } from "../../models/Robbery";
import { getLocationList, LocationList } from "../../interfaces/Locations";
import { RobberyLocation } from "../../models/RobberyLocation";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("rob")
		.setDescription("Rob a user or a location")
		.setNameLocalization(Locale.PortugueseBR, "roubar")
		.setDescriptionLocalization(Locale.PortugueseBR, "Roube um usuário ou um lugar")
		.addStringOption(target => target
			.setName("target")
			.setNameLocalization(Locale.PortugueseBR, "alvo")
			.setDescription("The user to rob")
			.setMinLength(3)
			.setDescriptionLocalization(Locale.PortugueseBR, "O usuário para roubar"),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const nameOrId = interaction.options.getString("target");
		const target = nameOrId ? await searchUser(nameOrId, interaction) : null;

		const s = Strings[language];

		let text = `${s.userFree}`;
		let canUserRob = true;

		if (user.IsScavenging()) {
			text = s.userScavenging;
			canUserRob = false;
		}
		if (user.IsWorking()) {
			text = s.userWorking;
			canUserRob = false;
		}
		if (user.IsWanted()) {
			text = s.userEscaping(user.Wanted.Time);
			canUserRob = false;
		}
		if (user.IsInPrison()) {
			text = s.userPrison(user.Prison.Time);
			canUserRob = false;
		}
		if (user.IsInHospital()) {
			text = s.userHospital(user.Hospital.Time);
			canUserRob = false;
		}

		if (!nameOrId) {
			const container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.Robbery)
				.addSectionComponents(section => section
					.addTextDisplayComponents(header => header
						.setContent(s.description),
					)
					.setThumbnailAccessory(thumb => thumb
						.setURL("https://media.discordapp.net/attachments/691019843159326757/791444366727708672/roubar_20201223201323.png"),
					),
				)
				.addLargeSeparator()
				.addTexts([`-# ${text}`])
				.addFooter({
					text: user.Situation.Simple,
				});

			const select = new StringSelectMenuBuilder()
				.setCustomId("select")
				.setPlaceholder(s.placeholderSelect);

			const locationList = getLocationList().filter(location => !location.Special);

			for (const location of locationList) {
				if (location.NeedAttack > user.Attributes.Attack) {
					continue;
				}

				const textMinToMax = `${formatMoney(location.Reward.Min, language)} - ${formatMoney(location.Reward.Max, language)}`;
				const textSuccess = `${s.success}: ${location.SuccessChance}%`;
				const textNeedAtk = `${location.NeedAttack} ATK`;

				select.addOptions(
					new StringSelectMenuOptionBuilder()
						.setLabel(location.Description[language])
						.setValue(String(location.Id))
						.setEmoji(location.Emote.Id)
						.setDescription(`${textSuccess} • ${textMinToMax} • ${textNeedAtk}`),
				);
			}

			const rowSelect = new ActionRowBuilder<StringSelectMenuBuilder>()
				.setComponents(select);

			const components = rowSelect.components[0].options.length > 0 ? [rowSelect] : [];

			const response = await replyInteraction(interaction, {
				components: canUserRob ? [container, ...components] : [container],
				flags: MessageFlags.IsComponentsV2,
			});

			const collector = response?.createMessageComponentCollector({
				filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
				componentType: ComponentType.StringSelect,
				idle: 60_000,
			});

			collector?.on("collect", async select => {
				await select.deferUpdate();
				await user.GetInfo();

				const location = LocationList[Number(select.values[0])];

				const robbery = new RobberyLocation(user, location);

				const { canRob, message } = await robbery.CanRobLocation();

				if (!canRob) {
					const container = defaultComponent({
						user,
						color: CrColors.Robbery,
						description: message,
					});

					return await replyInteraction(interaction, {
						components: [container],
						flags: MessageFlags.IsComponentsV2,
					});
				}

				await robbery.StartRobbery(interaction);
			});

			collector?.on("end", async () => {
				await disableButtons(interaction, container);
			});

			return;
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
			});

			return await replyInteraction(interaction, {
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
		}

		await robbery.GetDiscordUser();

		await robbery.StartRobbery(interaction);
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
		description: `# Rob
### Find a target and steal everything!
The higher your ${EmoteString.Attack}ATK, the higher your chances of stealing from other players and the more locations become available. The higher your ${EmoteString.Defense}DEF, the more protected you will be.

If you fail, you will be imprisoned for a time determined by your ${EmoteString.Attack}ATK.
If you succeed, you will be wanted by the police and will have to wait 1 hour to steal again.
There is a small chance the target will also be beaten up!`,
		placeholderSelect: "Available locations to rob",
		success: "Success",
	},
	[Language.Portuguese]: {
		userFree: "Você pode roubar!",
		userScavenging: `Você não pode roubar enquanto vasculha! ${EmoteString.Scavenge}`,
		userWorking: `Você não pode roubar enquanto trabalha! ${EmoteString.Jobs}`,
		userEscaping: (timerEscape: Date) => `Você não pode roubar enquanto estiver sendo procurado pela polícia! Poderá roubar novamente ${showTime(timerEscape.getTime(), true)} ${EmoteString.Police}`,
		userPrison: (timerPrison: Date) => `Você não pode roubar enquanto está preso! Será solto ${showTime(timerPrison.getTime(), true)} ${EmoteString.Prison}`,
		userHospital: (timerHospital: Date) => `Você não pode roubar enquanto está hospitalizado! Será curado ${showTime(timerHospital.getTime(), true)} ${EmoteString.Hospital}`,
		description: `# Roubar
### Encontre um alvo e roube tudo!
Quanto maior seu ${EmoteString.Attack}ATK, maiores suas chances de roubo à outros jogadores e mais locais ficam disponíveis. Quanto maior sua ${EmoteString.Defense}DEF, mais protegido você estará.

Se falhar, você será preso por um tempo definido pelo seu ${EmoteString.Attack}ATK.
Se conseguir, será procurado pela polícia e deverá esperar 1 hora para roubar novamente.
Há uma pequena chance do alvo ser também espancado!`,
		placeholderSelect: "Locais disponíveis para roubar",
		success: "Sucesso",
	},
	[Language.Spanish]: {
		userFree: "¡Puedes robar!",
		userScavenging: `¡No puedes robar mientras buscas! ${EmoteString.Scavenge}`,
		userWorking: `¡No puedes robar mientras trabajas! ${EmoteString.Jobs}`,
		userEscaping: (timerEscape: Date) => `¡No puedes robar mientras eres perseguido por la policía! ¡Puedes robar de nuevo ${showTime(timerEscape.getTime(), true)} ${EmoteString.Police}`,
		userPrison: (timerPrison: Date) => `¡No puedes robar mientras estás en prisión! ¡Serás liberado ${showTime(timerPrison.getTime(), true)} ${EmoteString.Prison}`,
		userHospital: (timerHospital: Date) => `¡No puedes robar mientras estás en el hospital! ¡Serás curado ${showTime(timerHospital.getTime(), true)} ${EmoteString.Hospital}`,
		description: `# Robar
### ¡Encuentra un objetivo y roba todo!
Cuanto mayor sea tu ${EmoteString.Attack}ATK, mayores serán tus posibilidades de robar a otros jugadores y más lugares estarán disponibles. Cuanto mayor sea tu ${EmoteString.Defense}DEF, más protegido estarás.

Si fallas, serás encarcelado por un tiempo determinado por tu ${EmoteString.Attack}ATK.
Si lo consigues, serás buscado por la policía y tendrás que esperar 1 hora para volver a robar.
¡Hay una pequeña posibilidad de que el objetivo también sea golpeado!`,
		placeholderSelect: "Lugares disponibles para robar",
		success: "Éxito",
	},
} as const;