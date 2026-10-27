"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const User_1 = require("#core/models/User");
const Language_1 = require("#core/models/Language");
const date_fns_1 = require("date-fns");
const UserItemRepository_1 = require("#core/repositories/UserItemRepository");
const Items_1 = require("#core/types/Items");
const log_1 = require("#shared/log");
const emotes_1 = require("#bot/utils/emotes");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const colors_1 = require("#bot/utils/colors");
const Ids_1 = require("#core/types/Ids");
var Mode;
(function (Mode) {
    Mode[Mode["Set"] = 0] = "Set";
    Mode[Mode["Add"] = 1] = "Add";
})(Mode || (Mode = {}));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("setitem")
        .setDescription("[Admin] Adds or modifies an item for a specific user.")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption(userId => userId
        .setName("user_id")
        .setDescription("The Discord Id of the user to modify.")
        .setRequired(true))
        .addIntegerOption(item => item
        .setName("item")
        .setDescription("Which item")
        .setRequired(true)
        .addChoices(Object.values(Items_1.ItemList).map(item => ({
        name: item.Description[Language_1.Language.English],
        value: item.Id,
    }))))
        .addIntegerOption(setOrAdd => setOrAdd
        .setName("set_or_add")
        .setDescription("Set a new value/duration or add to the existing one.")
        .setRequired(true)
        .addChoices({ name: "Set (overwrite existing)", value: Mode.Set }, { name: "Add (extend/increase existing)", value: Mode.Add }))
        .addNumberOption(hoursOrQuantity => hoursOrQuantity
        .setName("hours_or_quantity")
        .setDescription("For TIMED items: The duration in hours. For CONSUMABLE items: The quantity to set or add.")
        .setRequired(true)),
    async execute(interaction, user) {
        await (0, discordInteractions_1.deferReply)(interaction);
        const targetUserId = interaction.options.getString("user_id", true);
        const itemId = interaction.options.getInteger("item", true);
        const hoursOrQuantity = interaction.options.getNumber("hours_or_quantity", true);
        const mode = interaction.options.getInteger("set_or_add", true);
        // 1. Validate Inputs
        const itemData = Items_1.ItemList[itemId];
        if (!itemData) {
            return (0, discordInteractions_1.replyInteraction)(interaction, `${emotes_1.EmoteString.LessThan12Hours} Item with Id \`${itemId}\` was not found.`);
        }
        // 2. Fetch the target user from the database
        const targetUser = new User_1.User(targetUserId);
        const userExists = await targetUser.GetInfo();
        if (!userExists) {
            return (0, discordInteractions_1.replyInteraction)(interaction, `${emotes_1.EmoteString.LessThan12Hours} User with Id \`${targetUserId}\` was not found in the database.`);
        }
        // 3. Find the existing item directly in the database
        const existingItem = await UserItemRepository_1.UserItemRepository.FindByUserAndItem(targetUserId, itemId);
        const now = new Date();
        let replyMessage = "";
        // 4. Apply logic based on item type
        if (itemData.Type !== Items_1.ItemType.Consumable) {
            const newExpiryDate = (0, date_fns_1.addHours)(now, hoursOrQuantity);
            if (mode === Mode.Set) {
                if (existingItem) {
                    await UserItemRepository_1.UserItemRepository.UpdateDurationOrQuantity(targetUserId, itemId, { remainingTime: newExpiryDate });
                }
                else {
                    await UserItemRepository_1.UserItemRepository.Create({
                        userId: targetUserId,
                        itemId,
                        remainingTime: newExpiryDate,
                        skin: Ids_1.BundleId.Default,
                    });
                }
                replyMessage = `✅ Successfully **set** item ${itemData.Skin[Ids_1.BundleId.Default].String} ${itemData.Description[Language_1.Language.English]} for **${targetUser.GetNameWithImage()}**. It is now valid for ${hoursOrQuantity} hour(s)`;
            }
            else {
                if (existingItem) {
                    const baseDate = existingItem.remainingTime > now ? existingItem.remainingTime : now;
                    const extendedExpiryDate = (0, date_fns_1.addHours)(baseDate, hoursOrQuantity);
                    await UserItemRepository_1.UserItemRepository.UpdateDurationOrQuantity(targetUserId, itemId, { remainingTime: extendedExpiryDate });
                }
                else {
                    await UserItemRepository_1.UserItemRepository.Create({
                        userId: targetUserId,
                        itemId,
                        remainingTime: newExpiryDate,
                        skin: Ids_1.BundleId.Default,
                    });
                }
                replyMessage = `✅ Successfully **added** ${hoursOrQuantity} hours to item ${itemData.Skin[Ids_1.BundleId.Default].String} ${itemData.Description[Language_1.Language.English]} for **${targetUser.GetNameWithImage()}**.`;
            }
        }
        else if (mode === Mode.Set) {
            if (existingItem) {
                await UserItemRepository_1.UserItemRepository.UpdateDurationOrQuantity(targetUserId, itemId, { quantity: hoursOrQuantity });
            }
            else {
                await UserItemRepository_1.UserItemRepository.Create({
                    userId: targetUserId,
                    itemId,
                    quantity: hoursOrQuantity,
                    skin: Ids_1.BundleId.Default,
                });
            }
            replyMessage = `✅ Successfully **set** item ${itemData.Skin[Ids_1.BundleId.Default].String} ${itemData.Description[Language_1.Language.English]} for **${targetUser.GetNameWithImage()}**. They now have a quantity of **${hoursOrQuantity}**.`;
        }
        else {
            const newQuantity = (existingItem?.quantity || 0) + hoursOrQuantity;
            if (existingItem) {
                await UserItemRepository_1.UserItemRepository.UpdateDurationOrQuantity(targetUserId, itemId, { quantity: newQuantity });
            }
            else {
                await UserItemRepository_1.UserItemRepository.Create({
                    userId: targetUserId,
                    itemId,
                    quantity: newQuantity,
                    skin: Ids_1.BundleId.Default,
                });
            }
            replyMessage = `✅ Successfully **added** ${hoursOrQuantity} quantity to item ${itemData.Skin[Ids_1.BundleId.Default].String} ${itemData.Description[Language_1.Language.English]} for **${targetUser.GetNameWithImage()}**.`;
        }
        log_1.Log.Success(`Admin ${user.Nickname} (${user.Id}) used setitem on ${targetUser.Nickname} (Id: ${targetUser.Id}) for item ${itemData.Description[Language_1.Language.English]} (Id: ${itemData.Id}). Mode: ${mode === Mode.Set ? "set" : "add"}, ${itemData.Type == Items_1.ItemType.Consumable ? "Quantity" : "Hours"}: ${hoursOrQuantity}`);
        await (0, discordInteractions_1.sendPrivateMessage)(targetUserId, `You ${mode === Mode.Set ? "now have" : "received"} ${hoursOrQuantity} ${itemData.Type == Items_1.ItemType.Consumable ? "" : "hours"} of ${itemData.Skin[Ids_1.BundleId.Default].String} ${itemData.Description[Language_1.Language.English]}!`, colors_1.CrColors.Admin);
        await (0, discordInteractions_1.replyInteraction)(interaction, replyMessage);
    },
};
//# sourceMappingURL=setitem.js.map