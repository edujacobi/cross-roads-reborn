"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const Notification_1 = require("#core/models/Notification");
const Language_1 = require("#core/models/Language");
const User_1 = require("#core/models/User");
const discord_js_1 = require("discord.js");
const emotes_1 = require("#bot/utils/emotes");
const { sendPrivateMessage } = vitest_1.vi.hoisted(() => ({
    sendPrivateMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
}));
vitest_1.vi.mock("#bot/utils/discordInteractions", () => ({ sendPrivateMessage }));
(0, vitest_1.describe)("VIP gift notifications", () => {
    (0, vitest_1.afterEach)(() => vitest_1.vi.clearAllMocks());
    vitest_1.it.each([
        [Language_1.Language.English, "You received **7 days of VIP** from **Sender**!"],
        [Language_1.Language.Portuguese, "Você recebeu **7 dias de VIP** de **Sender**!"],
        [Language_1.Language.Spanish, "¡Recibiste **7 días de VIP** de **Sender**!"],
    ])("sends the recipient a DM in language %s", async (language, message) => {
        const receiver = new User_1.User("receiver", language);
        const giver = new User_1.User("giver");
        giver.Nickname = "Sender";
        await Notification_1.Notification.VipGift(receiver, giver, 7);
        (0, vitest_1.expect)(sendPrivateMessage).toHaveBeenCalledWith("receiver", `${message} ${emotes_1.EmoteString.VIP}`, discord_js_1.Colors.Gold);
    });
});
//# sourceMappingURL=VipGiftNotification.test.js.map