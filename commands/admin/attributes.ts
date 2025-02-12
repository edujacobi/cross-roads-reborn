import { ChatInputCommandInteraction, Colors, SlashCommandBuilder } from "discord.js";
import { Roosters } from "../../database/Roosters";
import { Op } from "sequelize";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { EmoteString } from "../../utils/ui";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("attributes")
		.setDescription("Shows the most trained attributes of roosters"),

	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();

		const sumAttack = await sumAttribute("statAttack");
		const sumDefense = await sumAttribute("statDefense");
		const sumSpeed = await sumAttribute("statSpeed");
		const sumCritical = await sumAttribute("statCritical");

		const count = await countRoosters();

		const embed = new CustomEmbedBuilder()
			.setColor(Colors.Red)
			.setDescription(`### Total
${EmoteString.Attack}${sumAttack} ${EmoteString.Defense}${sumDefense} ${EmoteString.Speed}${sumSpeed} ${EmoteString.CritChange}${sumCritical}
### Mean
${EmoteString.Attack}${(sumAttack / count).toFixed(2)} ${EmoteString.Defense}${(sumDefense / count).toFixed(2)} ${EmoteString.Speed}${(sumSpeed / count).toFixed(2)} ${EmoteString.CritChange}${(sumCritical / count).toFixed(2)}`)
			.setFooter({
				text: `Total roosters: ${count}`,
			});

		await interaction.editReply({ embeds: [embed] });
	},
};

const where = {
	name: {
		[Op.not]: "Rooster without name",
	},
	level: {
		[Op.gt]: 0,
	},
	isDeleted: false,
};

async function sumAttribute(attribute: "statAttack" | "statDefense" | "statSpeed" | "statCritical") {
	return await Roosters.sum(attribute, { where });
}

async function countRoosters() {
	return await Roosters.count({ where });
}