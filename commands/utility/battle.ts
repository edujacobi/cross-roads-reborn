import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	ComponentType,
	Locale,
	MessageComponentInteraction,
	SlashCommandBuilder,
	SlashCommandUserOption,
} from "discord.js";
import {
	BOT_ID,
	checkActions,
	checkRooster,
	checkUser,
	removeEmbedComponents,
	replyInteraction,
	showMessageActions,
} from "../../utils/logic";
import { defaultEmbed, EmoteId, EmoteString, getRarityColor } from "../../utils/ui";
import { Battle, BattleType } from "../../models/Battle";
import { BattleRooster } from "../../models/BattleRooster";
import { Rooster } from "../../models/Rooster";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { setTimeout as wait } from "timers/promises";
import { BattleArena, getBattleArena } from "../../models/BattleArena";

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName("battle")
		.setDescription("Challenge another rooster to a battle in the arena")
		.setNameLocalization(Locale.PortugueseBR, "batalhar")
		.setDescriptionLocalization(Locale.PortugueseBR, "Desafia outro galo para uma batalha na arena")
		.addUserOption((option: SlashCommandUserOption) =>
			option
				.setName("target")
				.setDescription("The rooster's owner to challenge")
				.setNameLocalization(Locale.PortugueseBR, "alvo")
				.setDescriptionLocalization(Locale.PortugueseBR, "O dono do galo para desafiar")
				.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const target = interaction.options.getUser("target", true);

		const rooster = await checkRooster(interaction.user.id, interaction);

		if (!rooster) {
			return;
		}

		const targetRooster = await checkRooster(target.id, interaction);

		if (!targetRooster) {
			return;
		}

		if (target.id === interaction.user.id) {
			return await replyInteraction(interaction, {
				embeds: [
					defaultEmbed({
						interaction,
						description: "You can't challenge yourself.",
					}),
				],
			});
		}

		const MAX_LEVEL_DIFFERENCE = 4;

		// SE NÃO FOR BOT
		if (target.id !== BOT_ID && Math.abs(targetRooster.Level - rooster.Level) > MAX_LEVEL_DIFFERENCE) {
			return await replyInteraction(interaction, {
				embeds: [
					defaultEmbed({
						interaction,
						thumbnail: rooster.GetImage(),
						color: getRarityColor(rooster.Rarity),
						description: `The level difference between **${rooster.GetNameWithImage()}** (${rooster.Level}) and **${targetRooster.GetNameWithImage()}** (${targetRooster.Level}) is too high! It cannot be greater than ${MAX_LEVEL_DIFFERENCE}. Choose another opponent.`,
					}),
				],
			});
		}

		const roosterActions = checkActions({
			training: true,
			finishedTraining: true,
			resting: true,
			lowLevel: true,
			battling: true,
		}, rooster);

		const canRoosterBattle = await showMessageActions(roosterActions, rooster, interaction);

		if (!canRoosterBattle) {
			return;
		}

		const targetRoosterActions = checkActions({
			training: true,
			finishedTraining: true,
			resting: true,
			lowLevel: true,
			battling: true,
		}, targetRooster);

		const canTargetRoosterBattle = await showMessageActions(targetRoosterActions, targetRooster, interaction);

		if (!canTargetRoosterBattle) {
			return;
		}

		let battleArena = BattleArena.Fishcutter;

		if (rooster.Level >= 5 && targetRooster.Level >= 5) {
			battleArena = BattleArena.Lemonheir;
		}

		if (rooster.Level >= 10 && targetRooster.Level >= 10) {
			battleArena = BattleArena.Temple;
		}

		if (rooster.Level >= 15 && targetRooster.Level >= 15) {
			battleArena = BattleArena.Conmegalo;
		}

		if (rooster.Level >= 20 && targetRooster.Level >= 20) {
			battleArena = BattleArena.Olympus;
		}

		if (rooster.Level >= 25 && targetRooster.Level >= 25) {
			battleArena = BattleArena.Coliseum;
		}

		const roosterDataFormatted = (r: Rooster) => `${EmoteString.Experience}Level ${r.Level}
${EmoteString.Victory}${r.Wins} ${EmoteString.Defeat}${r.Losses} ${EmoteString.Winrate}${r.GetWinrate()}`;

		const embedStartBattle = new CustomEmbedBuilder()
			.setDescription(`## ${rooster.Name} vs ${targetRooster.Name}\n**${interaction.user.displayName} challenged ${interaction.options.getUser("target")?.displayName} to a 1 vs 1 battle!**`)
			.addFields([
				{
					name: rooster.GetNameWithImage(),
					value: roosterDataFormatted(rooster),
					inline: true,
				},
				{
					name: targetRooster.GetNameWithImage(),
					value: roosterDataFormatted(targetRooster),
					inline: true,
				},
			])
			.setColor(Colors.White)
			.setImage(getBattleArena(battleArena).imageUrl)
			.setFooter({ text: getBattleArena(battleArena).name });

		const buttonAccept = new ButtonBuilder()
			.setCustomId("accept")
			.setLabel("Let's battle!")
			.setStyle(ButtonStyle.Success)
			.setEmoji(EmoteId.Knife);

		const buttonRefuse = new ButtonBuilder()
			.setCustomId("refuse")
			.setLabel("Maybe later")
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder<ButtonBuilder>()
			.setComponents([buttonAccept, buttonRefuse]);

		const response = await replyInteraction(interaction, {
			content: `${interaction.options.getUser("target")}`,
			embeds: [embedStartBattle],
			components: [row],
		});

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === target?.id,
			componentType: ComponentType.Button,
			time: 90_000,
		});

		let collectorAnswered = false;


		collector?.on("collect", async btn => {
			if (!rooster) {
				return;
			}

			if (btn.customId === "accept") {
				if (!target) {
					return;
				}

				const user = await checkUser(interaction.user.id, interaction);

				const rooster = await checkRooster(interaction.user.id, interaction);

				if (!rooster || !user) {
					return;
				}

				const targetRooster = await checkRooster(target.id, interaction);

				if (!targetRooster) {
					return;
				}

				const roosterActions = checkActions({
					training: true,
					finishedTraining: true,
					resting: true,
					lowLevel: true,
					battling: true,
				}, rooster);

				const canRoosterBattle = await showMessageActions(roosterActions, rooster, btn);

				if (!canRoosterBattle) {
					return;
				}

				const targetRoosterActions = checkActions({
					training: true,
					finishedTraining: true,
					resting: true,
					lowLevel: true,
					battling: true,
				}, targetRooster);

				const canTargetRoosterBattle = await showMessageActions(targetRoosterActions, targetRooster, btn);

				if (!canTargetRoosterBattle) {
					return;
				}

				const challenger = await new BattleRooster(rooster.OwnerId).GetInfo();
				const opponent = await new BattleRooster(targetRooster.OwnerId).GetInfo();

				if (!challenger || !opponent) {
					return;
				}

				challenger.CalcStats();
				opponent.CalcStats();

				const battle = new Battle(challenger, opponent, btn, BattleType.Fight, battleArena, user.Language);

				embedStartBattle
					.setColor(Colors.Green)
					.setDescription(`# THE BATTLE BEGINS!`);

				await removeEmbedComponents(btn, [embedStartBattle]);

				collectorAnswered = true;
				collector.dispose(btn);

				await wait(4000);

				await battle.Start();


			}
			else if (btn.customId === "refuse") {

				embedStartBattle
					.setColor(Colors.Red)
					.setFields([])
					.setDescription(`**${interaction.options.getUser("target")?.displayName}** refused the challenge.`);

				await removeEmbedComponents(btn, [embedStartBattle]);

			}
		});

		collector?.on("end", async () => {
			if (!collectorAnswered) {
				embedStartBattle
					.setColor(Colors.Red)
					.setFields([])
					.setDescription(`**${interaction.options.getUser("target")?.displayName}** didn't answered.`);

				await removeEmbedComponents(interaction, [embedStartBattle]);
			}
		});
	},
};