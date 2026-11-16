import { describe, expect, it } from "vitest";
import { formatToastText } from "../web-interface/utils/formatToastText";
import { GAME_TIME_ZONE } from "../src/shared/gameTimeZone";

describe("formatToastText", () => {
	it("removes Discord custom emojis and formats timestamps", () => {
		const timestamp = Math.floor(Date.UTC(2024, 0, 1, 12) / 1_000);
		const formattedTimestamp = new Intl.DateTimeFormat("pt-BR", {
			dateStyle: "short",
			timeStyle: "short",
			timeZone: GAME_TIME_ZONE,
		}).format(new Date(timestamp * 1_000));

		const formattedText = formatToastText(`Erro <:emoji:123456> em <t:${timestamp}:f> (<t:${timestamp}:R>) <:t:10987654321>`);

		expect(formattedText).toContain(`Erro em ${formattedTimestamp} (`);
		expect(formattedText).not.toMatch(/<(?::|t:)/);
	});
});
