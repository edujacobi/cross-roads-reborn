import { Collection, CommandInteraction, Events } from "discord.js";
import { defaultEmbed, showTime } from "../utils/ui";
import { checkUser, replyInteraction, setPlayerRoleInOfficialServer, setVIPRoleInOfficialServer } from "../utils/logic";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const wait = require("node:timers/promises").setTimeout;

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			return console.error(`No command matching ${interaction.commandName} was found.`);
		}

		const user = await checkUser(interaction.user.id, interaction);

		if (!user) {
			return;
		}

		if (!user.Nickname && command.data.name !== "setnick") {
			return await replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: "User without nickname",
					interaction,
					description: "You must set a nickname before using any other command! Use `/setnick` to set your nickname.",
				})],
				ephemeral: true,
			});
		}

		const cooldowns = interaction.client.cooldowns;

		if (!cooldowns.has(command.data.name)) {
			cooldowns.set(command.data.name, new Collection());
		}

		const now = Date.now();
		const timestamps = cooldowns.get(command.data.name);
		const defaultCooldownDuration = 3;
		const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

		if (!timestamps) {
			return;
		}

		if (timestamps.has(interaction.user.id)) {
			// @ts-expect-error - TS tells me that timestamps is possibly undefined, but I'm checking for it above.
			const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

			if (now < expirationTime) {

				await replyInteraction(interaction, {
					embeds: [defaultEmbed({
						nickname: user.Nickname,
						interaction,
						description: `You will be able to reuse the \`${command.data.name}\` command ${showTime(expirationTime, true)}.`,
					})],
					ephemeral: true,
				});

				await wait(cooldownAmount);
				return replyInteraction(interaction, {
					embeds: [defaultEmbed({
						nickname: user.Nickname,
						interaction,
						description: `You can now use the \`${command.data.name}\` command!`,
					})],
				});
			}
		}

		timestamps.set(interaction.user.id, now);
		setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

		setPlayerRoleInOfficialServer(interaction);
		await setVIPRoleInOfficialServer(interaction);

		try {
			command.execute(interaction, user);
		}
		catch (error) {
			console.error(error);

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: "There was an error while executing this command!",
					ephemeral: true,
				});

			}
			else {
				await replyInteraction(interaction, {
					content: "There was an error while executing this command!",
					ephemeral: true,
				});
			}
		}
	},
};