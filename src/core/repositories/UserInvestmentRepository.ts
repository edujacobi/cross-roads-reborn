import { UserInvestments } from "#core/database/UserInvestments";

export class UserInvestmentRepository {
	/**
	 * Finds a user investment by their userId.
	 */
	static async FindByUserId(userId: string): Promise<UserInvestments | null> {
		return await UserInvestments.findOne({
			where: { userId },
		});
	}

	/**
	 * Finds all active user investments.
	 */
	static async FindAll(): Promise<UserInvestments[]> {
		return await UserInvestments.findAll();
	}

	/**
	 * Creates a new user investment record.
	 */
	static async Create(values: {
		userId: string;
		investmentId: number;
		expiresAt: Date;
		accumulatedYield?: number;
		accumulatedFee?: number;
		henchmanEndsAt?: Date | null;
		henchmanHospitalized?: boolean;
		lastYieldAt?: Date | null;
	}): Promise<UserInvestments> {
		return await UserInvestments.create(values);
	}

	/**
	 * Updates user investments matching the userId.
	 */
	static async UpdateByUserId(
		userId: string,
		values: Partial<UserInvestments>
	): Promise<void> {
		await UserInvestments.update(values, {
			where: { userId },
		});
	}

	/**
	 * Destroys user investments matching the userId.
	 */
	static async DestroyByUserId(userId: string): Promise<number> {
		return await UserInvestments.destroy({
			where: { userId },
		});
	}

	/**
	 * Count of all user investments.
	 */
	static async Count(): Promise<number> {
		return await UserInvestments.count();
	}

	/**
	 * Decrements accumulated yield for a user investment.
	 */
	static async DecrementYield(userId: string, amount: number): Promise<void> {
		await UserInvestments.decrement("accumulatedYield", {
			by: amount,
			where: { userId },
		});
	}

	/**
	 * Increments yield and fee for a user investment.
	 */
	static async IncrementYieldAndFee(userId: string, yieldAmount: number, feeAmount: number): Promise<void> {
		await UserInvestments.increment(
			{ accumulatedYield: yieldAmount, accumulatedFee: feeAmount },
			{ where: { userId } }
		);
	}
}

