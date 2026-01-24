import { User } from "../models/User";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ChatInputCommandInteraction,
	ColorResolvable,
	Colors,
	CommandInteraction,
	ComponentType,
	ContainerBuilder,
	EmbedBuilder,
	InteractionEditReplyOptions,
	InteractionReplyOptions,
	InteractionResponse,
	Message,
	MessageComponentInteraction,
	MessageCreateOptions,
	MessageFlags,
	MessagePayload,
	SectionBuilder,
	Snowflake,
	StringSelectMenuBuilder,
} from "discord.js";
import { Op } from "sequelize";
import { getClient } from "../client";
import { Log } from "./log";
import { Users } from "../database/Users";
import { EmoteString } from "./emotes";
import { getLanguageFromLocale, Language } from "../models/Language";
import { CustomContainerBuilder } from "../ui/builders/CustomContainerBuilder";

/**
 * Checks if the user exists in the database. If the user is the one who invoked the interaction,
 * it creates a new user if they don't exist, or updates their language if it has changed.
 *
 * @param userId - The ID of the user to check.
 * @param interaction - The interaction that triggered this check.
 * @returns The user object if found or created, otherwise undefined.
 */
export async function checkUser(userId: string, interaction: CommandInteraction) {
	const lang = getLanguageFromLocale(interaction.locale);
	const user = new User(userId, lang);

	if (await user.GetInfo()) {
		if (userId == interaction.user.id && user.Language !== lang) {
			await user.UpdateLanguage(lang);
		}
		return user;
	}

	if (userId == interaction.user.id) {
		await user.Create();

		await sendPrivateMessage(interaction.user.id, Strings[lang].welcomeMessage(interaction.user.username));
		return user.GetInfo();
	}
}

/**
 * Searches for a user by name or ID.
 *
 * @param nameOrId - The name or ID of the user to search for.
 * @param interaction - The interaction to reply to if the user is not found.
 * @param language - The language to use for the reply message.
 * @returns The user object if found, otherwise null.
 */
export async function searchUser(nameOrId: string, interaction: CommandInteraction, language?: Language) {
	const user = await User.Search(nameOrId, language);

	if (!user) {
		await replyUserDontExist(interaction, getLanguageFromLocale(interaction.locale));
		return null;
	}

	return user;
}

/**
 * Removes all users from any active actions (robbing, scavenging, beating, etc.) in the database.
 * This is typically used to reset states.
 */
export async function removeAllFromActions() {
	try {
		const [affectedCount] = await Users.update({
			beingRobbedByUserId: null,
			robbingUserId: null,
			robbingLocationId: null,
			scavengingId: null,
			beatingUserId: null,
			beingBeatUpByUserId: null,
			casinoIsInGame: false,
		}, {
			where: {
				[Op.or]: {
					beingRobbedByUserId: {
						[Op.not]: null,
					},
					robbingUserId: {
						[Op.not]: null,
					},
					robbingLocationId: {
						[Op.not]: null,
					},
					scavengingId: {
						[Op.not]: null,
					},
					beatingUserId: {
						[Op.not]: null,
					},
					beingBeatUpByUserId: {
						[Op.not]: null,
					},
					casinoIsInGame: {
						[Op.eq]: true,
					},
				},
			},
		});

		Log.Info(`${affectedCount} users removed from actions.`);

	}
	catch (err) {
		Log.Warning(`Something went wrong with removing Users from actions.`);
	}
}

/**
 * Sends a private message (DM) to a user with a simple embed.
 *
 * @param userId - The ID of the user to send the message to.
 * @param message - The content of the message description.
 * @param color - The color of the embed (default: DarkButNotBlack).
 * @param footer - Optional footer text for the embed.
 */
export async function sendPrivateMessage(userId: string, message: string, color: ColorResolvable = Colors.DarkButNotBlack, footer: string = "") {
	const client = getClient();
	const discordUser = await client.users.fetch(userId);

	try {
		const embed = new EmbedBuilder()
			.setDescription(message);

		if (color) {
			embed.setColor(color);
		}
		if (footer) {
			embed.setFooter({ text: footer });
		}

		await discordUser.send({ embeds: [embed] });
	}
	catch (err) {
		Log.Warning(`Something went wrong with sending private message to ${discordUser.displayName} (${discordUser.id}).`);
	}
}

/**
 * Sends a complex private message (DM) to a user.
 *
 * @param userId - The ID of the user to send the message to.
 * @param options - The message options (string, payload, or create options).
 * @returns The sent message or undefined if the user ID is missing or an error occurs.
 */
export async function sendComplexPrivateMessage(userId: Snowflake | undefined, options: string | MessagePayload | MessageCreateOptions) {
	if (!userId) {
		return;
	}
	const client = getClient();
	const discordUser = await client.users.fetch(userId);

	try {
		return await discordUser.send(options);
	}
	catch (err) {
		Log.Warning(`Something went wrong with sending private message to ${discordUser.displayName} (${discordUser.id}).`);
	}
}

/**
 * Replies to an interaction, handling deferred or already replied states.
 *
 * @param interaction - The interaction to reply to.
 * @param options - The reply options.
 * @returns The reply message or undefined if an error occurs.
 */
export async function replyInteraction(interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction, options: string | MessagePayload | InteractionReplyOptions | InteractionEditReplyOptions) {
	try {
		if (interaction instanceof ButtonInteraction) {
			if (interaction.replied || interaction.deferred) {
				return await interaction.followUp(options as InteractionReplyOptions);
			}
			return await interaction.reply(options as InteractionReplyOptions);
		}
		if (interaction.replied || interaction.deferred) {
			return await interaction.editReply(options as InteractionEditReplyOptions);
		}
		if (interaction instanceof MessageComponentInteraction) {
			return await interaction.update(options as InteractionEditReplyOptions);
		}

		return await interaction.reply(options as InteractionReplyOptions);
	}
	catch (err) {
		Log.Warning(`Something went wrong with replying interaction ${interaction.id} of user ${interaction.user.displayName} in server ${interaction.guild?.name} (ID: ${interaction.guild?.id}). Error: ${err}`);
	}
}

/**
 * Replies to an interaction with a custom container (UI).
 *
 * @param interaction - The interaction to reply to.
 * @param container - The container builder with components.
 * @param ephemeral - Whether the reply should be ephemeral (default: false).
 * @returns The reply message.
 */
export async function replyWithContainer(interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction, container: CustomContainerBuilder | ContainerBuilder, ephemeral = false) {
	return await replyInteraction(interaction, {
		components: [container],
		flags: ephemeral ? [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] : MessageFlags.IsComponentsV2,
	});
}

/**
 * Creates a button interaction collector for a message.
 *
 * @param interaction - The original interaction.
 * @param response - The message or interaction response to collect from.
 * @param idleTime - The idle time in milliseconds before the collector stops (default: 60000).
 * @returns The collector or undefined if response is missing.
 */
export function createButtonCollector(interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction, response: Message | InteractionResponse | undefined, idleTime = 60_000) {
	if (!response) {
		return;
	}

	return response.createMessageComponentCollector({
		filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
		componentType: ComponentType.Button,
		idle: idleTime,
	});
}

/**
 * Creates a string select menu interaction collector for a message.
 *
 * @param interaction - The original interaction.
 * @param response - The message or interaction response to collect from.
 * @param idleTime - The idle time in milliseconds before the collector stops (default: 60000).
 * @returns The collector or undefined if response is missing.
 */
export function createStringSelectCollector(interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction, response: Message | InteractionResponse | undefined, idleTime = 60_000) {
	if (!response) {
		return;
	}

	return response.createMessageComponentCollector({
		filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
		componentType: ComponentType.StringSelect,
		idle: idleTime,
	});
}

/**
 * Defers the reply to an interaction if it hasn't been deferred already.
 *
 * @param interaction - The interaction to defer.
 */
export async function deferReply(interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction) {
	try {
		if (interaction.deferred) {
			return;
		}
		await interaction.deferReply();
	}
	catch (err) {
		Log.Warning(`Something went wrong with deferring interaction ${interaction.id} of user ${interaction.user.displayName} in server ${interaction.guild?.name} (ID: ${interaction.guild?.id}). Error: ${err}`);
	}
}

/**
 * Replies to an interaction indicating that the user does not exist.
 *
 * @param interaction - The interaction to reply to.
 * @param language - The language for the error message.
 * @returns The reply message.
 */
export async function replyUserDontExist(interaction: CommandInteraction, language: Language) {
	return await replyInteraction(interaction, {
		content: Strings[language].userDontExist,
		flags: [MessageFlags.Ephemeral],
	});
}

/**
 * Disables all buttons and select menus in a container and updates the interaction.
 *
 * @param interaction - The interaction to update.
 * @param container - The container with components to disable.
 */
export async function disableButtons(interaction: CommandInteraction | ButtonInteraction, container: ContainerBuilder | CustomContainerBuilder) {
	try {
		for (const component of container.components) {
			if (component instanceof SectionBuilder) {
				if (!component.accessory) {
					continue;
				}
				if (component.accessory.data.type === ComponentType.Button) {
					component.accessory.data.disabled = true;
				}
			}
			if (component instanceof ActionRowBuilder) {
				if (component.components.length === 0) {
					continue;
				}
				for (const c of component.components) {
					if (c instanceof ButtonBuilder || c instanceof StringSelectMenuBuilder) {
						c.setDisabled(true);
					}
				}
			}
		}

		await replyWithContainer(interaction, container);
	}
	catch (err) {
		Log.Warning(`Something went wrong with disabling buttons from container ${container.data.id} of user ${interaction.user.displayName} in server ${interaction.guild?.name} (ID: ${interaction.guild?.id}). Error: ${err}`);
	}
}

/**
 * Assigns the 'Player' role to the user in the official server if they don't have it.
 * Only works in the production environment and official server.
 *
 * @param interaction - The interaction triggering the check.
 */
export async function setPlayerRoleInOfficialServer(interaction: ChatInputCommandInteraction) {
	if (process.env.NODE_ENV !== "PROD") {
		return;
	}

	const playerRoleId = "824341916929622017";

	const isInOfficialServer = interaction.guild?.id === process.env.SERVER_ID;

	if (!isInOfficialServer) {
		return;
	}

	const playerRole = interaction.guild.roles.cache.get(playerRoleId);

	if (!playerRole) {
		return;
	}

	const user = interaction.guild.members.cache.get(interaction.user.id);

	if (!user) {
		return;
	}

	const isPlayer = user.roles.cache.some(role => role.id === playerRoleId);

	if (isPlayer) {
		return;
	}

	try {
		await user.roles.add(playerRole);
		Log.Success(`Role Player added to user ${interaction.user.displayName} (ID: ${interaction.user.id})`);
	}
	catch (err) {
		Log.Warning(`Something went wrong with adding role Player to user ${interaction.user.displayName} (ID: ${interaction.user.id}).`);
	}
}

/**
 * Synchronizes the 'VIP' role for the user in the official server based on their VIP status.
 * Only works in the production environment and official server.
 *
 * @param interaction - The interaction triggering the check.
 */
export async function setVIPRoleInOfficialServer(interaction: ChatInputCommandInteraction) {
	if (process.env.NODE_ENV !== "PROD") {
		return;
	}

	const VIPRoleId = "529680357591613442";

	const isInOfficialServer = interaction.guild?.id === process.env.SERVER_ID;

	if (!isInOfficialServer) {
		return;
	}

	const VIPRole = interaction.guild.roles.cache.get(VIPRoleId);

	if (!VIPRole) {
		return;
	}

	const user = interaction.guild.members.cache.get(interaction.user.id);

	if (!user) {
		return;
	}

	const player = await new User(interaction.user.id).GetInfo();

	if (!player) {
		return;
	}

	const hasVIPRole = user.roles.cache.some(role => role.id === VIPRoleId);

	if (hasVIPRole && player.IsVip()) {
		return;
	}

	if (hasVIPRole && !player.IsVip()) {
		try {
			await user.roles.remove(VIPRole);
			Log.Success(`Role VIP removed from user ${interaction.user.displayName} (ID: ${interaction.user.id})`);
		}
		catch (err) {
			Log.Warning(`Something went wrong with removing role VIP from user ${interaction.user.displayName} (ID: ${interaction.user.id}).`);
		}
	}

	if (!hasVIPRole && player.IsVip()) {
		try {
			await user.roles.add(VIPRole);
			Log.Success(`Role VIP added to user ${interaction.user.displayName} (ID: ${interaction.user.id})`);
		}
		catch (err) {
			Log.Warning(`Something went wrong with adding role VIP to user ${interaction.user.displayName} (ID: ${interaction.user.id}).`);
		}
	}
}

/**
 * Sets the user's nickname in the official server to match their game nickname.
 * Only works in the production environment and official server.
 *
 * @param interaction - The interaction triggering the check.
 * @param user - The user object containing the nickname.
 */
export async function setPlayerNicknameInOfficialServer(interaction: ChatInputCommandInteraction, user: User) {
	if (process.env.NODE_ENV !== "PROD") {
		return;
	}

	if (user.Id === process.env.JACOBI_ID) {
		return;
	}

	const isInOfficialServer = interaction.guild?.id === process.env.SERVER_ID;

	if (!isInOfficialServer) {
		return;
	}

	const member = interaction.guild.members.cache.get(interaction.user.id);

	if (!member) {
		return;
	}

	if (member.nickname === user.Nickname) {
		return;
	}

	try {
		await member.setNickname(user.Nickname);
		Log.Success(`Nickname in server added to user ${interaction.user.displayName} (ID: ${interaction.user.id})`);
	}
	catch (err) {
		Log.Warning(`Something went wrong with adding Nickname in server to user ${interaction.user.displayName} (ID: ${interaction.user.id}).`);
	}
}

/**
 * Checks if the user is a server booster in the official server.
 * Only works in the production environment and official server.
 *
 * @param interaction - The interaction triggering the check.
 * @returns True if the user is a booster, false otherwise.
 */
export async function isUserBoosterInOfficialServer(interaction: ChatInputCommandInteraction) {
	if (process.env.NODE_ENV !== "PROD") {
		return false;
	}

	const boosterRoleId = "758691633544953936";

	const isInOfficialServer = interaction.guild?.id === process.env.SERVER_ID;

	if (!isInOfficialServer) {
		return false;
	}

	const boosterRole = interaction.guild.roles.cache.get(boosterRoleId);

	if (!boosterRole) {
		return false;
	}

	const user = interaction.guild.members.cache.get(interaction.user.id);

	if (!user) {
		return false;
	}

	return user.roles.cache.some(role => role.id === boosterRoleId);
}

/**
 * Checks all members of the official server and synchronizes their VIP role.
 * VIP users without the role will receive it; non-VIP users with the role will lose it.
 */
async function setAllVIPRolesInOfficialServer() {
	if (process.env.NODE_ENV !== "PROD") {
		return;
	}

	const client = getClient();
	const serverId = process.env.SERVER_ID;
	const VIPRoleId = "529680357591613442";

	if (!serverId) {
		Log.Warning("SERVER_ID is not set in environment variables.");
		return;
	}

	const guild = client.guilds.cache.get(serverId);
	if (!guild) {
		Log.Warning(`Official server with Id ${serverId} not found.`);
		return;
	}

	let members;
	try {
		members = await guild.members.fetch();
	}
	catch (err) {
		Log.Warning(`Failed to fetch members for server Id ${serverId}. Error: ${err}`);
		return;
	}

	const VIPRole = guild.roles.cache.get(VIPRoleId);
	if (!VIPRole) {
		Log.Warning(`VIP role with Id ${VIPRoleId} not found in server.`);
		return;
	}

	for (const member of members.values()) {
		const userId = member.user.id;
		const user = await new User(userId).GetInfo();
		if (!user) {
			continue;
		}

		const hasVIPRole = member.roles.cache.has(VIPRoleId);
		const isVIP = user.IsVip();

		if (isVIP && !hasVIPRole) {
			try {
				await member.roles.add(VIPRole);
				Log.Success(`VIP role added to user ${member.user.displayName} (${userId})`);
			}
			catch (err) {
				Log.Warning(`Failed to add VIP role to user ${member.user.displayName} (${userId}). Error: ${err}`);
			}
		}
		else if (!isVIP && hasVIPRole) {
			try {
				await member.roles.remove(VIPRole);
				Log.Success(`VIP role removed from user ${member.user.displayName} (${userId})`);
			}
			catch (err) {
				Log.Warning(`Failed to remove VIP role from user ${member.user.displayName} (${userId}). Error: ${err}`);
			}
		}
	}
}

/**
 * Starts the procedure to periodically synchronize VIP roles in the official server.
 */
export async function startVIPProcedure() {
	await setAllVIPRolesInOfficialServer();
	setInterval(setAllVIPRolesInOfficialServer, 6 * 60 * 1_000);
}

/**
 * Calculates the value of a percentage of a number.
 *
 * @param percent - The percentage to calculate.
 * @param from - The base number.
 * @returns The calculated value.
 */
export function getPercent(percent: number, from: number) {
	return (from / 100) * percent;
}

/**
 * Returns a random item from an array.
 *
 * @param array - The array to pick from.
 * @returns A random element from the array.
 */
export function getRandomItemFromArray<T>(array: T[]): T {
	return array[Math.round(Math.random() * (array.length - 1))];
}

const Strings = {
	[Language.English]: {
		welcomeMessage: (name: string) => `# Welcome to Cross Roads Reborn!
## Hello ${name}!
### Welcome to Cross Roads Reborn, where all paths cross.
${EmoteString.Shop} Earn money, buy items, rob other players, and much more!

${EmoteString.CloseInv} See your inventory using \`/inv\`.

${EmoteString.AssaultRifle} You can receive a little bit of money each day using \`/daily\`.

${EmoteString.Jobs} To start working, use \`/jobs\`.

-# Hope you enjoy the game!`,
		userDontExist: "This user doesn't exist in the database.",
	},

	[Language.Portuguese]: {
		welcomeMessage: (name: string) => `# Bem-vindo ao Cross Roads Reborn!
## Olá ${name}!
### Bem-vindo ao Cross Roads Reborn, onde todos os caminhos se cruzam.
${EmoteString.Shop} Ganhe dinheiro, compre itens, roube outros jogadores e muito mais!

${EmoteString.CloseInv} Veja seu inventário usando \`/inv\`.

${EmoteString.AssaultRifle} Você pode receber um pouco de dinheiro todos os dias usando \`/daily\`.

${EmoteString.Jobs} Para começar a trabalhar, use \`/trabalhos\`.

-# Espero que você goste do jogo!`,
		userDontExist: "Este usuário não existe no banco de dados.",
	},

	[Language.Spanish]: {
		welcomeMessage: (name: string) => `# Bienvenido a Cross Roads Reborn!
## ¡Hola ${name}!
### Bienvenido a Cross Roads Reborn, donde todos los caminos se cruzan.
${EmoteString.Shop} Gana dinero, compra objetos, roba a otros jugadores y mucho más!

${EmoteString.CloseInv} Mira tu inventario usando \`/inv\`.

${EmoteString.AssaultRifle} Puedes recibir un poco de dinero cada día usando \`/daily\`.

${EmoteString.Jobs} Para empezar a trabajar, usa \`/jobs\`.

-# ¡Espero que disfrutes del juego!`,
		userDontExist: "Este usuario no existe en la base de datos.",
	},
} as const;