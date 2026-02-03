import { Client, Events } from "discord.js";
import { removeAllFromActions } from "@bot/utils/logic";
import { sequelize } from "@core/database/Database";
import { changeActivity } from "@bot/utils/ui";
import { Notification } from "@core/models/Notification";
import { HorseRacing } from "@core/models/HorseRacing";

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client: Client) {
		// await sequelize.sync({ force: true });
		await sequelize.sync();
		changeActivity(client);
		Notification.StartProcedure();
		await Promise.all([
			removeAllFromActions(),
			// startVIPProcedure(),
			HorseRacing.Initialize(),
		]);
	},
};
