import { User } from "./User";
import { UserInvestments } from "#core/database/UserInvestments";
import {
	type InvestmentId,
	InvestmentList,
	type InvestmentActionResult,
} from "#core/types/Investments";
import { Users } from "#core/database/Users";
import { addDays, addHours, differenceInHours, isFuture, isPast, startOfHour } from "date-fns";
import { Log } from "#shared/log";
import { formatMoney } from "#bot/utils/ui";
import { Notification } from "./Notification";
import { Language } from "./Language";
import { type ClassId, getInvestmentYieldClassModifier } from "#core/types/Classes";

export class Investment {
	static readonly DURATION_DAYS = 7;
	private static IsProcessing = false;

	static Initialize() {
		// Checks every minute if the hour has turned
		setInterval(Investment.ProcessHourlyYield, 60 * 1_000);
	}

	/**
	 * Returns the Date when the next hourly yield will be processed.
	 * Based on LastProcessedHour, the next tick fires at (LastProcessedHour + 1):00:00.
	 */
	static GetNextPaymentTime(): Date {
		const next = startOfHour(new Date());
		next.setHours(next.getHours() + 1);
		return next;
	}

	static async ProcessHourlyYield() {
		if (Investment.IsProcessing) return; // Still running from earlier?
		Investment.IsProcessing = true;
		const logs: string[] = [];

		try {
			const activeInvestments = await UserInvestments.findAll();
			const nowHour = startOfHour(new Date());

			const tasks = activeInvestments.map(async (currentInvestment) => {
				try {
					const investmentData = InvestmentList[currentInvestment.investmentId as InvestmentId];
					if (!investmentData) return;

					// Find the anchor for payment calculation
					const lastBasis = currentInvestment.lastYieldAt || currentInvestment.createdAt;
					const lastBasisHour = startOfHour(lastBasis);

					// How many full hours passed across the boundary?
					const hoursToPay = differenceInHours(nowHour, lastBasisHour);
					if (hoursToPay <= 0) return;

					// Lightweight user loading: only fetch what we need
					const userRow = await Users.findOne({
						where: { id: currentInvestment.userId },
						attributes: [
							"id", "nickname", "money", "language", "class",
							"prisonTime", "hospitalTime", "jobId",
							"robbingUserId", "beingRobbedByUserId", "robbingLocationId",
							"scavengingId", "casinoIsInGame",
							"beatingUserId", "beingBeatUpByUserId",
							"robberyInvestmentDefending", "robberyParticipatingInGangAction",
							"notifyInvestmentYield",
						],
					});

					if (!userRow) return;

					const isIdling = Investment.IsUserIdling(userRow);

					// Check 7-day expiration (Process expiration only if the current moment is past expiration)
					if (isPast(currentInvestment.expiresAt)) {
						if (!isIdling) return; // Wait for idling to end gracefully

						// Final proportional yield: calculate how many minutes elapsed since last process until expiration
						const lastYieldPoint = currentInvestment.lastYieldAt || currentInvestment.createdAt;
						const minutesRemaining = (currentInvestment.expiresAt.getTime() - lastYieldPoint.getTime()) / (1_000 * 60);

						let expirationYield = 0;
						let expirationFee = 0;

						if (minutesRemaining > 0) {
							expirationYield = Math.round(investmentData.HourlyYield * (minutesRemaining / 60));

							// Apply class modifier
							const classModifier = getInvestmentYieldClassModifier(userRow.class as ClassId);
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
							await Users.increment(
								{ money: payout, investmentTotalProfit: payout },
								{ where: { id: currentInvestment.userId } },
							);
						}
						await currentInvestment.destroy();

						const user = await new User(currentInvestment.userId).GetInfo();
						if (user) {
							await Notification.InvestmentExpired(
								user,
								investmentData.Name[user.Language],
								payout,
								totalFee > 0 ? totalFee : undefined,
								investmentData.HenchmanFee,
							);
						}

						logs.push(`- Investment of user ${userRow.nickname} (Id: ${currentInvestment.userId}) (${investmentData.Name[0]}) expired. Payout: ${formatMoney(payout, Language.English)}.`);
						return;
					}

					let totalPayout = 0;
					let totalPayoutFee = 0;

					// Process all retroactive hours
					for (let i = 0; i < hoursToPay; i++) {
						let hourlyYield = Math.round(investmentData.HourlyYield);

						// Apply class modifier
						const classModifier = getInvestmentYieldClassModifier(userRow.class as ClassId);
						hourlyYield = Math.round(hourlyYield * classModifier);

						// Apply first-hour proportional logic if i == 0 and lastYieldAt is null
						if (i === 0 && currentInvestment.lastYieldAt === null) {
							const minutesOfFirstHour = (60 - currentInvestment.createdAt.getMinutes());
							const fraction = Math.max(0, Math.min(60, minutesOfFirstHour)) / 60;
							hourlyYield = Math.round(hourlyYield * fraction);
						}

						// Calculate the timestamp for this specific hourly tick
						const currentTick = addHours(lastBasisHour, i + 1);

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

						await Users.increment(
							{ money: finalPayout, investmentTotalProfit: finalPayout },
							{ where: { id: currentInvestment.userId } },
						);

						await currentInvestment.update({
							accumulatedYield: 0,
							accumulatedFee: 0,
							lastYieldAt: nowHour,
						});

						logs.push(`- Payed ${hoursToPay}h to ${userRow.nickname} (Id: ${currentInvestment.userId}). Total: ${formatMoney(finalPayout, Language.English)}.`);

						if (userRow.notifyInvestmentYield) {
							const user = await new User(currentInvestment.userId).GetInfo();
							if (user) {
								await Notification.InvestmentYield(
									user,
									investmentData.Name[user.Language],
									finalPayout,
									finalFee,
									investmentData.HenchmanFee,
								);
							}
						}
					}
					else {
						await currentInvestment.increment({
							accumulatedYield: Math.round(totalPayout),
							accumulatedFee: Math.round(totalPayoutFee),
						});
						await currentInvestment.update({ lastYieldAt: nowHour });
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
				Log.Info(`Investment yield (${logs.length} investments):\n${logs.join("\n")}`);
			}
		}
	}

	/**
	 * Checks if a user is idling based on raw DB fields, without building a full User object.
	 */
	private static IsUserIdling(userRow: Users): boolean {
		const now = new Date();
		return (
			userRow.jobId == null &&
			(userRow.prisonTime == null || userRow.prisonTime <= now) &&
			(userRow.hospitalTime == null || userRow.hospitalTime <= now) &&
			userRow.scavengingId == null &&
			!userRow.casinoIsInGame &&
			userRow.robbingUserId == null &&
			userRow.beingRobbedByUserId == null &&
			userRow.robbingLocationId == null &&
			userRow.beatingUserId == null &&
			userRow.beingBeatUpByUserId == null &&
			!userRow.robberyInvestmentDefending &&
			!userRow.robberyParticipatingInGangAction
		);
	}

	/**
	 * Allows a user to purchase a new investment.
	 * They can only have one active investment at a time.
	 */
	static async Buy(user: User, investmentId: InvestmentId): Promise<InvestmentActionResult> {
		const investmentData = InvestmentList[investmentId];

		if (user.Money < investmentData.Price) {
			return { success: false, reason: "insufficient_funds" };
		}

		// Check if user already has an investment
		const existing = await UserInvestments.findOne({
			where: { userId: user.Id },
		});

		if (existing) {
			return { success: false, reason: "already_has_investment" };
		}

		user.Money -= investmentData.Price;
		await user.Update({ money: user.Money });

		const expiresAt = addDays(new Date(), Investment.DURATION_DAYS);

		await UserInvestments.create({
			userId: user.Id,
			investmentId,
			accumulatedYield: 0,
			accumulatedFee: 0,
			henchmanEndsAt: null,
			henchmanHospitalized: false,
			expiresAt,
			lastYieldAt: null,
		});

		// Refresh user cache
		user.Investment.Id = investmentId;
		user.Investment.AccumulatedYield = 0;
		user.Investment.HenchmanEndsAt = null;
		user.Investment.HenchmanHospitalized = false;
		user.Investment.ExpiresAt = expiresAt;
		user.Investment.PurchasedAt = new Date();

		Log.Success(`User ${user.Nickname} (Id: ${user.Id}) bought investment ${investmentData.Name[Language.English]} (Id: ${user.Investment.Id}) for ${formatMoney(investmentData.Price, Language.English)}. Expires at ${expiresAt}.`);

		return { success: true };
	}

	/**
	 * Abandons the current investment, losing all accumulated yield and the property.
	 */
	static async Abandon(user: User): Promise<InvestmentActionResult> {
		if (user.Investment.Id == null) {
			return { success: false, reason: "no_investment" };
		}
		const investmentData = InvestmentList[user.Investment.Id];

		await UserInvestments.destroy({
			where: { userId: user.Id },
		});

		Log.Info(`User ${user.Nickname} (Id: ${user.Id}) abandoned investment ${investmentData.Name[Language.English]} (Id: ${user.Investment.Id}).`);

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
	static async HireHenchman(user: User): Promise<InvestmentActionResult> {
		if (user.Investment.Id == null) {
			return { success: false, reason: "no_investment" };
		}

		if (this.HasContractHenchman(user)) {
			return { success: false, reason: "already_has_henchman" };
		}

		const endsAt = addHours(new Date(), 12); // 12 hours
		await UserInvestments.update(
			{ henchmanEndsAt: endsAt, henchmanHospitalized: false },
			{ where: { userId: user.Id } },
		);

		user.Investment.HenchmanEndsAt = endsAt;
		user.Investment.HenchmanHospitalized = false;

		Log.Info(`User ${user.Nickname} (Id: ${user.Id}) hired a henchman for investment ${InvestmentList[user.Investment.Id].Name[Language.English]} (Id: ${user.Investment.Id}). Ends at ${endsAt}.`);

		return { success: true };
	}

	static HasContractHenchman(user: User): boolean {
		if (!user.Investment.HenchmanEndsAt) return false;
		return isFuture(new Date(user.Investment.HenchmanEndsAt));
	}

	/**
	 * Checks if the user currently has an active henchman defending the property.
	 */
	static HasActiveHenchman(user: User): boolean {
		if (!user.Investment.HenchmanEndsAt || user.Investment.HenchmanHospitalized) return false;
		return isFuture(new Date(user.Investment.HenchmanEndsAt));
	}

	/**
	 * Toggles the investment yield notification preference.
	 */
	static async ToggleNotifyYield(user: User) {
		const newValue = !user.Investment.NotifyYield;
		user.Investment.NotifyYield = newValue;
		await user.Update({ notifyInvestmentYield: newValue });

		Log.Info(`User ${user.Nickname} (Id: ${user.Id}) ${newValue ? "activated" : "deactivated"} investment yield notifications.`);

		return newValue;
	}
}
