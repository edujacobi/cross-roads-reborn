import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	ComponentType,
	Locale,
	MessageComponentInteraction,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandUserOption,
} from "discord.js";
import {
	checkActions,
	checkRooster,
	checkUser,
	removeEmbedComponents,
	replyInteraction,
	showMessageActions,
} from "../../utils/logic";
import { defaultEmbed, EmoteId, EmoteString } from "../../utils/ui";
import { Rooster } from "../../models/Rooster";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import dotenv from "dotenv";
import { BattleArena, getBattleArena } from "../../models/BattleArena";
import { ChampionshipBattle } from "../../models/ChampionshipBattle";
import { Language } from "../../models/Language";

dotenv.config();

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName("championship")
		.setDescription("Create a official battle of a championship. Required: Game Master of Battle Roosters Arena")
		.setNameLocalization(Locale.PortugueseBR, "campeonato")
		.setDescriptionLocalization(Locale.PortugueseBR, "Cria uma batalha oficial de um campeonato. Necessário: Game Mater do Battle Roosters Arena")
		.addUserOption((option: SlashCommandUserOption) =>
			option
				.setName("user1")
				.setDescription("The rooster's owner 1")
				.setNameLocalization(Locale.PortugueseBR, "usuario1")
				.setDescriptionLocalization(Locale.PortugueseBR, "O dono do galo 1")
				.setRequired(true),
		)
		.addUserOption((option: SlashCommandUserOption) =>
			option
				.setName("user2")
				.setDescription("The rooster's owner 2")
				.setNameLocalization(Locale.PortugueseBR, "usuario2")
				.setDescriptionLocalization(Locale.PortugueseBR, "O dono do galo 2")
				.setRequired(true),
		)
		.addIntegerOption((option: SlashCommandIntegerOption) =>
			option
				.setName("best_of")
				.setDescription("Needs to be an odd number")
				.setNameLocalization(Locale.PortugueseBR, "melhor_de")
				.setDescriptionLocalization(Locale.PortugueseBR, "Precisa ser um numero ímpar")
				.addChoices(
					{ name: "Best of 1", value: 1, name_localizations: {
						[Locale.PortugueseBR]: "Melhor de 1",
						[Locale.SpanishES]: "Mejor de 1",
					} },
					{ name: "Best of 3", value: 3, name_localizations: {
						[Locale.PortugueseBR]: "Melhor de 3",
						[Locale.SpanishES]: "Mejor de 3",
					} },
					{ name: "Best of 5", value: 5, name_localizations: {
						[Locale.PortugueseBR]: "Melhor de 5",
						[Locale.SpanishES]: "Mejor de 5",
					} },
				)
				.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const user = await checkUser(interaction.user.id, interaction);

		if (!user) {
			return;
		}

		const s = Strings[user.Language];

		if (!["606290632725626940", process.env.JACOBI_ID].includes(interaction.user.id)) {
			return await replyInteraction(interaction, {
				embeds: [
					defaultEmbed({
						interaction,
						color: Colors.Yellow,
						description: s.descriptionRequirements,
					}),
				],
				ephemeral: true,
			});
		}

		const user1 = interaction.options.getUser("user1", true);
		const user2 = interaction.options.getUser("user2", true);
		const bestOf = interaction.options.getInteger("best_of", true);

		const rooster1 = await checkRooster(user1.id, interaction);

		if (!rooster1) {
			return;
		}

		const rooster2 = await checkRooster(user2.id, interaction);

		if (!rooster2) {
			return;
		}

		if (user1.id === user2.id) {
			return await replyInteraction(interaction, {
				embeds: [
					defaultEmbed({
						interaction,
						description: s.descriptionSamePlayers,
					}),
				],
			});
		}

		// const MAX_LEVEL_DIFFERENCE = 5;
		//
		// if (Math.abs(rooster2.Level - rooster1.Level) > MAX_LEVEL_DIFFERENCE) {
		// 	return await replyInteraction(interaction, {
		// 		embeds: [
		// 			defaultEmbed({
		// 				interaction,
		// 				color: Colors.Yellow,
		// 				description: `The level difference between **${rooster1.GetNameWithImage()}** (${rooster1.Level}) and **${rooster2.GetNameWithImage()}** (${rooster2.Level}) is too high! It cannot be greater than ${MAX_LEVEL_DIFFERENCE}.`
		// 			})
		// 		]
		// 	});
		// }

		const rooster1Actions = checkActions({
			training: true,
			finishedTraining: true,
			resting: true,
			lowLevel: true,
			battling: true,
		}, rooster1);

		const canRooster1Battle = await showMessageActions(rooster1Actions, rooster1, interaction);

		if (!canRooster1Battle) {
			return;
		}

		const rooster2Actions = checkActions({
			training: true,
			finishedTraining: true,
			resting: true,
			lowLevel: true,
			battling: true,
		}, rooster2);

		const canRooster2Battle = await showMessageActions(rooster2Actions, rooster2, interaction);

		if (!canRooster2Battle) {
			return;
		}

		const battleArena = BattleArena.Conmegalo;

		const roosterDataFormatted = (r: Rooster) => s.dataFormatted(r.RarityText, r.Level);

		const embedStartBattle = new CustomEmbedBuilder()
			.setDescription(s.descriptionStartBattle(rooster1.Name, rooster2.Name, bestOf))
			.addFields([
				{
					name: rooster1.GetNameWithImage(),
					value: roosterDataFormatted(rooster1),
					inline: true,
				},
				{
					name: rooster2.GetNameWithImage(),
					value: roosterDataFormatted(rooster2),
					inline: true,
				},
			])
			.setColor(Colors.Yellow)
			.setImage(getBattleArena(battleArena).imageUrl)
			.setFooter({ text: getBattleArena(battleArena).name });

		const buttonAccept = new ButtonBuilder()
			.setCustomId("accept")
			.setLabel(s.labelAccept)
			.setStyle(ButtonStyle.Success)
			.setEmoji(EmoteId.Katana);

		const buttonRefuse = new ButtonBuilder()
			.setCustomId("refuse")
			.setLabel(s.labelRefuse)
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder<ButtonBuilder>()
			.setComponents([buttonAccept, buttonRefuse]);

		const response = await replyInteraction(interaction, {
			content: `${interaction.options.getUser("user1")} ${interaction.options.getUser("user2")}`,
			embeds: [embedStartBattle],
			components: [row],
		});

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === user1.id || i.user.id === user2.id,
			componentType: ComponentType.Button,
			time: 90_000,
		});

		let collectorAnswered = false;

		const usersAcceptedList: string[] = [];

		async function managePlayerStatus(btn: ButtonInteraction) {
			usersAcceptedList.push(btn.user.id);
			// await btn.deferUpdate();

			const roosterDataFormatted = (r: Rooster) => s.dataFormattedAccepted(r.RarityText, r.Level);

			if (btn.user.id == user1.id) {
				// @ts-expect-error - Assuming that the fields will never be undefined
				embedStartBattle.data.fields[0].value = roosterDataFormatted(rooster1);

			}
			else if (btn.user.id == user2.id) {
				// @ts-expect-error - Assuming that the fields will never be undefined
				embedStartBattle.data.fields[1].value = roosterDataFormatted(rooster2);
			}

			await replyInteraction(interaction, { embeds: [embedStartBattle] });
		}

		collector?.on("collect", async btn => {
			if (btn.customId === "accept") {
				if (!user1 || !user2) {
					return;
				}

				const rooster1 = await checkRooster(user1.id, interaction);

				if (!rooster1) {
					return;
				}

				const rooster2 = await checkRooster(user2.id, interaction);

				if (!rooster2) {
					return;
				}

				const roosterActions = checkActions({
					training: true,
					finishedTraining: true,
					resting: true,
					lowLevel: true,
					battling: true,
				}, rooster1);

				const canRooster1Battle = await showMessageActions(roosterActions, rooster1, btn);

				if (!canRooster1Battle) {
					return;
				}

				const rooster2Actions = checkActions({
					training: true,
					finishedTraining: true,
					resting: true,
					lowLevel: true,
					battling: true,
				}, rooster2);

				const canRooster2Battle = await showMessageActions(rooster2Actions, rooster2, btn);

				if (!canRooster2Battle) {
					return;
				}

				if (usersAcceptedList.includes(btn.user.id)) {
					return;
				}

				await managePlayerStatus(btn);

				if (!(usersAcceptedList.includes(user1.id) && usersAcceptedList.includes(user2.id))) {
					return;
				}

				embedStartBattle
					.setColor(Colors.Yellow)
					.setDescription(s.descriptionBattleBegins);

				await removeEmbedComponents(btn, [embedStartBattle]);

				collectorAnswered = true;
				collector.dispose(btn);

				await new ChampionshipBattle(rooster1, rooster2, bestOf, btn).Start();

			}
			else if (btn.customId === "refuse") {

				embedStartBattle
					.setColor(Colors.Red)
					.setFields([])
					.setDescription(s.descriptionRefusedBattle(btn.user.displayName));

				await removeEmbedComponents(btn, [embedStartBattle]);

			}
		});

		collector?.on("end", async () => {
			if (!collectorAnswered) {
				embedStartBattle
					.setColor(Colors.Red)
					.setFields([])
					.setDescription(s.descriptionEnd);

				await removeEmbedComponents(interaction, [embedStartBattle]);
			}
		});
	},
};

const Strings = {
	[Language.English]:{
		descriptionRequirements: `You don't have the requirements to start a Championship Battle.`,
		descriptionSamePlayers: "The players cannot be the same.",
		descriptionStartBattle: (rooster1Name: string, rooster2Name: string, bestOf: number) => `## ${rooster1Name} vs ${rooster2Name}\n**A best of ${bestOf} battles to a Championship!**`,
		descriptionBattleBegins: `# THE CHAMPIONSHIP BATTLE BEGINS!`,
		descriptionRefusedBattle: (nameDisplay: string) => `**${nameDisplay}** refused the challenge.`,
		dataFormatted: (rarity: string, level: number) => `**${rarity}**\nLevel: \`${level}\`\n${EmoteString.Waiting} Waiting...`,
		dataFormattedAccepted: (rarity: string, level: number) => `**${rarity}**\nLevel: \`${level}\`\n${EmoteString.Online} Accepted`,
		labelAccept: "Let's go!",
		labelRefuse: "I'm scared",
		descriptionEnd: `All the players have to accept the battle.`,

	},
	[Language.Portuguese]:{
		descriptionRequirements: `Você não cumpre os requisistos para inciar uma Batalha de Cameponato.`,
		descriptionSamePlayers: "Os jogadores não podem ser iguais.",
		descriptionStartBattle: (rooster1Name: string, rooster2Name: string, bestOf: number) => `## ${rooster1Name} vs ${rooster2Name}\n**Numa melhor de ${bestOf} batalhas em um Campeonato!**`,
		descriptionBattleBegins: `# O CAMPEONATO DE BATALHAS COMEÇOU`,
		descriptionRefusedBattle: (nameDisplay: string) => `**${nameDisplay}** recusou o desafio.`,
		dataFormatted: (rarity: string, level: number) => `**${rarity}**\nNível: \`${level}\`\n${EmoteString.Waiting} Esperando...`,
		dataFormattedAccepted: (rarity: string, level: number) => `**${rarity}**\nNível: \`${level}\`\n${EmoteString.Online} Aceitou`,
		labelAccept: "Vamos lá!",
		labelRefuse: "Tô com medo",
		descriptionEnd: `Todos os jogadores precisam aceitar a batalha.`,
	},
	[Language.Spanish]:{
		descriptionRequirements: `No tienes los requisitos para iniciar una batalla de campeonato.`,
		descriptionSamePlayers: "Los jugadores no pueden ser los mismos.",
		descriptionStartBattle: (rooster1Name: string, rooster2Name: string, bestOf: number) => `## ${rooster1Name} vs ${rooster2Name}\n**Lo mejor de ${bestOf} battallas en un campeonato!**`,
		descriptionBattleBegins: `# ¡COMIENZA LA BATALLA DEL CAMPEONATO!`,
		descriptionRefusedBattle: (nameDisplay: string) => `**${nameDisplay}** rechazó el desafío.`,
		dataFormatted: (rarity: string, level: number) => `**${rarity}**\nNivel: \`${level}\`\n${EmoteString.Waiting} Esperando...`,
		dataFormattedAccepted: (rarity: string, level: number) => `**${rarity}**\nNivel: \`${level}\`\n${EmoteString.Online} Aceptado`,
		labelAccept: "¡Vamos!",
		labelRefuse: "Tengo miedo",
		descriptionEnd: `Todos los jugadores tienen que aceptar la batalla.`,
	}
} as const;