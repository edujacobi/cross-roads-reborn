"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeMultiplayerSessionDiscordBridge = initializeMultiplayerSessionDiscordBridge;
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const client_1 = require("#bot/client");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const beatupHelper_1 = require("#bot/utils/beatupHelper");
const robberyHelper_1 = require("#bot/utils/robberyHelper");
const Language_1 = require("#core/models/Language");
const User_1 = require("#core/models/User");
const MultiplayerSession_1 = require("#core/models/MultiplayerSession");
const log_1 = require("#shared/log");
const discord_js_1 = require("discord.js");
const promptedSessions = new Set();
const shownResponses = new Set();
const defenderMessages = new Map();
function initializeMultiplayerSessionDiscordBridge() {
    return MultiplayerSession_1.MultiplayerSession.SubscribeAll(session => {
        if (session.source !== "web" || !session.targetId)
            return;
        if ((session.kind === "beatUp" || session.kind === "userRobbery" || session.kind === "investmentRobbery") &&
            session.phase === "awaitingDefender" &&
            !promptedSessions.has(session.id)) {
            promptedSessions.add(session.id);
            void sendPrompt(session).catch(error => {
                log_1.Log.Warning(`Failed to send Discord prompt for multiplayer session ${session.id}: ${error}`);
            });
        }
        if (session.response && !shownResponses.has(session.id)) {
            shownResponses.add(session.id);
            void showResponse(session).catch(error => {
                log_1.Log.Warning(`Failed to update Discord response for multiplayer session ${session.id}: ${error}`);
            });
        }
        if (session.phase === "completed" || session.phase === "aborted") {
            void showResult(session).catch(error => {
                log_1.Log.Warning(`Failed to send Discord result for multiplayer session ${session.id}: ${error}`);
            });
        }
    });
}
async function sendPrompt(session) {
    const target = new User_1.User(session.targetId);
    if (!await target.GetInfo())
        return;
    const attacker = new User_1.User(session.ownerId);
    if (!await attacker.GetInfo())
        return;
    const client = (0, client_1.getClient)();
    const discordTarget = await client.users.fetch(target.Id);
    let prompt;
    if (session.kind === "beatUp" || session.kind === "userRobbery") {
        const details = session.duelDetails;
        if (!details)
            throw new Error(`Missing duel details for session ${session.id}`);
        const data = {
            usedGunSkin: details.weaponEmoji,
            usedGunName: details.weaponName,
            usedGrenade: details.usedGrenade,
            allowedResponses: session.allowedResponses,
        };
        prompt = session.kind === "beatUp"
            ? (0, beatupHelper_1.buildBeatUpDefenderPrompt)(attacker, target, {
                ...data,
                timeInHospitalAditional: details.hospitalMinutesDelta,
            })
            : (0, robberyHelper_1.buildRobberyDefenderPrompt)(attacker, target, {
                ...data,
                defenderTimeInHospital: details.hospitalMinutes,
                attackerAditionalTimeCallPolice: details.prisonMinutesDelta,
            });
    }
    else {
        prompt = buildInvestmentPrompt(session, attacker, target);
    }
    const message = await discordTarget.send({
        components: [prompt],
        flags: discord_js_1.MessageFlags.IsComponentsV2,
    });
    defenderMessages.set(session.id, message);
    const expiresAt = session.expiresAt ? new Date(session.expiresAt).getTime() : Date.now() + 60_000;
    const collector = message.createMessageComponentCollector({
        filter: interaction => interaction.user.id === target.Id,
        componentType: discord_js_1.ComponentType.Button,
        time: Math.max(1, expiresAt - Date.now()),
    });
    collector.on("collect", async (interaction) => {
        await (0, discordInteractions_1.deferUpdate)(interaction);
        const result = await MultiplayerSession_1.MultiplayerSession.Respond(session.id, target.Id, interaction.customId, target.Language);
        if (!result.success) {
            await interaction.followUp({ content: result.message, flags: discord_js_1.MessageFlags.Ephemeral });
        }
    });
}
function buildInvestmentPrompt(session, attacker, target) {
    const language = target.Language;
    const title = {
        [Language_1.Language.English]: "Investment attack",
        [Language_1.Language.Portuguese]: "Ataque ao investimento",
        [Language_1.Language.Spanish]: "Ataque a la inversión",
    }[language];
    const defendLabel = {
        [Language_1.Language.English]: "Defend",
        [Language_1.Language.Portuguese]: "Defender",
        [Language_1.Language.Spanish]: "Defender",
    }[language];
    const attackDescription = {
        [Language_1.Language.English]: `Your investment is under attack by ${attacker.GetNameWithImage()}.`,
        [Language_1.Language.Portuguese]: `Seu investimento está sendo atacado por ${attacker.GetNameWithImage()}.`,
        [Language_1.Language.Spanish]: `Tu inversión está siendo atacada por ${attacker.GetNameWithImage()}.`,
    }[language];
    return new CustomContainerBuilder_1.CustomContainerBuilder()
        .setUser(target)
        .setAccentColor(colors_1.CrColors.Robbery)
        .addTexts([
        `${emotes_1.EmoteString.InvestmentActive} ${title}`,
        `${attackDescription} ${session.investmentName ?? ""}`,
    ])
        .addLargeSeparator()
        .addButtonRow(button => button
        .setCustomId("defend")
        .setLabel(defendLabel)
        .setStyle(discord_js_1.ButtonStyle.Secondary));
}
async function showResponse(session) {
    const message = defenderMessages.get(session.id);
    if (!message)
        return;
    const target = new User_1.User(session.targetId);
    if (!await target.GetInfo())
        return;
    if (session.kind === "beatUp") {
        await message.edit({ components: [(0, beatupHelper_1.buildBeatUpDefenderResponse)(target, session.response)] });
        return;
    }
    if (session.kind === "userRobbery") {
        await message.edit({ components: [(0, robberyHelper_1.buildRobberyDefenderResponse)(target, session.response)] });
        return;
    }
    const responseText = {
        [Language_1.Language.English]: "Your response was recorded. Wait for the result.",
        [Language_1.Language.Portuguese]: "Sua resposta foi registrada. Aguarde o resultado.",
        [Language_1.Language.Spanish]: "Tu respuesta fue registrada. Espera el resultado.",
    }[target.Language];
    const container = new CustomContainerBuilder_1.CustomContainerBuilder()
        .setUser(target)
        .setAccentColor(colors_1.CrColors.Robbery)
        .addTexts([responseText]);
    await message.edit({ components: [container] });
}
async function showResult(session) {
    const message = defenderMessages.get(session.id);
    if (!message)
        return;
    const target = new User_1.User(session.targetId);
    if (!await target.GetInfo())
        return;
    const attacker = new User_1.User(session.ownerId);
    if (!await attacker.GetInfo())
        return;
    if (session.phase === "completed" && session.result) {
        if (session.kind === "beatUp") {
            const outcome = MultiplayerSession_1.MultiplayerSession.DecodeResult(session.result);
            await message.edit({ components: [(0, beatupHelper_1.buildBeatUpDefenderResult)(attacker, target, outcome)] });
            defenderMessages.delete(session.id);
            promptedSessions.delete(session.id);
            shownResponses.delete(session.id);
            return;
        }
        if (session.kind === "userRobbery") {
            const outcome = MultiplayerSession_1.MultiplayerSession.DecodeResult(session.result);
            await message.edit({ components: [(0, robberyHelper_1.buildRobberyDefenderResult)(attacker, target, outcome)] });
            defenderMessages.delete(session.id);
            promptedSessions.delete(session.id);
            shownResponses.delete(session.id);
            return;
        }
    }
    const actionComplete = {
        [Language_1.Language.English]: "The action is complete.",
        [Language_1.Language.Portuguese]: "A ação foi concluída.",
        [Language_1.Language.Spanish]: "La acción fue completada.",
    }[target.Language];
    const actionAborted = {
        [Language_1.Language.English]: "This action was cancelled.",
        [Language_1.Language.Portuguese]: "Esta ação foi cancelada.",
        [Language_1.Language.Spanish]: "Esta acción fue cancelada.",
    }[target.Language];
    let text = session.phase === "aborted" ? actionAborted : actionComplete;
    if (session.phase === "completed" && session.result && session.kind === "investmentRobbery") {
        const messages = {
            [Language_1.Language.English]: {
                success: (amount) => `Your investment was robbed for ${(0, ui_1.formatMoney)(amount, target.Language)}.`,
                remaining: (amount) => `Remaining yield: ${(0, ui_1.formatMoney)(amount, target.Language)}.`,
                failure: "The gang was caught; your investment was defended.",
            },
            [Language_1.Language.Portuguese]: {
                success: (amount) => `Seu investimento foi roubado em ${(0, ui_1.formatMoney)(amount, target.Language)}.`,
                remaining: (amount) => `Rendimento restante: ${(0, ui_1.formatMoney)(amount, target.Language)}.`,
                failure: "A gangue foi pega; seu investimento foi defendido.",
            },
            [Language_1.Language.Spanish]: {
                success: (amount) => `Robaron ${(0, ui_1.formatMoney)(amount, target.Language)} de tu inversión.`,
                remaining: (amount) => `Rendimiento restante: ${(0, ui_1.formatMoney)(amount, target.Language)}.`,
                failure: "La cuadrilla fue atrapada; defendiste tu inversión.",
            },
        };
        const result = MultiplayerSession_1.MultiplayerSession.DecodeResult(session.result);
        text = result.win
            ? `${messages[target.Language].success(result.robbedAmount)}\n${messages[target.Language].remaining(result.remainingYield)}`
            : messages[target.Language].failure;
    }
    const container = new CustomContainerBuilder_1.CustomContainerBuilder()
        .setUser(target)
        .setAccentColor(session.kind === "beatUp" ? colors_1.CrColors.BeatUp : colors_1.CrColors.Robbery)
        .addTexts([text]);
    await message.edit({ components: [container] });
    defenderMessages.delete(session.id);
    promptedSessions.delete(session.id);
    shownResponses.delete(session.id);
}
//# sourceMappingURL=multiplayerSessionDiscordBridge.js.map