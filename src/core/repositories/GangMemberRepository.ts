import { GangMembers } from "#core/database/GangMembers";

export class GangMemberRepository {
	/**
	 * Finds one gang membership matching the userId.
	 */
	static async FindByUserId(userId: string): Promise<GangMembers | null> {
		return await GangMembers.findOne({
			where: { userId },
		});
	}

	/**
	 * Finds all members of a gang.
	 */
	static async FindAllByGang(gangId: number): Promise<GangMembers[]> {
		return await GangMembers.findAll({
			where: { gangId },
		});
	}

	/**
	 * Adds a user to a gang.
	 */
	static async Create(values: {
		gangId: number;
		userId: string;
		roleId: number;
		depositTime: Date;
		depositAmount?: number;
	}): Promise<GangMembers> {
		return await GangMembers.create(values);
	}

	/**
	 * Updates a gang member record's role.
	 */
	static async UpdateRole(userId: string, gangId: number, roleId: number): Promise<void> {
		await GangMembers.update(
			{ roleId },
			{ where: { userId, gangId } }
		);
	}

	/**
	 * Updates a gang member record's deposit information.
	 */
	static async UpdateDeposit(userId: string, gangId: number, depositAmount: number, depositTime: Date): Promise<void> {
		await GangMembers.update(
			{ depositAmount, depositTime },
			{ where: { userId, gangId } }
		);
	}

	/**
	 * Removes a member from a gang.
	 */
	static async RemoveFromGang(userId: string, gangId: number): Promise<number> {
		return await GangMembers.destroy({
			where: { userId, gangId },
		});
	}

	/**
	 * Count of all gang members.
	 */
	static async Count(): Promise<number> {
		return await GangMembers.count();
	}

	/**
	 * Removes all members of a gang.
	 */
	static async RemoveAllByGangId(gangId: number): Promise<number> {
		return await GangMembers.destroy({
			where: { gangId },
		});
	}

	/**
	 * Reassigns roles from an old role ID to a new role ID in a gang.
	 */
	static async ReassignRole(gangId: number, oldRoleId: number, newRoleId: number): Promise<void> {
		await GangMembers.update(
			{ roleId: newRoleId },
			{ where: { gangId, roleId: oldRoleId } }
		);
	}
}

