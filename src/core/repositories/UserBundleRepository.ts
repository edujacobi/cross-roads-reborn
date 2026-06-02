import { UserBundles } from "#core/database/UserBundles";
import type { InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";

export class UserBundleRepository {
	static async FindOne(userId: string, bundleId: number): Promise<UserBundles | null> {
		return await UserBundles.findOne({
			where: { userId, bundleId },
		});
	}

	static async FindAllByUserId(userId: string): Promise<UserBundles[]> {
		return await UserBundles.findAll({
			where: { userId },
			order: [["bundleId", "ASC"]],
		});
	}

	static async Create(
		values: Optional<InferCreationAttributes<UserBundles>, NullishPropertiesOf<InferCreationAttributes<UserBundles>>>
	): Promise<UserBundles> {
		return await UserBundles.create(values);
	}

	static async Destroy(userId: string, bundleId: number): Promise<number> {
		return await UserBundles.destroy({
			where: { userId, bundleId },
		});
	}

	static async DestroyAll(): Promise<number> {
		return await UserBundles.destroy({
			where: {},
		});
	}
}
