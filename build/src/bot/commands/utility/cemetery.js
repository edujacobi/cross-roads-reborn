"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const collectors_1 = require("#bot/utils/collectors");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const Language_1 = require("#core/models/Language");
const Pagination_1 = require("#core/models/Pagination");
const UserRepository_1 = require("#core/repositories/UserRepository");
const Classes_1 = require("#core/types/Classes");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("cemetery")
        .setDescription("Visit the cemetery and see the dead players")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "cemiterio")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "cementerio")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Visite o cemitério e veja os jogadores mortos")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Visitar el cementerio y ver a los jugadores muertos"),
    async execute(interaction, user) {
        const s = Strings[user.Language];
        const deadPlayers = await UserRepository_1.UserRepository.FindAllDead();
        let container = new CustomContainerBuilder_1.CustomContainerBuilder();
        const addContainerHeader = () => {
            const s = Strings[user.Language];
            container = new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(user)
                .setAccentColor(colors_1.CrColors.Cemetery)
                .addSectionComponents(header => header
                .addTexts([
                `# ${s.title}`,
                s.subtitle,
                s.subtitleDeath,
                s.subtitleBan,
            ])
                .setThumbnailAccessory(thumb => thumb
                .setURL("https://media.discordapp.net/attachments/1233604589064818808/1513568921859391518/Cemitery.png")));
            if (deadPlayers.length === 0) {
                container
                    .addLargeSeparator()
                    .addTexts([
                    s.empty,
                ]);
            }
        };
        const generateContainer = async () => {
            const buttonDead = new discord_js_1.ButtonBuilder()
                .setCustomId("dead")
                .setLabel(s.dead)
                .setDisabled(deadPlayers.length === 0)
                .setStyle(discord_js_1.ButtonStyle.Secondary);
            addContainerHeader();
            container
                .addFooter({ button: buttonDead });
            const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
            const collector = (0, collectors_1.createButtonCollector)(interaction, response);
            collector?.on("end", async () => {
                await (0, collectors_1.disableButtons)(interaction, container);
            });
            collector?.on("collect", async (btn) => {
                await (0, discordInteractions_1.deferUpdate)(btn);
                if (btn.customId === "dead") {
                    buttonDead.setDisabled(true);
                    const pagination = new Pagination_1.Pagination(interaction, user.Language);
                    pagination.HowManyRecords = deadPlayers.length;
                    pagination.Limit = 10;
                    const containerDead = new CustomContainerBuilder_1.CustomContainerBuilder()
                        .setUser(user)
                        .addTexts([
                        `# ${s.titleDead}`,
                    ])
                        .addLargeSeparator();
                    pagination.CustomizeContainer = async () => {
                        const users = deadPlayers.slice(pagination.Offset, pagination.Offset + pagination.Limit);
                        for (let i = 0; i < users.length; i++) {
                            const u = users[i];
                            containerDead.addTexts([
                                `### ${Classes_1.ClassList[u.class].Image.Emote.String} ${u.nickname}`,
                                `${s.revived} ${(0, discord_js_1.time)(u.deadUntil, discord_js_1.TimestampStyles.RelativeTime)}`,
                            ]);
                            if (i !== users.length - 1) {
                                containerDead.addSmallSeparator();
                            }
                        }
                        return containerDead;
                    };
                    await pagination.GenerateContainer(container);
                }
            });
        };
        await generateContainer();
    },
};
const Strings = {
    [Language_1.Language.English]: {
        title: "Cemetery",
        subtitle: "-# 50% chance of being in a better place.",
        subtitleDeath: "### Death\nWhen a player dies, they lose all their money and their job, if they have one. While dead, they do not receive money from investments.",
        subtitleBan: "### Banned\nDead players were banned from the game and cannot use any command. You don't want to be here.",
        empty: "The cemetery is empty! There are no dead players.",
        titleDead: "Here lie...",
        revived: "Revived",
        dead: "Dead",
    },
    [Language_1.Language.Portuguese]: {
        title: "Cemitério",
        subtitle: "-# 50% de chance de estarem em um lugar melhor.",
        subtitleDeath: "### Morte\nAo morrer, o jogador perde todo o dinheiro e seu trabalho, caso estiver em um. Enquanto morto, ele não recebe dinheiro de investimentos.",
        subtitleBan: "### Banidos\nJogadores mortos foram banidos do jogo e não podem usar comando algum. Você não quer estar aqui.",
        empty: "O cemitério está vazio! Não há jogadores mortos.",
        titleDead: "Aqui jazem...",
        revived: "Ressuscitará",
        dead: "Mortos",
    },
    [Language_1.Language.Spanish]: {
        title: "Cementerio",
        subtitle: "-# 50% de probabilidad de estar en un lugar mejor.",
        subtitleDeath: "### Muerte\nAl morir, el jugador pierde todo su dinero y su trabajo, si tiene uno. Mientras muerto, no recibe dinero de inversiones.",
        subtitleBan: "### Banidos\nLos jugadores muertos fueron baneados del juego y no pueden usar ningún comando. No querrás estar aquí.",
        empty: "¡El cementerio está vacío! No hay jugadores muertos.",
        titleDead: "Aquí yacen...",
        revived: "Resucitará",
        dead: "Muertos",
    },
};
//# sourceMappingURL=cemetery.js.map