import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { deferUpdate, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteId, EmoteString } from "#bot/utils/emotes";
import { defaultComponent, formatMoney, showTime } from "#bot/utils/ui";
import { Strings as BeatUpStrings, type BeatUp } from "#core/models/BeatUp";
import type { User } from "#core/models/User";
import { ButtonBuilder, ButtonStyle, type ChatInputCommandInteraction, ComponentType, type MessageComponentInteraction, MessageFlags } from "discord.js";
import { setTimeout as wait } from "timers/promises";
import { ItemId } from "#core/types/Ids";
import { getClient } from "#bot/client";
import { CrColors } from "#bot/utils/colors";

export async function runUserBeatUp(interaction: ChatInputCommandInteraction, beatUp: BeatUp, attacker: User, defender: User) {
	const sA = BeatUpStrings[attacker.Language];
	const sD = BeatUpStrings[defender.Language];

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

				const availability = await beatUp.CanBeatUser();

				if (!availability.canBeat) {
					const container = defaultComponent({
						user: attacker,
						color: CrColors.BeatUp,
						description: availability.message,
					});

					await replyWithContainer(interaction, container);
					return;
				}
			}
		}
	}

	const initData = await beatUp.LockStates(usedGrenade);

	try {
		const client = getClient();
		const defenderDiscordUser = await client.users.fetch(defender.Id);

		let usedGun = `${initData.usedGunSkin} **${initData.usedGunName}**`;
		if (usedGrenade) {
			usedGun += ` ${sD.andAGrenade}`;
		}

		const privateContainer = new CustomContainerBuilder()
			.setAccentColor(CrColors.BeatUp)
			.addTexts([
				`${EmoteString.Beat} ${sD.beatingInProgress}`,
			])
			.addLargeSeparator()
			.addTexts([
				`**${attacker.GetNameWithImage()}** ${sD.tryingToBeatYou} ${usedGun}`,
				``,
				`-# ${sD.decide}:`,
			])
			.addSectionComponents(fight => fight
				.addTexts([
					`### 💪 **${sD.fight}**`,
					`${sD.fightDescription(initData.timeInHospitalAditional)}`,
				])
				.setButtonAccessory(new ButtonBuilder()
					.setCustomId("fight")
					.setLabel(sD.fight)
					.setStyle(ButtonStyle.Secondary)
					.setEmoji("💪"),
				),
			)
			.addLargeSeparator()
			.addSectionComponents(run => run
				.addTexts([
					`### 👟 **${sD.run}**`,
					`${sD.runDescription(initData.timeInHospitalAditional)}`,
				])
				.setButtonAccessory(new ButtonBuilder()
					.setCustomId("run")
					.setLabel(sD.run)
					.setStyle(ButtonStyle.Secondary)
					.setEmoji("👟")
					.setDisabled(initData.cannotRun),
				),
			)
			.addLargeSeparator()
			.addSectionComponents(nothing => nothing
				.addTexts([
					`### 🏳️ **${sD.doNothing}**`,
					`${sD.doNothingDescription}`,
				])
				.setButtonAccessory(new ButtonBuilder()
					.setCustomId("nothing")
					.setLabel(sD.doNothing)
					.setStyle(ButtonStyle.Secondary)
					.setEmoji("🏳️"),
				),
			)
			.addFooter({ text: sD.secondsToRespond });

		const defenderMessage = await defenderDiscordUser.send({
			components: [privateContainer],
			flags: MessageFlags.IsComponentsV2,
		});

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

		let defenderReaction: "fight" | "run" | "nothing" = "nothing";

		if (defenderMessage) {
			const collectorPrivate = defenderMessage.createMessageComponentCollector({
				filter: (i: MessageComponentInteraction) => i.user.id === defender.Id,
				max: 1,
				componentType: ComponentType.Button,
				time: 45_000,
			});

			collectorPrivate.on("collect", async btn => {
				let descriptionPrivate = "";
				let descriptionChannel = "";

				collectorPrivate.stop();

				if (btn.customId === "fight") {
					defenderReaction = "fight";
					descriptionPrivate = `### 💪 ${sD.fighting} ${EmoteString.Waiting}`;
					descriptionChannel = `### 💪 ${defender.GetNameWithImage()} ${sA.isFighting}!`;
				}
				else if (btn.customId === "run") {
					defenderReaction = "run";
					descriptionPrivate = `### 👟 ${sD.running} ${EmoteString.Waiting}`;
					descriptionChannel = `### 👟 ${defender.GetNameWithImage()} ${sA.isRunning}!`;
				}
				else if (btn.customId === "nothing") {
					defenderReaction = "nothing";
					descriptionPrivate = `### 🏳️ ${sD.doingNothing} ${EmoteString.Waiting}`;
					descriptionChannel = `### 🏳️ ${defender.GetNameWithImage()} ${sA.isDoingNothing}!`;
				}

				const updatedPrivateContainer = new CustomContainerBuilder()
					.setAccentColor(CrColors.BeatUp)
					.addTexts([
						`${EmoteString.Beat} ${sD.beatingInProgress}`,
					])
					.addLargeSeparator()
					.addTexts([
						descriptionPrivate,
					])
					.addFooter({ text: sD.secondsToRespond });

				channelContainer.changeTextFromSectionId(50, descriptionChannel);

				await btn.update({
					components: [updatedPrivateContainer],
				});

				await replyWithContainer(interaction, channelContainer);
			});
		}

		await wait(45_000);

		const outcome = await beatUp.Resolve(defenderReaction);

		const finalPrivateContainer = new CustomContainerBuilder()
			.setAccentColor(CrColors.BeatUp)
			.addTexts([
				`${EmoteString.Beat} ${sD.finishedBeatUpDefender}`,
			])
			.addLargeSeparator();

		if (outcome.success) {
			finalPrivateContainer.addTexts([
				sD.wereBeated(attacker.GetNameWithImage(), outcome.defenderHospitalTime!),
			]);

			const texts = [
				`### ${EmoteString.Victory} ${sA.success}!`,
				`${sA.youBeated(defender.GetNameWithImage(), outcome.defenderHospitalTime!)}`,
				`-# ${sA.willBeAbleAgain} ${showTime(outcome.attackerBeatUpTime!.getTime(), true)}`,
			].join("\n");

			channelContainer.changeTextFromSectionId(50, texts);
		}
		else {
			finalPrivateContainer.addTexts([
				sD.youBeated(attacker.GetNameWithImage(), outcome.attackerHospitalTime!),
			]);

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
			finalPrivateContainer.addFooter({
				text: formatMoney(defender.Money, defender.Language),
			});

			await defenderMessage.edit({
				components: [finalPrivateContainer],
			});
		}
	}
	finally {
		await beatUp.ReleaseLocks();
	}
}
