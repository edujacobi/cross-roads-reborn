import { CommandInteraction } from "discord.js";
import { getLanguageFromLocale, Language, Localization } from "@core/models/Language";
import { User } from "@core/models/User";
import { Users } from "@core/database/Users";
import { Op } from "sequelize";
import { Log } from "@shared/log";
import { replyUserDontExist, sendPrivateMessage } from "@bot/utils/discordInteractions";
import { EmoteString } from "@bot/utils/emotes";

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
	},
} as const satisfies Localization;