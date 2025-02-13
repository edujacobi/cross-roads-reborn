import { Client, Events } from "discord.js";
import { notificationProcedure, removeAllFromRobbery } from "../utils/logic";
import { sequelize } from "../database/Database";
import { Log } from "../utils/log";
import { changeActivity } from "../utils/ui";

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client: Client) {
		// await sequelize.sync({force: true});
		await sequelize.sync();
		changeActivity(client);
		await removeAllFromRobbery();
		await notificationProcedure();
		Log.Success(`🔪 CROSS ROADS REBORN ONLINE!`);
	},
};