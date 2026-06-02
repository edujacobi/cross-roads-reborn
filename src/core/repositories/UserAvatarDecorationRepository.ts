import { UserAvatarDecorations } from "#core/database/UserAvatarDecorations";
import type { InferAttributes, InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";

export class UserAvatarDecorationRepository {
	static async FindOne(userId: string, avatarDecorationId: number): Promise<UserAvatarDecorations | null> {
		return await UserAvatarDecorations.findOne({
			where: { userId, avatarDecorationId },
		});
	}

	static async FindAllByUserId(userId: string): Promise<UserAvatarDecorations[]> {
		return await UserAvatarDecorations.findAll({
			where: { userId },
			order: [["avatarDecorationId", "ASC"]],
		});
	}

	static async Create(
		values: Optional<InferCreationAttributes<UserAvatarDecorations>, NullishPropertiesOf<InferCreationAttributes<UserAvatarDecorations>>>
	): Promise<UserAvatarDecorations> {
		return await UserAvatarDecorations.create(values);
	}

	static async Destroy(userId: string, avatarDecorationId: number): Promise<number> {
		return await UserAvatarDecorations.destroy({
			where: { userId, avatarDecorationId },
		});
	}

	static async DestroyAll(): Promise<number> {
		return await UserAvatarDecorations.destroy({
			where: {},
		});
	}
}
