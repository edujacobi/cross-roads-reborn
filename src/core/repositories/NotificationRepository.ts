import { Notifications } from "#core/database/Notifications";
import { Op } from "sequelize";
import type { InferAttributes, InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";

export class NotificationRepository {
	static async Create(
		values: Optional<InferCreationAttributes<Notifications>, NullishPropertiesOf<InferCreationAttributes<Notifications>>>
	): Promise<Notifications> {
		return await Notifications.create(values);
	}

	static async CountUnsentBefore(time: Date): Promise<number> {
		return await Notifications.count({
			where: {
				date: {
					[Op.lt]: time,
				},
				notified: false,
			},
		});
	}

	static async FindUnsentBefore(time: Date): Promise<Notifications[]> {
		return await Notifications.findAll({
			where: {
				date: {
					[Op.lt]: time,
				},
				notified: false,
			},
		});
	}

	static async MarkAsNotified(id: number | number[]): Promise<[number]> {
		return await Notifications.update(
			{ notified: true },
			{
				where: { id },
			}
		);
	}

	static async DeleteUnsentByUserIdAndType(userId: string, type: number): Promise<number> {
		return await Notifications.destroy({
			where: {
				userId,
				type,
				notified: false,
			},
		});
	}

	static async DeleteById(id: number): Promise<number> {
		return await Notifications.destroy({
			where: { id },
		});
	}
}
