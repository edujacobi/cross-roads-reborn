"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const WebPush_1 = require("#core/models/WebPush");
(0, vitest_1.describe)("WebPush.ToPlainText", () => {
    (0, vitest_1.it)("strips Discord emotes and markdown", () => {
        (0, vitest_1.expect)(WebPush_1.WebPush.ToPlainText("You finished your **Cook** job! <:jobs:123456>\n-# <a:hench:987> 		Fee __paid__ by cool_guy"))
            .toBe("You finished your Cook job!\nFee paid by cool_guy");
    });
});
//# sourceMappingURL=WebPush.test.js.map