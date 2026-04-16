import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { CrColors } from "#bot/utils/colors";
import { deferReply, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteString } from "#bot/utils/emotes";
import { formatMoney, showTime } from "#bot/utils/ui";
import { Language, type Localization } from "#core/models/Language";
import type { User } from "#core/models/User";
import { Log } from "#shared/log";
import { addHours } from "date-fns";
import { ButtonBuilder, ButtonStyle, type ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";

interface TopGGCheckResponse {
	created_at: string;
	expires_at: string;
	weight: number;
}

interface TopGGErrorResponse {
	type: string;
	title: string;
	status: number;
	detail: string;
}

interface TopGGProjectResponse {
	id: string;
	name: string;
	type: string;
	platform: string;
	headline: string;
	tags: string[];
	votes: number;
	votes_total: number;
	review_score: number;
	review_count: number;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("vote")
		.setNameLocalization(Locale.PortugueseBR, "votar")
		.setNameLocalization(Locale.SpanishES, "votar")
		.setDescription("Check your top.gg vote and claim 10 Special Coins!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Verifique seu voto no top.gg e ganhe 10 Moedas Especiais!")
		.setDescriptionLocalization(Locale.SpanishES, "¡Verifique su voto en top.gg y obtenga 10 Monedas Especiales!"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];

		await deferReply(interaction);

		const token = process.env.TOPGG_TOKEN;
		const botId = process.env.CLIENT_ID;

		if (!token || !botId) {
			return Log.Error("Missing Top.gg token or bot ID");
		}


		let statsString = "";
		try {
			const projectRes = await fetch(`https://top.gg/api/v1/projects/@me`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			if (projectRes.ok) {
				const project = await projectRes.json() as TopGGProjectResponse;
				statsString = s.stats(project.votes_total, project.review_score, project.review_count, user.Vote.Count);
			}
		}
		catch (err) {
			Log.Warning(`Error fetching project from Top.gg API: ${err}`);
		}

		const container = new CustomContainerBuilder()
			.setUser(user)
			.setAccentColor(CrColors.Default)
			.addSectionComponents(header => header
				.addTexts([
					`# ${s.title}`,
					statsString,
				])
				.setThumbnailAccessory(thumb => thumb
					.setURL(interaction.client.user.avatarURL() ?? "")
				)
			)
			.addLargeSeparator();


		if (!user.CanClaimVote()) {
			const nextVoteTime = user.Vote.LastClaim ? showTime(addHours(user.Vote.LastClaim, 12).getTime(), true) : s.neverVoted;

			container
				.addTexts([
					s.cooldown(nextVoteTime),
				])
				.addFooter();

			return replyWithContainer(interaction, container);
		}

		// Fetch Top.gg API
		let hasVoted = false;

		try {
			const response = await fetch(`https://top.gg/api/v1/projects/@me/votes/${interaction.user.id}?source=discord`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (response.ok) {
				const data = await response.json() as TopGGCheckResponse;
				hasVoted = data.created_at !== null;
			}
			else if (response.status === 404) {
				hasVoted = false;
			}
			else {
				const errorData = await response.json() as TopGGErrorResponse;
				Log.Warning(`Failed to fetch from Top.gg API: ${response.status} ${errorData.detail ?? response.statusText}`);
			}
		}
		catch (err) {
			Log.Warning(`Error fetching from Top.gg API: ${err}`);
		}


		if (hasVoted) {
			await user.ClaimVoteReward();

			container
				.addTexts([
					s.success,
				])
				.addFooter({
					text: `${EmoteString.SpecialCoinShop}${formatMoney(user.SpecialCoin, user.Language, "")}`
				});

			return replyWithContainer(interaction, container);
		}

		// Needs to vote
		container
			.addTexts([
				s.needsToVote,
			])
			.addFooter({
				button: new ButtonBuilder()
					.setLabel(s.voteHere)
					.setStyle(ButtonStyle.Link)
					.setURL(`https://top.gg/bot/${botId}/vote`)
			});

		return replyWithContainer(interaction, container);
	}
};

const Strings = {
	[Language.English]: {
		title: "Vote - Top.gg",
		neverVoted: "Never voted",
		cooldown: (time: string) => `You have already received your vote reward in the last 12 hours!\n-# You can receive again ${time}.`,
		success: `Thank you for your vote! You have received ${EmoteString.SpecialCoinShop}10 Special Coins.\n-# Wait 12 hours to vote again.`,
		needsToVote: `You haven't voted for us in the last 12 hours!\n-# Click the button below to vote and return here to receive your ${EmoteString.SpecialCoinShop}10 Special Coins.`,
		voteHere: "Vote Here",
		stats: (total: number, score: number, reviews: number, userVotes: number) => `${EmoteString.TopGG_Chart} ${total.toLocaleString("en-US")} Votes  • ${EmoteString.TopGG_Star} ${score.toFixed(1)}/5 (${reviews.toLocaleString("en-US")} reviews)\n-# You voted ${userVotes} times`,
	},

	[Language.Portuguese]: {
		title: "Votar - Top.gg",
		neverVoted: "Nunca votou",
		cooldown: (time: string) => `Você já recebeu sua recompensa de voto nas últimas 12 horas!\n-# Você poderá receber novamente ${time}.`,
		success: `Obrigado pelo seu voto! Você recebeu ${EmoteString.SpecialCoinShop}10 Moedas Especiais.\n-# Aguarde 12 horas para votar novamente.`,
		needsToVote: `Você não votou em nós nas últimas 12 horas!\n-# Clique no botão abaixo para votar e volte aqui para receber suas ${EmoteString.SpecialCoinShop}10 Moedas Especiais.`,
		voteHere: "Votar Aqui",
		stats: (total: number, score: number, reviews: number, userVotes: number) => `${EmoteString.TopGG_Chart} ${total.toLocaleString("pt-BR")} Votos • ${EmoteString.TopGG_Star} ${score.toFixed(1)}/5 (${reviews.toLocaleString("pt-BR")} avaliações)\n-# Você votou ${userVotes} vezes`,
	},
	[Language.Spanish]: {
		title: "Votar - Top.gg",
		neverVoted: "Nunca votó",
		cooldown: (time: string) => `¡Ya has recibido tu recompensa de voto en las últimas 12 horas!\n-# Puedes recibir de nuevo ${time}.`,
		success: `¡Gracias por tu voto! Has recibido ${EmoteString.SpecialCoinShop}10 Special Coins.\n-# Espera 12 horas para votar de nuevo.`,
		needsToVote: `¡No has votado por nosotros en las últimas 12 horas!\n-# Haz clic en el botón de abajo para votar y vuelve aquí para recibir tus ${EmoteString.SpecialCoinShop}10 Monedas Especiales.`,
		voteHere: "Vota Aquí",
		stats: (total: number, score: number, reviews: number, userVotes: number) => `${EmoteString.TopGG_Chart} ${total.toLocaleString("es-ES")} Votos • ${EmoteString.TopGG_Star} ${score.toFixed(1)}/5 (${reviews.toLocaleString("es-ES")} reseñas)\n-# Votaste ${userVotes} veces`,
	},
} as const satisfies Localization;
