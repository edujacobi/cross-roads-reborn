import { UserBackgroundDecorations } from "#core/database/UserBackgroundDecorations";
import type { InferAttributes, InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";

export class UserBackgroundDecorationRepository {
	static async FindOne(userId: string, backgroundDecorationId: number): Promise<UserBackgroundDecorations | null> {
		return await UserBackgroundDecorations.findOne({
			where: { userId, backgroundDecorationId },
		});
	}

	static async FindAllByUserId(userId: string): Promise<UserBackgroundDecorations[]> {
		return await UserBackgroundDecorations.findAll({
			where: { userId },
			order: [["backgroundDecorationId", "ASC"]],
		});
	}

	static async Create(
		values: Optional<InferCreationAttributes<UserBackgroundDecorations>, NullishPropertiesOf<InferCreationAttributes<UserBackgroundDecorations>>>
	): Promise<UserBackgroundDecorations> {
		return await UserBackgroundDecorations.create(values);
	}

	static async Destroy(userId: string, backgroundDecorationId: number): Promise<number> {
		return await UserBackgroundDecorations.destroy({
			where: { userId, backgroundDecorationId },
		});
	}

	static async DestroyAll(): Promise<number> {
		return await UserBackgroundDecorations.destroy({
			where: {},
		});
	}
}
