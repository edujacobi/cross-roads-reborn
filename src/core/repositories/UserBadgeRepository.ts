import { UserBadges } from "#core/database/UserBadges";
import type { InferAttributes, InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";

export class UserBadgeRepository {
	static async FindOne(userId: string, badgeId: number): Promise<UserBadges | null> {
		return await UserBadges.findOne({
			where: { userId, badgeId },
		});
	}

	static async FindAllByUserId(userId: string): Promise<UserBadges[]> {
		return await UserBadges.findAll({
			where: { userId },
			order: [["badgeId", "ASC"]],
		});
	}

	static async Create(
		values: Optional<InferCreationAttributes<UserBadges>, NullishPropertiesOf<InferCreationAttributes<UserBadges>>>
	): Promise<UserBadges> {
		return await UserBadges.create(values);
	}

	static async Destroy(userId: string, badgeId: number): Promise<number> {
		return await UserBadges.destroy({
			where: { userId, badgeId },
		});
	}

	static async DestroyAll(): Promise<number> {
		return await UserBadges.destroy({
			where: {},
		});
	}
}
