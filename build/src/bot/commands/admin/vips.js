"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const UserRepository_1 = require("#core/repositories/UserRepository");
const emotes_1 = require("#bot/utils/emotes");
const Pagination_1 = require("#core/models/Pagination");
const Classes_1 = require("#core/types/Classes");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("vips")
        .setDescription("See all VIPs and Remaining time")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Veja todos os VIPs e o tempo restante")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction, user, language) {
        await (0, discordInteractions_1.deferReply)(interaction);
        let users = [];
        const pagination = new Pagination_1.Pagination(interaction, language);
        async function findList() {
            users = await UserRepository_1.UserRepository.FindAllVips(pagination.Limit, pagination.Offset);
        }
        pagination.HowManyRecords = await UserRepository_1.UserRepository.CountVips();
        pagination.CustomizeContainer = async () => {
            await findList();
            let text = "";
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                const emoteClass = Classes_1.ClassList[user.class].Image.Emote.String;
                const timeText = user.vipEternal ? "**Eternal**" : `Ends in ${(0, discord_js_1.time)(user.vipTime, discord_js_1.TimestampStyles.ShortDateTime)}`;
                text += `### ${emoteClass} ${user.nickname}\n${timeText}\n-# \`Id: ${user.id}\`\n`;
            }
            return new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(user)
                .setAccentColor(discord_js_1.Colors.Gold)
                .addTexts([
                `# ${emotes_1.EmoteString.VIP} VIP Users`,
            ])
                .addLargeSeparator()
                .addTexts([
                text,
            ]);
        };
        await pagination.GenerateContainer();
    },
};
//# sourceMappingURL=vips.js.map