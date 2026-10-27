"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const ui_1 = require("#bot/utils/ui");
const RobHistoryRepository_1 = require("#core/repositories/RobHistoryRepository");
const emotes_1 = require("#bot/utils/emotes");
const UserRepository_1 = require("#core/repositories/UserRepository");
const Language_1 = require("#core/models/Language");
const Pagination_1 = require("#core/models/Pagination");
const Classes_1 = require("#core/types/Classes");
const Locations_1 = require("#core/types/Locations");
const Investments_1 = require("#core/types/Investments");
const Robbery_1 = require("#core/types/Robbery");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const userUtils_1 = require("#bot/utils/userUtils");
module.exports = {
    cooldown: 10,
    data: new discord_js_1.SlashCommandBuilder()
        .setName("history")
        .setDescription("Shows the history of your robberies")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "historico")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "historial")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Mostra o seu histórico de roubos")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Muestra el historial de tus robos")
        .addStringOption(target => target
        .setName("target")
        .setDescription("The user to show")
        .setMinLength(3)
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "alvo")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O usuário para mostrar")),
    async execute(interaction, user, language) {
        const nameOrId = interaction.options.getString("target");
        await (0, discordInteractions_1.deferReply)(interaction);
        const target = nameOrId ? await (0, userUtils_1.searchUser)(nameOrId, interaction) : user;
        if (!target) {
            return;
        }
        const s = Strings[language];
        const pagination = new Pagination_1.Pagination(interaction, language);
        let robHistories = [];
        pagination.HowManyRecords = await RobHistoryRepository_1.RobHistoryRepository.Count(target.Id);
        pagination.CustomizeContainer = async () => {
            robHistories = await RobHistoryRepository_1.RobHistoryRepository.GetList(target.Id, pagination.Limit, pagination.Offset);
            let historyList = "";
            if (robHistories.length == 0) {
                historyList = `\n${s.empty}`;
            }
            for (let i = 0; i < robHistories.length; i++) {
                const rob = robHistories[i];
                const emoji = rob.success ? emotes_1.EmoteString.Victory : emotes_1.EmoteString.Defeat;
                const text = rob.success ? s.success : s.failure;
                const attacker = await UserRepository_1.UserRepository.FindById(rob.attackerId, ["id", "class", "nickname"]);
                const defender = await UserRepository_1.UserRepository.FindById(rob.defenderId, ["id", "class", "nickname"]);
                const location = Locations_1.LocationList[rob.locationId];
                if (!attacker) {
                    continue;
                }
                const boldCs = `${attacker.id == user.Id ? "**__" : ""}`;
                const boldCe = `${attacker.id == user.Id ? "__**" : ""}`;
                const challengerName = `${Classes_1.ClassList[attacker.class].Image.Emote.String} ${boldCs}${attacker.nickname}${boldCe}`;
                let opponentName = "";
                if ((rob.type == Robbery_1.ClashType.User || rob.type == Robbery_1.ClashType.BeatUp || rob.type == Robbery_1.ClashType.Investment) && defender) {
                    const boldOs = `${defender.id == user.Id ? "**__" : ""}`;
                    const boldOe = `${defender.id == user.Id ? "__**" : ""}`;
                    opponentName = `${Classes_1.ClassList[defender.class].Image.Emote.String} ${boldOs}${defender.nickname}${boldOe}`;
                    if (rob.type == Robbery_1.ClashType.Investment && rob.locationId != null) {
                        const inv = Investments_1.InvestmentList[rob.locationId];
                        if (inv) {
                            opponentName = `${inv.Name[user.Language]} ${s.of} ${opponentName}`;
                        }
                    }
                }
                if (rob.type == Robbery_1.ClashType.Location && location) {
                    opponentName = `${location.Emote.String} ${location.Name[user.Language]}`;
                }
                let emoteShow = emotes_1.EmoteString.React;
                if (rob.type == Robbery_1.ClashType.BeatUp)
                    emoteShow = emotes_1.EmoteString.BaseballBat;
                if (rob.type == Robbery_1.ClashType.Investment)
                    emoteShow += emotes_1.EmoteString.InvestmentActive;
                let textMoney = rob.success && rob.type != Robbery_1.ClashType.BeatUp ? ` • **${(0, ui_1.formatMoney)(rob.money, user.Language)}**` : "";
                if (rob.type == Robbery_1.ClashType.Investment) {
                    textMoney += ` • ${s.gangAction}`;
                }
                historyList += `### ${challengerName} ${emoteShow} ${opponentName}\n-# ${emoji} ${text}${textMoney} • ${(0, ui_1.formatDate)(rob.createdAt, language)}\n`;
            }
            return new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(user)
                .addTexts([
                `-# ${s.title} ${target.GetNameWithImage()}`,
            ])
                .addLargeSeparator()
                .addTexts([
                historyList,
            ]);
        };
        await pagination.GenerateContainer();
    },
};
const Strings = {
    [Language_1.Language.English]: {
        empty: "This user doesn't have a history",
        success: "Success",
        failure: "Failure",
        title: `Robbery and beat ups history of`,
        data: "Data",
        history: "history",
        successes: "Successes",
        failures: "Failures",
        successRate: "Success rate",
        robbedTotal: "Robbed total of",
        robbedTimes: (beingRobbedCount) => `Robbed \`${beingRobbedCount}\` times`,
        lost: "Lost",
        of: "of",
        gangAction: "Gang action",
    },
    [Language_1.Language.Portuguese]: {
        empty: "Este usuário não possui histórico",
        success: "Sucesso",
        failure: "Falha",
        title: `Histórico de roubos e espancamentos de`,
        data: "Dados",
        history: "Histórico",
        successes: "Sucessos",
        failures: "Falhas",
        successRate: "Taxa de sucesso",
        robbedTotal: "Roubou um total de",
        robbedTimes: (beingRobbedCount) => `Foi roubado \`${beingRobbedCount}\` vezes`,
        lost: "Perdeu",
        of: "de",
        gangAction: "Ação em Gangue",
    },
    [Language_1.Language.Spanish]: {
        empty: "Este usuario no tiene historial",
        success: "Éxito",
        failure: "Fracaso",
        title: `Historial de robos y golpes de`,
        data: "Datos",
        history: "Historial",
        successes: "Éxitos",
        failures: "Fracasos",
        successRate: "Tasa de éxito",
        robbedTotal: "Robó un total de",
        robbedTimes: (beingRobbedCount) => `Fue robado \`${beingRobbedCount}\` veces`,
        lost: "Perdió",
        of: "de",
        gangAction: "Acción en cuadrilla",
    },
};
//# sourceMappingURL=history.js.map