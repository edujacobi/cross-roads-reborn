"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const Language_1 = require("#core/models/Language");
const log_1 = require("#shared/log");
const date_fns_1 = require("date-fns");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("vote")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "votar")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "votar")
        .setDescription("Check your top.gg vote and claim 10 Special Coins!")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Verifique seu voto no top.gg e ganhe 10 Moedas Especiais!")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "¡Verifique su voto en top.gg y obtenga 10 Monedas Especiales!"),
    async execute(interaction, user, language) {
        const s = Strings[language];
        await (0, discordInteractions_1.deferReply)(interaction);
        const token = process.env.TOPGG_TOKEN;
        const botId = process.env.CLIENT_ID;
        if (!token || !botId) {
            return log_1.Log.Error("Missing Top.gg token or bot ID");
        }
        let statsString = "";
        try {
            const projectRes = await fetch(`https://top.gg/api/v1/projects/@me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (projectRes.ok) {
                const project = await projectRes.json();
                statsString = s.stats(project.votes_total, project.review_score, project.review_count, user.Vote.Count);
            }
        }
        catch (err) {
            log_1.Log.Warning(`Error fetching project from Top.gg API: ${err}`);
        }
        const container = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(user)
            .setAccentColor(colors_1.CrColors.Default)
            .addSectionComponents(header => header
            .addTexts([
            `# ${s.title}`,
            statsString,
        ])
            .setThumbnailAccessory(thumb => thumb
            .setURL(interaction.client.user.avatarURL() ?? "")))
            .addLargeSeparator();
        if (!user.CanClaimVote()) {
            const nextVoteTime = user.Vote.LastClaim ? (0, discord_js_1.time)((0, date_fns_1.addHours)(user.Vote.LastClaim, 12), discord_js_1.TimestampStyles.RelativeTime) : s.neverVoted;
            container
                .addTexts([
                s.cooldown(nextVoteTime),
            ])
                .addFooter();
            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
        }
        // Fetch Top.gg API
        let votedAt = null;
        try {
            const response = await fetch(`https://top.gg/api/v1/projects/@me/votes/${interaction.user.id}?source=discord`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.created_at) {
                    const date = new Date(data.created_at);
                    const diff = (0, date_fns_1.differenceInHours)(new Date(), date);
                    if (diff < 12) {
                        votedAt = date;
                    }
                }
            }
            else if (response.status !== 404) {
                const errorData = await response.json();
                log_1.Log.Warning(`Failed to fetch from Top.gg API: ${response.status} ${errorData.detail ?? response.statusText}`);
            }
        }
        catch (err) {
            log_1.Log.Warning(`Error fetching from Top.gg API: ${err}`);
        }
        if (votedAt) {
            await user.ClaimVoteReward(votedAt);
            container
                .addTexts([
                s.success,
            ])
                .addFooter({
                text: `${emotes_1.EmoteString.SpecialCoinShop}${(0, ui_1.formatMoney)(user.SpecialCoin, user.Language, "")}`
            });
            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
        }
        // Needs to vote
        container
            .addTexts([
            s.needsToVote,
        ])
            .addFooter({
            button: new discord_js_1.ButtonBuilder()
                .setLabel(s.voteHere)
                .setStyle(discord_js_1.ButtonStyle.Link)
                .setURL(`https://top.gg/bot/${botId}/vote`)
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    }
};
const Strings = {
    [Language_1.Language.English]: {
        title: "Vote - Top.gg",
        neverVoted: "Never voted",
        cooldown: (time) => `You have already received your vote reward in the last 12 hours!\n-# You can receive again ${time}.`,
        success: `Thank you for your vote! You have received ${emotes_1.EmoteString.SpecialCoinShop}10 Special Coins.\n-# Wait 12 hours to vote again.`,
        needsToVote: `You haven't voted for us in the last 12 hours!\n-# Click the button below to vote and return here to receive your ${emotes_1.EmoteString.SpecialCoinShop}10 Special Coins.`,
        voteHere: "Vote",
        stats: (total, score, reviews, userVotes) => `${emotes_1.EmoteString.TopGG_Chart} ${total.toLocaleString("en-US")} Votes  • ${emotes_1.EmoteString.TopGG_Star} ${score.toFixed(1)}/5 (${reviews.toLocaleString("en-US")} reviews)\n-# You voted ${userVotes} times`,
    },
    [Language_1.Language.Portuguese]: {
        title: "Votar - Top.gg",
        neverVoted: "Nunca votou",
        cooldown: (time) => `Você já recebeu sua recompensa de voto nas últimas 12 horas!\n-# Você poderá receber novamente ${time}.`,
        success: `Obrigado pelo seu voto! Você recebeu ${emotes_1.EmoteString.SpecialCoinShop}10 Moedas Especiais.\n-# Aguarde 12 horas para votar novamente.`,
        needsToVote: `Você não votou em nós nas últimas 12 horas!\n-# Clique no botão abaixo para votar e volte aqui para receber suas ${emotes_1.EmoteString.SpecialCoinShop}10 Moedas Especiais.`,
        voteHere: "Votar",
        stats: (total, score, reviews, userVotes) => `${emotes_1.EmoteString.TopGG_Chart} ${total.toLocaleString("pt-BR")} Votos • ${emotes_1.EmoteString.TopGG_Star} ${score.toFixed(1)}/5 (${reviews.toLocaleString("pt-BR")} avaliações)\n-# Você votou ${userVotes} vezes`,
    },
    [Language_1.Language.Spanish]: {
        title: "Votar - Top.gg",
        neverVoted: "Nunca votó",
        cooldown: (time) => `¡Ya has recibido tu recompensa de voto en las últimas 12 horas!\n-# Puedes recibir de nuevo ${time}.`,
        success: `¡Gracias por tu voto! Has recibido ${emotes_1.EmoteString.SpecialCoinShop}10 Special Coins.\n-# Espera 12 horas para votar de nuevo.`,
        needsToVote: `¡No has votado por nosotros en las últimas 12 horas!\n-# Haz clic en el botón de abajo para votar y vuelve aquí para recibir tus ${emotes_1.EmoteString.SpecialCoinShop}10 Monedas Especiales.`,
        voteHere: "Votar",
        stats: (total, score, reviews, userVotes) => `${emotes_1.EmoteString.TopGG_Chart} ${total.toLocaleString("es-ES")} Votos • ${emotes_1.EmoteString.TopGG_Star} ${score.toFixed(1)}/5 (${reviews.toLocaleString("es-ES")} reseñas)\n-# Votaste ${userVotes} veces`,
    },
};
//# sourceMappingURL=vote.js.map