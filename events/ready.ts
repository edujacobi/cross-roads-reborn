import { Client, Events } from "discord.js";
import { removeAllFromActions } from "../utils/logic";
import { sequelize } from "../database/Database";
import { Log } from "../utils/log";
import { changeActivity } from "../utils/ui";
import { Notification } from "../models/Notification";
import { HorseRacing } from "../models/HorseRacing";

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client: Client) {
		// await sequelize.sync({ force: true });
		await sequelize.sync();
		changeActivity(client);
		await removeAllFromActions();
		Notification.StartProcedure();
		await HorseRacing.Initialize();
		Log.Success(`🔪 CROSS ROADS REBORN ONLINE!`);
	},
};
