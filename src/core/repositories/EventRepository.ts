import { Events } from "#core/database/Events";
import { type InferAttributes, type InferCreationAttributes, Op, type Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";

export class EventRepository {
	static async Create(
		values: Optional<InferCreationAttributes<Events>, NullishPropertiesOf<InferCreationAttributes<Events>>>
	): Promise<Events> {
		return await Events.create(values);
	}

	static async Destroy(id: number): Promise<number> {
		return await Events.destroy({
			where: { id },
		});
	}

	static async Update(
		id: number,
		values: Partial<InferAttributes<Events>>
	): Promise<[number]> {
		return await Events.update(values, {
			where: { id },
		});
	}

	static async FindActiveEvent(type: number, date: Date): Promise<Events | null> {
		return await Events.findOne({
			where: {
				type,
				periodStart: { [Op.lte]: date },
				periodEnd: { [Op.gte]: date },
			},
		});
	}

	static async FindUpcomingEvents(date: Date): Promise<Events[]> {
		return await Events.findAll({
			where: {
				[Op.or]: {
					periodStart: { [Op.gte]: date },
					periodEnd: { [Op.gte]: date },
				},
			},
		});
	}
}
