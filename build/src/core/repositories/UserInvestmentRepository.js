"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserInvestmentRepository = void 0;
const UserInvestments_1 = require("#core/database/UserInvestments");
class UserInvestmentRepository {
    /**
     * Finds a user investment by their userId.
     */
    static async FindByUserId(userId) {
        return await UserInvestments_1.UserInvestments.findOne({
            where: { userId },
        });
    }
    /**
     * Finds all active user investments.
     */
    static async FindAll() {
        return await UserInvestments_1.UserInvestments.findAll();
    }
    /**
     * Creates a new user investment record.
     */
    static async Create(values) {
        return await UserInvestments_1.UserInvestments.create(values);
    }
    /**
     * Updates user investments matching the userId.
     */
    static async UpdateByUserId(userId, values) {
        await UserInvestments_1.UserInvestments.update(values, {
            where: { userId },
        });
    }
    /**
     * Destroys user investments matching the userId.
     */
    static async DestroyByUserId(userId) {
        return await UserInvestments_1.UserInvestments.destroy({
            where: { userId },
        });
    }
    /**
     * Count of all user investments.
     */
    static async Count() {
        return await UserInvestments_1.UserInvestments.count();
    }
    /**
     * Decrements accumulated yield for a user investment.
     */
    static async DecrementYield(userId, amount) {
        await UserInvestments_1.UserInvestments.decrement("accumulatedYield", {
            by: amount,
            where: { userId },
        });
    }
    /**
     * Increments yield and fee for a user investment.
     */
    static async IncrementYieldAndFee(userId, yieldAmount, feeAmount) {
        await UserInvestments_1.UserInvestments.increment({ accumulatedYield: yieldAmount, accumulatedFee: feeAmount }, { where: { userId } });
    }
}
exports.UserInvestmentRepository = UserInvestmentRepository;
//# sourceMappingURL=UserInvestmentRepository.js.map