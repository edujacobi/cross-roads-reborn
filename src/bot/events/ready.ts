import { type Client, Events } from "discord.js";
import { sequelize } from "#core/database/Database";
import { changeActivity } from "#bot/utils/ui";
import { Notification } from "#core/models/Notification";
import { HorseRacing } from "#core/models/HorseRacing";
import { Lottery } from "#core/models/Lottery";
import { removeAllFromActions } from "#bot/utils/userUtils";
import { Investment } from "#core/models/Investment";
import { Dashboard } from "#core/models/Dashboard";
import { Gang } from "#core/models/Gang";

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
			Investment.Initialize(),
			// startVIPProcedure(),
			HorseRacing.Initialize(),
			Lottery.Initialize(),
			Gang.ScheduleAllActiveShipments(),
			Dashboard.ScheduleMidnightSnapshot(),
		]);
	},
};
