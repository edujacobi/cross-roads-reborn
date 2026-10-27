"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUser = checkUser;
exports.searchUser = searchUser;
exports.removeAllFromActions = removeAllFromActions;
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const Users_1 = require("#core/database/Users");
const Language_1 = require("#core/models/Language");
const User_1 = require("#core/models/User");
const log_1 = require("#shared/log");
const sequelize_1 = require("sequelize");
/**
 * Checks if the user exists in the database. If the user is the one who invoked the interaction,
 * it creates a new user if they don't exist, or updates their language if it has changed.
 *
 * @param userId - The Id of the user to check.
 * @param interaction - The interaction that triggered this check.
 * @returns The user object if found or created, otherwise undefined.
 */
async function checkUser(userId, interaction) {
    const lang = (0, Language_1.getLanguageFromLocale)(interaction.locale);
    const user = new User_1.User(userId, lang);
    if (await user.GetInfo()) {
        if (userId == interaction.user.id && user.Language !== lang) {
            await user.UpdateLanguage(lang);
        }
        return user;
    }
    if (userId == interaction.user.id) {
        await user.Create();
        await (0, discordInteractions_1.sendPrivateMessage)(interaction.user.id, Strings[lang].welcomeMessage(interaction.user.username));
        return user.GetInfo();
    }
}
/**
 * Searches for a user by name or Id.
 *
 * @param nameOrId - The name or Id of the user to search for.
 * @param interaction - The interaction to reply to if the user is not found.
 * @param language - The language to use for the reply message.
 * @returns The user object if found, otherwise null.
 */
async function searchUser(nameOrId, interaction, language) {
    const user = await User_1.User.Search(nameOrId, language);
    if (!user) {
        await (0, discordInteractions_1.replyUserDontExist)(interaction, (0, Language_1.getLanguageFromLocale)(interaction.locale));
        return null;
    }
    return user;
}
/**
 * Removes all users from any active actions (robbing, scavenging, beating, etc.) in the database.
 * This is typically used to reset states.
 */
async function removeAllFromActions() {
    try {
        const [affectedCount] = await Users_1.Users.update({
            beingRobbedByUserId: null,
            robbingUserId: null,
            robbingLocationId: null,
            scavengingId: null,
            beatingUserId: null,
            beingBeatUpByUserId: null,
            casinoIsInGame: false,
            robberyParticipatingInGangAction: false,
            robberyInvestmentDefending: false,
        }, {
            where: {
                [sequelize_1.Op.or]: {
                    beingRobbedByUserId: {
                        [sequelize_1.Op.not]: null,
                    },
                    robbingUserId: {
                        [sequelize_1.Op.not]: null,
                    },
                    robbingLocationId: {
                        [sequelize_1.Op.not]: null,
                    },
                    scavengingId: {
                        [sequelize_1.Op.not]: null,
                    },
                    beatingUserId: {
                        [sequelize_1.Op.not]: null,
                    },
                    beingBeatUpByUserId: {
                        [sequelize_1.Op.not]: null,
                    },
                    casinoIsInGame: {
                        [sequelize_1.Op.eq]: true,
                    },
                    robberyParticipatingInGangAction: {
                        [sequelize_1.Op.eq]: true,
                    },
                    robberyInvestmentDefending: {
                        [sequelize_1.Op.eq]: true,
                    },
                },
            },
        });
        log_1.logger.info(`${affectedCount} users removed from actions.`);
    }
    catch (err) {
        log_1.logger.error(`Something went wrong with removing Users from actions.`);
    }
}
const Strings = {
    [Language_1.Language.English]: {
        welcomeMessage: (name) => `# Welcome to Cross Roads Reborn!
## Hello ${name}!
### Welcome to Cross Roads Reborn, where all paths cross.
${emotes_1.EmoteString.Shop} Earn money, buy items, rob other players, and much more!

${emotes_1.EmoteString.CloseInv} See your inventory using \`/inv\`.

${emotes_1.EmoteString.AssaultRifle} You can receive a little bit of money each day using \`/daily\`.

${emotes_1.EmoteString.Jobs} To start working, use \`/jobs\`.

-# Hope you enjoy the game!`,
    },
    [Language_1.Language.Portuguese]: {
        welcomeMessage: (name) => `# Bem-vindo ao Cross Roads Reborn!
## Olá ${name}!
### Bem-vindo ao Cross Roads Reborn, onde todos os caminhos se cruzam.
${emotes_1.EmoteString.Shop} Ganhe dinheiro, compre itens, roube outros jogadores e muito mais!

${emotes_1.EmoteString.CloseInv} Veja seu inventário usando \`/inv\`.

${emotes_1.EmoteString.AssaultRifle} Você pode receber um pouco de dinheiro todos os dias usando \`/daily\`.

${emotes_1.EmoteString.Jobs} Para começar a trabalhar, use \`/trabalhos\`.

-# Espero que você goste do jogo!`,
    },
    [Language_1.Language.Spanish]: {
        welcomeMessage: (name) => `# Bienvenido a Cross Roads Reborn!
## ¡Hola ${name}!
### Bienvenido a Cross Roads Reborn, donde todos los caminos se cruzan.
${emotes_1.EmoteString.Shop} Gana dinero, compra objetos, roba a otros jugadores y mucho más!

${emotes_1.EmoteString.CloseInv} Mira tu inventario usando \`/inv\`.

${emotes_1.EmoteString.AssaultRifle} Puedes recibir un poco de dinero cada día usando \`/daily\`.

${emotes_1.EmoteString.Jobs} Para empezar a trabajar, usa \`/jobs\`.

-# ¡Espero que disfrutes del juego!`,
    },
};
//# sourceMappingURL=userUtils.js.map