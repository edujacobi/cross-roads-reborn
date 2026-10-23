import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { CrColors } from "#bot/utils/colors";
import { deferReply, deferUpdate, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteString } from "#bot/utils/emotes";
import { formatMoney } from "#bot/utils/ui";
import { disableButtons } from "#bot/utils/collectors";
import { checkUser } from "#bot/utils/userUtils";
import { Heist } from "#core/models/Heist";
import { MultiplayerSession, type MultiplayerSessionView } from "#core/models/MultiplayerSession";
import { Vault } from "#core/models/Vault";
import { getWeeklyTarget, HeistMissionId } from "#core/types/Heist";
import { GangColor } from "#core/types/GangColors";
import { getLanguageFromLocale, Language, type Localization } from "#core/models/Language";
import type { User } from "#core/models/User";
import { ClassId } from "#core/types/Classes";
import { Log } from "#shared/log";
import {
	ButtonStyle,
	type ChatInputCommandInteraction,
	Colors,
	Locale,
	MessageFlags,
	SlashCommandBuilder,
	time,
	TimestampStyles,
} from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("heist")
		.setNameLocalization(Locale.PortugueseBR, "golpe")
		.setNameLocalization(Locale.SpanishES, "golpe")
		.setDescription("Plan and execute a gang heist")
		.setDescriptionLocalization(Locale.PortugueseBR, "Planeje e execute um golpe com sua gangue")
		.setDescriptionLocalization(Locale.SpanishES, "Planificar y ejecutar un golpe con tu cuadrilla"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];
		await deferReply(interaction);

		const gang = await user.GetGang();
		if (!gang) {
			const container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(Colors.Red)
				.addTexts([
					`## ${s.title}`,
					`${EmoteString.Gang} ${s.notInGang}`
				]);
			return replyWithContainer(interaction, container);
		}
		const sessionGang = gang;

		// Main Menu View Generator
		const getMainMenuContainer = async () => {
			const heistState = await Heist.GetHeistState(gang.Id);
			const vaultBalances = await Vault.GetBalances();
			const target = getWeeklyTarget();
			const activeVaultBalance = target.VaultType === "bank" ? vaultBalances.bank : vaultBalances.casino;

			let bonus = 0;
			if (heistState.mission1Completed) bonus += 4;
			if (heistState.mission2Completed) bonus += 2;
			if (heistState.mission3Completed) bonus += 5;

			const targetName = target.Name[language];
			const vaultValue = formatMoney(activeVaultBalance, language);

			const container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(GangColor[gang.Color].Color)
				.addSectionComponents(section => section
					.addTexts([
						`# ${s.title}`,
						s.currentTarget(targetName, vaultValue),
					])
					.setThumbnailAccessory(thumb => thumb.setURL(target.Thumbnail)),
				)
				.addLargeSeparator()
				.addSectionComponents(howItWorks => howItWorks
					.addTexts([
						s.introHowItWorks,
					])
					.setButtonAccessory(btn => btn
						.setCustomId("info_how_it_works")
						.setLabel(s.btnHowItWorks)
						.setStyle(ButtonStyle.Secondary),
					)
				)
				.addLargeSeparator()
				.addSectionComponents(submissions => submissions
					.addTexts([
						s.introSubmissions,
					])
					.setButtonAccessory(btn => btn
						.setCustomId("info_submissions")
						.setLabel(s.btnSubmissions)
						.setStyle(ButtonStyle.Secondary),
					)
				)
				.addLargeSeparator()
				.addSectionComponents(actions => actions
					.addTexts([
						s.actionsIntro,
					])
					.setButtonAccessory(btn => btn
						.setCustomId("open_actions_menu")
						.setLabel(s.btnActions)
						.setStyle(ButtonStyle.Primary),
					)
				)
				.addFooter({
					text: `${s.gang} ${gang.Name} • ${s.preparationBonus(bonus)}`
				});
			return container;
		};

		const getActionsContainer = async () => {
			const heistState = await Heist.GetHeistState(gang.Id);
			const target = getWeeklyTarget();
			const targetName = target.Name[language];
			const isBank = target.VaultType === "bank";
			const storyText = isBank ? s.bankStories : s.casinoStories;

			const container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(GangColor[gang.Color].Color)
				.addTexts([
					storyText,
				])
				.addLargeSeparator();
			const openHeist = MultiplayerSession.GetVisibleSessions(user.Id, gang.Id)
				.find(session => session.kind === "gangHeist" && session.phase === "lobby");
			if (openHeist && !openHeist.participants.some(participant => participant.userId === user.Id)) {
				container.addButtonRow(btn => btn
					.setCustomId("join_active_heist")
					.setLabel(s.participate)
					.setStyle(ButtonStyle.Primary),
				);
			}

			const m1Done = heistState.mission1Completed;
			const m1Cooldown = !!(heistState.mission1CooldownUntil && heistState.mission1CooldownUntil > new Date());
			const m2Done = heistState.mission2Completed;
			const hasEnoughMoney = gang.Money >= Heist.GETAWAY_CARS_COST;
			const m3Done = heistState.mission3Completed;
			const m3Cooldown = !!(heistState.mission3CooldownUntil && heistState.mission3CooldownUntil > new Date());
			const heistCooldown = !!(heistState.heistCooldownUntil && heistState.heistCooldownUntil > new Date());

			const isMainAllowed = await Vault.IsMainHeistAllowed();
			const day = new Date().getDay();
			const isAllowedDay = day === 1 || day === 3 || day === 5;
			const heistDisabled = heistCooldown || !isMainAllowed || !isAllowedDay;

			container.addButtonRow(
				btn => btn
					.setCustomId("m1_blueprint")
					.setLabel(m1Done ? s.doneLabel : (m1Cooldown ? s.cooldownLabel : s.blueprintLabel))
					.setStyle(m1Done ? ButtonStyle.Success : ButtonStyle.Secondary)
					.setDisabled(m1Done || m1Cooldown),
				btn => btn
					.setCustomId("m2_getaway")
					.setLabel(m2Done ? s.doneLabel : s.getawayLabel)
					.setStyle(m2Done ? ButtonStyle.Success : ButtonStyle.Secondary)
					.setDisabled(m2Done || !hasEnoughMoney),
				btn => btn
					.setCustomId("m3_hack")
					.setLabel(m3Done ? s.doneLabel : (m3Cooldown ? s.cooldownLabel : s.hackLabel))
					.setStyle(m3Done ? ButtonStyle.Success : ButtonStyle.Secondary)
					.setDisabled(m3Done || m3Cooldown),
				btn => btn
					.setCustomId("m4_heist")
					.setEmoji(target.Emote.Id)
					.setLabel(s.heistLabel(targetName))
					.setStyle(ButtonStyle.Primary)
					.setDisabled(heistDisabled),
				btn => btn
					.setCustomId("back_to_menu")
					.setLabel(s.btnBack)
					.setStyle(ButtonStyle.Secondary)

			)
				.addFooter({
					text: `${s.gang} ${gang.Name}`
				});
			return container;
		};

		let currentContainer = await getMainMenuContainer();
		const reply = await replyWithContainer(interaction, currentContainer);

		let activeMenuCollector: ReturnType<NonNullable<typeof reply>["createMessageComponentCollector"]> | null = null;

		const startMenuCollector = () => {
			if (activeMenuCollector) {
				try {
					activeMenuCollector.stop("restarting");
				}
				catch {
					// Ignore collector stop errors
				}
			}

			const collector = reply!.createMessageComponentCollector({ idle: 120_000 });
			activeMenuCollector = collector;

			collector.on("end", async (_collected, reason) => {
				if (reason !== "starting_mission" && reason !== "restarting") {
					await disableButtons(interaction, currentContainer);
				}
			});

			collector.on("collect", async (btnInteraction) => {
				if (btnInteraction.user.id !== user.Id) {
					return btnInteraction.reply({ content: s.onlyLeader, flags: MessageFlags.Ephemeral });
				}

				const customId = btnInteraction.customId;

				if (customId === "info_how_it_works") {
					await deferUpdate(btnInteraction);
					currentContainer = new CustomContainerBuilder()
						.setUser(user)
						.setAccentColor(GangColor[gang.Color].Color)
						.addTexts([
							s.detailsHowItWorks,
						])
						.addLargeSeparator()
						.addButtonRow(
							btn => btn
								.setCustomId("back_to_menu")
								.setLabel(s.btnBack)
								.setStyle(ButtonStyle.Secondary),
						)
						.addFooter({
							text: `${s.gang} ${gang.Name}`,
						});
					await replyWithContainer(interaction, currentContainer);
					return;
				}

				if (customId === "info_submissions") {
					await deferUpdate(btnInteraction);
					currentContainer = new CustomContainerBuilder()
						.setUser(user)
						.setAccentColor(GangColor[gang.Color].Color)
						.addTexts([
							s.detailsSubmissions,
						])
						.addLargeSeparator()
						.addButtonRow(
							btn => btn
								.setCustomId("back_to_menu")
								.setLabel(s.btnBack)
								.setStyle(ButtonStyle.Secondary),
						)
						.addFooter({
							text: `${s.gang} ${gang.Name}`,
						});
					await replyWithContainer(interaction, currentContainer);
					return;
				}

				if (customId === "open_actions_menu") {
					await deferUpdate(btnInteraction);
					currentContainer = await getActionsContainer();
					await replyWithContainer(interaction, currentContainer);
					return;
				}

				if (customId === "back_to_menu") {
					await deferUpdate(btnInteraction);
					currentContainer = await getMainMenuContainer();
					await replyWithContainer(interaction, currentContainer);
					return;
				}
				if (customId === "join_active_heist") {
					const activeSession = MultiplayerSession.GetVisibleSessions(user.Id, gang.Id)
						.find(session => session.kind === "gangHeist" && session.phase === "lobby");
					if (!activeSession || activeSession.missionId === null) {
						return btnInteraction.reply({ content: s.cannotStart, flags: MessageFlags.Ephemeral });
					}
					await deferUpdate(btnInteraction);
					collector.stop("starting_mission");
					await showHeistLobby(activeSession.missionId as HeistMissionId, activeSession.id);
					return;
				}
				let missionId: HeistMissionId = HeistMissionId.Blueprint;

				if (customId === "m1_blueprint") missionId = HeistMissionId.Blueprint;
				else if (customId === "m2_getaway") missionId = HeistMissionId.GetawayCars;
				else if (customId === "m3_hack") missionId = HeistMissionId.HackCameras;
				else if (customId === "m4_heist") missionId = HeistMissionId.MainHeist;

				const checkStart = await Heist.ValidateStart(user, gang, missionId);
				if (!checkStart.success) {
					let errText: string = s.cannotStart;
					if (checkStart.reason === "onlyLeader") errText = s.onlyLeader;
					else if (checkStart.reason === "noBase") errText = s.noBase;
					else if (checkStart.reason === "scheduleBlock") errText = s.scheduleBlock;
					else if (checkStart.reason === "noMoney") errText = s.noMoney;
					else if (checkStart.reason === "missionCompleted") errText = s.missionCompleted;
					else if (checkStart.reason === "missionCooldown") errText = s.missionCooldown(time(checkStart.time!, TimestampStyles.RelativeTime));
					else if (checkStart.reason === "heistCooldown") errText = s.heistCooldown(time(checkStart.time!, TimestampStyles.RelativeTime));

					return btnInteraction.reply({ content: errText, flags: MessageFlags.Ephemeral });
				}

				await deferUpdate(btnInteraction);
				collector.stop("starting_mission"); // Stop main menu interaction

				// Mission 2 is instant buy
				if (missionId === HeistMissionId.GetawayCars) {
					const purchase = await MultiplayerSession.BuyGangHeistGetawayCars(user, user.Language);
					if (purchase.success) {
						currentContainer = new CustomContainerBuilder()
							.setUser(user)
							.setAccentColor(GangColor[gang.Color].Color)
							.addTexts([
								`# ${s.successTitle}`,
								`${EmoteString.Victory} ${s.mission2Success}`,
							])
							.addLargeSeparator()
							.addButtonRow(
								btn => btn
									.setCustomId("back_to_menu")
									.setLabel(s.btnBack)
									.setStyle(ButtonStyle.Secondary),
							)
							.addFooter({
								text: `${s.gang} ${gang.Name}`,
							});
						await replyWithContainer(interaction, currentContainer);
						startMenuCollector();
					}
					else {
						await btnInteraction.followUp({ content: purchase.message, flags: MessageFlags.Ephemeral });
						startMenuCollector();
					}
					return;
				}

				await showHeistLobby(missionId);
			});
		};

		async function showHeistLobby(missionId: HeistMissionId, existingSessionId?: string) {
			let session: MultiplayerSessionView | null;
			if (existingSessionId) {
				session = MultiplayerSession.GetVisibleSession(existingSessionId, user.Id, sessionGang.Id);
			}
			else {
				const started = await MultiplayerSession.StartGangHeist(user, missionId, "discord");
				if (!started.success) {
					currentContainer = new CustomContainerBuilder()
						.setUser(user)
						.setAccentColor(Colors.Red)
						.addTexts([started.message])
						.addButtonRow(btn => btn
							.setCustomId("back_to_menu")
							.setLabel(s.btnBack)
							.setStyle(ButtonStyle.Secondary),
						);
					await replyWithContainer(interaction, currentContainer);
					startMenuCollector();
					return;
				}
				session = started.session;
			}
			if (!session || session.missionId === null) {
				currentContainer = await getMainMenuContainer();
				await replyWithContainer(interaction, currentContainer);
				startMenuCollector();
				return;
			}

			const target = getWeeklyTarget();
			const targetName = `${target.Emote.String} ${target.Name[language]}`;
			const lobbyName = session.missionId === HeistMissionId.Blueprint
				? s.blueprintLabel
				: session.missionId === HeistMissionId.HackCameras
					? s.hackLabel
					: s.heistLabel(targetName);

			const getLobbyContainer = async (view: MultiplayerSessionView) => {
				let chance: number;
				if (view.missionId === HeistMissionId.Blueprint) {
					chance = Math.min(100, 10 + view.participants.length * 2);
				}
				else if (view.missionId === HeistMissionId.HackCameras) {
					chance = Math.min(100, 15 + view.participants.length);
				}
				else {
					let totalAttack = 0;
					for (const participant of view.participants) {
						let attack = participant.attack;
						if (participant.classId === ClassId.Hobo) attack *= 0.9;
						else if (participant.classId === ClassId.Assassin) attack *= 1.1;
						totalAttack += attack;
					}
					chance = totalAttack / 50;
					const heistState = await Heist.GetHeistState(sessionGang.Id);
					if (heistState.mission1Completed) chance += 4;
					if (heistState.mission2Completed) chance += 2;
					if (heistState.mission3Completed) chance += 5;
					chance = Math.min(100, Math.max(0, chance));
				}

				const container = new CustomContainerBuilder()
					.setUser(user)
					.setAccentColor(GangColor[sessionGang.Color].Color)
					.addTexts([
						`# ${s.lobbyTitle(lobbyName)}`,
						view.phase === "lobby"
							? s.lobbyDescription(chance.toFixed(2), view.participants.length, view.maxParticipants)
							: `${EmoteString.Waiting} **${s.inProgress}**`,
						view.participants.map(participant => `- ${participant.nickname}`).join("\n"),
					])
					.addLargeSeparator();

				if (view.phase === "lobby") {
					container.addButtonRow(btn => btn
						.setCustomId("join_lobby")
						.setLabel(s.participate)
						.setStyle(ButtonStyle.Primary));
					if (view.ownerId === user.Id) {
						container.addButtonRow(btn => btn
							.setCustomId("abort_lobby")
							.setLabel(s.abort)
							.setStyle(ButtonStyle.Secondary));
					}
				}
				else if (view.phase === "completed" && view.result) {
					const result = MultiplayerSession.DecodeResult<{
						success: boolean;
						stolenAmount?: number;
						shareAmount?: number;
						jailHours?: number;
					}>(view.result);
					let resultText: string;
					if (view.missionId === HeistMissionId.Blueprint) {
						resultText = result.success ? s.mission1Success : s.mission1Fail;
					}
					else if (view.missionId === HeistMissionId.HackCameras) {
						resultText = result.success ? s.mission3Success : s.mission3Fail;
					}
					else {
						resultText = result.success
							? s.mainSuccess(formatMoney(result.stolenAmount ?? 0, language), formatMoney(result.shareAmount ?? 0, language))
							: s.mainFail(result.jailHours ?? 0);
					}
					container
						.setAccentColor(result.success ? CrColors.Default : CrColors.Hospital)
						.addTexts([result.success ? s.successTitle : s.failTitle, resultText])
						.addButtonRow(btn => btn
							.setCustomId("back_to_menu")
							.setLabel(s.btnBack)
							.setStyle(ButtonStyle.Secondary));
				}
				else if (view.phase === "aborted") {
					container
						.addTexts([s.aborted])
						.addButtonRow(btn => btn
							.setCustomId("back_to_menu")
							.setLabel(s.btnBack)
							.setStyle(ButtonStyle.Secondary));
				}

				return container.addFooter({ text: `${s.gang} ${sessionGang.Name}` });
			};

			currentContainer = await getLobbyContainer(session);
			const lobbyReply = await replyWithContainer(interaction, currentContainer);
			const lobbyCollector = lobbyReply?.createMessageComponentCollector({
				time: session.missionId === HeistMissionId.MainHeist ? 90_000 : 60_000,
			});
			const updateSession = async (view: MultiplayerSessionView) => {
				if (view.id !== session!.id) return;
				currentContainer = await getLobbyContainer(view);
				await replyWithContainer(interaction, currentContainer);
			};
			let updateQueue = Promise.resolve();
			const queueUpdate = (view: MultiplayerSessionView): Promise<void> => {
				updateQueue = updateQueue.then(() => updateSession(view)).catch(error => {
					Log.Error(`Failed to update heist session ${view.id}: ${error}`);
				});
				return updateQueue;
			};
			const unsubscribe = MultiplayerSession.Subscribe(user.Id, sessionGang.Id, view => {
				if (view.id === session!.id) {
					void queueUpdate(view);
				}
			});
			const latest = MultiplayerSession.GetVisibleSession(session.id, user.Id, sessionGang.Id);
			if (latest && (latest.phase !== session.phase || latest.participants.length !== session.participants.length)) {
				await queueUpdate(latest);
			}

			lobbyCollector?.on("collect", async lobbyBtn => {
				await deferUpdate(lobbyBtn);
				if (lobbyBtn.customId === "abort_lobby") {
					const result = await MultiplayerSession.Abort(session!.id, lobbyBtn.user.id, getLanguageFromLocale(lobbyBtn.locale));
					if (!result.success) {
						await lobbyBtn.followUp({ content: result.message, flags: MessageFlags.Ephemeral });
					}
					return;
				}
				if (lobbyBtn.customId !== "join_lobby") return;
				const participant = await checkUser(lobbyBtn.user.id, interaction);
				if (!participant) return;
				const result = await MultiplayerSession.Join(session!.id, participant, participant.Language);
				if (!result.success) {
					await lobbyBtn.followUp({
						content: result.message,
						flags: MessageFlags.Ephemeral,
					});
				}
			});
			lobbyCollector?.on("end", () => {
				void disableButtons(interaction, currentContainer);
			});

			try {
				const completed = await MultiplayerSession.WaitForCompletion(session.id);
				await updateQueue;
				await updateSession(completed);
				startMenuCollector();
			}
			finally {
				unsubscribe();
			}
		}

		startMenuCollector();
	},
};

const Strings = {
	[Language.English]: {
		notInGang: "You are not in a gang.",
		gang: "Gang",
		onlyLeader: "Only the Leader can orchestrate a heist.",
		noBase: "Your gang cannot perform a heist without a base.",
		scheduleBlock: "You can only perform the main heist on Monday, Wednesday, or Friday.",
		heistCooldown: (timeStr: string) => `Your gang must wait until ${timeStr} to attempt the heist again.`,
		missionCompleted: "Your gang has already completed this mission.",
		missionCooldown: (timeStr: string) => `Your gang must wait until ${timeStr} to attempt this mission again.`,
		noMoney: `Your gang does not have enough money in the vault (requires ${formatMoney(Heist.GETAWAY_CARS_COST, Language.English)}).`,
		title: "Heists",
		currentTarget: (name: string, val: string) => `Current target:\n## ${name} (${val})`,
		vaultBalance: (val: string) => `Vault balance:\n## ${val}`,
		preparationBonus: (bonus: number) => `Preparation bonus: \`+${bonus}% chance\``,
		introHowItWorks: "### 🏦 How heists work\nLearn about vault rotations, payouts, and modifiers.",
		btnHowItWorks: "How it works",
		introSubmissions: "### 📁 Preparation missions\nLearn how to increase your success rate and prepare for the heist.",
		btnSubmissions: "Preparation guide",
		btnBack: "Back",
		actionsHeader: "Actions",
		actionsIntro: `### ${EmoteString.React} Action plan / execute\nReady to prepare the heist or execute the main robbery?`,
		btnActions: "Plan actions",
		bankStories:
			`# Preparation plan - Central Bank\n` +
			`### 📁 Steal blueprint\n` +
			`Stealing the bank blueprints will reveal the vault's layout, security grids, and entry routes.\n` +
			`### 🚗 Buy getaway cars\n` +
			`A bank heist is loud; buying getaway cars will help you escape the police. The alternative is to run barefoot!\n` +
			`### 💻 Hack cameras\n` +
			`Hacking the bank's mainframe will loop surveillance feeds and delay SWAT response.\n` +
			`### ${EmoteString.CentralBank} Execute heist\n` +
			`Break into the vault and secure the Central Bank reserves!`,
		casinoStories:
			`# Preparation plan - Casino\n` +
			`### 📁 Steal blueprint\n` +
			`Stealing the blueprints will help you navigate the complex hallways and backrooms of the Casino.\n` +
			`### 🚗 Buy getaway cars\n` +
			`Casino cash bags are heavy; getaway cars ensure a swift getaway. The alternative is to run barefoot!\n` +
			`### 💻 Hack cameras\n` +
			`Hacking the casino's surveillance system will feed loops to the security team and bypass laser grids.\n` +
			`### ${EmoteString.Casino} Execute heist\n` +
			`Penetrate the Casino vault and clean out the high-rollers' cash!`,
		doneLabel: "Done",
		cooldownLabel: "Cooldown",
		cannotStart: "Cannot start.",
		detailsHowItWorks:
			`# How heists work\n` +
			`### Vault rotation\n` +
			`The target rotates weekly between the **${EmoteString.CentralBank} Central Bank** (5% of shop purchases) and the **${EmoteString.Casino} Casino** (10% of casino bets).\n` +
			`### Payouts\n` +
			`Steals **10% to 20%** of the active vault, split equally among participants (+10% for Thief) and the gang vault.\n` +
			`### Availability\n` +
			`Available on **Mondays, Wednesdays, and Fridays**.\n` +
			`### Success chance\n` +
			`Based on participant weapons, class modifiers, and preparation bonuses.`,
		detailsSubmissions:
			`# Preparation missions\n` +
			`### 📁 Steal blueprint\n` +
			`+4% success chance (6h cooldown).\n` +
			`### 🚗 Buy getaway cars\n` +
			`+2% success chance (costs **${formatMoney(Heist.GETAWAY_CARS_COST, Language.English)}** from gang vault).\n` +
			`### 💻 Hack cameras\n` +
			`+5% success chance (6h cooldown).\n` +
			`\n-# Sub-missions are **always available** and provide cumulative bonuses for the main heist.`,
		blueprintLabel: "📁 Steal blueprint (+4%)",
		getawayLabel: "🚗 Buy getaway cars (+2%)",
		hackLabel: "💻 Hack cameras (+5%)",
		heistLabel: (target: string) => `Execute heist: ${target}`,
		lobbyTitle: (name: string) => `Heist preparation: ${name}`,
		lobbyDescription: (chance: string, pCount: number, maxCount: number) => `Current success chance: **${chance}%**\nMembers joined: **[${pCount}/${maxCount}]**\n\n**Participants:**`,
		participate: "Participate",
		abort: "Abort",
		alreadyIn: "You are already in this heist lobby.",
		cannotParticipate: (reason: string) => {
			switch (reason) {
			case "notInSameGang": return "You cannot participate: You are not a member of this gang.";
			case "notInGang": return "You cannot participate: You are not in a gang.";
			case "lobbyFull": return "You cannot participate: The lobby is full.";
			case "dead": return "You cannot participate: You are dead.";
			case "scavenging": return "You cannot participate: You are scavenging.";
			case "working": return "You cannot participate: You are working.";
			case "prison": return "You cannot participate: You are imprisoned.";
			case "wanted": return "You cannot participate: You are wanted.";
			case "hospital": return "You cannot participate: You are hospitalized.";
			case "escaping": return "You cannot participate: You are escaping.";
			case "casino": return "You cannot participate: You are in a casino game.";
			case "defendingInvestment": return "You cannot participate: You are defending an investment.";
			case "gangAction": return "You cannot participate: You are participating in another gang action.";
			default: return "You cannot participate: You are busy.";
			}
		},
		inProgress: "Heist in progress...",
		aborted: "Heist aborted by the Leader.",
		successTitle: "Success!",
		failTitle: "Failure!",
		mission1Success: "Blueprint stolen successfully!",
		mission1Fail: "Federal police caught you! Blueprint theft failed and participants are jailed.",
		mission2Success: "Getaway cars purchased successfully!",
		mission3Success: "Cameras hacked successfully!",
		mission3Fail: "IP address was traced by federal agents! Hack failed and participants are jailed.",
		mainSuccess: (stolen: string, share: string) => `Success! Stole **${stolen}** from the vault.\nEach participant received **${share}**, and the gang fund received **${share}**.`,
		mainFail: (hours: number) => `Failure! You were caught escaping and all participants are jailed for **${hours} hours**.`,
	},
	[Language.Portuguese]: {
		notInGang: "Você não está em uma gangue.",
		gang: "Gangue",
		onlyLeader: "Somente o Líder pode orquestrar um golpe.",
		noBase: "Sua gangue não pode realizar um golpe sem uma base.",
		scheduleBlock: "Você só pode realizar o golpe principal na Segunda, Quarta ou Sexta-feira.",
		heistCooldown: (timeStr: string) => `Sua gangue deve esperar até ${timeStr} para tentar o golpe novamente.`,
		missionCompleted: "Sua gangue já concluiu esta missão.",
		missionCooldown: (timeStr: string) => `Sua gangue deve esperar até ${timeStr} para tentar esta missão novamente.`,
		noMoney: `Sua gangue não tem dinheiro suficiente em caixa (necessário ${formatMoney(Heist.GETAWAY_CARS_COST, Language.Portuguese)}).`,
		title: "Golpes",
		currentTarget: (name: string, val: string) => `Alvo atual:\n## ${name} (${val})`,
		vaultBalance: (val: string) => `Saldo do cofre:\n## ${val}`,
		preparationBonus: (bonus: number) => `Bônus de preparação: \`+${bonus}% de chance\``,
		introHowItWorks: "### 🏦 Como funcionam os golpes\nSaiba mais sobre rotação de cofres, pagamentos e modificadores.",
		btnHowItWorks: "Como funciona",
		introSubmissions: "### 📁 Missões de preparação\nSaiba como aumentar suas chances de sucesso e preparar o golpe.",
		btnSubmissions: "Guia de preparação",
		btnBack: "Voltar",
		actionsHeader: "Ações",
		actionsIntro: `### ${EmoteString.React} Plano de ação / executar\nPronto para preparar o golpe ou executar o roubo principal?`,
		btnActions: "Planejar ações",
		bankStories:
			`# Plano de preparação - Banco Central\n` +
			`### 📁 Roubar planta\n` +
			`Roubar as plantas do banco revelará o layout do cofre, redes de segurança e rotas de entrada.\n` +
			`### 🚗 Comprar carros\n` +
			`Um assalto ao banco é barulhento; comprar carros de fuga ajudará você a escapar da polícia. A alternativa é correr descalço!\n` +
			`### 💻 Hackear câmeras\n` +
			`Hackear o sistema do banco desativará alarmes e atrasará a resposta da SWAT.\n` +
			`### ${EmoteString.CentralBank} Executar golpe\n` +
			`Invada o cofre e garanta as reservas do Banco Central!`,
		casinoStories:
			`# Plano de preparação - Cassino\n` +
			`### 📁 Roubar planta\n` +
			`Roubar as plantas ajudará você a navegar pelos complexos corredores e salas dos fundos do Cassino.\n` +
			`### 🚗 Comprar carros\n` +
			`Malas de dinheiro de cassino são pesadas; carros de fuga garantem uma fuga rápida. A alternativa é correr descalço!\n` +
			`### 💻 Hackear câmeras\n` +
			`Hackear o sistema de vigilância do cassino colocará as câmeras em loop e burlará sensores a laser.\n` +
			`### ${EmoteString.Casino} Executar golpe\n` +
			`Penetre no cofre do cassino e limpe o dinheiro dos grandes apostadores!`,
		doneLabel: "Concluído",
		cooldownLabel: "Aguarde",
		cannotStart: "Não é possível iniciar.",
		detailsHowItWorks:
			`# Como funcionam os golpes\n` +
			`### Rotação de cofres\n` +
			`O alvo rotaciona semanalmente entre o **${EmoteString.CentralBank} Banco Central** (5% das compras da loja) e o **${EmoteString.Casino} Cassino** (10% das apostas).\n` +
			`### Pagamentos\n` +
			`Rouba de **10% a 20%** do cofre ativo, dividido igualmente entre participantes (+10% para Ladrão) e o caixa da gangue.\n` +
			`### Disponibilidade\n` +
			`Disponível nas **Segundas, Quartas e Sextas-feiras**.\n` +
			`### Chance de sucesso\n` +
			`Baseada nas armas dos participantes, modificadores de classe e bônus de preparação.`,
		detailsSubmissions:
			`# Missões de preparação\n` +
			`### 📁 Roubar planta\n` +
			`+4% chance de sucesso (cooldown de 6h).\n` +
			`### 🚗 Comprar carros\n` +
			`+2% chance de sucesso (custa **${formatMoney(Heist.GETAWAY_CARS_COST, Language.Portuguese)}** do caixa da gangue).\n` +
			`### 💻 Hackear câmeras\n` +
			`+5% chance de sucesso (cooldown de 6h).\n` +
			`\n-# As submissões estão **sempre disponíveis** e fornecem bônus cumulativos para o golpe principal.`,
		blueprintLabel: "📁 Roubar planta (+4%)",
		getawayLabel: "🚗 Comprar carros (+2%)",
		hackLabel: "💻 Hackear câmeras (+5%)",
		heistLabel: (target: string) => `Executar golpe: ${target}`,
		lobbyTitle: (name: string) => `Preparação do golpe: ${name}`,
		lobbyDescription: (chance: string, pCount: number, maxCount: number) => `Chance de sucesso atual: **${chance}%**\nMembros participantes: **[${pCount}/${maxCount}]**\n\n**Participantes:**`,
		participate: "Participar",
		abort: "Abortar",
		alreadyIn: "Você já está participando deste golpe.",
		cannotParticipate: (reason: string) => {
			switch (reason) {
			case "notInSameGang": return "Você não pode participar: Você não é membro desta gangue.";
			case "notInGang": return "Você não pode participar: Você não está em uma gangue.";
			case "lobbyFull": return "Você não pode participar: O lobby está cheio.";
			case "dead": return "Você não pode participar: Você está morto.";
			case "scavenging": return "Você não pode participar: Você está coletando itens.";
			case "working": return "Você não pode participar: Você está trabalhando.";
			case "prison": return "Você não pode participar: Você está preso.";
			case "wanted": return "Você não pode participar: Você está sendo procurado.";
			case "hospital": return "Você não pode participar: Você está hospitalizado.";
			case "escaping": return "Você não pode participar: Você está fugindo.";
			case "casino": return "Você não pode participar: Você está jogando no cassino.";
			case "defendingInvestment": return "Você não pode participar: Você está defendendo um investimento.";
			case "gangAction": return "Você não pode participar: Você já está em outra ação de gangue.";
			default: return "Você não pode participar: Você está ocupado.";
			}
		},
		inProgress: "Golpe em andamento...",
		aborted: "Golpe abortado pelo Líder.",
		successTitle: "Sucesso!",
		failTitle: "Falha!",
		mission1Success: "Planta do banco roubada com sucesso!",
		mission1Fail: "A polícia federal pegou vocês! O roubo da planta falhou e os participantes foram presos.",
		mission2Success: "Carros de fuga comprados com sucesso!",
		mission3Success: "Câmeras hackeadas com sucesso!",
		mission3Fail: "O endereço IP foi rastreado pelos agentes federais! O hack falhou e os participantes foram presos.",
		mainSuccess: (stolen: string, share: string) => `Sucesso! Roubados **${stolen}** do cofre.\nCada participante recebeu **${share}**, e o caixa da gangue recebeu **${share}**.`,
		mainFail: (hours: number) => `Falha! Vocês foram pegos tentando escapar e todos os participantes ficarão presos por **${hours} horas**.`,
	},
	[Language.Spanish]: {
		notInGang: "No estás en una cuadrilla.",
		gang: "Cuadrilla",
		onlyLeader: "Solo el Líder puede organizar un golpe.",
		noBase: "Tu cuadrilla no puede realizar un golpe sin una base.",
		scheduleBlock: "Solo puedes realizar el golpe principal el Lunes, Miércoles o Viernes.",
		heistCooldown: (timeStr: string) => `Tu cuadrilla debe esperar hasta ${timeStr} para intentar el golpe nuevamente.`,
		missionCompleted: "Tu cuadrilla ya ha completado esta misión.",
		missionCooldown: (timeStr: string) => `Tu cuadrilla debe esperar hasta ${timeStr} para intentar esta misión nuevamente.`,
		noMoney: `Tu cuadrilla no tiene suficiente dinero en caja (se requiere ${formatMoney(Heist.GETAWAY_CARS_COST, Language.Spanish)}).`,
		title: "Golpes",
		currentTarget: (name: string, val: string) => `Objetivo actual:\n## ${name} (${val})`,
		vaultBalance: (val: string) => `Saldo de la bóveda:\n## ${val}`,
		preparationBonus: (bonus: number) => `Bono de preparación: \`+${bonus}% de probabilidad\``,
		introHowItWorks: "### 🏦 Cómo funcionan los golpes\nConozca más sobre la rotación de cajas, pagos y modificadores.",
		btnHowItWorks: "Cómo funciona",
		introSubmissions: "### 📁 Misiones de preparación\nConozca cómo aumentar su probabilidad de éxito y preparar el atraco.",
		btnSubmissions: "Guía de preparación",
		btnBack: "Volver",
		actionsHeader: "Acciones",
		actionsIntro: `### ${EmoteString.React} Plan de acción / ejecutar\n¿Listo para preparar el golpe o ejecutar el robo principal?`,
		btnActions: "Planear acciones",
		bankStories:
			`# Plan de preparación - Banco Central\n` +
			`### 📁 Robar plano\n` +
			`Robar los planos del banco revelará el diseño de la bóveda, las redes de seguridad y las rutas de entrada.\n` +
			`### 🚗 Comprar autos\n` +
			`Un atraco al banco es ruidoso; comprar autos de escape te ayudará a escapar de la policía. ¡La alternativa es correr descalzo!\n` +
			`### 💻 Hackear cámaras\n` +
			`Hackear el sistema central del banco desactivará alarmas y retrasará la respuesta de la SWAT.\n` +
			`### ${EmoteString.CentralBank} Executar golpe\n` +
			`¡Entra en la bóveda y asegura las reservas del Banco Central!`,
		casinoStories:
			`# Plan de preparación - Casino\n` +
			`### 📁 Robar plano\n` +
			`Robar los planos te ayudará a navegar por los complejos pasillos y salas traseras del Casino.\n` +
			`### 🚗 Comprar autos\n` +
			`Las bolsas de dinero del casino son pesadas; los autos de escape garantizan una huida rápida. ¡La alternativa es correr descalzo!\n` +
			`### 💻 Hackear cámaras\n` +
			`Hackear el sistema de vigilancia del casino pondrá las cámaras en bucle y evitará sensores láser.\n` +
			`### ${EmoteString.Casino} Executar golpe\n` +
			`¡Penetra en la bóveda del casino y limpia el dinero de los grandes apostadores!`,
		doneLabel: "Completado",
		cooldownLabel: "Espera",
		cannotStart: "No se puede iniciar.",
		detailsHowItWorks:
			`# Cómo funcionan los golpes\n` +
			`### Rotación de bóvedas\n` +
			`El objetivo rota semanalmente entre el **${EmoteString.CentralBank} Banco Central** (5% de las compras de la tienda) y el **${EmoteString.Casino} Casino** (10% de las apuestas).\n` +
			`### Pagos\n` +
			`Roba del **10% al 20%** de la bóveda activa, dividido en partes iguales entre participantes (+10% para Ladrón) y la caja de la cuadrilla.\n` +
			`### Disponibilidad\n` +
			`Disponible los **Lunes, Miércoles y Viernes**.\n` +
			`### Probabilidad de éxito\n` +
			`Basada en las armas de los participantes, modificadores de clase y bonos de preparación.`,
		detailsSubmissions:
			`# Misiones de preparación\n` +
			`### 📁 Robar plano\n` +
			`+4% probabilidad de éxito (cooldown de 6h).\n` +
			`### 🚗 Comprar autos\n` +
			`+2% probabilidad de éxito (cuesta **${formatMoney(Heist.GETAWAY_CARS_COST, Language.Spanish)}** de la cuadrilla).\n` +
			`### 💻 Hackear cámaras\n` +
			`+5% probabilidad de éxito (cooldown de 6h).\n` +
			`\n-# Las submisiones están **siempre disponibles** y otorgan bonos acumulativos para el golpe principal.`,
		blueprintLabel: "📁 Robar plano (+4%)",
		getawayLabel: "🚗 Comprar autos (+2%)",
		hackLabel: "💻 Hackear cámaras (+5%)",
		heistLabel: (target: string) => `Ejecutar golpe: ${target}`,
		lobbyTitle: (name: string) => `Preparación del golpe: ${name}`,
		lobbyDescription: (chance: string, pCount: number, maxCount: number) => `Probabilidad de éxito actual: **${chance}%**\nMiembros participantes: **[${pCount}/${maxCount}]**\n\n**Participantes:**`,
		participate: "Participar",
		abort: "Abortar",
		alreadyIn: "Ya estás participando en este golpe.",
		cannotParticipate: (reason: string) => {
			switch (reason) {
			case "notInSameGang": return "No puedes participar: No eres miembro de esta cuadrilla.";
			case "notInGang": return "No puedes participar: No estás en una cuadrilla.";
			case "lobbyFull": return "No puedes participar: El lobby está lleno.";
			case "dead": return "No puedes participar: Estás muerto.";
			case "scavenging": return "No puedes participar: Estás recolectando objetos.";
			case "working": return "No puedes participar: Estás trabajando.";
			case "prison": return "No puedes participar: Estás encarcelado.";
			case "wanted": return "No puedes participar: Estás siendo buscado.";
			case "hospital": return "No puedes participar: Estás hospitalizado.";
			case "escaping": return "No puedes participar: Estás escapando.";
			case "casino": return "No puedes participar: Estás jugando en el casino.";
			case "defendingInvestment": return "No puedes participar: Estás defendiendo una inversión.";
			case "gangAction": return "No puedes participar: Ya estás en otra acción de cuadrilla.";
			default: return "No puedes participar: Estás ocupado.";
			}
		},
		inProgress: "Golpe en curso...",
		aborted: "Golpe abortado por el Líder.",
		successTitle: "¡Éxito!",
		failTitle: "¡Fracaso!",
		mission1Success: "¡Plano del banco robado con éxito!",
		mission1Fail: "¡La policía federal los atrapó! El robo del plano falló y los participantes fueron encarcelados.",
		mission2Success: "¡Autos de escape comprados con éxito!",
		mission3Success: "¡Cámaras hackeadas con éxito!",
		mission3Fail: "¡La dirección IP fue rastreada por agentes federales! El hack falló y los participantes fueron encarcelados.",
		mainSuccess: (stolen: string, share: string) => `¡Éxito! Robados **${stolen}** de la caja fuerte.\nCada participante recibió **${share}**, y la caja de la cuadrilla recibió **${share}**.`,
		mainFail: (hours: number) => `¡Fracaso! Fueron atrapados intentando escapar y todos los participantes serán encarcelados por **${hours} horas**.`,
	},
} as const satisfies Localization;
