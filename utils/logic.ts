import { User } from "../models/User";
import {
	APIEmbed,
	ButtonInteraction,
	ChatInputCommandInteraction,
	CommandInteraction, EmbedBuilder,
	InteractionReplyOptions,
	MessagePayload,
} from "discord.js";
import { CustomEmbedBuilder } from "../models/CustomEmbedBuilder";
import { JSONEncodable } from "@discordjs/util";
import { Op } from "sequelize";
import { Notification, NotificationType } from "../models/Notification";
import { getClient } from "../client";
import { Log } from "./log";
import { Users } from "../database/Users";
import { EmoteString } from "./emotes";
import { JobList } from "../models/Job";
import { formatMoney } from "./ui";

export const BOT_ID = "1089602356271927356";

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


export async function removeAllFromRobbery() {
	try {
		await Users.update({
			beingRobbedByUserId: null,
			robbingUserId: null,
		}, {
			where: {
				beingRobbedByUserId: {
					[Op.not]: null,
				},
				robbingUserId: {
					[Op.not]: null,
				},
			},
		});

		Log.Info(`All users removed from robberies.`);

	}
	catch (err) {
		Log.Warning(`Something went wrong with removing Users from robberies.`);
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

export async function sendComplexPrivateMessage(userId: string, embed: EmbedBuilder) {
	const client = getClient();
	const discordUser = await client.users.fetch(userId);

	try {
		return await discordUser.send({ embeds: [embed] });
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
		const user = await new User(notification.UserId).GetInfo();

		if (!user) {
			Log.Warning(`Cannot send private message if the user was deleted (UserId: ${notification.UserId}).`);
			await notification.SetAsNotified();
			continue;
		}

		else if (notification.Type == NotificationType.Daily) {
			await sendPrivateMessage(user.Id, `${EmoteString.Experience} You can receive your daily Exp again!`);
		}

		else if (notification.Type == NotificationType.Job) {
			if (user.Job.Id === null) {
				return;
			}
			const job = JobList[user.Job.Id];
			await user.EndJob();
			await sendPrivateMessage(notification.UserId, `Você terminou seu trabalho ${job.Description[user.Language]} e recebeu ${formatMoney(job.Salary, user.Language)}!`);
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