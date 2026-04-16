import { replyInteraction, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteString } from "#bot/utils/emotes";
import {
	isUserBoosterInOfficialServer,
	syncUserInOfficialServer,
} from "#bot/utils/officialServer";
import { defaultComponent, showTime } from "#bot/utils/ui";
import { checkUser } from "#bot/utils/userUtils";
import { getLanguageFromLocale, Language, type Localization } from "#core/models/Language";
import { User } from "#core/models/User";
import { ClassId } from "#core/types/Classes";
import { logger } from "#shared/log";
import { Collection, Colors, type CommandInteraction, Events, MessageFlags } from "discord.js";

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

		const [user, isBooster] = await Promise.all([
			checkUser(interaction.user.id, interaction),
			isUserBoosterInOfficialServer(interaction),
		]);

		if (!user) {
			return;
		}

		if (!user.Nickname && command.data.name !== "setnick") {
			const tempUser = new User("0");
			tempUser.Nickname = s.settingNick;

			const container = defaultComponent({
				user: tempUser,
				description: s.settingNickDescription,
			});

			return replyWithContainer(interaction, container, true);
		}

		if (user.Class == ClassId.None && command.data.name !== "setclass" && command.data.name !== "setnick") {
			const container = defaultComponent({
				user,
				description: s.settingClassDescription,
			});

			return replyWithContainer(interaction, container, true);
		}

		const cooldowns = interaction.client.cooldowns;

		if (!cooldowns.has(command.data.name)) {
			cooldowns.set(command.data.name, new Collection());
		}

		const now = Date.now();
		const timestamps = cooldowns.get(command.data.name);
		const defaultCooldownDuration = user.IsVip() || isBooster ? 1 : 5;
		const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;

		if (!timestamps) {
			return;
		}

		if (timestamps.has(interaction.user.id)) {
			// @ts-expect-error - TS tells me that timestamps is possibly undefined, but I'm checking for it above.
			const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

			if (now < expirationTime) {
				const container = defaultComponent({
					user,
					description: s.willBeAble(command.data.name, expirationTime),
				});

				await replyWithContainer(interaction, container, true);

				container.changeTextFromSectionId(1, s.canNowUse(command.data.name));

				await wait(cooldownAmount);

				return replyWithContainer(interaction, container, true);
			}
		}

		if (command.vip && !user.IsVip()) {
			const container = defaultComponent({
				user,
				color: Colors.Gold,
				description: s.needVIP,
			});

			return replyWithContainer(interaction, container, true);
		}

		timestamps.set(interaction.user.id, now);
		setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

		interaction.client.userLastCommand.set(interaction.user.id, now);

		// Throttled server synchronization (once every 4 hours)
		const lastSync = interaction.client.userLastSync?.get(interaction.user.id) || 0;
		const fourHours = 4 * 60 * 60 * 1_000;

		if (now - lastSync > fourHours) {
			try {
				await syncUserInOfficialServer(interaction, user);

				interaction.client.userLastSync.set(interaction.user.id, now);

			}
			catch (error) {
				logger.error("Error during throttled sync:", error);
			}
		}

		try {
			await command.execute(interaction, user, language);
		}
		catch (error) {
			logger.error(error);

			await replyInteraction(interaction, {
				content: "There was an error while executing this command!",
				flags: [MessageFlags.Ephemeral],
			});
		}
	},
};

const Strings = {
	[Language.English]: {
		noCommand: (command: string) => `No command matching \`${command}\` was found.`,
		settingNick: "Setting nickname",
		settingNickDescription: "You must set a nickname before using any other command! Use `/setnick` to set your nickname.",
		settingClassDescription: "You must choose a class before using any other command! Use `/setclass` to choose your class.",
		willBeAble: (commandName: string, expirationTime: number) => `You will be able to reuse the \`${commandName}\` command ${showTime(expirationTime, true)}.`,
		canNowUse: (commandName: string) => `You can now use the \`${commandName}\` command.`,
		needVIP: `You need to be ${EmoteString.VIP} **VIP** to perform this action.`,
	},
	[Language.Portuguese]: {
		noCommand: (command: string) => `Nenhum comando correspondente a \`${command}\` foi encontrado.`,
		settingNick: "Configurando nickname",
		settingNickDescription: "Você deve definir um nickname antes de usar qualquer outro comando! Use `/mudanick` para definir seu nickname.",
		settingClassDescription: "Você deve escolher uma classe antes de usar qualquer outro comando! Use `/mudaclasse` para definir sua classe.",
		willBeAble: (commandName: string, expirationTime: number) => `Você poderá reutilizar o comando \`${commandName}\` ${showTime(expirationTime, true)}.`,
		canNowUse: (commandName: string) => `Agora você pode usar o comando \`${commandName}\`.`,
		needVIP: `Você precisa ser ${EmoteString.VIP} **VIP** para realizar esta ação.`,
	},
	[Language.Spanish]: {
		noCommand: (command: string) => `No se encontró ningún comando que coincida con \`${command}\`.`,
		settingNick: "Configurando nickname",
		settingNickDescription: "¡Debes establecer un apodo antes de usar cualquier otro comando! Use `/setnick` para establecer su apodo.",
		settingClassDescription: "¡Debes elegir una clase antes de usar cualquier otro comando! Use `/setclass` para definir su clase.",
		willBeAble: (commandName: string, expirationTime: number) => `Podrás reutilizar el comando \`${commandName}\` ${showTime(expirationTime, true)}.`,
		canNowUse: (commandName: string) => `Ahora puedes usar el comando \`${commandName}\`.`,
		needVIP: `Necesitas ser ${EmoteString.VIP} **VIP** para realizar esta acción.`,
	},
} as const satisfies Localization;