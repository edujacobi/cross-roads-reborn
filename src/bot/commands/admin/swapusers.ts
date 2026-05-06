import { createButtonCollector, disableButtons } from "#bot/utils/collectors";
import { CrColors } from "#bot/utils/colors";
import { deferUpdate, replyUserDontExist, replyWithContainer } from "#bot/utils/discordInteractions";
import { defaultComponent } from "#bot/utils/ui";
import { checkUser } from "#bot/utils/userUtils";
import { sequelize } from "#core/database/Database";
import GangMembers from "#core/database/GangMembers";
import Gangs from "#core/database/Gangs";
import { HorseRaceBets } from "#core/database/HorseRaceBets";
import { LotteryTickets } from "#core/database/LotteryTickets";
import { Notifications } from "#core/database/Notifications";
import { RobHistories } from "#core/database/RobHistories";
import UserAvatarDecorations from "#core/database/UserAvatarDecorations";
import UserBackgroundDecorations from "#core/database/UserBackgroundDecorations";
import UserBadges from "#core/database/UserBadges";
import UserBundles from "#core/database/UserBundles";
import { UserInvestments } from "#core/database/UserInvestments";
import { UserItems } from "#core/database/UserItems";
import { Users } from "#core/database/Users";
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
import { QueryTypes } from "sequelize";

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

			// Proceed with swap
			const transaction = await sequelize.transaction();

			try {
				// Defer foreign keys to allow primary key updates during the transaction
				await sequelize.query("PRAGMA defer_foreign_keys = ON", { transaction });

				// Temporary ID to avoid primary key collisions during swap
				const tempId = `TEMP_${interaction.id.slice(0, 13)}`;

				// List of tables and columns to update based on CR Reborn schema
				const updates = [
					{ table: Users.tableName, column: "id" },
					{ table: Users.tableName, column: "robbingUserId" },
					{ table: Users.tableName, column: "beingRobbedByUserId" },
					{ table: Users.tableName, column: "beatingUserId" },
					{ table: Users.tableName, column: "beingBeatUpByUserId" },
					{ table: UserItems.tableName, column: "userId" },
					{ table: UserBadges.tableName, column: "userId" },
					{ table: UserInvestments.tableName, column: "userId" },
					{ table: UserBundles.tableName, column: "userId" },
					{ table: UserAvatarDecorations.tableName, column: "userId" },
					{ table: UserBackgroundDecorations.tableName, column: "userId" },
					{ table: Notifications.tableName, column: "userId" },
					{ table: GangMembers.tableName, column: "userId" },
					{ table: Gangs.tableName, column: "leaderId" },
					{ table: HorseRaceBets.tableName, column: "userId" },
					{ table: LotteryTickets.tableName, column: "userId" },
					{ table: RobHistories.tableName, column: "attackerId" },
					{ table: RobHistories.tableName, column: "defenderId" }
				];

				const details: string[] = [];

				// 3-step swap process
				for (const { table, column } of updates) {
					// Step 1: oldId -> tempId
					await sequelize.query(
						`UPDATE ${table} SET ${column} = :tempId WHERE ${column} = :oldId`,
						{ replacements: { oldId, tempId }, type: QueryTypes.UPDATE, transaction }
					);

					// Step 2: newId -> oldId
					await sequelize.query(
						`UPDATE ${table} SET ${column} = :oldId WHERE ${column} = :newId`,
						{ replacements: { oldId, newId }, type: QueryTypes.UPDATE, transaction }
					);

					// Step 3: tempId -> newId
					await sequelize.query(
						`UPDATE ${table} SET ${column} = :newId WHERE ${column} = :tempId`,
						{ replacements: { newId, tempId }, type: QueryTypes.UPDATE, transaction }
					);

					details.push(`- **${table}**: Swapped ${column}`);
				}

				await transaction.commit();

				container = defaultComponent({
					user,
					color: CrColors.Admin,
					description: `### User swap successful\nSuccessfully swapped data between **${oldUser.Nickname}** (Id: ${oldId}) and **${newUser.Nickname}** (Id: ${newId}).\n\n**Tables updated:**\n${details.join("\n")}`,
				});

				Log.Success(`Admin ${user.Nickname} (Id: ${user.Id}) swapped Users ${oldUser.Nickname} (Id: ${oldId}) and ${newUser.Nickname} (Id: ${newId}).`);

				await replyWithContainer(interaction, container);

			}
			catch (error) {
				await transaction.rollback();
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
