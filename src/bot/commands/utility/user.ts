import { getClient } from "#bot/client";
import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { UserImageCanvasBuilder } from "#bot/ui/builders/UserImageCanvasBuilder";
import { createButtonCollector, disableButtons } from "#bot/utils/collectors";
import { deferReply, deferUpdate, replyInteraction, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteId } from "#bot/utils/emotes";
import { formatMoney, showTime } from "#bot/utils/ui";
import { searchUser } from "#bot/utils/userUtils";
import { Language, type Localization } from "#core/models/Language";
import type { User } from "#core/models/User";
import { UserBadge } from "#core/models/UserBadge";
import { BadgeId, BadgeList } from "#core/types/Badges";
import { ClassList } from "#core/types/Classes";
import { addDays } from "date-fns";
import {
	AttachmentBuilder,
	type ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	Locale,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("user")
		.setDescription("Relevant informations about the user!")
		.setNameLocalization(Locale.PortugueseBR, "usuario")
		.setDescriptionLocalization(Locale.PortugueseBR, "Informações relevantes sobre o jogador!")
		.addStringOption(target => target
			.setName("target")
			.setDescription("The user")
			.setMinLength(3)
			.setNameLocalization(Locale.PortugueseBR, "alvo")
			.setDescriptionLocalization(Locale.PortugueseBR, "O usuário"),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const nameOrId = interaction.options.getString("target");

		await deferReply(interaction);

		const target = nameOrId ? await searchUser(nameOrId, interaction, language) : user;
		const _user = target ? await getClient().users.fetch(target.Id) : interaction.user;

		if (!target) {
			return;
		}

		const s = Strings[language];

		let badges = await UserBadge.GetList(target.Id);

		if (target.IsVip()) {
			badges = UserBadge.AddVIPBadgeInList(badges, target);
		}

		let badgeText = "";

		badges.forEach(badge => badgeText += `${badge.Emoji} `);

		const now = new Date();

		let currentOption: string | null = null;

		const buttonOptions = [{
			id: "hospital",
			label: "Hospital",
			emote: EmoteId.Hospital,
			texts: [
				`\`${target.Hospital.Count}\` ${s.timesInHospital}`,
				`\`${formatMoney(target.Hospital.TreatmentSum, user.Language)}\` (\`${target.Hospital.TreatmentCount}\`) ${s.spentInTreatments}`,
			],
		}, {
			id: "daily",
			label: "Daily",
			emote: EmoteId.Heads,
			texts: [
				target.CanReceiveDaily() ? s.available : showTime(addDays(target.Daily.LastReceived!, 1).getTime(), true),
				`\`${target.Daily.CurrentStreak}\` ${s.currentStreak}`,
				`\`${target.Daily.MaxStreak}\` ${s.maxStreak}`,
			],
		}, {
			id: "prison",
			label: s.prison,
			emote: EmoteId.Prison,
			texts: [
				`\`${target.Prison.Count}\` ${s.timesInPrison}`,
				`\`${target.Escape.Count}\` ${s.escapes}`,
				`\`${formatMoney(target.Prison.BriberySum, user.Language)}\` (\`${target.Prison.BriberyCount}\`) ${s.inBribery}`,
			],
		}, {
			id: "robbery",
			label: s.robberies,
			emote: EmoteId.Robbery,
			texts: [
				target.Wanted.Time > now ? showTime(target.Wanted.Time.getTime(), true) : s.canRob,
				`\`${formatMoney(target.Robbery.SuccessRobbedSum, user.Language)}\` (\`${target.Robbery.SuccessCount}\`) ${s.robbed}`,
				`\`${formatMoney(target.Robbery.BeingRobbedSum, user.Language)}\` (\`${target.Robbery.BeingRobbedCount}\`) ${s.robLost}`,
				`\`${target.Robbery.FailureCount}\` ${s.beatFailure}`,
			],
		}, {
			id: "beatups",
			label: s.beatUps,
			emote: EmoteId.Beat,
			texts: [
				target.BeatUp.Time > now ? showTime(target.BeatUp.Time.getTime(), true) : s.canBeat,
				`\`${target.BeatUp.SuccessCount}\` ${s.beatSuccess}`,
				`\`${target.BeatUp.FailureCount}\` ${s.beatFailure}`,
				`\`${target.BeatUp.BeatedUpCount}\` ${s.beatedUp}`,
			],
		}, {
			id: "casino",
			label: s.casino,
			emote: EmoteId.Casino,
			texts: [
				`\`${target.Casino.WinCount + target.Casino.LoseCount}\` ${s.games}`,
				`\`${formatMoney(target.Casino.WinSum, user.Language)}\` (\`${target.Casino.WinCount}\`) ${s.won}`,
				`\`${formatMoney(target.Casino.LoseSum, user.Language)}\` (\`${target.Casino.LoseCount}\`) ${s.lost}`,
				`\`${(target.Casino.WinCount / (target.Casino.LoseCount + target.Casino.WinCount) * 100).toFixed(2)}%\` win rate`,
			],
		}, {
			id: "alms",
			label: s.alms,
			emote: EmoteId.Alms,
			texts: [
				target.Alms.ReceiveTime > now ? `${s.almsReceive} ${showTime(target.Alms.ReceiveTime.getTime(), true)}` : s.almsCanReceive,
				target.Alms.GiveTime > now ? `${s.almsGive} ${showTime(target.Alms.GiveTime.getTime(), true)}` : s.almsCanGive,
				`${formatMoney(target.Alms.ReceivedSum, user.Language)} (\`${target.Alms.ReceivedCount}\`) ${s.almsReceived}`,
				`${formatMoney(target.Alms.GivenSum, user.Language)} (\`${target.Alms.GivenCount}\`) ${s.almsGiven}`,
			],
		}, {
			id: "scavenge",
			label: s.scavenge,
			emote: EmoteId.Scavenge,
			texts: [
				target.Scavenge.Time > now ? showTime(target.Scavenge.Time.getTime(), true) : s.scavengeCan,
				`\`${target.Scavenge.Found.Items + target.Scavenge.Found.MoneyCount}\` ${s.scavengeFound}`,
				`\`${target.Scavenge.Found.Failures}\` ${s.scavengeFailures}`,
				`\`${target.Scavenge.Found.FailureWithHospital}\` ${s.scavengeHospitalizations}`,
				`\`${target.Scavenge.Found.FailureWithPrison}\` ${s.scavengePrisions}`,
			],
		}, {
			id: "money",
			label: s.money,
			emote: EmoteId.Bank,
			texts: [
				`\`${formatMoney(target.Job.ReceivedSum, user.Language)}\` (\`${target.Job.ReceivedCount}\`) ${s.fromJobs}`,
				`\`${formatMoney(target.Investment.TotalProfit, language)}\` ${s.fromInvestments}`,
				`\`${formatMoney(target.Shop.SpentSum, user.Language)}\` (\`${target.Shop.SpentCount}\`) ${s.spent}`,
			],
		}, {
			id: "badges",
			label: s.badges,
			emote: BadgeList[BadgeId.S1Top1Money].Emoji.Id,
			texts: badgeText === "" ? [s.noBadges] : badges.map(badge => `**${BadgeList[badge.BadgeId].Emoji.String} ${BadgeList[badge.BadgeId].Name[language]}**\n-# ${BadgeList[badge.BadgeId].Description[language]}`),
		}];


		const userImage = await new UserImageCanvasBuilder(target, _user.avatarURL({ size: 512 }))
			.SetBadges(badges)
			.SetDecoration(target.AvatarDecoration.Id)
			.GenerateImage();

		const userImageFile = new AttachmentBuilder(userImage, { name: "user.webp" });

		function addHeader(container = new CustomContainerBuilder()) {
			if (!target) {
				return container;
			}

			container.setUser(target)
				.addSectionComponents(header => header
					.addTexts([
						`### ${s.title} ${target.Nickname}`,
						badges.length > 0 ? `### ${badgeText}` : "",
						`### ${formatMoney(target.Money, language)}`,
					].filter(Boolean))
					.setThumbnailAccessory(thumb => thumb
						.setURL("attachment://user.webp"),
					),
				)
				.addTexts([
					`### ${ClassList[target.Class].Image.Emote.String} ${ClassList[target.Class].Name[user.Language]} • ${target.Situation.SimpleEmote}`,
				])
				.addLargeSeparator();

			return container;
		}

		function generateDefaultContainer() {
			if (!target) {
				return addHeader();
			}

			// separate options in different arrays with length = 5
			const buttonOptionsChunks = [];
			for (let i = 0; i < buttonOptions.length; i += 5) {
				buttonOptionsChunks.push(buttonOptions.slice(i, i + 5));
			}

			const container = addHeader();

			for (const chunk of buttonOptionsChunks) {
				container.addButtonRow(
					...chunk.map(option => (btn: ButtonBuilder) => btn
						.setLabel(option.label)
						.setEmoji(option.emote)
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(option.id === currentOption)
						.setCustomId(option.id),
					),
				);
			}

			if (currentOption != null) {
				const info = buttonOptions.find(b => b.id === currentOption);

				if (!info) {
					return container;
				}

				const emoji = interaction.client.emojis.cache.get(info.emote);

				container
					.addLargeSeparator()
					.addTexts([
						`### ${emoji} ${info.label}`,
						...info.texts,
					]);
			}

			container.addFooter({
				text: `Id: ${target.Id} • ${s.playingSince}: ${target.CreatedAt.toLocaleDateString(interaction.locale)}`,
			});

			return container;
		}

		const files = [];
		if (userImageFile) {
			files.push(userImageFile);
		}

		let container = generateDefaultContainer();

		const response = await replyInteraction(interaction, {
			components: [container],
			files,
			flags: MessageFlags.IsComponentsV2,
		});

		const collector = createButtonCollector(interaction, response);

		collector?.on("end", async () => {
			await disableButtons(interaction, container);
		});

		collector?.on("collect", async btn => {
			await deferUpdate(btn);

			currentOption = btn.customId;

			container = generateDefaultContainer();

			return replyWithContainer(interaction, container);
		});
	},
};

const Strings = {
	[Language.English]: {
		title: "Informations of",
		situation: "Situation",
		className: "Class",
		available: "Available",
		currentStreak: "current streak",
		maxStreak: "max streak",
		prison: "Prison",
		timesInPrison: "times inprisoned",
		escapes: "escapes",
		inBribery: "in bribery",
		robberies: "Robberies",
		canRob: "Can rob",
		robbed: "robbed",
		robLost: "lost",
		timesInHospital: "times hospitalized",
		spentInTreatments: "in treatments",
		beatUps: "Beat ups",
		canBeat: "Can beat",
		beatSuccess: "successes",
		beatFailure: "failures",
		beatedUp: "times beated up",
		money: "Money",
		fromJobs: "from jobs",
		fromInvestments: "from investments",
		spent: "spent in shops",
		casino: "Casino",
		games: "games",
		won: "won",
		lost: "lost",
		alms: "Alms",
		almsReceive: "Receive",
		almsCanReceive: "Can receive",
		almsGive: "Give",
		almsCanGive: "Can give",
		almsReceived: "received",
		almsGiven: "given",
		scavenge: "Scavenge",
		scavengeCan: "Can scavenge",
		scavengeTries: "tries",
		scavengeItems: "items",
		scavengeFound: "found",
		scavengeMoney: "dinheiro",
		scavengeFailures: "failures",
		scavengeHospitalizations: "hospitalizations",
		scavengePrisions: "prisons",
		badges: "Badges",
		noBadges: "No badges",
		playingSince: "Playing since",
		goBack: "Go back",
	},

	[Language.Portuguese]: {
		title: "Informações de",
		situation: "Situação",
		className: "Classe",
		available: "Disponível",
		currentStreak: "sequência atual",
		maxStreak: "sequência máxima",
		prison: "Prisão",
		timesInPrison: "vezes preso",
		escapes: "fugas",
		inBribery: "em suborno",
		robberies: "Roubos",
		canRob: "Pode roubar",
		robbed: "roubados",
		robLost: "perdidos",
		timesInHospital: "vezes hospitalizado",
		spentInTreatments: "em tratamentos",
		beatUps: "Espancamentos",
		canBeat: "Pode espancar",
		beatSuccess: "sucessos",
		beatFailure: "falhas",
		beatedUp: "vezes espancado",
		money: "Dinheiro",
		fromJobs: "de trabalhos",
		fromInvestments: "de investimentos",
		spent: "gastos em lojas",
		casino: "Cassino",
		games: "jogos",
		won: "ganhos",
		lost: "perdidos",
		alms: "Esmola",
		almsReceive: "Receber",
		almsCanReceive: "Pode receber",
		almsGive: "Doar",
		almsCanGive: "Pode doar",
		almsReceived: "recebidos",
		almsGiven: "doados",
		scavenge: "Vasculhar",
		scavengeCan: "Pode vasculhar",
		scavengeTries: "tentativas",
		scavengeItems: "itens",
		scavengeFound: "encontrados",
		scavengeMoney: "dinheiro",
		scavengeFailures: "falhas",
		scavengeHospitalizations: "hospitalizações",
		scavengePrisions: "prisões",
		badges: "Insígnias",
		noBadges: "Sem insígnias",
		playingSince: "Jogando desde",
		goBack: "Voltar",
	},

	[Language.Spanish]: {
		title: "Informaciones de",
		situation: "Situación",
		className: "Clase",
		available: "Disponible",
		currentStreak: "racha actual",
		maxStreak: "racha máxima",
		prison: "Prisión",
		timesInPrison: "veces en prisión",
		escapes: "fugas",
		inBribery: "en soborno",
		robberies: "Robos",
		canRob: "Puede robar",
		robbed: "robados",
		robLost: "perdidos",
		timesInHospital: "veces hospitalizado",
		spentInTreatments: "en tratamientos",
		beatUps: "Golpiza",
		canBeat: "Puede golpear",
		beatSuccess: "sucesos",
		beatFailure: "fallos",
		beatedUp: "veces golpeado",
		money: "Dinero",
		fromJobs: "de trabajos",
		fromInvestments: "de inversiones",
		spent: "gastos en tiendas",
		casino: "Casino",
		games: "juegos",
		won: "ganados",
		lost: "perdidos",
		alms: "Limosna",
		almsReceive: "Recibir",
		almsCanReceive: "Puede recibir",
		almsGive: "Dar",
		almsCanGive: "Puede dar",
		almsReceived: "recibidos",
		almsGiven: "dado",
		scavenge: "Buscar",
		scavengeCan: "Puede buscar",
		scavengeTries: "intentos",
		scavengeItems: "artículos",
		scavengeFound: "encontrados",
		scavengeMoney: "dinero",
		scavengeFailures: "fallos",
		scavengeHospitalizations: "hospitalizaciones",
		scavengePrisions: "prisiones",
		badges: "Insignia",
		noBadges: "Sin insignia",
		playingSince: "Jugando desde",
		goBack: "Voltar",
	},
} as const satisfies Localization;