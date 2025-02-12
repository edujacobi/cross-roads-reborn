import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	ComponentType, Locale,
	MessageComponentInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { checkActions, checkRooster, checkUser, removeEmbedComponents, replyInteraction } from "../../utils/logic";
import { EmoteId, EmoteString, getPathText, showTime } from "../../utils/ui";
import { Rooster, RoosterStat } from "../../models/Rooster";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { Log } from "../../utils/log";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("train")
		.setDescription("Increase your rooster's attributes by training")
		.setNameLocalization(Locale.PortugueseBR, "treinar")
		.setDescriptionLocalization(Locale.PortugueseBR, "Aumente os atributos do seu galo treinando"),

	async execute(interaction: ChatInputCommandInteraction) {
		const user = await checkUser(interaction.user.id, interaction);

		const rooster = await checkRooster(interaction.user.id, interaction);

		if (!user || !rooster) {
			return;
		}

		const actions = checkActions({
			training: true,
			finishedTraining: true,
			resting: true,
			trainedAll: true,
			battling: true,
		}, rooster);

		let textTrain = `_So you wanna become the greatest? Come closer, I'll teach you.\nIn wich path do you want to train?_`;
		if (actions.training) {
			textTrain = `_Procede with your training and you shall become the greatest!_\n\n${EmoteString.Training} **Training** in the ${getPathText(<string>rooster.IsTraining)} until ${showTime(rooster.Timers.Train)}`;
		}
		if (actions.finishedTraining) {
			textTrain = "_You have finished your training. You need to rest now, my pupil!_";
		}
		if (actions.resting) {
			textTrain = `_You are too tired to train._\n\n${EmoteString.Resting} **Resting** until ${showTime(rooster.Timers.Rest)}`;
		}
		if (actions.trainedAll) {
			textTrain = "_I already trained you all your available trainings. Go fight!_";
		}
		if (actions.battling) {
			textTrain = `_You're in a middle of a ${EmoteString.Battling} **Battle**! Finish it and come back here._`;
		}

		function getTextFooter(rooster: Rooster) {
			let textFooter = "Ready to train";
			if (actions.training) {
				textFooter = "Training";
			}
			if (actions.finishedTraining) {
				textFooter = "Finished";
			}
			if (actions.resting) {
				textFooter = "Resting";
			}
			if (actions.trainedAll) {
				textFooter = "Cannot train in this level anymore";
			}
			if (actions.battling) {
				textFooter = "Battling";
			}

			textFooter += ` • Remaining training sessions: ${rooster.AvailableTrainings}`;
			return textFooter;
		}

		const embed = new CustomEmbedBuilder()
			.setTitle("Training")
			.setDescription(textTrain)
			// .setThumbnail("https://i.imgur.com/Bdp7I9e.jpeg")
			.setImage("https://i.imgur.com/K2Ud0qn.jpeg")
			.addFields([
				{
					// name: `${EmoteString.Attack} Path of Violence`,
					name: getPathText(RoosterStat.ATK),
					value: `Boost your Attack (${rooster.Stats.Attack}). Deals more damage in your blows.`,
				},
				{
					// name: `${EmoteString.Defense} Path of Patience`,
					name: getPathText(RoosterStat.DEF),
					value: `Boost your Defense (${rooster.Stats.Defense}). Receive less damage in opponent blows.`,
				},
				{
					// name: `${EmoteString.Speed} Path of Flowness`,
					name: getPathText(RoosterStat.SPD),
					value: `Boost your Speed (${rooster.Stats.Speed}). Increase the probability of attacking twice.`,
				},
				// {
				// 	// name: `${EmoteString.Stamina} Path of Endurance`,
				// 	name: `${EmoteString.Stamina} Path of Bull`,
				// 	value: `Boost your Stamina. Increase how many blows you can take.`
				// },
				{
					// name: `${EmoteString.Stamina} Path of Endurance`,
					name: getPathText(RoosterStat.CRT),
					value: `Boost your Critical (${rooster.Stats.Critical}). Increase the chance of deal double damage.`,
				},
			])
			.setColor(Colors.White)
			.setDefaultFooter(interaction, getTextFooter(rooster));

		const buttonATK = new ButtonBuilder()
			.setCustomId(RoosterStat.ATK)
			.setLabel("Attack")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(EmoteId.Attack);

		const buttonDEF = new ButtonBuilder()
			.setCustomId(RoosterStat.DEF)
			.setLabel("Defense")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(EmoteId.Defense);

		const buttonSPD = new ButtonBuilder()
			.setCustomId(RoosterStat.SPD)
			.setLabel("Speed")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(EmoteId.Speed);

		const buttonCRT = new ButtonBuilder()
			.setCustomId(RoosterStat.CRT)
			.setLabel("Critical")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(EmoteId.CritChance);

		const buttonStop = new ButtonBuilder()
			.setCustomId("stop")
			.setLabel("Stop training")
			.setStyle(ButtonStyle.Danger);

		const buttonComplete = new ButtonBuilder()
			.setCustomId("complete")
			.setLabel("Complete training")
			.setStyle(ButtonStyle.Success);

		const row = new ActionRowBuilder<ButtonBuilder>();

		if (actions.training) {
			row.setComponents([buttonStop]);
		}
		else if (actions.finishedTraining) {
			row.setComponents([buttonComplete]);
		}
		else {
			row.setComponents([buttonATK, buttonDEF, buttonSPD, buttonCRT]);
		}

		const response = await replyInteraction(interaction, {
			embeds: [embed],
			components: actions.trainedAll ? [] : [row],
			ephemeral: true,
		});

		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			time: 60_000,
		});

		collector?.on("collect", async btn => {
			const rooster = await checkRooster(interaction.user.id, interaction);

			if (!rooster) {
				return;
			}

			const actions = checkActions({
				training: true,
				finishedTraining: true,
				resting: true,
				trainedAll: true,
				battling: true,
			}, rooster);

			embed.setFields([]);

			if (btn.customId == "stop") {
				const restTime = await rooster.StopTraining();

				embed
					.setDefaultFooter(interaction, getTextFooter(rooster))
					.setDescription(`_What a shame, you stopped your training._ **${rooster.Name}** will rest until ${showTime(restTime)}.`);

			}
			else if (btn.customId == "complete") {
				if (!rooster.CanCompleteTraining()) {
					embed
						.setDescription(`**${rooster.Name}** is not training.`);

				}
				else {
					const { exp, restTime } = await rooster.CompleteTraining();

					embed
						.setDefaultFooter(interaction, getTextFooter(rooster))
						.setDescription(`**${rooster.Name}** has completed his training and gained ${exp} exp! It will need to rest until ${showTime(restTime)}.`);
				}
			}
			else if (actions.training) {
				embed.setDescription("_You're already training._");
			}
			else if (actions.resting) {
				embed.setDescription("_Take your time, you need to rest now._");
			}
			else if (actions.battling) {
				embed.setDescription("_You're in a middle of a battle! Finish it and come back here._");
			}
			else {
				try {
					const trainTime = await rooster.StartTraining(btn.customId as RoosterStat, user.IsVip());

					const path = getPathText(btn.customId);

					embed
						.setDefaultFooter(interaction, getTextFooter(rooster))
						.setDescription(`**${rooster.Name}** is now ${EmoteString.Training} **Training** in the **${path}**. It will end ${showTime(trainTime, true)}.`);

				}
				catch (err) {
					Log.Warning(`Something went wrong at start of training of Rooster ${rooster.Id} (from OwnerID: ${rooster.OwnerId}) `);
				}
			}

			await removeEmbedComponents(interaction, [embed]);
		});

		collector?.on("end", async () => {
			await removeEmbedComponents(interaction);
		});
	},
};