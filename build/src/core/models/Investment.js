"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Investment = void 0;
const User_1 = require("./User");
const UserInvestmentRepository_1 = require("#core/repositories/UserInvestmentRepository");
const Investments_1 = require("#core/types/Investments");
const UserRepository_1 = require("#core/repositories/UserRepository");
const date_fns_1 = require("date-fns");
const log_1 = require("#shared/log");
const ui_1 = require("#bot/utils/ui");
const Notification_1 = require("./Notification");
const Language_1 = require("./Language");
const Classes_1 = require("#core/types/Classes");
class Investment {
    static DURATION_DAYS = 7;
    static IsProcessing = false;
    static Initialize() {
        // Checks every minute if the hour has turned
        setInterval(Investment.ProcessHourlyYield, 60 * 1_000);
    }
    /**
     * Returns the Date when the next hourly yield will be processed.
     * Based on LastProcessedHour, the next tick fires at (LastProcessedHour + 1):00:00.
     */
    static GetNextPaymentTime() {
        const next = (0, date_fns_1.startOfHour)(new Date());
        next.setHours(next.getHours() + 1);
        return next;
    }
    static async ProcessHourlyYield() {
        if (Investment.IsProcessing)
            return; // Still running from earlier?
        Investment.IsProcessing = true;
        const logs = [];
        try {
            const activeInvestments = await UserInvestmentRepository_1.UserInvestmentRepository.FindAll();
            const nowHour = (0, date_fns_1.startOfHour)(new Date());
            const tasks = activeInvestments.map(async (currentInvestment) => {
                try {
                    const investmentData = Investments_1.InvestmentList[currentInvestment.investmentId];
                    if (!investmentData)
                        return;
                    // Find the anchor for payment calculation
                    const lastBasis = currentInvestment.lastYieldAt || currentInvestment.createdAt;
                    const lastBasisHour = (0, date_fns_1.startOfHour)(lastBasis);
                    // How many full hours passed across the boundary?
                    const hoursToPay = (0, date_fns_1.differenceInHours)(nowHour, lastBasisHour);
                    if (hoursToPay <= 0)
                        return;
                    // Lightweight user loading: only fetch what we need
                    const userRow = await UserRepository_1.UserRepository.FindById(currentInvestment.userId, [
                        "id", "nickname", "money", "language", "class",
                        "prisonTime", "hospitalTime", "jobId",
                        "robbingUserId", "beingRobbedByUserId", "robbingLocationId",
                        "scavengingId", "casinoIsInGame",
                        "beatingUserId", "beingBeatUpByUserId",
                        "robberyInvestmentDefending", "robberyParticipatingInGangAction",
                        "notifyInvestmentYield",
                    ]);
                    if (!userRow)
                        return;
                    const user = new User_1.User(currentInvestment.userId);
                    await user.GetSimpleInfo(userRow, undefined, { skipGangLookup: true });
                    const isIdling = user.IsIdling();
                    // Check 7-day expiration (Process expiration only if the current moment is past expiration)
                    if ((0, date_fns_1.isPast)(currentInvestment.expiresAt)) {
                        if (!isIdling)
                            return; // Wait for idling to end gracefully
                        // Final proportional yield: calculate how many minutes elapsed since last process until expiration
                        const lastYieldPoint = currentInvestment.lastYieldAt || currentInvestment.createdAt;
                        const minutesRemaining = (currentInvestment.expiresAt.getTime() - lastYieldPoint.getTime()) / (1_000 * 60);
                        let expirationYield = 0;
                        let expirationFee = 0;
                        if (minutesRemaining > 0) {
                            expirationYield = Math.round(investmentData.HourlyYield * (minutesRemaining / 60));
                            // Apply class modifier
                            const classModifier = (0, Classes_1.getInvestmentYieldClassModifier)(userRow.class);
                            expirationYield = Math.round(expirationYield * classModifier);
                            // Henchman fee logic (Calculate final fee if active during the partial hour)
                            if (currentInvestment.henchmanEndsAt && !currentInvestment.henchmanHospitalized) {
                                const henchmanExpiration = new Date(currentInvestment.henchmanEndsAt);
                                if (currentInvestment.expiresAt <= henchmanExpiration) {
                                    expirationFee = Math.round(expirationYield * (investmentData.HenchmanFee / 100));
                                    expirationYield -= expirationFee;
                                }
                            }
                        }
                        // Calculate total payout and fee to notify
                        const totalAccumulatedFee = currentInvestment.accumulatedFee;
                        const payout = Math.round(currentInvestment.accumulatedYield + expirationYield);
                        const totalFee = Math.round(totalAccumulatedFee + expirationFee);
                        if (payout > 0) {
                            await UserRepository_1.UserRepository.IncrementMoneyAndProfit(currentInvestment.userId, payout);
                        }
                        await UserInvestmentRepository_1.UserInvestmentRepository.DestroyByUserId(currentInvestment.userId);
                        const user = await new User_1.User(currentInvestment.userId).GetInfo();
                        if (user) {
                            await Notification_1.Notification.InvestmentExpired(user, investmentData.Name[user.Language], payout, totalFee > 0 ? totalFee : undefined, investmentData.HenchmanFee);
                        }
                        logs.push(`- Investment of user ${userRow.nickname} (Id: ${currentInvestment.userId}) (${investmentData.Name[0]}) expired. Payout: ${(0, ui_1.formatMoney)(payout, Language_1.Language.English)}.`);
                        return;
                    }
                    let totalPayout = 0;
                    let totalPayoutFee = 0;
                    // Process all retroactive hours
                    for (let i = 0; i < hoursToPay; i++) {
                        let hourlyYield = Math.round(investmentData.HourlyYield);
                        // Apply class modifier
                        const classModifier = (0, Classes_1.getInvestmentYieldClassModifier)(userRow.class);
                        hourlyYield = Math.round(hourlyYield * classModifier);
                        // Apply first-hour proportional logic if i == 0 and lastYieldAt is null
                        if (i === 0 && currentInvestment.lastYieldAt === null) {
                            const minutesOfFirstHour = (60 - currentInvestment.createdAt.getMinutes());
                            const fraction = Math.max(0, Math.min(60, minutesOfFirstHour)) / 60;
                            hourlyYield = Math.round(hourlyYield * fraction);
                        }
                        // Calculate the timestamp for this specific hourly tick
                        const currentTick = (0, date_fns_1.addHours)(lastBasisHour, i + 1);
                        // Henchman fee logic (Check if henchman was active at THIS specific hour)
                        if (currentInvestment.henchmanEndsAt && !currentInvestment.henchmanHospitalized) {
                            const henchmanExpiration = new Date(currentInvestment.henchmanEndsAt);
                            if (currentTick <= henchmanExpiration) {
                                const fee = Math.round(hourlyYield * (investmentData.HenchmanFee / 100));
                                totalPayoutFee += fee;
                                hourlyYield -= fee;
                            }
                        }
                        totalPayout += hourlyYield;
                    }
                    if (isIdling) {
                        const finalPayout = Math.round(totalPayout + currentInvestment.accumulatedYield);
                        const finalFee = Math.round(totalPayoutFee + currentInvestment.accumulatedFee);
                        await UserRepository_1.UserRepository.IncrementMoneyAndProfit(currentInvestment.userId, finalPayout);
                        await UserInvestmentRepository_1.UserInvestmentRepository.UpdateByUserId(currentInvestment.userId, {
                            accumulatedYield: 0,
                            accumulatedFee: 0,
                            lastYieldAt: nowHour,
                        });
                        logs.push(`- Payed ${hoursToPay}h to ${userRow.nickname} (Id: ${currentInvestment.userId}). Total: ${(0, ui_1.formatMoney)(finalPayout, Language_1.Language.English)}.`);
                        if (userRow.notifyInvestmentYield) {
                            const user = await new User_1.User(currentInvestment.userId).GetInfo();
                            if (user) {
                                await Notification_1.Notification.InvestmentYield(user, investmentData.Name[user.Language], finalPayout, finalFee, investmentData.HenchmanFee);
                            }
                        }
                    }
                    else {
                        await UserInvestmentRepository_1.UserInvestmentRepository.IncrementYieldAndFee(currentInvestment.userId, Math.round(totalPayout), Math.round(totalPayoutFee));
                        await UserInvestmentRepository_1.UserInvestmentRepository.UpdateByUserId(currentInvestment.userId, { lastYieldAt: nowHour });
                    }
                }
                catch (e) {
                    logs.push(`Failed to process investment yield for userId: ${currentInvestment.userId}: ${e}`);
                }
            });
            await Promise.allSettled(tasks);
        }
        finally {
            Investment.IsProcessing = false;
            if (logs.length > 0) {
                log_1.Log.Info(`Investment yield (${logs.length} investments):\n${logs.join("\n")}`);
            }
        }
    }
    /**
     * Allows a user to purchase a new investment.
     * They can only have one active investment at a time.
     */
    static async Buy(user, investmentId) {
        const investmentData = Investments_1.InvestmentList[investmentId];
        if (user.Money < investmentData.Price) {
            return { success: false, reason: "insufficient_funds" };
        }
        // Check if user already has an investment
        const existing = await UserInvestmentRepository_1.UserInvestmentRepository.FindByUserId(user.Id);
        if (existing) {
            return { success: false, reason: "already_has_investment" };
        }
        // ponytail: SQLite's UNIQUE(userId) is our native mutex. Insert first; if duplicate, catch it before touching money.
        const expiresAt = (0, date_fns_1.addDays)(new Date(), Investment.DURATION_DAYS);
        try {
            await UserInvestmentRepository_1.UserInvestmentRepository.Create({
                userId: user.Id,
                investmentId,
                accumulatedYield: 0,
                accumulatedFee: 0,
                henchmanEndsAt: null,
                henchmanHospitalized: false,
                expiresAt,
                lastYieldAt: null,
            });
        }
        catch {
            return { success: false, reason: "already_has_investment" };
        }
        user.Money -= investmentData.Price;
        await user.Update({ money: user.Money });
        // Refresh user cache
        user.Investment.Id = investmentId;
        user.Investment.AccumulatedYield = 0;
        user.Investment.HenchmanEndsAt = null;
        user.Investment.HenchmanHospitalized = false;
        user.Investment.ExpiresAt = expiresAt;
        user.Investment.PurchasedAt = new Date();
        log_1.Log.Success(`User ${user.Nickname} (Id: ${user.Id}) bought investment ${investmentData.Name[Language_1.Language.English]} (Id: ${user.Investment.Id}) for ${(0, ui_1.formatMoney)(investmentData.Price, Language_1.Language.English)}. Expires at ${expiresAt}.`);
        return { success: true };
    }
    /**
     * Abandons the current investment, losing all accumulated yield and the property.
     */
    static async Abandon(user) {
        if (user.Investment.Id == null) {
            return { success: false, reason: "no_investment" };
        }
        const investmentData = Investments_1.InvestmentList[user.Investment.Id];
        await UserInvestmentRepository_1.UserInvestmentRepository.DestroyByUserId(user.Id);
        log_1.Log.Info(`User ${user.Nickname} (Id: ${user.Id}) abandoned investment ${investmentData.Name[Language_1.Language.English]} (Id: ${user.Investment.Id}).`);
        user.Investment.Id = null;
        user.Investment.AccumulatedYield = 0;
        user.Investment.HenchmanEndsAt = null;
        user.Investment.HenchmanHospitalized = false;
        user.Investment.ExpiresAt = null;
        user.Investment.PurchasedAt = null;
        return { success: true };
    }
    /**
     * Hires a henchman for the current investment for 12 hours.
     */
    static async HireHenchman(user) {
        if (user.Investment.Id == null) {
            return { success: false, reason: "no_investment" };
        }
        if (this.HasContractHenchman(user)) {
            return { success: false, reason: "already_has_henchman" };
        }
        const endsAt = (0, date_fns_1.addHours)(new Date(), 12); // 12 hours
        await UserInvestmentRepository_1.UserInvestmentRepository.UpdateByUserId(user.Id, {
            henchmanEndsAt: endsAt,
            henchmanHospitalized: false,
        });
        user.Investment.HenchmanEndsAt = endsAt;
        user.Investment.HenchmanHospitalized = false;
        log_1.Log.Info(`User ${user.Nickname} (Id: ${user.Id}) hired a henchman for investment ${Investments_1.InvestmentList[user.Investment.Id].Name[Language_1.Language.English]} (Id: ${user.Investment.Id}). Ends at ${endsAt}.`);
        return { success: true };
    }
    static HasContractHenchman(user) {
        if (!user.Investment.HenchmanEndsAt)
            return false;
        return (0, date_fns_1.isFuture)(new Date(user.Investment.HenchmanEndsAt));
    }
    /**
     * Checks if the user currently has an active henchman defending the property.
     */
    static HasActiveHenchman(user) {
        if (!user.Investment.HenchmanEndsAt || user.Investment.HenchmanHospitalized)
            return false;
        return (0, date_fns_1.isFuture)(new Date(user.Investment.HenchmanEndsAt));
    }
    /**
     * Toggles the investment yield notification preference.
     */
    static async ToggleNotifyYield(user) {
        const newValue = !user.Investment.NotifyYield;
        user.Investment.NotifyYield = newValue;
        await user.Update({ notifyInvestmentYield: newValue });
        log_1.Log.Info(`User ${user.Nickname} (Id: ${user.Id}) ${newValue ? "activated" : "deactivated"} investment yield notifications.`);
        return newValue;
    }
}
exports.Investment = Investment;
//# sourceMappingURL=Investment.js.map