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
	checkActions,
	checkRooster,
	checkUser,
	removeEmbedComponents,
	replyInteraction,
	showMessageActions,
} from "../../utils/logic";
import { defaultEmbed, EmoteId } from "../../utils/ui";
import { Battle, BattleType } from "../../models/Battle";
import { BattleRooster } from "../../models/BattleRooster";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { setTimeout as wait } from "timers/promises";
import { Rooster } from "../../models/Rooster";
import { BattleArena, getBattleArena } from "../../models/BattleArena";

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName("spare")
		.setDescription("Challenge another rooster to a spare in the dojo. Does not give Exp nor count in rankings")
		.setNameLocalization(Locale.PortugueseBR, "praticar")
		.setDescriptionLocalization(Locale.PortugueseBR, "Desafie outro galo para uma prática no dojo. Não da Exp nem conta em rankings")
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

		const roosterDataFormatted = (r: Rooster) => `**${r.RarityText}**\nLevel: \`${r.Level}\``;

		const embedStartBattle = new CustomEmbedBuilder()
			.setDescription(`## ${rooster.Name} vs ${targetRooster.Name}\n**${interaction.user.displayName} challenged ${interaction.options.getUser("target")?.displayName} to a 1 vs 1 spare!**`)
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
			.setColor(Colors.DarkOrange)
			.setImage(getBattleArena(BattleArena.Dojo).imageUrl)
			.setFooter({ text: getBattleArena(BattleArena.Dojo).name });

		const buttonAccept = new ButtonBuilder()
			.setCustomId("accept")
			.setLabel("Let's spare!")
			.setStyle(ButtonStyle.Success)
			.setEmoji(EmoteId.Energy);

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

				const battle = new Battle(challenger, opponent, btn, BattleType.Spare, BattleArena.Dojo, user.Language);

				embedStartBattle
					.setColor(Colors.Green)
					.setDescription(`# THE SPARE BEGINS!`);

				await removeEmbedComponents(btn, [embedStartBattle]);

				collectorAnswered = true;
				collector.dispose(btn);

				await wait(4000);

				await battle.Start();


			}
			else if (btn.customId === "refuse") {

				embedStartBattle
					.setColor(Colors.Red)
					.setDescription(`${interaction.options.getUser("target")?.displayName} refused the challenge.`);

				await removeEmbedComponents(btn, [embedStartBattle]);

			}
		});

		collector?.on("end", async () => {
			if (!collectorAnswered) {
				embedStartBattle
					.setColor(Colors.Red)
					.setDescription(`${interaction.options.getUser("target")?.displayName} didn't answered.`);

				await removeEmbedComponents(interaction, [embedStartBattle]);
			}
		});
	},
};