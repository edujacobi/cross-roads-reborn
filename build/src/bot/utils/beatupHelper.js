"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBeatUpDefenderPrompt = buildBeatUpDefenderPrompt;
exports.buildBeatUpDefenderResponse = buildBeatUpDefenderResponse;
exports.buildBeatUpDefenderResult = buildBeatUpDefenderResult;
exports.runUserBeatUp = runUserBeatUp;
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const BeatUp_1 = require("#core/models/BeatUp");
const MultiplayerSession_1 = require("#core/models/MultiplayerSession");
const discord_js_1 = require("discord.js");
const Ids_1 = require("#core/types/Ids");
const client_1 = require("#bot/client");
const colors_1 = require("#bot/utils/colors");
const log_1 = require("#shared/log");
function buildBeatUpDefenderPrompt(attacker, defender, data) {
    const strings = BeatUp_1.Strings[defender.Language];
    const usedGun = `${data.usedGunSkin} **${data.usedGunName}**${data.usedGrenade ? ` ${strings.andAGrenade}` : ""}`;
    return new CustomContainerBuilder_1.CustomContainerBuilder()
        .setAccentColor(colors_1.CrColors.BeatUp)
        .addTexts([`${emotes_1.EmoteString.Beat} ${strings.beatingInProgress}`])
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
        .setButtonAccessory(new discord_js_1.ButtonBuilder()
        .setCustomId("fight")
        .setLabel(strings.fight)
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setEmoji("💪")))
        .addLargeSeparator()
        .addSectionComponents(run => run
        .addTexts([
        `### 👟 **${strings.run}**`,
        strings.runDescription(data.timeInHospitalAditional),
    ])
        .setButtonAccessory(new discord_js_1.ButtonBuilder()
        .setCustomId("run")
        .setLabel(strings.run)
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setEmoji("👟")
        .setDisabled(!data.allowedResponses.includes("run"))))
        .addLargeSeparator()
        .addSectionComponents(nothing => nothing
        .addTexts([
        `### 🏳️ **${strings.doNothing}**`,
        strings.doNothingDescription,
    ])
        .setButtonAccessory(new discord_js_1.ButtonBuilder()
        .setCustomId("nothing")
        .setLabel(strings.doNothing)
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setEmoji("🏳️")))
        .addFooter({
        text: `${(0, ui_1.formatMoney)(defender.Money, defender.Language)} • ${strings.secondsToRespond}`,
    });
}
function buildBeatUpDefenderResponse(defender, response) {
    const strings = BeatUp_1.Strings[defender.Language];
    const action = response === "fight"
        ? `### 💪 ${strings.fighting}`
        : response === "run"
            ? `### 👟 ${strings.running}`
            : `### 🏳️ ${strings.doingNothing}`;
    return new CustomContainerBuilder_1.CustomContainerBuilder()
        .setAccentColor(colors_1.CrColors.BeatUp)
        .addTexts([`${emotes_1.EmoteString.Beat} ${strings.beatingInProgress}`])
        .addLargeSeparator()
        .addTexts([`${action} ${emotes_1.EmoteString.Waiting}`])
        .addFooter({ text: strings.secondsToRespond });
}
function buildBeatUpDefenderResult(attacker, defender, outcome) {
    const strings = BeatUp_1.Strings[defender.Language];
    const container = new CustomContainerBuilder_1.CustomContainerBuilder()
        .setAccentColor(colors_1.CrColors.BeatUp)
        .addTexts([`${emotes_1.EmoteString.Beat} ${strings.finishedBeatUpDefender}`])
        .addLargeSeparator();
    container.addTexts([
        outcome.success
            ? strings.wereBeated(attacker.GetNameWithImage(), outcome.defenderHospitalTime)
            : strings.youBeated(attacker.GetNameWithImage(), outcome.attackerHospitalTime),
    ]);
    container.addFooter({ text: (0, ui_1.formatMoney)(defender.Money, defender.Language) });
    return container;
}
async function runUserBeatUp(interaction, attacker, defender) {
    const sA = BeatUp_1.Strings[attacker.Language];
    const grenade = attacker.Items.find(i => i.Id === Ids_1.ItemId.Grenade);
    let usedGrenade = false;
    if (grenade && grenade.Quantity > 0) {
        if (attacker.AutomaticGrenade) {
            usedGrenade = true;
        }
        else {
            const grenadeContainer = new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(attacker)
                .setAccentColor(colors_1.CrColors.BeatUp)
                .addTexts([
                `-# ${emotes_1.EmoteString.Beat} ${sA.preparingToBeat(defender.GetNameWithImage())}`,
            ])
                .addSectionComponents(row => row
                .addTexts([
                `### ${emotes_1.EmoteString.Granade} **${sA.useGrenade}**`,
                sA.useGrenadeEffect,
            ])
                .setButtonAccessory(new discord_js_1.ButtonBuilder()
                .setCustomId("use_grenade")
                .setLabel(sA.useGrenade)
                .setStyle(discord_js_1.ButtonStyle.Success)
                .setEmoji(emotes_1.EmoteId.Granade)))
                .addSectionComponents(row => row
                .addTexts([
                `### **${sA.dontUseGrenade}**`,
                sA.dontUseGrenadeDescription,
            ])
                .setButtonAccessory(new discord_js_1.ButtonBuilder()
                .setCustomId("dont_use_grenade")
                .setLabel(sA.dontUseGrenade)
                .setStyle(discord_js_1.ButtonStyle.Secondary)))
                .addFooter({
                text: sA.useGrenadeDescription(grenade.Quantity),
            });
            const grenadeMessage = await (0, discordInteractions_1.replyWithContainer)(interaction, grenadeContainer);
            if (grenadeMessage) {
                try {
                    const confirmation = await grenadeMessage.awaitMessageComponent({
                        filter: (i) => i.user.id === attacker.Id,
                        time: 30_000,
                        componentType: discord_js_1.ComponentType.Button,
                    });
                    await (0, discordInteractions_1.deferUpdate)(confirmation);
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
    const started = await MultiplayerSession_1.MultiplayerSession.StartBeatUp(attacker, defender, usedGrenade, "discord");
    if (!started.success) {
        const container = (0, ui_1.defaultComponent)({
            user: attacker,
            color: colors_1.CrColors.BeatUp,
            description: started.message,
        });
        await (0, discordInteractions_1.replyWithContainer)(interaction, container);
        return;
    }
    const { session } = started;
    const initData = started.initData;
    let unsubscribe;
    try {
        let defenderDiscordUser;
        try {
            const client = (0, client_1.getClient)();
            defenderDiscordUser = await client.users.fetch(defender.Id);
        }
        catch (err) {
            log_1.Log.Warning(`Failed to fetch defender discord user ${defender.Id}: ${err}`);
        }
        let defenderMessage;
        if (defenderDiscordUser) {
            try {
                const privateContainer = buildBeatUpDefenderPrompt(attacker, defender, {
                    ...initData,
                    allowedResponses: session.allowedResponses,
                });
                defenderMessage = await defenderDiscordUser.send({
                    components: [privateContainer],
                    flags: discord_js_1.MessageFlags.IsComponentsV2,
                });
            }
            catch (err) {
                log_1.Log.Warning(`Failed to send beatup DM to user ${defender.Id}: ${err}`);
            }
        }
        const channelContainer = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(attacker)
            .setAccentColor(colors_1.CrColors.BeatUp)
            .addTexts([
            `${emotes_1.EmoteString.Beat} ${sA.beatingInProgress}`,
        ], 1)
            .addLargeSeparator()
            .addTexts([
            `${sA.tryingToBeatUp} **${defender.GetNameWithImage()}** ${emotes_1.EmoteString.Waiting}`,
        ], 50)
            .addFooter();
        await (0, discordInteractions_1.replyWithContainer)(interaction, channelContainer);
        let stopCollector;
        let handledResponse = null;
        let responseUpdate = Promise.resolve();
        const updateResponse = async (response) => {
            if (handledResponse !== null)
                return;
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
            await (0, discordInteractions_1.replyWithContainer)(interaction, channelContainer);
        };
        unsubscribe = MultiplayerSession_1.MultiplayerSession.Subscribe(attacker.Id, attacker.GangId, update => {
            if (update.id === session.id && update.response) {
                responseUpdate = updateResponse(update.response).catch(error => {
                    log_1.Log.Warning(`Failed to update beat-up response for session ${session.id}: ${error}`);
                });
            }
        });
        const currentSession = MultiplayerSession_1.MultiplayerSession.GetVisibleSession(session.id, attacker.Id, attacker.GangId);
        if (currentSession?.response)
            await updateResponse(currentSession.response);
        if (defenderMessage) {
            const collectorPrivate = defenderMessage.createMessageComponentCollector({
                filter: (i) => i.user.id === defender.Id,
                max: 1,
                componentType: discord_js_1.ComponentType.Button,
                time: 45_000,
            });
            stopCollector = () => collectorPrivate.stop();
            collectorPrivate.on("collect", async (btn) => {
                await (0, discordInteractions_1.deferUpdate)(btn);
                const response = await MultiplayerSession_1.MultiplayerSession.Respond(session.id, defender.Id, btn.customId, defender.Language);
                if (!response.success) {
                    await btn.followUp({ content: response.message, flags: discord_js_1.MessageFlags.Ephemeral });
                }
            });
        }
        const completed = await MultiplayerSession_1.MultiplayerSession.WaitForCompletion(session.id);
        await responseUpdate;
        unsubscribe();
        unsubscribe = undefined;
        if (completed.phase !== "completed" || !completed.result) {
            await (0, discordInteractions_1.replyWithContainer)(interaction, (0, ui_1.defaultComponent)({
                user: attacker,
                color: colors_1.CrColors.BeatUp,
                description: MultiplayerSession_1.Strings[attacker.Language].actionInterrupted,
            }));
            return;
        }
        const outcome = MultiplayerSession_1.MultiplayerSession.DecodeResult(completed.result);
        const finalPrivateContainer = buildBeatUpDefenderResult(attacker, defender, outcome);
        if (outcome.success) {
            const texts = [
                `### ${emotes_1.EmoteString.Victory} ${sA.success}!`,
                `${sA.youBeated(defender.GetNameWithImage(), outcome.defenderHospitalTime)}`,
                `-# ${sA.willBeAbleAgain} ${(0, discord_js_1.time)(outcome.attackerBeatUpTime, discord_js_1.TimestampStyles.RelativeTime)}`,
            ].join("\n");
            channelContainer.changeTextFromSectionId(50, texts);
        }
        else {
            const texts = [
                `### ${emotes_1.EmoteString.Defeat} ${sA.failure}!`,
                sA.youFailed(outcome.attackerHospitalTime),
            ].join("\n");
            channelContainer.changeTextFromSectionId(50, texts);
        }
        channelContainer
            .changeTextFromSectionId(1, `${emotes_1.EmoteString.Beat} ${sA.finishedBeatUpAttacker(outcome.success)}`)
            .changeFooterText((0, ui_1.formatMoney)(attacker.Money, attacker.Language));
        await (0, discordInteractions_1.replyWithContainer)(interaction, channelContainer);
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
//# sourceMappingURL=beatupHelper.js.map