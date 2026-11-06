"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserItemRepository = void 0;
const UserItems_1 = require("#core/database/UserItems");
const sequelize_1 = require("sequelize");
const TimedActionRepository_1 = require("./TimedActionRepository");
class UserItemRepository {
    /**
     * Finds a user item by its primary key.
     */
    static async FindByPk(id) {
        return await UserItems_1.UserItems.findByPk(id);
    }
    /**
     * Finds a user item by userId and itemId.
     */
    static async FindByUserAndItem(userId, itemId) {
        return await UserItems_1.UserItems.findOne({
            where: { userId, itemId },
            transaction: TimedActionRepository_1.actionTransaction.getStore(),
        });
    }
    /**
     * Finds all items belonging to a user.
     */
    static async FindAllByUser(userId) {
        return await UserItems_1.UserItems.findAll({
            where: { userId },
            transaction: TimedActionRepository_1.actionTransaction.getStore(),
        });
    }
    /**
     * Finds all items belonging to a user matching specific item IDs.
     */
    static async FindAllByUserAndItems(userId, itemIds) {
        return await UserItems_1.UserItems.findAll({
            where: {
                userId,
                itemId: {
                    [sequelize_1.Op.in]: itemIds,
                },
            },
        });
    }
    /**
     * Finds active (unexpired or quantity > 0) items belonging to a user.
     */
    static async FindActiveByUser(userId) {
        return await UserItems_1.UserItems.findAll({
            transaction: TimedActionRepository_1.actionTransaction.getStore(),
            where: {
                userId,
                [sequelize_1.Op.or]: {
                    remainingTime: {
                        [sequelize_1.Op.gt]: new Date(),
                    },
                    quantity: {
                        [sequelize_1.Op.gt]: 0,
                    },
                },
            },
            order: [["remainingTime", "ASC"]],
        });
    }
    /**
     * Counts how many active users possess a specific item.
     */
    static async CountUsersWithItem(itemId) {
        return await UserItems_1.UserItems.count({
            distinct: true,
            col: "userId",
            where: {
                itemId,
                [sequelize_1.Op.or]: {
                    remainingTime: {
                        [sequelize_1.Op.gt]: new Date(),
                    },
                    quantity: {
                        [sequelize_1.Op.gt]: 0,
                    },
                },
            },
        });
    }
    /**
     * Creates a new user item record.
     */
    static async Create(values) {
        return await UserItems_1.UserItems.create(values);
    }
    /**
     * Bulk creates user item records.
     */
    static async BulkCreate(records) {
        return await UserItems_1.UserItems.bulkCreate(records);
    }
    /**
     * Updates the skin of a user item.
     */
    static async UpdateSkin(userId, itemId, skinId) {
        await UserItems_1.UserItems.update({ skin: skinId }, { where: { userId, itemId } });
    }
    /**
     * Updates the skins of a set of user items.
     */
    static async UpdateBundleSkins(userId, itemIds, skinId) {
        await UserItems_1.UserItems.update({ skin: skinId }, { where: { userId, itemId: { [sequelize_1.Op.in]: itemIds } } });
    }
    /**
     * Updates the remaining time and/or quantity of a user item.
     */
    static async UpdateDurationOrQuantity(userId, itemId, values) {
        await UserItems_1.UserItems.update(values, {
            where: { userId, itemId },
        });
    }
    /**
     * Decrements the quantity of a user item.
     */
    static async DecrementQuantity(userId, itemId, amount) {
        await UserItems_1.UserItems.decrement("quantity", {
            by: amount,
            where: { userId, itemId },
        });
    }
    /**
     * Upserts a user item record.
     */
    static async Upsert(values) {
        await UserItems_1.UserItems.upsert(values, { transaction: TimedActionRepository_1.actionTransaction.getStore() });
    }
}
exports.UserItemRepository = UserItemRepository;
//# sourceMappingURL=UserItemRepository.js.map