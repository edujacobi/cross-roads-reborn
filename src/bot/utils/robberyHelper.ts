import { getClient } from "#bot/client";
import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { CrColors } from "#bot/utils/colors";
import { deferUpdate, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteId, EmoteString } from "#bot/utils/emotes";
import { defaultComponent, formatMoney, showTime } from "#bot/utils/ui";
import { Strings as RobberyStrings, type UserRobberyStrategy } from "#core/models/strategies/robbery/UserRobberyStrategy";
import type { User } from "#core/models/User";
import { ItemId } from "#core/types/Ids";
import { ButtonBuilder, ButtonStyle, type ChatInputCommandInteraction, ComponentType, type MessageComponentInteraction, MessageFlags } from "discord.js";
import { setTimeout as wait } from "timers/promises";

export async function runUserRobbery(interaction: ChatInputCommandInteraction, robbery: UserRobberyStrategy, attacker: User, defender: User) {
	const sA = RobberyStrings[attacker.Language];
	const sD = RobberyStrings[defender.Language];

	const grenade = attacker.Items.find(i => i.Id === ItemId.Grenade);
	let usedGrenade = false;

	if (grenade && grenade.Quantity > 0) {
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

			await attacker.GetInfo();

			const availability = await robbery.CanRob();

			if (!availability.canRob) {
				const container = defaultComponent({
					user: attacker,
					color: CrColors.Robbery,
					description: availability.message,
				});

				await replyWithContainer(interaction, container);
				return;
			}
		}
	}

	const initData = await robbery.LockStates(usedGrenade);

	try {
		const client = getClient();
		const defenderDiscordUser = await client.users.fetch(defender.Id);

		let usedGun = `${initData.usedGunSkin} **${initData.usedGunName}**`;
		if (usedGrenade) {
			usedGun += ` ${sD.andAGrenade}`;
		}

		const privateContainer = new CustomContainerBuilder()
			.setAccentColor(CrColors.Robbery)
			.addTexts([
				`${EmoteString.Robbery} ${sD.robberyInProgress}`,
			])
			.addLargeSeparator()
			.addTexts([
				`**${attacker.GetNameWithImage()}** ${sD.tryingToRobYou} ${usedGun} • ${EmoteString.Attack}${attacker.Attributes.Attack} ATK`,
				``,
				`-# ${sD.decide}:`,
			])
			.addSectionComponents(react => react
				.addTexts([
					`### ${EmoteString.Defense} **${sD.react}**`,
					sD.reactDescription(initData.defenderTimeInHospital),
				])
				.setButtonAccessory(new ButtonBuilder()
					.setCustomId("react")
					.setLabel(sD.react)
					.setStyle(ButtonStyle.Success)
					.setEmoji(EmoteId.Defense)
					.setDisabled(initData.cannotReact),
				),
			)
			.addLargeSeparator()
			.addSectionComponents(police => police
				.addTexts([
					`### ${EmoteString.Police} **${sD.callPolice}**`,
					sD.callPoliceDescription(initData.attackerAditionalTimeCallPolice),
				])
				.setButtonAccessory(new ButtonBuilder()
					.setCustomId("police")
					.setLabel(sD.callPolice)
					.setStyle(ButtonStyle.Danger)
					.setEmoji(EmoteId.Police)
					.setDisabled(initData.cannotCallPolice),
				),
			)
			.addLargeSeparator()
			.addSectionComponents(nothing => nothing
				.addTexts([
					`### 🏳️ **${sD.doNothing}**`,
					sD.doNothingDescription,
				])
				.setButtonAccessory(new ButtonBuilder()
					.setCustomId("nothing")
					.setLabel(sD.doNothing)
					.setStyle(ButtonStyle.Secondary),
				),
			)
			.addFooter({
				text: `${formatMoney(defender.Money, defender.Language)} • ${sD.secondsToRespond}`,
			});

		const defenderMessage = await defenderDiscordUser.send({
			components: [privateContainer],
			flags: MessageFlags.IsComponentsV2,
		});

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

		let defenderReaction: "react" | "police" | "nothing" = "nothing";

		if (defenderMessage) {
			const collectorPrivate = defenderMessage.createMessageComponentCollector({
				filter: (i: MessageComponentInteraction) => i.user.id === defender.Id,
				max: 1,
				componentType: ComponentType.Button,
				time: 60_000,
			});

			collectorPrivate.on("collect", async btn => {
				let descriptionPrivate = "";
				let descriptionChannel = "";

				collectorPrivate.stop();

				if (btn.customId === "react") {
					defenderReaction = "react";
					descriptionPrivate = `### ${EmoteString.React} ${sD.reacting} ${EmoteString.Waiting}`;
					descriptionChannel = `### ${EmoteString.React} ${defender.GetNameWithImage()} ${sA.isReacting}!`;
				}
				else if (btn.customId === "police") {
					defenderReaction = "police";
					descriptionPrivate = `### ${EmoteString.Police} ${sD.callingPolice} ${EmoteString.Waiting}`;
					descriptionChannel = `### ${EmoteString.Police} ${defender.GetNameWithImage()} ${sA.isCallingPolice}!`;
				}
				else if (btn.customId === "nothing") {
					defenderReaction = "nothing";
					descriptionPrivate = `### 🏳️ ${sD.doingNothing} ${EmoteString.Waiting}`;
					descriptionChannel = `### 🏳️ ${defender.GetNameWithImage()} ${sA.isDoingNothing}!`;
				}

				const updatedPrivateContainer = new CustomContainerBuilder()
					.setAccentColor(CrColors.Robbery)
					.addTexts([
						`${EmoteString.Robbery} ${sD.robberyInProgress}`,
					])
					.addLargeSeparator()
					.addTexts([
						descriptionPrivate,
					])
					.addFooter({ text: `${formatMoney(defender.Money, defender.Language)} • ${sD.secondsToRespond}` });

				channelContainer.changeTextFromSectionId(50, descriptionChannel);

				await btn.update({
					components: [updatedPrivateContainer],
				});

				await replyWithContainer(interaction, channelContainer);
			});
		}

		await wait(60_000);

		const outcome = await robbery.Resolve(defenderReaction);

		const finalPrivateContainer = new CustomContainerBuilder()
			.setAccentColor(CrColors.Robbery)
			.addTexts([
				`${EmoteString.Robbery} ${sD.finishedRobberyDefender}`,
			])
			.addLargeSeparator();

		if (outcome.success) {
			finalPrivateContainer.addTexts([
				`### ${EmoteString.Defeat} ${sD.success}.`,
				`${sD.wereRobbed(formatMoney(outcome.moneyRobbed, defender.Language), attacker.GetNameWithImage())}${outcome.willBeBeatenUp ? `\n${sD.beatedUp(outcome.defenderHospitalTime!)} ${EmoteString.Hospital}` : ""}`,
			]);

			const randomSuccessMessage = sA.successMessages[Math.floor(Math.random() * sA.successMessages.length)];
			const successMessage = randomSuccessMessage(formatMoney(outcome.moneyRobbed, attacker.Language), defender.GetNameWithImage());

			const texts = [
				`### ${EmoteString.Victory} ${sA.success}!`,
				`${successMessage}${outcome.willBeBeatenUp ? `\n${sA.beatenUp(outcome.defenderHospitalTime!)} ${EmoteString.Hospital}` : ""}`,
				`-# ${sA.willBeAbleAgain} ${showTime(outcome.attackerWantedTime!.getTime(), true)}`,
			].join("\n");

			channelContainer.changeTextFromSectionId(50, texts);
		}
		else {
			finalPrivateContainer.addTexts([
				`### ${EmoteString.Victory} ${sD.failure}!`,
				`**${attacker.GetNameWithImage()}** ${sD.robFailed} ${EmoteString.Police}`,
				`-# ${sD.prisonUntil(outcome.attackerPrisonTime!)}!`,
			]);

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
			finalPrivateContainer.addFooter({
				text: formatMoney(defender.Money, defender.Language),
			});
			await defenderMessage.edit({
				components: [finalPrivateContainer],
			});
		}
	}
	finally {
		await robbery.ReleaseLocks();
	}
}
