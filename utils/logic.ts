import { User } from "../models/User";
import {
	APIEmbed,
	ButtonInteraction,
	ChatInputCommandInteraction,
	CommandInteraction,
	InteractionReplyOptions,
	MessagePayload,
} from "discord.js";
import { Rooster } from "../models/Rooster";
import { defaultEmbed, EmoteString, getPathText, getRarityColor, showTime } from "./ui";
import { Roosters } from "../database/Roosters";
import { CustomEmbedBuilder } from "../models/CustomEmbedBuilder";
import { JSONEncodable } from "@discordjs/util";
import { Op } from "sequelize";
import { Notification, NotificationType } from "../models/Notification";
import { getClient } from "../client";
import { Log } from "./log";
import { getRoosterEmote } from "../models/RoosterImage";
import { Egg } from "../models/Egg";

export const BOT_ID = "1089602356271927356";
export const HOURS_TO_HATCH = 6;

export async function checkUser(userId: string, interaction: CommandInteraction) {
	const user = new User(userId);

	if (await user.GetInfo()) {
		return user;
	}

	if (userId == interaction.user.id) {
		await user.Create();
		const message = `# Welcome to Battle Roosters Arena
## Hello ${interaction.user.displayName}!

Welcome to Battle Roosters Arena, where your journey as a **Rooster Trainer** begins.

There is roosters of many types. Each one of them has a Nationality (where he was born), a Race, a Color (you can change it) and a Rarity.

You've received a rooster of random attributes. He will start at level 0.

He can battle only at level 1. You can train him at the Dojo. Use \`/train\`.

You can receive a little bit of Exp each day using \`/daily\`.

The rarities of wild roosters are:
**${EmoteString.Common} Common**
**${EmoteString.Uncommon} Uncommon**
**${EmoteString.Rare} Rare**
**${EmoteString.Legendary} Legendary**

Hope you enjoy the game!
`;
		await sendPrivateMessage(interaction.user.id, message);
		return user.GetInfo();
	}
}

export async function checkRooster(userId: string, interaction: CommandInteraction) {
	await checkUser(userId, interaction);

	const rooster = new Rooster(userId);

	if (await rooster.GetInfo()) {
		if (!rooster.IsDeleted) {
			return rooster;
		}
	}

	const egg = await checkEgg(userId, interaction);

	if (egg) {
		return;
	}

	if (userId == interaction.user.id) {
		await rooster.Create();
		return rooster.GetInfo();

	}
	else {
		await replyInteraction(interaction, {
			content: `I didn't find a rooster for this user in the database!`,
			ephemeral: true,
		});
	}

}

export async function checkEgg(userId: string, interaction: CommandInteraction) {
	const egg = new Egg(userId);

	await egg.GetInfo();

	if (!egg.Exists) {
		return;
	}

	if (userId == interaction.user.id) {
		if (egg.Hatched) {
			return egg;
		}

		await replyInteraction(interaction, {
			content: `You need to wait until ${showTime(egg.TimeToHatch)} for your 🥚 Egg to hatch a new rooster!`,
			ephemeral: true,
		});

		return egg;
	}
	else {
		const client = getClient();
		const discordUser = await client.users.fetch(userId);

		if (egg.Hatched) {
			await replyInteraction(interaction, {
				content: `${discordUser.displayName}'s 🥚 Egg hatched! He/She need to use \`/rooster\` command to see what is inside!`,
				ephemeral: true,
			});
		}
		else {
			await replyInteraction(interaction, {
				content: `${discordUser.displayName} need to wait until ${showTime(egg.TimeToHatch)} for their 🥚 Egg to hatch a new rooster!`,
				ephemeral: true,
			});
		}
	}

	return egg;
}

interface ActionsOptions {
	training?: boolean;
	finishedTraining?: boolean;
	battling?: boolean;
	resting?: boolean;
	lowLevel?: boolean;
	trainedAll?: boolean;
}

/**
 * Check if the Rooster can battle by checking all battle actions.
 * @param rooster the rooster model
 * @returns if the rooster can battle (false: cannot; true: can)
 */
export function checkAllActionsForBattle(rooster: Rooster) {
	return checkActions({
		training: true,
		finishedTraining: true,
		battling: true,
		resting: true,
		lowLevel: true,
	}, rooster);
}

/**
 * Check if the Rooster can do some action.
 * @param actions the actions to verify
 * @param rooster the rooster model
 * @returns if the user can perform the action (false: cannot; true: can)
 */
export function checkActions(actions: ActionsOptions, rooster: Rooster) {
	const isBattling = rooster.BattlingWith != null;
	const isTraining = rooster.Timers.Train > Date.now() && rooster.IsTraining != null;
	const hasFinishedTraining = rooster.Timers.Train < Date.now() && rooster.IsTraining != null;
	const isResting = rooster.Timers.Rest > Date.now() && rooster.IsTraining == null;
	const isLowLevel = rooster.Level === 0;
	const hasAlreadyTrainedAll = rooster.AvailableTrainings == 0;

	const actionsChecked: ActionsOptions = {
		battling: actions.battling && isBattling,
		finishedTraining: actions.finishedTraining && hasFinishedTraining,
		training: actions.training && isTraining,
		resting: actions.resting && isResting,
		lowLevel: actions.lowLevel && isLowLevel,
		trainedAll: actions.trainedAll && hasAlreadyTrainedAll,
	};

	return actionsChecked;
}

/**
 * Show messages based on checked actions
 * @param actions the actions to show messages
 * @param rooster the rooster model
 * @param interaction the interaction to respond
 * @returns boolean if the rooster can perfom the action of the messages
 */
export async function showMessageActions(actions: ActionsOptions, rooster: Rooster, interaction: CommandInteraction | ButtonInteraction) {
	let description = "";

	if (actions.battling) {
		if (!rooster.BattlingWith) {
			return;
		}

		const opponent = await Roosters.findByPk(rooster.BattlingWith);

		description += `**${rooster.GetNameWithImage()}** is ${EmoteString.Battling} **Battling** with ${opponent?.name} and cannot do that right now. It will finish in a moment.\n`;
	}

	if (actions.training) {
		description += `**${rooster.GetNameWithImage()}** is ${EmoteString.Training} **Training** in ${getPathText(<string>rooster.IsTraining)} and cannot do that right now. It will finish ${showTime(rooster.Timers.Train, true)}.\n`;
	}

	if (actions.finishedTraining) {
		description += `**${rooster.GetNameWithImage()}** has ${EmoteString.Training} **finished his training** in ${getPathText(<string>rooster.IsTraining)} and need to complete it.\n`;
	}

	if (actions.resting) {
		description += `**${rooster.GetNameWithImage()}** is ${EmoteString.Resting} **Resting** and cannot do that right now. It will be ready ${showTime(rooster.Timers.Rest, true)}.\n`;
	}

	if (actions.lowLevel) {
		description += `**${rooster.GetNameWithImage()}** cannot do that until it gets to Level 1.\n`;
	}

	if (actions.trainedAll) {
		description += `**${rooster.GetNameWithImage()}** doesn't have more ${EmoteString.Training} **Trainings** available.\n`;
	}

	if (description.length == 0) {
		return true;
	}

	await replyInteraction(interaction, {
		embeds: [defaultEmbed({
			thumbnail: rooster.GetImage(),
			color: getRarityColor(rooster.Rarity),
			interaction,
			description: description,
		})],
		ephemeral: true,
	});

	return false;
}

export async function removeAllFromBattle() {
	try {
		await Roosters.update({
			battlingWith: null,
		}, {
			where: {
				battlingWith: {
					[Op.not]: null,
				},
			},
		});

		Log.Info(`All roosters removed from battle.`);

	}
	catch (err) {
		Log.Warning(`Something went wrong with removing Roosters from battle.`);
	}
}

export async function sendPrivateMessage(userId: string, message: string) {
	const client = getClient();
	const discordUser = await client.users.fetch(userId);

	try {
		const embed = new CustomEmbedBuilder()
			.setDescription(message);

		await discordUser.send({ embeds: [embed] });
	}
	catch (err) {
		Log.Warning(`Something went wrong with sending private message to ${discordUser.displayName} (${discordUser.id}).`);
	}
}

export async function sendTimedNotification() {
	const now = new Date();
	const hasNotification = await Notification.HasNotificationsToSend(now);

	// return Log.Info(`No notifications to send. Ignoring procedure.`);
	if (!hasNotification) {
		return;
	}

	Log.Info(`Starting notification procedure ↓`);
	const list = await Notification.GetNextNotifications(now);

	for (const notification of list) {
		const rooster = await Roosters.findByPk(notification.RoosterId);

		if (!rooster) {
			Log.Warning(`Cannot send private message if the rooster was deleted (RoosterId: ${notification.RoosterId}).`);
			await notification.SetAsNotified();
			continue;
		}

		if (notification.Type == NotificationType.Rest) {
			await sendPrivateMessage(rooster.ownerId, `${getRoosterEmote(rooster.image)} **${rooster.name}** has rested! ${EmoteString.Resting} `);
		}
		else if (notification.Type == NotificationType.Train) {
			await sendPrivateMessage(rooster.ownerId, `${getRoosterEmote(rooster.image)} **${rooster.name}** has ended his training in ${getPathText(<string>rooster.isTraining)}! ${EmoteString.Training}`);
		}
		else if (notification.Type == NotificationType.Daily) {
			await sendPrivateMessage(rooster.ownerId, `${EmoteString.Experience} You can receive your daily Exp again!`);
		}
		else if (notification.Type == NotificationType.Hatch) {
			await sendPrivateMessage(rooster.ownerId, `Your 🥚 Egg has hatched! Use \`/rooster\` to see what is inside!`);
		}

		await notification.SetAsNotified();
	}
	Log.Info(`Notification procedure complete ↑`);
}

export async function notificationProcedure() {
	setInterval(sendTimedNotification, 60_000);
}

export async function replyInteraction(interaction: CommandInteraction | ButtonInteraction, options: string | MessagePayload | InteractionReplyOptions) {
	try {
		if (interaction.replied) {
			return await interaction.editReply(options);
		}

		return await interaction.reply(options);
	}
	catch (err) {
		Log.Warning(`Something went wrong with replying interaction ${interaction.id} of user ${interaction.user.displayName} in server ${interaction.guild?.name} (ID: ${interaction.guild?.id}). Error: ${err}`);
	}
}

export async function removeEmbedComponents(interaction: CommandInteraction | ButtonInteraction, embeds?: (JSONEncodable<APIEmbed> | APIEmbed)[]) {
	try {
		const replyOptions = embeds ? { embeds, components: [] } : { components: [] };

		if (interaction instanceof CommandInteraction) {
			await replyInteraction(interaction, replyOptions);
		}
		else {
			await interaction.update(replyOptions);
		}
	}
	catch (err) {
		Log.Warning(`Something went wrong with removing components from interaction ${interaction.id} of user ${interaction.user.displayName} in server ${interaction.guild?.name} (ID: ${interaction.guild?.id}). Error: ${err}`);
	}
}

export function setPlayerRoleInOfficialServer(interaction: ChatInputCommandInteraction) {
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
		user.roles.add(playerRole);
		Log.Success(`Role Player added to user ${interaction.user.displayName} (ID: ${interaction.user.id})`);
	}
	catch (err) {
		Log.Warning(`Something went wrong with adding role Player to user ${interaction.user.displayName} (ID: ${interaction.user.id}).`);
	}
}

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