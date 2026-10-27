"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const officialServer_1 = require("#bot/utils/officialServer");
const ui_1 = require("#bot/utils/ui");
const userUtils_1 = require("#bot/utils/userUtils");
const Language_1 = require("#core/models/Language");
const User_1 = require("#core/models/User");
const Classes_1 = require("#core/types/Classes");
const log_1 = require("#shared/log");
const discord_js_1 = require("discord.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const wait = require("node:timers/promises").setTimeout;
module.exports = {
    name: discord_js_1.Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isChatInputCommand())
            return;
        const language = (0, Language_1.getLanguageFromLocale)(interaction.locale);
        const s = Strings[language];
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            return console.error(s.noCommand(interaction.commandName));
        }
        const [user, isBooster] = await Promise.all([
            (0, userUtils_1.checkUser)(interaction.user.id, interaction),
            (0, officialServer_1.isUserBoosterInOfficialServer)(interaction),
        ]);
        if (!user) {
            return;
        }
        if (user.IsDead()) {
            const container = (0, ui_1.defaultComponent)({
                user,
                description: s.deadDescription(user.DeadUntil),
            });
            return (0, discordInteractions_1.replyWithContainer)(interaction, container, true);
        }
        if (!user.Nickname && command.data.name !== "setnick") {
            const tempUser = new User_1.User("0");
            tempUser.Nickname = s.settingNick;
            const container = (0, ui_1.defaultComponent)({
                user: tempUser,
                description: s.settingNickDescription,
            });
            return (0, discordInteractions_1.replyWithContainer)(interaction, container, true);
        }
        if (user.Class == Classes_1.ClassId.None && command.data.name !== "setclass" && command.data.name !== "setnick") {
            const container = (0, ui_1.defaultComponent)({
                user,
                description: s.settingClassDescription,
            });
            return (0, discordInteractions_1.replyWithContainer)(interaction, container, true);
        }
        const cooldowns = interaction.client.cooldowns;
        if (!cooldowns.has(command.data.name)) {
            cooldowns.set(command.data.name, new discord_js_1.Collection());
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
                const container = (0, ui_1.defaultComponent)({
                    user,
                    description: s.willBeAble(command.data.name, new Date(expirationTime)),
                });
                await (0, discordInteractions_1.replyWithContainer)(interaction, container, true);
                container.changeTextFromSectionId(1, s.canNowUse(command.data.name));
                await wait(cooldownAmount);
                return (0, discordInteractions_1.replyWithContainer)(interaction, container, true);
            }
        }
        if (command.vip && !user.IsVip()) {
            const container = (0, ui_1.defaultComponent)({
                user,
                color: discord_js_1.Colors.Gold,
                description: s.needVIP,
            });
            return (0, discordInteractions_1.replyWithContainer)(interaction, container, true);
        }
        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
        interaction.client.userLastCommand.set(interaction.user.id, now);
        // Throttled server synchronization (once every 4 hours)
        const lastSync = interaction.client.userLastSync?.get(interaction.user.id) || 0;
        const fourHours = 4 * 60 * 60 * 1_000;
        if (now - lastSync > fourHours) {
            try {
                await (0, officialServer_1.syncUserInOfficialServer)(interaction, user);
                interaction.client.userLastSync.set(interaction.user.id, now);
            }
            catch (error) {
                log_1.logger.error("Error during throttled sync:", error);
            }
        }
        try {
            await command.execute(interaction, user, language);
        }
        catch (error) {
            log_1.logger.error(error);
            await (0, discordInteractions_1.replyInteraction)(interaction, {
                content: "There was an error while executing this command!",
                flags: [discord_js_1.MessageFlags.Ephemeral],
            });
        }
    },
};
const Strings = {
    [Language_1.Language.English]: {
        noCommand: (command) => `No command matching \`${command}\` was found.`,
        settingNick: "Setting nickname",
        settingNickDescription: "You must set a nickname before using any other command! Use `/setnick` to set your nickname.",
        settingClassDescription: "You must choose a class before using any other command! Use `/setclass` to choose your class.",
        willBeAble: (commandName, expirationDate) => `You will be able to reuse the \`${commandName}\` command ${(0, discord_js_1.time)(expirationDate, discord_js_1.TimestampStyles.RelativeTime)}.`,
        canNowUse: (commandName) => `You can now use the \`${commandName}\` command.`,
        needVIP: `You need to be ${emotes_1.EmoteString.VIP} **VIP** to perform this action.`,
        deadDescription: (date) => `You are dead! You will be revived ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}.`,
    },
    [Language_1.Language.Portuguese]: {
        noCommand: (command) => `Nenhum comando correspondente a \`${command}\` foi encontrado.`,
        settingNick: "Configurando nickname",
        settingNickDescription: "Você deve definir um nickname antes de usar qualquer outro comando! Use `/mudanick` para definir seu nickname.",
        settingClassDescription: "Você deve escolher uma classe antes de usar qualquer outro comando! Use `/mudaclasse` para definir sua classe.",
        willBeAble: (commandName, expirationDate) => `Você poderá reutilizar o comando \`${commandName}\` ${(0, discord_js_1.time)(expirationDate, discord_js_1.TimestampStyles.RelativeTime)}.`,
        canNowUse: (commandName) => `Agora você pode usar o comando \`${commandName}\`.`,
        needVIP: `Você precisa ser ${emotes_1.EmoteString.VIP} **VIP** para realizar esta ação.`,
        deadDescription: (date) => `Você está morto! Você ressuscitará ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}.`,
    },
    [Language_1.Language.Spanish]: {
        noCommand: (command) => `No se encontró ningún comando que coincida con \`${command}\`.`,
        settingNick: "Configurando nickname",
        settingNickDescription: "¡Debes establecer un apodo antes de usar cualquier otro comando! Use `/setnick` para establecer su apodo.",
        settingClassDescription: "¡Debes elegir una clase antes de usar cualquier otro comando! Use `/setclass` para definir su clase.",
        willBeAble: (commandName, expirationDate) => `Podrás reutilizar el comando \`${commandName}\` ${(0, discord_js_1.time)(expirationDate, discord_js_1.TimestampStyles.RelativeTime)}.`,
        canNowUse: (commandName) => `Ahora puedes usar el comando \`${commandName}\`.`,
        needVIP: `Necesitas ser ${emotes_1.EmoteString.VIP} **VIP** para realizar esta acción.`,
        deadDescription: (date) => `¡Estás muerto! Resucitarás ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}.`,
    },
};
//# sourceMappingURL=interactionCreate.js.map