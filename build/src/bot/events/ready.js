"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const ui_1 = require("#bot/utils/ui");
const Notification_1 = require("#core/models/Notification");
const HorseRacing_1 = require("#core/models/HorseRacing");
const Lottery_1 = require("#core/models/Lottery");
const userUtils_1 = require("#bot/utils/userUtils");
const Investment_1 = require("#core/models/Investment");
const Dashboard_1 = require("#core/models/Dashboard");
const Gang_1 = require("#core/models/Gang");
const Season_1 = require("#core/models/Season");
const log_1 = require("#shared/log");
const VaultRepository_1 = require("#core/repositories/VaultRepository");
module.exports = {
    name: discord_js_1.Events.ClientReady,
    once: true,
    async execute(client) {
        await VaultRepository_1.VaultRepository.GetInstance();
        (0, ui_1.changeActivity)(client);
        Notification_1.Notification.StartProcedure();
        log_1.LogManager.Initialize();
        await Season_1.Season.Initialize();
        await Promise.all([
            (0, userUtils_1.removeAllFromActions)(),
            Investment_1.Investment.Initialize(),
            // startVIPProcedure(),
            HorseRacing_1.HorseRacing.Initialize(),
            Lottery_1.Lottery.Initialize(),
            Gang_1.Gang.ScheduleAllActiveShipments(),
            Dashboard_1.Dashboard.ScheduleMidnightSnapshot(),
        ]);
    },
};
//# sourceMappingURL=ready.js.map