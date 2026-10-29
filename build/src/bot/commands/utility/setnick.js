"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const ui_1 = require("#bot/utils/ui");
const UserRepository_1 = require("#core/repositories/UserRepository");
const User_1 = require("#core/models/User");
const Language_1 = require("#core/models/Language");
const colors_1 = require("#bot/utils/colors");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const collectors_1 = require("#bot/utils/collectors");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("setnick")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "mudanick")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "apodo")
        .setDescription("Set a nickname for you")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Muda o seu nick")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Establece un apodo para ti")
        .addStringOption((option) => option
        .setName("nick")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "apodo")
        .setDescription("The new nickname")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O novo nick")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Tu nuevo apodo")
        .setMinLength(3)
        .setMaxLength(18)
        .setRequired(true)),
    async execute(interaction, user, language) {
        const newNick = interaction.options.getString("nick", true);
        const s = Strings[language];
        const CHANGE_COST = user.GetNicknameChangeCost();
        if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(newNick)) {
            const tempUser = new User_1.User("0");
            tempUser.Nickname = s.setting;
            const container = (0, ui_1.defaultComponent)({
                user: tempUser,
                color: discord_js_1.Colors.Red,
                description: s.invalidNick(newNick),
                footer: s.footer,
            });
            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
        }
        const nickExists = await UserRepository_1.UserRepository.SearchByNameOrId(newNick);
        if (nickExists) {
            const tempUser = new User_1.User("0");
            tempUser.Nickname = s.setting;
            const container = (0, ui_1.defaultComponent)({
                user: tempUser,
                color: discord_js_1.Colors.Red,
                description: s.nickInUse(newNick, nickExists.id),
                footer: s.footer,
            });
            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
        }
        const newUser = user.Nickname === "";
        if (newUser) {
            await user.SetNickname(newNick);
            const container = (0, ui_1.defaultComponent)({
                user,
                color: colors_1.CrColors.Default,
                description: s.newPlayer(newNick),
            });
            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
        }
        const oldNick = user.Nickname || interaction.user.displayName;
        let container = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(user)
            .setAccentColor(colors_1.CrColors.Default)
            .addSectionComponents(section => section
            .addTexts([
            s.costToChange(CHANGE_COST, newNick, oldNick),
        ])
            .setButtonAccessory(btn => btn
            .setCustomId(`confirm`)
            .setDisabled(user.Money < CHANGE_COST)
            .setLabel((0, ui_1.formatMoney)(CHANGE_COST, language))
            .setStyle(discord_js_1.ButtonStyle.Success)))
            .addFooter({
            text: (0, ui_1.formatMoney)(user.Money, language),
        });
        const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
        const collector = (0, collectors_1.createButtonCollector)(interaction, response, { maxClicks: 1 });
        collector?.on("end", async () => {
            await (0, collectors_1.disableButtons)(interaction, container);
        });
        collector?.on("collect", async (btn) => {
            await (0, discordInteractions_1.deferUpdate)(btn);
            if (btn.customId === "confirm") {
                await user.GetInfo();
                const currentCost = user.GetNicknameChangeCost();
                const success = await user.SetNickname(newNick, currentCost);
                const description = success ? s.nickChanged(oldNick, newNick) : s.errorChange;
                container = (0, ui_1.defaultComponent)({
                    user,
                    color: colors_1.CrColors.Default,
                    description,
                    footer: (0, ui_1.formatMoney)(user.Money, language),
                });
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
        });
    },
};
const Strings = {
    [Language_1.Language.English]: {
        setting: "Setting nickname",
        invalidNick: (newNick) => `The nickname **${newNick}** is invalid! It can only contain letters and one space between words.`,
        nickInUse: (newNick, userId) => `The nickname **${newNick}** is already in use!\n-# by user with id \`${userId}\``,
        newPlayer: (newNick) => `-# A new player arrives!\n## Welcome **${newNick}**!\n-# Now, choose your class: \`/setclass\``,
        nickChanged: (oldNick, newNick) => `**${oldNick}** now has the nickname **${newNick}**!`,
        footer: "Please, choose another nickname!",
        costToChange: (cost, newNick, oldNick) => `The cost for you to change your nickname is ${(0, ui_1.formatMoney)(cost, Language_1.Language.English)}.\n-# Confirm the change from **${oldNick}** to **${newNick}**?`,
        errorChange: "You don't have enough money to change your nickname.",
    },
    [Language_1.Language.Portuguese]: {
        setting: "Configurando nickname",
        invalidNick: (newNick) => `O nickname **${newNick}** é inválido! Só pode conter letras e um espaço entre palavras.`,
        nickInUse: (newNick, userId) => `O nickname **${newNick}** já está em uso!\n-# pelo usuário com id \`${userId}\``,
        newPlayer: (newNick) => `-# Um novo jogador chegou!\n## Bem-vindo **${newNick}**!\n-# Agora, escolha sua classe: \`/mudaclasse\``,
        nickChanged: (oldNick, newNick) => `**${oldNick}** agora tem o nickname **${newNick}**!`,
        footer: "Por favor, escolha outro nickname!",
        costToChange: (cost, newNick, oldNick) => `O custo para você alterar seu nickname é ${(0, ui_1.formatMoney)(cost, Language_1.Language.Portuguese)}.\n-# Confirmar troca de **${oldNick}** para **${newNick}**?`,
        errorChange: "Você não possui dinheiro suficiente para alterar seu nickname.",
    },
    [Language_1.Language.Spanish]: {
        setting: "Configurando nickname",
        invalidNick: (newNick) => `El nickname **${newNick}** es inválido! Solo puede contener letras y un espacio entre palabras.`,
        nickInUse: (newNick, userId) => `El nickname **${newNick}** ya está en uso!\n-# por el usuario con id \`${userId}\``,
        newPlayer: (newNick) => `-# ¡Un nuevo jugador ha llegado!\n## Bienvenido **${newNick}**!\n-# Ahora, elige tu clase: \`/setclass\``,
        nickChanged: (oldNick, newNick) => `**${oldNick}** ahora tiene el nickname **${newNick}**!`,
        footer: "¡Por favor, elige otro nickname!",
        costToChange: (cost, newNick, oldNick) => `El costo para que usted cambie su nickname es ${(0, ui_1.formatMoney)(cost, Language_1.Language.Spanish)}.\n-# ¿Confirmar el cambio de **${oldNick}** a **${newNick}**?`,
        errorChange: "No tienes suficiente dinero para cambiar su nickname.",
    },
};
//# sourceMappingURL=setnick.js.map