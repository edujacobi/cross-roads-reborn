"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const formatToastText_1 = require("../web-interface/utils/formatToastText");
(0, vitest_1.describe)("formatToastText", () => {
    (0, vitest_1.it)("removes Discord custom emojis and formats timestamps", () => {
        const timestamp = Math.floor(Date.UTC(2024, 0, 1, 12) / 1_000);
        const formattedTimestamp = new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
        }).format(new Date(timestamp * 1_000));
        const formattedText = (0, formatToastText_1.formatToastText)(`Erro <:emoji:123456> em <t:${timestamp}:f> (<t:${timestamp}:R>) <:t:10987654321>`);
        (0, vitest_1.expect)(formattedText).toContain(`Erro em ${formattedTimestamp} (`);
        (0, vitest_1.expect)(formattedText).not.toMatch(/<(?::|t:)/);
    });
});
//# sourceMappingURL=WebToast.test.js.map