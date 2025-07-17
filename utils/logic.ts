import { User } from "../models/User";
import {
	APIEmbed,
	ButtonInteraction,
	CacheType,
	ChatInputCommandInteraction,
	ColorResolvable,
	CommandInteraction,
	ComponentType,
	ContainerBuilder,
	InteractionEditReplyOptions,
	InteractionReplyOptions,
	MessageComponentInteraction,
	MessageCreateOptions,
	MessageFlags,
	MessagePayload,
	SectionBuilder,
	Snowflake,
} from "discord.js";
import { CustomEmbedBuilder } from "../models/CustomEmbedBuilder";
import { JSONEncodable } from "@discordjs/util";
import { Op } from "sequelize";
import { getClient } from "../client";
import { Log } from "./log";
import { Users } from "../database/Users";
import { EmoteString } from "./emotes";
import { getLanguageFromLocale, Language } from "../models/Language";

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

export async function searchUser(nameOrId: string) {
	return await Users.findOne({
		where: {
			[Op.or]: {
				nickname: {
					[Op.like]: nameOrId,
				},
				id: nameOrId,
			},
		},
	});
}

export async function removeAllFromActions() {
	try {
		const [affectedCount] = await Users.update({
			beingRobbedByUserId: null,
			robbingUserId: null,
			robbingLocationId: null,
			scavengingId: null,
			beatingUserId: null,
			beingBeatUpByUserId: null,
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
				},
			},
		});

		Log.Info(`${affectedCount} users removed from actions.`);

	}
	catch (err) {
		Log.Warning(`Something went wrong with removing Users from actions.`);
	}
}

export async function sendPrivateMessage(userId: string, message: string, color?: ColorResolvable, footer: string = "") {
	const client = getClient();
	const discordUser = await client.users.fetch(userId);

	try {
		const embed = new CustomEmbedBuilder()
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

export async function replyInteraction(interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction<CacheType>, options: string | MessagePayload | InteractionReplyOptions | InteractionEditReplyOptions) {
	try {
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

export async function replyUserDontExist(interaction: CommandInteraction, language: Language) {
	return await replyInteraction(interaction, {
		content: Strings[language].userDontExist,
		flags: [MessageFlags.Ephemeral],
	});
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

export async function disableButtons(interaction: CommandInteraction | ButtonInteraction, container: ContainerBuilder) {
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
		}

		await replyInteraction(interaction, { components: [container] });
	}
	catch (err) {
		Log.Warning(`Something went wrong with disabling buttons from container ${container.data.id} of user ${interaction.user.displayName} in server ${interaction.guild?.name} (ID: ${interaction.guild?.id}). Error: ${err}`);
	}
}

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

export async function setPlayerNicknameInOfficialServer(interaction: ChatInputCommandInteraction, user: User) {
	if (process.env.NODE_ENV !== "PROD") {
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

export function getPercent(percent: number, from: number) {
	return (from / 100) * percent;
}

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

${EmoteString.AK47} You can receive a little bit of money each day using \`/daily\`.

${EmoteString.Jobs} To start working, use \`/job\`.

-# Hope you enjoy the game!`,
		userDontExist: "This user doesn't exist in the database.",
	},

	[Language.Portuguese]: {
		welcomeMessage: (name: string) => `# Bem-vindo ao Cross Roads Reborn!
## Olá ${name}!
### Bem-vindo ao Cross Roads Reborn, onde todos os caminhos se cruzam.
${EmoteString.Shop} Ganhe dinheiro, compre itens, roube outros jogadores e muito mais!

${EmoteString.CloseInv} Veja seu inventário usando \`/inv\`.

${EmoteString.AK47} Você pode receber um pouco de dinheiro todos os dias usando \`/daily\`.

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

${EmoteString.AK47} Puedes recibir un poco de dinero cada día usando \`/daily\`.

${EmoteString.Jobs} Para empezar a trabajar, usa \`/jobs\`.

-# ¡Espero que disfrutes del juego!`,
		userDontExist: "Este usuario no existe en la base de datos.",
	},
} as const;