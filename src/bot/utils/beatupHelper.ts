import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { deferUpdate, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteId, EmoteString } from "#bot/utils/emotes";
import { defaultComponent, formatMoney } from "#bot/utils/ui";
import { Strings as BeatUpStrings } from "#core/models/BeatUp";
import type { BeatUpInitData, BeatUpOutcomeData } from "#core/models/BeatUp";
import type { User } from "#core/models/User";
import { MultiplayerSession, Strings as MultiplayerStrings } from "#core/models/MultiplayerSession";
import { ButtonBuilder, ButtonStyle, type ChatInputCommandInteraction, ComponentType, type Message, type MessageComponentInteraction, MessageFlags, time, TimestampStyles } from "discord.js";
import { ItemId } from "#core/types/Ids";
import { getClient } from "#bot/client";
import { CrColors } from "#bot/utils/colors";
import { Log } from "#shared/log";

type BeatUpDefenderPromptData = Pick<
	BeatUpInitData,
	"timeInHospitalAditional" | "usedGunSkin" | "usedGunName" | "usedGrenade"
> & { allowedResponses: string[] };

export function buildBeatUpDefenderPrompt(
	attacker: User,
	defender: User,
	data: BeatUpDefenderPromptData,
): CustomContainerBuilder {
	const strings = BeatUpStrings[defender.Language];
	const usedGun = `${data.usedGunSkin} **${data.usedGunName}**${data.usedGrenade ? ` ${strings.andAGrenade}` : ""}`;

	return new CustomContainerBuilder()
		.setAccentColor(CrColors.BeatUp)
		.addTexts([`${EmoteString.Beat} ${strings.beatingInProgress}`])
		.addLargeSeparator()
		.addTexts([
			`**${attacker.GetNameWithImage()}** ${strings.tryingToBeatYou} ${usedGun}`,
			"",
			`-# ${strings.decide}:`,
		])
		.addSectionComponents(fight => fight
			.addTexts([
				`### 💪 **${strings.fight}**`,
				strings.fightDescription(data.timeInHospitalAditional),
			])
			.setButtonAccessory(new ButtonBuilder()
				.setCustomId("fight")
				.setLabel(strings.fight)
				.setStyle(ButtonStyle.Secondary)
				.setEmoji("💪"),
			),
		)
		.addLargeSeparator()
		.addSectionComponents(run => run
			.addTexts([
				`### 👟 **${strings.run}**`,
				strings.runDescription(data.timeInHospitalAditional),
			])
			.setButtonAccessory(new ButtonBuilder()
				.setCustomId("run")
				.setLabel(strings.run)
				.setStyle(ButtonStyle.Secondary)
				.setEmoji("👟")
				.setDisabled(!data.allowedResponses.includes("run")),
			),
		)
		.addLargeSeparator()
		.addSectionComponents(nothing => nothing
			.addTexts([
				`### 🏳️ **${strings.doNothing}**`,
				strings.doNothingDescription,
			])
			.setButtonAccessory(new ButtonBuilder()
				.setCustomId("nothing")
				.setLabel(strings.doNothing)
				.setStyle(ButtonStyle.Secondary)
				.setEmoji("🏳️"),
			),
		)
		.addFooter({
			text: `${formatMoney(defender.Money, defender.Language)} • ${strings.secondsToRespond}`,
		});
}

export function buildBeatUpDefenderResponse(defender: User, response: string): CustomContainerBuilder {
	const strings = BeatUpStrings[defender.Language];
	const action = response === "fight"
		? `### 💪 ${strings.fighting}`
		: response === "run"
			? `### 👟 ${strings.running}`
			: `### 🏳️ ${strings.doingNothing}`;

	return new CustomContainerBuilder()
		.setAccentColor(CrColors.BeatUp)
		.addTexts([`${EmoteString.Beat} ${strings.beatingInProgress}`])
		.addLargeSeparator()
		.addTexts([`${action} ${EmoteString.Waiting}`])
		.addFooter({ text: strings.secondsToRespond });
}

export function buildBeatUpDefenderResult(
	attacker: User,
	defender: User,
	outcome: BeatUpOutcomeData,
): CustomContainerBuilder {
	const strings = BeatUpStrings[defender.Language];
	const container = new CustomContainerBuilder()
		.setAccentColor(CrColors.BeatUp)
		.addTexts([`${EmoteString.Beat} ${strings.finishedBeatUpDefender}`])
		.addLargeSeparator();

	container.addTexts([
		outcome.success
			? strings.wereBeated(attacker.GetNameWithImage(), outcome.defenderHospitalTime!)
			: strings.youBeated(attacker.GetNameWithImage(), outcome.attackerHospitalTime!),
	]);
	container.addFooter({ text: formatMoney(defender.Money, defender.Language) });
	return container;
}

export async function runUserBeatUp(interaction: ChatInputCommandInteraction, attacker: User, defender: User) {
	const sA = BeatUpStrings[attacker.Language];

	const grenade = attacker.Items.find(i => i.Id === ItemId.Grenade);
	let usedGrenade = false;

	if (grenade && grenade.Quantity > 0) {
		if (attacker.AutomaticGrenade) {
			usedGrenade = true;
		}
		else {
			const grenadeContainer = new CustomContainerBuilder()
				.setUser(attacker)
				.setAccentColor(CrColors.BeatUp)
				.addTexts([
					`-# ${EmoteString.Beat} ${sA.preparingToBeat(defender.GetNameWithImage())}`,
				])
				.addSectionComponents(row => row
					.addTexts([
						`### ${EmoteString.Granade} **${sA.useGrenade}**`,
						sA.useGrenadeEffect,
					])
					.setButtonAccessory(new ButtonBuilder()
						.setCustomId("use_grenade")
						.setLabel(sA.useGrenade)
						.setStyle(ButtonStyle.Success)
						.setEmoji(EmoteId.Granade),
					),
				)
				.addSectionComponents(row => row
					.addTexts([
						`### **${sA.dontUseGrenade}**`,
						sA.dontUseGrenadeDescription,
					])
					.setButtonAccessory(new ButtonBuilder()
						.setCustomId("dont_use_grenade")
						.setLabel(sA.dontUseGrenade)
						.setStyle(ButtonStyle.Secondary),
					),
				)
				.addFooter({
					text: sA.useGrenadeDescription(grenade.Quantity),
				});

			const grenadeMessage = await replyWithContainer(interaction, grenadeContainer);

			if (grenadeMessage) {
				try {
					const confirmation = await grenadeMessage.awaitMessageComponent({
						filter: (i) => i.user.id === attacker.Id,
						time: 30_000,
						componentType: ComponentType.Button,
					});

					await deferUpdate(confirmation);

					if (confirmation.customId === "use_grenade") {
						usedGrenade = true;
					}
				}
				catch (e) {
					// Time out, do nothing
				}

				await Promise.all([
					attacker.GetInfo(),
					defender.GetInfo(),
				]);

			}
		}
	}

	const started = await MultiplayerSession.StartBeatUp(attacker, defender, usedGrenade, "discord");
	if (!started.success) {
		const container = defaultComponent({
			user: attacker,
			color: CrColors.BeatUp,
			description: started.message,
		});
		await replyWithContainer(interaction, container);
		return;
	}
	const { session } = started;
	const initData = started.initData!;
	let unsubscribe: (() => void) | undefined;

	try {
		let defenderDiscordUser;
		try {
			const client = getClient();
			defenderDiscordUser = await client.users.fetch(defender.Id);
		}
		catch (err) {
			Log.Warning(`Failed to fetch defender discord user ${defender.Id}: ${err}`);
		}

		let defenderMessage: Message | undefined;
		if (defenderDiscordUser) {
			try {
				const privateContainer = buildBeatUpDefenderPrompt(attacker, defender, {
					...initData,
					allowedResponses: session.allowedResponses,
				});

				defenderMessage = await defenderDiscordUser.send({
					components: [privateContainer],
					flags: MessageFlags.IsComponentsV2,
				});
			}
			catch (err) {
				Log.Warning(`Failed to send beatup DM to user ${defender.Id}: ${err}`);
			}
		}

		const channelContainer = new CustomContainerBuilder()
			.setUser(attacker)
			.setAccentColor(CrColors.BeatUp)
			.addTexts([
				`${EmoteString.Beat} ${sA.beatingInProgress}`,
			], 1)
			.addLargeSeparator()
			.addTexts([
				`${sA.tryingToBeatUp} **${defender.GetNameWithImage()}** ${EmoteString.Waiting}`,
			], 50)
			.addFooter();

		await replyWithContainer(interaction, channelContainer);

		let stopCollector: (() => void) | undefined;
		let handledResponse: string | null = null;
		let responseUpdate = Promise.resolve();

		const updateResponse = async (response: string) => {
			if (handledResponse !== null) return;
			handledResponse = response;
			let descriptionChannel = "";
			if (response === "fight") {
				descriptionChannel = `### 💪 ${defender.GetNameWithImage()} ${sA.isFighting}!`;
			}
			else if (response === "run") {
				descriptionChannel = `### 👟 ${defender.GetNameWithImage()} ${sA.isRunning}!`;
			}
			else {
				descriptionChannel = `### 🏳️ ${defender.GetNameWithImage()} ${sA.isDoingNothing}!`;
			}

			const updatedPrivateContainer = buildBeatUpDefenderResponse(defender, response);
			channelContainer.changeTextFromSectionId(50, descriptionChannel);
			stopCollector?.();
			if (defenderMessage) {
				await defenderMessage.edit({ components: [updatedPrivateContainer] });
			}
			await replyWithContainer(interaction, channelContainer);
		};

		unsubscribe = MultiplayerSession.Subscribe(attacker.Id, attacker.GangId, update => {
			if (update.id === session.id && update.response) {
				responseUpdate = updateResponse(update.response).catch(error => {
					Log.Warning(`Failed to update beat-up response for session ${session.id}: ${error}`);
				});
			}
		});
		const currentSession = MultiplayerSession.GetVisibleSession(session.id, attacker.Id, attacker.GangId);
		if (currentSession?.response) await updateResponse(currentSession.response);

		if (defenderMessage) {
			const collectorPrivate = defenderMessage.createMessageComponentCollector({
				filter: (i: MessageComponentInteraction) => i.user.id === defender.Id,
				max: 1,
				componentType: ComponentType.Button,
				time: 45_000,
			});
			stopCollector = () => collectorPrivate.stop();
			collectorPrivate.on("collect", async btn => {
				await deferUpdate(btn);
				const response = await MultiplayerSession.Respond(session.id, defender.Id, btn.customId, defender.Language);
				if (!response.success) {
					await btn.followUp({ content: response.message, flags: MessageFlags.Ephemeral });
				}
			});
		}

		const completed = await MultiplayerSession.WaitForCompletion(session.id);
		await responseUpdate;
		unsubscribe();
		unsubscribe = undefined;
		if (completed.phase !== "completed" || !completed.result) {
			await replyWithContainer(interaction, defaultComponent({
				user: attacker,
				color: CrColors.BeatUp,
				description: MultiplayerStrings[attacker.Language].actionInterrupted,
			}));
			return;
		}
		const outcome = MultiplayerSession.DecodeResult<BeatUpOutcomeData>(completed.result);

		const finalPrivateContainer = buildBeatUpDefenderResult(attacker, defender, outcome);

		if (outcome.success) {
			const texts = [
				`### ${EmoteString.Victory} ${sA.success}!`,
				`${sA.youBeated(defender.GetNameWithImage(), outcome.defenderHospitalTime!)}`,
				`-# ${sA.willBeAbleAgain} ${time(outcome.attackerBeatUpTime!, TimestampStyles.RelativeTime)}`,
			].join("\n");

			channelContainer.changeTextFromSectionId(50, texts);
		}
		else {
			const texts = [
				`### ${EmoteString.Defeat} ${sA.failure}!`,
				sA.youFailed(outcome.attackerHospitalTime!),
			].join("\n");

			channelContainer.changeTextFromSectionId(50, texts);
		}

		channelContainer
			.changeTextFromSectionId(1, `${EmoteString.Beat} ${sA.finishedBeatUpAttacker(outcome.success)}`)
			.changeFooterText(formatMoney(attacker.Money, attacker.Language));

		await replyWithContainer(interaction, channelContainer);

		if (defenderMessage) {
			await defenderMessage.edit({
				components: [finalPrivateContainer],
			});
		}
	}
	finally {
		unsubscribe?.();
	}
}
