import { DashboardCanvasBuilder } from "#bot/ui/builders/DashboardCanvasBuilder";
import { deferReply, replyInteraction } from "#bot/utils/discordInteractions";
import { Dashboard } from "#core/models/Dashboard";
import { AttachmentBuilder, type ChatInputCommandInteraction, Locale, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("dashboard")
		.setDescription("See the game dashboard and statistics")
		.setDescriptionLocalization(Locale.PortugueseBR, "Veja o painel do jogo e estatísticas")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction: ChatInputCommandInteraction) {
		await deferReply(interaction);

		const [stats, history] = await Promise.all([
			Dashboard.GetCurrentStats(),
			Dashboard.GetLast30Days(),
		]);

		const builder = new DashboardCanvasBuilder();
		const buffer = await builder.Draw(stats, history);
		const attachment = new AttachmentBuilder(buffer, { name: "dashboard.webp" });

		return replyInteraction(interaction, {
			files: [attachment],
		});
	},
};