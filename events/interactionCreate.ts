import { Collection, Colors, CommandInteraction, Events } from "discord.js";
import { defaultEmbed, showTime } from "../utils/ui";
import { checkUser, replyInteraction, setPlayerRoleInOfficialServer, setVIPRoleInOfficialServer } from "../utils/logic";
import { getLanguageFromLocale, Language } from "../models/Language";
import { EmoteString } from "../utils/emotes";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const wait = require("node:timers/promises").setTimeout;

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;

		const language = getLanguageFromLocale(interaction.locale);

		const s = Strings[language];

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			return console.error(s.noCommand(interaction.commandName));
		}

		const user = await checkUser(interaction.user.id, interaction);

		if (!user) {
			return;
		}

		if (!user.Nickname && command.data.name !== "setnick") {
			return await replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: s.settingNick,
					interaction,
					description: s.settingDescription,
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
						description: s.willBeAble(command.data.name, expirationTime),
					})],
					ephemeral: true,
				});

				await wait(cooldownAmount);
				return replyInteraction(interaction, {
					embeds: [defaultEmbed({
						nickname: user.Nickname,
						interaction,
						description: s.canNowUse(command.data.name),
					})],
				});
			}
		}

		if (command.vip && !user.IsVip()) {
			return await replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: user.Nickname,
					interaction,
					color: Colors.Gold,
					description: s.needVIP,
				})],
				ephemeral: true,
			});
		}

		timestamps.set(interaction.user.id, now);
		setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

		setPlayerRoleInOfficialServer(interaction);
		await setVIPRoleInOfficialServer(interaction);

		try {
			command.execute(interaction, user, language);
		}
		catch (error) {
			console.error(error);

			await replyInteraction(interaction, {
				content: "There was an error while executing this command!",
				ephemeral: true,
			});
		}
	},
};

const Strings = {
	[Language.English]: {
		noCommand: (command: string) => `No command matching \`${command}\` was found.`,
		settingNick: "Setting nickname",
		settingDescription: "You must set a nickname before using any other command! Use `/setnick` to set your nickname.",
		willBeAble: (commandName: string, expirationTime: number) => `You will be able to reuse the \`${commandName}\` command ${showTime(expirationTime, true)}.`,
		canNowUse: (commandName: string) => `You can now use the \`${commandName}\` command.`,
		needVIP: `You need to be ${EmoteString.VIP} **VIP** to perform this action.`,
	},
	[Language.Portuguese]: {
		noCommand: (command: string) => `Nenhum comando correspondente a \`${command}\` foi encontrado.`,
		settingNick: "Configurando nickname",
		settingDescription: "Você deve definir um nickname antes de usar qualquer outro comando! Use `/mudanick` para definir seu nickname.",
		willBeAble: (commandName: string, expirationTime: number) => `Você poderá reutilizar o comando \`${commandName}\` ${showTime(expirationTime, true)}.`,
		canNowUse: (commandName: string) => `Agora você pode usar o comando \`${commandName}\`.`,
		needVIP: `Você precisa ser ${EmoteString.VIP} **VIP** para realizar esta ação.`,
	},
	[Language.Spanish]: {
		noCommand: (command: string) => `No se encontró ningún comando que coincida con \`${command}\`.`,
		settingNick: "Configurando nickname",
		settingDescription: "¡Debes establecer un apodo antes de usar cualquier otro comando! Use `/setnick` para establecer su apodo.",
		willBeAble: (commandName: string, expirationTime: number) => `Podrás reutilizar el comando \`${commandName}\` ${showTime(expirationTime, true)}.`,
		canNowUse: (commandName: string) => `Ahora puedes usar el comando \`${commandName}\`.`,
		needVIP: `Necesitas ser ${EmoteString.VIP} **VIP** para realizar esta acción.`,
	},
} as const;