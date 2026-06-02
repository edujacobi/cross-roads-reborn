import { LotteryDraws } from "#core/database/LotteryDraws";
import { LotteryTickets } from "#core/database/LotteryTickets";
import { Op } from "sequelize";
import type { InferAttributes, InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";

export class LotteryRepository {
	// --- Lottery Draws ---
	static async FindDrawById(id: number): Promise<LotteryDraws | null> {
		return await LotteryDraws.findByPk(id);
	}

	static async FindNextDraw(): Promise<LotteryDraws | null> {
		return await LotteryDraws.findOne({
			where: { isFinished: false },
			order: [["drawTime", "ASC"]],
		});
	}

	static async FindLastWinnerDraw(): Promise<LotteryDraws | null> {
		return await LotteryDraws.findOne({
			where: {
				isFinished: true,
				winningTicketId: { [Op.ne]: null },
			},
			order: [["drawTime", "DESC"]],
		});
	}

	static async FindDrawByTime(drawTime: Date): Promise<LotteryDraws | null> {
		return await LotteryDraws.findOne({
			where: { drawTime },
		});
	}

	static async FindPendingDraws(date: Date): Promise<LotteryDraws[]> {
		return await LotteryDraws.findAll({
			where: {
				drawTime: {
					[Op.lt]: date,
				},
				isFinished: false,
			},
		});
	}

	static async CreateDraw(
		values: Optional<InferCreationAttributes<LotteryDraws>, NullishPropertiesOf<InferCreationAttributes<LotteryDraws>>>
	): Promise<LotteryDraws> {
		return await LotteryDraws.create(values);
	}

	static async UpdateDraw(
		id: number,
		values: Partial<InferAttributes<LotteryDraws>>
	): Promise<[number]> {
		return await LotteryDraws.update(values, {
			where: { id },
		});
	}

	static async DestroyAllDraws(): Promise<number> {
		return await LotteryDraws.destroy({
			where: {},
		});
	}

	// --- Lottery Tickets ---
	static async FindTicketById(id: number): Promise<LotteryTickets | null> {
		return await LotteryTickets.findByPk(id);
	}

	static async FindTicket(userId: string, drawId: number): Promise<LotteryTickets | null> {
		return await LotteryTickets.findOne({
			where: { userId, drawId },
		});
	}

	static async FindAllTicketsForDraw(drawId: number): Promise<LotteryTickets[]> {
		return await LotteryTickets.findAll({
			where: { drawId },
		});
	}

	static async CreateTicket(
		values: Optional<InferCreationAttributes<LotteryTickets>, NullishPropertiesOf<InferCreationAttributes<LotteryTickets>>>
	): Promise<LotteryTickets> {
		return await LotteryTickets.create(values);
	}

	static async UpdateTicket(
		id: number,
		values: Partial<InferAttributes<LotteryTickets>>
	): Promise<[number]> {
		return await LotteryTickets.update(values, {
			where: { id },
		});
	}

	static async DestroyAllTickets(): Promise<number> {
		return await LotteryTickets.destroy({
			where: {},
		});
	}
}
