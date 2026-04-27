import { type Client, Events } from "discord.js";
import { sequelize } from "#core/database/Database";
import { changeActivity } from "#bot/utils/ui";
import { Notification } from "#core/models/Notification";
import { HorseRacing } from "#core/models/HorseRacing";
import { Lottery } from "#core/models/Lottery";
import { removeAllFromActions } from "#bot/utils/userUtils";
import { InvestmentManager } from "#core/models/InvestmentManager";
import { DashboardStats } from "#core/database/DashboardStats";
import { Dashboard } from "#core/models/Dashboard";

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
			InvestmentManager.Initialize(),
			// startVIPProcedure(),
			HorseRacing.Initialize(),
			Lottery.Initialize(),
			Dashboard.ScheduleMidnightSnapshot(),
		]);
	},
};
