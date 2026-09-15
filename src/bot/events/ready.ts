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
import { Season } from "#core/models/Season";
import { LogManager } from "#shared/log";
import { VaultRepository } from "#core/repositories/VaultRepository";

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client: Client) {
		// await sequelize.sync({ force: true });
		await sequelize.sync();
		await VaultRepository.GetInstance();
		changeActivity(client);
		Notification.StartProcedure();
		LogManager.Initialize();
		await Season.Initialize();
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
