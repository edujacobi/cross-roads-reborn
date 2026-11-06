"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRobberyDefenderPrompt = buildRobberyDefenderPrompt;
exports.buildRobberyDefenderResponse = buildRobberyDefenderResponse;
exports.buildRobberyDefenderResult = buildRobberyDefenderResult;
exports.runUserRobbery = runUserRobbery;
const client_1 = require("#bot/client");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const UserRobberyStrategy_1 = require("#core/models/strategies/robbery/UserRobberyStrategy");
const MultiplayerSession_1 = require("#core/models/MultiplayerSession");
const Ids_1 = require("#core/types/Ids");
const discord_js_1 = require("discord.js");
const log_1 = require("#shared/log");
function buildRobberyDefenderPrompt(attacker, defender, data) {
    const strings = UserRobberyStrategy_1.Strings[defender.Language];
    const usedGun = `${data.usedGunSkin} **${data.usedGunName}**${data.usedGrenade ? ` ${strings.andAGrenade}` : ""}`;
    return new CustomContainerBuilder_1.CustomContainerBuilder()
        .setAccentColor(colors_1.CrColors.Robbery)
        .addTexts([`${emotes_1.EmoteString.Robbery} ${strings.robberyInProgress}`])
        .addLargeSeparator()
        .addTexts([
        `**${attacker.GetNameWithImage()}** ${strings.tryingToRobYou} ${usedGun} • ${emotes_1.EmoteString.Attack}${attacker.Attributes.Attack} ATK`,
        "",
        `-# ${strings.decide}:`,
    ])
        .addSectionComponents(react => react
        .addTexts([
        `### ${emotes_1.EmoteString.React} **${strings.react}**`,
        strings.reactDescription(data.defenderTimeInHospital),
    ])
        .setButtonAccessory(new discord_js_1.ButtonBuilder()
        .setCustomId("react")
        .setLabel(strings.react)
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setEmoji(emotes_1.EmoteId.React)
        .setDisabled(!data.allowedResponses.includes("react"))))
        .addLargeSeparator()
        .addSectionComponents(police => police
        .addTexts([
        `### ${emotes_1.EmoteString.Police} **${strings.callPolice}**`,
        strings.callPoliceDescription(data.attackerAditionalTimeCallPolice),
    ])
        .setButtonAccessory(new discord_js_1.ButtonBuilder()
        .setCustomId("police")
        .setLabel(strings.callPolice)
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setEmoji(emotes_1.EmoteId.Police)
        .setDisabled(!data.allowedResponses.includes("police"))))
        .addLargeSeparator()
        .addSectionComponents(nothing => nothing
        .addTexts([
        `### 🏳️ **${strings.doNothing}**`,
        strings.doNothingDescription,
    ])
        .setButtonAccessory(new discord_js_1.ButtonBuilder()
        .setCustomId("nothing")
        .setLabel(strings.doNothing)
        .setStyle(discord_js_1.ButtonStyle.Secondary)))
        .addFooter({
        text: `${(0, ui_1.formatMoney)(defender.Money, defender.Language)} • ${strings.secondsToRespond}`,
    });
}
function buildRobberyDefenderResponse(defender, response) {
    const strings = UserRobberyStrategy_1.Strings[defender.Language];
    const action = response === "react"
        ? `### ${emotes_1.EmoteString.React} ${strings.reacting}`
        : response === "police"
            ? `### ${emotes_1.EmoteString.Police} ${strings.callingPolice}`
            : `### 🏳️ ${strings.doingNothing}`;
    return new CustomContainerBuilder_1.CustomContainerBuilder()
        .setAccentColor(colors_1.CrColors.Robbery)
        .addTexts([`${emotes_1.EmoteString.Robbery} ${strings.robberyInProgress}`])
        .addLargeSeparator()
        .addTexts([`${action} ${emotes_1.EmoteString.Waiting}`])
        .addFooter({
        text: `${(0, ui_1.formatMoney)(defender.Money, defender.Language)} • ${strings.secondsToRespond}`,
    });
}
function buildRobberyDefenderResult(attacker, defender, outcome) {
    const strings = UserRobberyStrategy_1.Strings[defender.Language];
    const container = new CustomContainerBuilder_1.CustomContainerBuilder()
        .setAccentColor(colors_1.CrColors.Robbery)
        .addTexts([`${emotes_1.EmoteString.Robbery} ${strings.finishedRobberyDefender}`])
        .addLargeSeparator();
    if (outcome.success) {
        container.addTexts([
            `### ${emotes_1.EmoteString.Defeat} ${strings.success}.`,
            `${strings.wereRobbed((0, ui_1.formatMoney)(outcome.moneyRobbed, defender.Language), attacker.GetNameWithImage())}${outcome.willBeBeatenUp ? `\n${strings.beatedUp(outcome.defenderHospitalTime)} ${emotes_1.EmoteString.Hospital}` : ""}`,
        ]);
    }
    else {
        container.addTexts([
            `### ${emotes_1.EmoteString.Victory} ${strings.failure}!`,
            `**${attacker.GetNameWithImage()}** ${strings.robFailed} ${emotes_1.EmoteString.Police}`,
            `-# ${strings.prisonUntil(outcome.attackerPrisonTime)}!`,
        ]);
    }
    container.addFooter({ text: (0, ui_1.formatMoney)(defender.Money, defender.Language) });
    return container;
}
async function runUserRobbery(interaction, attacker, defender) {
    const sA = UserRobberyStrategy_1.Strings[attacker.Language];
    const grenade = attacker.Items.find(i => i.Id === Ids_1.ItemId.Grenade);
    let usedGrenade = false;
    if (grenade && grenade.Quantity > 0) {
        if (attacker.AutomaticGrenade) {
            usedGrenade = true;
        }
        else {
            const grenadeContainer = new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(attacker)
                .setAccentColor(colors_1.CrColors.Robbery)
                .addTexts([
                `-# ${emotes_1.EmoteString.Robbery} ${sA.preparingToRob(defender.GetNameWithImage())}`,
            ])
                .addLargeSeparator()
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
                .addLargeSeparator()
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
    const started = await MultiplayerSession_1.MultiplayerSession.StartUserRobbery(attacker, defender, usedGrenade, "discord");
    if (!started.success) {
        const container = (0, ui_1.defaultComponent)({
            user: attacker,
            color: colors_1.CrColors.Robbery,
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
                const privateContainer = buildRobberyDefenderPrompt(attacker, defender, {
                    ...initData,
                    allowedResponses: session.allowedResponses,
                });
                defenderMessage = await defenderDiscordUser.send({
                    components: [privateContainer],
                    flags: discord_js_1.MessageFlags.IsComponentsV2,
                });
            }
            catch (err) {
                log_1.Log.Warning(`Failed to send robbery DM to user ${defender.Id}: ${err}`);
            }
        }
        const channelContainer = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(attacker)
            .setAccentColor(colors_1.CrColors.Robbery)
            .addTexts([
            `${emotes_1.EmoteString.Robbery} ${sA.robberyInProgress}`,
        ], 1)
            .addLargeSeparator()
            .addTexts([
            `${sA.tryingToRob} ${defender.GetNameWithImage()} ${emotes_1.EmoteString.Waiting}`,
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
            if (response === "react") {
                descriptionChannel = `### ${emotes_1.EmoteString.React} ${defender.GetNameWithImage()} ${sA.isReacting}!`;
            }
            else if (response === "police") {
                descriptionChannel = `### ${emotes_1.EmoteString.Police} ${defender.GetNameWithImage()} ${sA.isCallingPolice}!`;
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
            await (0, discordInteractions_1.replyWithContainer)(interaction, channelContainer);
        };
        unsubscribe = MultiplayerSession_1.MultiplayerSession.Subscribe(attacker.Id, attacker.GangId, update => {
            if (update.id === session.id && update.response) {
                responseUpdate = updateResponse(update.response).catch(error => {
                    log_1.Log.Warning(`Failed to update robbery response for session ${session.id}: ${error}`);
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
                time: 60_000,
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
        unsubscribe?.();
        unsubscribe = undefined;
        if (completed.phase !== "completed" || !completed.result) {
            await (0, discordInteractions_1.replyWithContainer)(interaction, (0, ui_1.defaultComponent)({
                user: attacker,
                color: colors_1.CrColors.Robbery,
                description: MultiplayerSession_1.Strings[attacker.Language].actionInterrupted,
            }));
            return;
        }
        const outcome = MultiplayerSession_1.MultiplayerSession.DecodeResult(completed.result);
        const finalPrivateContainer = buildRobberyDefenderResult(attacker, defender, outcome);
        if (outcome.success) {
            const randomSuccessMessage = sA.successMessages[Math.floor(Math.random() * sA.successMessages.length)];
            const successMessage = randomSuccessMessage((0, ui_1.formatMoney)(outcome.moneyRobbed, attacker.Language), defender.GetNameWithImage());
            const texts = [
                `### ${emotes_1.EmoteString.Victory} ${sA.success}!`,
                `${successMessage}${outcome.willBeBeatenUp ? `\n${sA.beatenUp(outcome.defenderHospitalTime)} ${emotes_1.EmoteString.Hospital}` : ""}`,
                `-# ${sA.willBeAbleAgain} ${(0, discord_js_1.time)(outcome.attackerWantedTime, discord_js_1.TimestampStyles.RelativeTime)}`,
            ].join("\n");
            channelContainer.changeTextFromSectionId(50, texts);
        }
        else {
            const randomFailureMessage = sA.failureMessages[Math.floor(Math.random() * sA.failureMessages.length)];
            const texts = [
                `### ${emotes_1.EmoteString.Defeat} ${sA.failure}!`,
                `${sA.youFailed}!`,
                `-# ${emotes_1.EmoteString.Prison} ${randomFailureMessage} ${sA.prisonTime(outcome.attackerPrisonTime)}`,
            ].join("\n");
            channelContainer.changeTextFromSectionId(50, texts);
        }
        channelContainer
            .changeTextFromSectionId(1, `${emotes_1.EmoteString.Robbery} ${sA.finishedRobberyAttacker(outcome.success)}`)
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
//# sourceMappingURL=robberyHelper.js.map