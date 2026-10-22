import { afterEach, describe, expect, it, vi } from "vitest";
import { Notification } from "#core/models/Notification";
import { Language } from "#core/models/Language";
import { User } from "#core/models/User";
import { Colors } from "discord.js";
import { EmoteString } from "#bot/utils/emotes";

const { sendPrivateMessage } = vi.hoisted(() => ({
	sendPrivateMessage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("#bot/utils/discordInteractions", () => ({ sendPrivateMessage }));

describe("VIP gift notifications", () => {
	afterEach(() => vi.clearAllMocks());

	it.each([
		[Language.English, "You received **7 days of VIP** from **Sender**!"],
		[Language.Portuguese, "Você recebeu **7 dias de VIP** de **Sender**!"],
		[Language.Spanish, "¡Recibiste **7 días de VIP** de **Sender**!"],
	])("sends the recipient a DM in language %s", async (language, message) => {
		const receiver = new User("receiver", language);
		const giver = new User("giver");
		giver.Nickname = "Sender";

		await Notification.VipGift(receiver, giver, 7);

		expect(sendPrivateMessage).toHaveBeenCalledWith(
			"receiver",
			`${message} ${EmoteString.VIP}`,
			Colors.Gold,
		);
	});
});
