import { createButtonCollector, disableButtons } from "#bot/utils/collectors";
import { CrColors } from "#bot/utils/colors";
import { deferUpdate, replyUserDontExist, replyWithContainer } from "#bot/utils/discordInteractions";
import { defaultComponent } from "#bot/utils/ui";
import { checkUser } from "#bot/utils/userUtils";
import { UserRepository } from "#core/repositories/UserRepository";
import type { User } from "#core/models/User";
import { Log } from "#shared/log";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	Colors,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("swapusers")
		.setDescription("Swaps two users across all database tables")
		.setDescriptionLocalization(Locale.PortugueseBR, "Troca dois usuários em todas as tabelas do banco de dados")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option => option
			.setName("oldid")
			.setDescription("The old user Id")
			.setDescriptionLocalization(Locale.PortugueseBR, "O Id antigo do usuário")
			.setRequired(true),
		)
		.addStringOption(option => option
			.setName("newid")
			.setDescription("The new user Id")
			.setDescriptionLocalization(Locale.PortugueseBR, "O novo Id do usuário")
			.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const oldId = interaction.options.getString("oldid", true);
		const newId = interaction.options.getString("newid", true);

		const oldUser = await checkUser(oldId, interaction);
		const newUser = await checkUser(newId, interaction);

		// Old Id must be a user in the database
		if (!oldUser || !newUser) {
			return replyUserDontExist(interaction, user.Language);
		}

		const confirmButton = new ButtonBuilder()
			.setCustomId("confirm")
			.setLabel("Confirm")
			.setStyle(ButtonStyle.Danger);

		const cancelButton = new ButtonBuilder()
			.setCustomId("cancel")
			.setLabel("Cancel")
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(confirmButton, cancelButton);

		let container = defaultComponent({
			user,
			color: CrColors.Admin,
			description: `### Confirmation required\nDo you really want to swap **${oldUser.Nickname}** for **${newUser.Nickname}**?\n\nThis will exchange ALL progress, items, and history between both accounts.`,
			buttons: row,
		});

		const response = await replyWithContainer(interaction, container);
		const collector = createButtonCollector(interaction, response);

		collector?.on("collect", async btn => {
			await deferUpdate(btn);

			if (btn.customId === "cancel") {
				container = defaultComponent({
					user,
					color: Colors.Grey,
					description: "### Swap cancelled\nNo changes were made to the database.",
				});
				await replyWithContainer(interaction, container);
				return collector.stop();
			}

			try {
				// Temporary ID to avoid primary key collisions during swap
				const tempId = `TEMP_${interaction.id.slice(0, 13)}`;

				const details = await UserRepository.SwapUsers(oldId, newId, tempId);

				container = defaultComponent({
					user,
					color: CrColors.Admin,
					description: `### User swap successful\nSuccessfully swapped data between **${oldUser.Nickname}** (Id: ${oldId}) and **${newUser.Nickname}** (Id: ${newId}).\n\n**Tables updated:**\n${details.join("\n")}`,
				});

				Log.Success(`Admin ${user.Nickname} (Id: ${user.Id}) swapped Users ${oldUser.Nickname} (Id: ${oldId}) and ${newUser.Nickname} (Id: ${newId}).`);

				await replyWithContainer(interaction, container);

			}
			catch (error) {
				Log.Error(`Failed to swap Users ${oldUser.Nickname} (Id: ${oldId}) and ${newUser.Nickname} (Id: ${newId}): ${error}`);

				container = defaultComponent({
					user,
					color: Colors.Red,
					description: `### Swap failed\nChanges have been rolled back.\n\nError: \`${error instanceof Error ? error.message : "Unknown error"}\``,
				});

				await replyWithContainer(interaction, container);
			}

			collector.stop();
		});

		collector?.on("end", async () => {
			await disableButtons(interaction, container);
		});
	},
};
