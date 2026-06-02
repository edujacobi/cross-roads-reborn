import { GangRoles } from "#core/database/GangRoles";
import type { InferAttributes, InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";

export class GangRoleRepository {
	static async FindById(id: number): Promise<GangRoles | null> {
		return await GangRoles.findByPk(id);
	}

	static async FindAllByGangId(gangId: number): Promise<GangRoles[]> {
		return await GangRoles.findAll({
			where: { gangId },
		});
	}

	static async Create(
		values: Optional<InferCreationAttributes<GangRoles>, NullishPropertiesOf<InferCreationAttributes<GangRoles>>>
	): Promise<GangRoles> {
		return await GangRoles.create(values);
	}

	static async Update(
		id: number,
		values: Partial<InferAttributes<GangRoles>>
	): Promise<[number]> {
		return await GangRoles.update(values, {
			where: { id },
		});
	}

	static async Destroy(id: number): Promise<number> {
		return await GangRoles.destroy({
			where: { id },
		});
	}

	static async DestroyAllByGangId(gangId: number): Promise<number> {
		return await GangRoles.destroy({
			where: { gangId },
		});
	}

	static async DestroyAll(): Promise<number> {
		return await GangRoles.destroy({
			where: {},
		});
	}
}
