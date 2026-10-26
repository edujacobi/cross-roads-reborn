import { getClient } from "#bot/client";
import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { CrColors } from "#bot/utils/colors";
import { deferUpdate, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteId, EmoteString } from "#bot/utils/emotes";
import { defaultComponent, formatMoney } from "#bot/utils/ui";
import { Strings as RobberyStrings } from "#core/models/strategies/robbery/UserRobberyStrategy";
import type { RobberyInitData, RobberyOutcomeData } from "#core/types/Robbery";
import type { User } from "#core/models/User";
import { MultiplayerSession, Strings as MultiplayerStrings } from "#core/models/MultiplayerSession";
import { ItemId } from "#core/types/Ids";
import {
	ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	ComponentType,
	type Message,
	type MessageComponentInteraction,
	MessageFlags,
	time,
	TimestampStyles,
} from "discord.js";
import { Log } from "#shared/log";

type RobberyDefenderPromptData = Pick<
	RobberyInitData,
	"attackerAditionalTimeCallPolice" | "defenderTimeInHospital" | "usedGunSkin" | "usedGunName" | "usedGrenade"
> & { allowedResponses: string[] };

export function buildRobberyDefenderPrompt(
	attacker: User,
	defender: User,
	data: RobberyDefenderPromptData,
): CustomContainerBuilder {
	const strings = RobberyStrings[defender.Language];
	const usedGun = `${data.usedGunSkin} **${data.usedGunName}**${data.usedGrenade ? ` ${strings.andAGrenade}` : ""}`;

	return new CustomContainerBuilder()
		.setAccentColor(CrColors.Robbery)
		.addTexts([`${EmoteString.Robbery} ${strings.robberyInProgress}`])
		.addLargeSeparator()
		.addTexts([
			`**${attacker.GetNameWithImage()}** ${strings.tryingToRobYou} ${usedGun} • ${EmoteString.Attack}${attacker.Attributes.Attack} ATK`,
			"",
			`-# ${strings.decide}:`,
		])
		.addSectionComponents(react => react
			.addTexts([
				`### ${EmoteString.React} **${strings.react}**`,
				strings.reactDescription(data.defenderTimeInHospital),
			])
			.setButtonAccessory(new ButtonBuilder()
				.setCustomId("react")
				.setLabel(strings.react)
				.setStyle(ButtonStyle.Secondary)
				.setEmoji(EmoteId.React)
				.setDisabled(!data.allowedResponses.includes("react")),
			),
		)
		.addLargeSeparator()
		.addSectionComponents(police => police
			.addTexts([
				`### ${EmoteString.Police} **${strings.callPolice}**`,
				strings.callPoliceDescription(data.attackerAditionalTimeCallPolice),
			])
			.setButtonAccessory(new ButtonBuilder()
				.setCustomId("police")
				.setLabel(strings.callPolice)
				.setStyle(ButtonStyle.Secondary)
				.setEmoji(EmoteId.Police)
				.setDisabled(!data.allowedResponses.includes("police")),
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
				.setStyle(ButtonStyle.Secondary),
			),
		)
		.addFooter({
			text: `${formatMoney(defender.Money, defender.Language)} • ${strings.secondsToRespond}`,
		});
}

export function buildRobberyDefenderResponse(defender: User, response: string): CustomContainerBuilder {
	const strings = RobberyStrings[defender.Language];
	const action = response === "react"
		? `### ${EmoteString.React} ${strings.reacting}`
		: response === "police"
			? `### ${EmoteString.Police} ${strings.callingPolice}`
			: `### 🏳️ ${strings.doingNothing}`;

	return new CustomContainerBuilder()
		.setAccentColor(CrColors.Robbery)
		.addTexts([`${EmoteString.Robbery} ${strings.robberyInProgress}`])
		.addLargeSeparator()
		.addTexts([`${action} ${EmoteString.Waiting}`])
		.addFooter({
			text: `${formatMoney(defender.Money, defender.Language)} • ${strings.secondsToRespond}`,
		});
}

export function buildRobberyDefenderResult(
	attacker: User,
	defender: User,
	outcome: RobberyOutcomeData,
): CustomContainerBuilder {
	const strings = RobberyStrings[defender.Language];
	const container = new CustomContainerBuilder()
		.setAccentColor(CrColors.Robbery)
		.addTexts([`${EmoteString.Robbery} ${strings.finishedRobberyDefender}`])
		.addLargeSeparator();

	if (outcome.success) {
		container.addTexts([
			`### ${EmoteString.Defeat} ${strings.success}.`,
			`${strings.wereRobbed(formatMoney(outcome.moneyRobbed, defender.Language), attacker.GetNameWithImage())}${outcome.willBeBeatenUp ? `\n${strings.beatedUp(outcome.defenderHospitalTime!)} ${EmoteString.Hospital}` : ""}`,
		]);
	}
	else {
		container.addTexts([
			`### ${EmoteString.Victory} ${strings.failure}!`,
			`**${attacker.GetNameWithImage()}** ${strings.robFailed} ${EmoteString.Police}`,
			`-# ${strings.prisonUntil(outcome.attackerPrisonTime!)}!`,
		]);
	}

	container.addFooter({ text: formatMoney(defender.Money, defender.Language) });
	return container;
}

export async function runUserRobbery(interaction: ChatInputCommandInteraction, attacker: User, defender: User) {
	const sA = RobberyStrings[attacker.Language];

	const grenade = attacker.Items.find(i => i.Id === ItemId.Grenade);
	let usedGrenade = false;

	if (grenade && grenade.Quantity > 0) {
		if (attacker.AutomaticGrenade) {
			usedGrenade = true;
		}
		else {
			const grenadeContainer = new CustomContainerBuilder()
				.setUser(attacker)
				.setAccentColor(CrColors.Robbery)
				.addTexts([
					`-# ${EmoteString.Robbery} ${sA.preparingToRob(defender.GetNameWithImage())}`,
				])
				.addLargeSeparator()
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
				.addLargeSeparator()
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

	const started = await MultiplayerSession.StartUserRobbery(attacker, defender, usedGrenade, "discord");
	if (!started.success) {
		const container = defaultComponent({
			user: attacker,
			color: CrColors.Robbery,
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
				const privateContainer = buildRobberyDefenderPrompt(attacker, defender, {
					...initData,
					allowedResponses: session.allowedResponses,
				});

				defenderMessage = await defenderDiscordUser.send({
					components: [privateContainer],
					flags: MessageFlags.IsComponentsV2,
				});
			}
			catch (err) {
				Log.Warning(`Failed to send robbery DM to user ${defender.Id}: ${err}`);
			}
		}

		const channelContainer = new CustomContainerBuilder()
			.setUser(attacker)
			.setAccentColor(CrColors.Robbery)
			.addTexts([
				`${EmoteString.Robbery} ${sA.robberyInProgress}`,
			], 1)
			.addLargeSeparator()
			.addTexts([
				`${sA.tryingToRob} ${defender.GetNameWithImage()} ${EmoteString.Waiting}`,
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
			if (response === "react") {
				descriptionChannel = `### ${EmoteString.React} ${defender.GetNameWithImage()} ${sA.isReacting}!`;
			}
			else if (response === "police") {
				descriptionChannel = `### ${EmoteString.Police} ${defender.GetNameWithImage()} ${sA.isCallingPolice}!`;
			}
			else {
				descriptionChannel = `### 🏳️ ${defender.GetNameWithImage()} ${sA.isDoingNothing}!`;
			}

			const updatedPrivateContainer = buildRobberyDefenderResponse(defender, response);
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
					Log.Warning(`Failed to update robbery response for session ${session.id}: ${error}`);
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
				time: 60_000,
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
		unsubscribe?.();
		unsubscribe = undefined;
		if (completed.phase !== "completed" || !completed.result) {
			await replyWithContainer(interaction, defaultComponent({
				user: attacker,
				color: CrColors.Robbery,
				description: MultiplayerStrings[attacker.Language].actionInterrupted,
			}));
			return;
		}
		const outcome = MultiplayerSession.DecodeResult<RobberyOutcomeData>(completed.result);

		const finalPrivateContainer = buildRobberyDefenderResult(attacker, defender, outcome);

		if (outcome.success) {
			const randomSuccessMessage = sA.successMessages[Math.floor(Math.random() * sA.successMessages.length)];
			const successMessage = randomSuccessMessage(formatMoney(outcome.moneyRobbed, attacker.Language), defender.GetNameWithImage());

			const texts = [
				`### ${EmoteString.Victory} ${sA.success}!`,
				`${successMessage}${outcome.willBeBeatenUp ? `\n${sA.beatenUp(outcome.defenderHospitalTime!)} ${EmoteString.Hospital}` : ""}`,
				`-# ${sA.willBeAbleAgain} ${time(outcome.attackerWantedTime!, TimestampStyles.RelativeTime)}`,
			].join("\n");

			channelContainer.changeTextFromSectionId(50, texts);
		}
		else {
			const randomFailureMessage = sA.failureMessages[Math.floor(Math.random() * sA.failureMessages.length)];

			const texts = [
				`### ${EmoteString.Defeat} ${sA.failure}!`,
				`${sA.youFailed}!`,
				`-# ${EmoteString.Prison} ${randomFailureMessage} ${sA.prisonTime(outcome.attackerPrisonTime!)}`,
			].join("\n");

			channelContainer.changeTextFromSectionId(50, texts);
		}

		channelContainer
			.changeTextFromSectionId(1, `${EmoteString.Robbery} ${sA.finishedRobberyAttacker(outcome.success)}`)
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
