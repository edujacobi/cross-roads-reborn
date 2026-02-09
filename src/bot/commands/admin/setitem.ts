import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { User } from "@core/models/User";
import { Language } from "@core/models/Language";
import { addHours } from "date-fns";
import { UserItems } from "@core/database/UserItems";
import { ItemList, ItemType, UserItem } from "@core/types/Items";
import { Log } from "@shared/log";
import { EmoteString } from "@bot/utils/emotes";
import { deferReply, replyInteraction, sendPrivateMessage } from "@bot/utils/discordInteractions";
import { CrColors } from "@bot/utils/colors";
import { BundleId } from "@core/types/Ids";

enum Mode {
	Set,
	Add
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("setitem")
		.setDescription("[Admin] Adds or modifies an item for a specific user.")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(userId => userId
			.setName("user_id")
			.setDescription("The Discord ID of the user to modify.")
			.setRequired(true),
		)
		.addIntegerOption(item => item
			.setName("item")
			.setDescription("Which item")
			.setRequired(true)
			.addChoices(Object.values(ItemList).map(item => ({
				name: item.Description[Language.English],
				value: item.Id,
			} as {
				name: string; value: number;
			}))),
		)
		.addIntegerOption(setOrAdd => setOrAdd
			.setName("set_or_add")
			.setDescription("Set a new value/duration or add to the existing one.")
			.setRequired(true)
			.addChoices(
				{ name: "Set (overwrite existing)", value: Mode.Set },
				{ name: "Add (extend/increase existing)", value: Mode.Add },
			),
		)
		.addNumberOption(hoursOrQuantity => hoursOrQuantity
			.setName("hours_or_quantity")
			.setDescription("For TIMED items: The duration in hours. For CONSUMABLE items: The quantity to set or add.")
			.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		await deferReply(interaction);

		const targetUserId = interaction.options.getString("user_id", true);
		const itemId = interaction.options.getInteger("item", true);
		const hoursOrQuantity = interaction.options.getNumber("hours_or_quantity", true);
		const mode = interaction.options.getInteger("set_or_add", true) as Mode;

		// 1. Validate Inputs
		const itemData = ItemList[itemId] as UserItem;
		if (!itemData) {
			return replyInteraction(interaction, `${EmoteString.LessThan12Hours} Item with ID \`${itemId}\` was not found.`);
		}

		// 2. Fetch the target user from the database
		const targetUser = new User(targetUserId);
		const userExists = await targetUser.GetInfo();
		if (!userExists) {
			return replyInteraction(interaction, `${EmoteString.LessThan12Hours} User with ID \`${targetUserId}\` was not found in the database.`);
		}

		// 3. Find the existing item directly in the database
		const existingItem = await UserItems.findOne({
			where: { userId: targetUserId, itemId: itemId },
		});

		const now = new Date();
		let replyMessage = "";

		// 4. Apply logic based on item type
		if (itemData.Type !== ItemType.Consumable) {

			const newExpiryDate = addHours(now, hoursOrQuantity);

			if (mode === Mode.Set) {
				if (existingItem) {
					await existingItem.update({ remainingTime: newExpiryDate });
				}
				else {
					await UserItems.create({
						userId: targetUserId,
						itemId,
						remainingTime: newExpiryDate,
						skin: BundleId.Default,
					});
				}

				replyMessage = `✅ Successfully **set** item ${itemData.Skin[BundleId.Default].String} ${itemData.Description[Language.English]} for **${targetUser.GetNameWithImage()}**. It is now valid for ${hoursOrQuantity} hour(s)`;

			}
			else {
				if (existingItem) {
					const baseDate = existingItem.remainingTime > now ? existingItem.remainingTime : now;
					const extendedExpiryDate = addHours(baseDate, hoursOrQuantity);
					await existingItem.update({ remainingTime: extendedExpiryDate });
				}
				else {
					await UserItems.create({
						userId: targetUserId,
						itemId,
						remainingTime: newExpiryDate,
						skin: BundleId.Default,
					});
				}

				replyMessage = `✅ Successfully **added** ${hoursOrQuantity} hours to item ${itemData.Skin[BundleId.Default].String} ${itemData.Description[Language.English]} for **${targetUser.GetNameWithImage()}**.`;
			}
		}
		else if (mode === Mode.Set) {
			if (existingItem) {
				await existingItem.update({ quantity: hoursOrQuantity });
			}
			else {
				await UserItems.create({
					userId: targetUserId,
					itemId,
					quantity: hoursOrQuantity,
					skin: BundleId.Default,
				});
			}

			replyMessage = `✅ Successfully **set** item ${itemData.Skin[BundleId.Default].String} ${itemData.Description[Language.English]} for **${targetUser.GetNameWithImage()}**. They now have a quantity of **${hoursOrQuantity}**.`;

		}
		else {
			const newQuantity = (existingItem?.quantity || 0) + hoursOrQuantity;

			if (existingItem) {
				await existingItem.update({ quantity: newQuantity });
			}
			else {
				await UserItems.create({
					userId: targetUserId,
					itemId,
					quantity: newQuantity,
					skin: BundleId.Default,
				});
			}

			replyMessage = `✅ Successfully **added** ${hoursOrQuantity} quantity to item ${itemData.Skin[BundleId.Default].String} ${itemData.Description[Language.English]} for **${targetUser.GetNameWithImage()}**.`;
		}

		Log.Success(`Admin ${user.Nickname} (${user.Id}) used setitem on ${targetUser.Nickname} (Id: ${targetUser.Id}) for item ${itemData.Description[Language.English]} (Id: ${itemData.Id}). Mode: ${mode === Mode.Set ? "set" : "add"}, ${itemData.Type == ItemType.Consumable ? "Quantity" : "Hours"}: ${hoursOrQuantity}`);

		await sendPrivateMessage({
			userId: targetUserId,
			message: `You ${mode === Mode.Set ? "now have" : "received"} ${hoursOrQuantity} ${itemData.Type == ItemType.Consumable ? "" : "hours"} of ${itemData.Skin[BundleId.Default].String} ${itemData.Description[Language.English]}!`,
			color: CrColors.Admin,
		});

		await replyInteraction(interaction, replyMessage);
	},
};