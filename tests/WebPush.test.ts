import { describe, expect, it } from "vitest";
import { WebPush } from "#core/models/WebPush";

describe("WebPush.ToPlainText", () => {
	it("strips Discord emotes and markdown", () => {
		expect(WebPush.ToPlainText("You finished your **Cook** job! <:jobs:123456>\n-# <a:hench:987> 		Fee __paid__ by cool_guy"))
			.toBe("You finished your Cook job!\nFee paid by cool_guy");
	});
});
