import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { createButtonCollector, disableButtons } from "#bot/utils/collectors";
import { CrColors } from "#bot/utils/colors";
import { deferUpdate, replyWithContainer } from "#bot/utils/discordInteractions";
import { Language, type Localization } from "#core/models/Language";
import { Pagination } from "#core/models/Pagination";
import type { User } from "#core/models/User";
import { UserRepository } from "#core/repositories/UserRepository";
import { ClassList } from "#core/types/Classes";
import { ButtonBuilder, ButtonStyle, type ChatInputCommandInteraction, Locale, SlashCommandBuilder, time, TimestampStyles } from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("cemetery")
		.setDescription("Visit the cemetery and see the dead players")
		.setNameLocalization(Locale.PortugueseBR, "cemiterio")
		.setNameLocalization(Locale.SpanishES, "cementerio")
		.setDescriptionLocalization(Locale.PortugueseBR, "Visite o cemitério e veja os jogadores mortos")
		.setDescriptionLocalization(Locale.SpanishES, "Visitar el cementerio y ver a los jugadores muertos"),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const s = Strings[user.Language];
		const deadPlayers = await UserRepository.FindAllDead();

		let container = new CustomContainerBuilder();

		const addContainerHeader = () => {

			const s = Strings[user.Language];
			container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.Cemetery)
				.addSectionComponents(header => header
					.addTexts([
						`# ${s.title}`,
						s.subtitle,
						s.subtitleDeath,
						s.subtitleBan,
					])
					.setThumbnailAccessory(thumb => thumb
						.setURL("https://media.discordapp.net/attachments/1233604589064818808/1513568921859391518/Cemitery.png")
					)
				);

			if (deadPlayers.length === 0) {
				container
					.addLargeSeparator()
					.addTexts([
						s.empty,
					]);
			}
		};

		const generateContainer = async () => {
			const buttonDead = new ButtonBuilder()
				.setCustomId("dead")
				.setLabel(s.dead)
				.setDisabled(deadPlayers.length === 0)
				.setStyle(ButtonStyle.Secondary);

			addContainerHeader();
			container
				.addFooter({ button: buttonDead });

			const response = await replyWithContainer(interaction, container);

			const collector = createButtonCollector(interaction, response);

			collector?.on("end", async () => {
				await disableButtons(interaction, container);
			});

			collector?.on("collect", async btn => {
				await deferUpdate(btn);

				if (btn.customId === "dead") {
					buttonDead.setDisabled(true);

					const pagination = new Pagination(interaction, user.Language);

					pagination.HowManyRecords = deadPlayers.length;
					pagination.Limit = 10;

					const containerDead = new CustomContainerBuilder()
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
								`### ${ClassList[u.class].Image.Emote.String} ${u.nickname}`,
								`${s.revived} ${time(u.deadUntil!, TimestampStyles.RelativeTime)}`,
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
	[Language.English]: {
		title: "Cemetery",
		subtitle: "-# 50% chance of being in a better place.",
		subtitleDeath: "### Death\nWhen a player dies, they lose all their money and their job, if they have one. While dead, they do not receive money from investments.",
		subtitleBan: "### Banned\nDead players were banned from the game and cannot use any command. You don't want to be here.",
		empty: "The cemetery is empty! There are no dead players.",
		titleDead: "Here lie...",
		revived: "Revived",
		dead: "Dead",
	},
	[Language.Portuguese]: {
		title: "Cemitério",
		subtitle: "-# 50% de chance de estarem em um lugar melhor.",
		subtitleDeath: "### Morte\nAo morrer, o jogador perde todo o dinheiro e seu trabalho, caso estiver em um. Enquanto morto, ele não recebe dinheiro de investimentos.",
		subtitleBan: "### Banidos\nJogadores mortos foram banidos do jogo e não podem usar comando algum. Você não quer estar aqui.",
		empty: "O cemitério está vazio! Não há jogadores mortos.",
		titleDead: "Aqui jazem...",
		revived: "Ressuscitará",
		dead: "Mortos",
	},
	[Language.Spanish]: {
		title: "Cementerio",
		subtitle: "-# 50% de probabilidad de estar en un lugar mejor.",
		subtitleDeath: "### Muerte\nAl morir, el jugador pierde todo su dinero y su trabajo, si tiene uno. Mientras muerto, no recibe dinero de inversiones.",
		subtitleBan: "### Banidos\nLos jugadores muertos fueron baneados del juego y no pueden usar ningún comando. No querrás estar aquí.",
		empty: "¡El cementerio está vacío! No hay jugadores muertos.",
		titleDead: "Aquí yacen...",
		revived: "Resucitará",
		dead: "Muertos",
	},
} as const satisfies Localization;
