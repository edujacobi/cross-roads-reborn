import { ChatInputCommandInteraction, Locale, SlashCommandBuilder, SlashCommandUserOption } from "discord.js";
import { checkRooster, replyInteraction } from "../../utils/logic";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { EmoteString, getPathText, getRarityColor, showTime } from "../../utils/ui";
import { Nationalities } from "../../models/Rooster";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("roosterinfo")
		.setDescription("Shows the database info of a Rooster")
		.setNameLocalization(Locale.PortugueseBR, "galoinfo")
		.setDescriptionLocalization(Locale.PortugueseBR, "Mostra os dados do banco de dados de um galo")
		.addUserOption((option: SlashCommandUserOption) =>
			option
				.setName("target")
				.setDescription("The user's rooster to show")
				.setNameLocalization(Locale.PortugueseBR, "alvo")
				.setDescriptionLocalization(Locale.PortugueseBR, "O dono do galo para mostrar"),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser("target") ?? interaction.user;

		const rooster = await checkRooster(user.id, interaction);

		if (!rooster) {
			return;
		}

		const embed = new CustomEmbedBuilder()
			.setColor(getRarityColor(rooster.Rarity))
			.setThumbnail(rooster.GetImage())
			.setDescription(`# ${rooster.Name}
### ID
${rooster.Id}
### Owner
<@${rooster.OwnerId}> (ID: \`${rooster.OwnerId}\`)
### BirthDate
${rooster.BirthDate}
### Rarity
${rooster.RarityText} (ID: \`${rooster.Rarity}\`)
### Title
${rooster.Title.length > 0 ? rooster.Title : "-"}
### Nationality
${Nationalities[rooster.Nationality].flag} ${Nationalities[rooster.Nationality].description} (ID: \`${rooster.Nationality}\`)
### Attributes
${EmoteString.Attack}Attack \`${rooster.Stats.Attack}\`, ${EmoteString.Defense}Defense \`${rooster.Stats.Defense}\`, ${EmoteString.Speed}Speed  \`${rooster.Stats.Speed}\`, ${EmoteString.CritChange}Critical \`${rooster.Stats.Critical}\`
### Victories / Defeats
${EmoteString.Victory}Victories: \`${rooster.Wins}\`, ${EmoteString.Defeat}Defeats: \`${rooster.Losses}\`, ${EmoteString.Winrate}Win rate: \`${rooster.GetWinrate()}\`
### Level / Exp
Level ${rooster.Level} (${rooster.Exp}/${rooster.GetExpNeededToLevelUp()} Exp)
### Training
${rooster.IsTraining ? `Training: ${getPathText(rooster.IsTraining)}` : "Is not training"} (${rooster.AvailableTrainings} remaining in this level)
### Battle
${rooster.BattlingWith ? `Battling with: ${rooster.BattlingWith}` : "Is not in battle"}
### Timers
Train: ${showTime(rooster.Timers.Train)}
Rest: ${showTime(rooster.Timers.Rest)}`)
			.addFields([
				// {name: "ColorId", value: rooster.ColorId.toString(), inline: true},
				// {name: "BossWins", value: rooster.BossWins.toString(), inline: true},

				{ name: "Current Daily streak", value: rooster.Daily.CurrentStreak.toString(), inline: true },
				{ name: "Max Daily streak", value: rooster.Daily.MaxStreak.toString(), inline: true },
				{
					name: "Daily - Last Received",
					value: rooster.Daily.LastReceived == null ? "never" : showTime(rooster.Daily.LastReceived.getTime()),
					inline: true,
				},
			])
			.setDefaultFooter(interaction);

		await replyInteraction(interaction, { embeds: [embed] });
	},
};