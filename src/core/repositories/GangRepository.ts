import { Gangs } from "#core/database/Gangs";
import GangMembers from "#core/database/GangMembers";
import { Op } from "sequelize";
import type { InferAttributes, InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";

export class GangRepository {
	static async FindById(
		id: number,
		attributes?: (keyof Gangs)[]
	): Promise<Gangs | null> {
		return await Gangs.findByPk(id, attributes ? { attributes } : undefined);
	}

	static async FindTopGangs(limit: number, offset: number): Promise<Gangs[]> {
		return await Gangs.findAll({
			limit,
			offset,
			order: [["level", "DESC"], ["experience", "DESC"]],
			where: {
				level: {
					[Op.gt]: 0,
				},
			},
		});
	}

	static async FindByName(name: string): Promise<Gangs | null> {
		return await Gangs.findOne({
			where: {
				name: {
					[Op.like]: name,
				},
			},
		});
	}

	static async FindByAcronym(acronym: string): Promise<Gangs | null> {
		return await Gangs.findOne({
			where: {
				acronym: {
					[Op.like]: acronym,
				},
			},
		});
	}

	static async FindByNameOrAcronym(name: string, acronym: string): Promise<Gangs | null> {
		return await Gangs.findOne({
			where: {
				[Op.or]: {
					name: { [Op.like]: name },
					acronym: { [Op.like]: acronym }
				}
			}
		});
	}

	static async FindByUserId(userId: string): Promise<Gangs | null> {
		return await Gangs.findOne({
			include: [{
				model: GangMembers,
				where: { userId }
			}]
		});
	}

	static async Create(
		values: Optional<InferCreationAttributes<Gangs>, NullishPropertiesOf<InferCreationAttributes<Gangs>>>
	): Promise<Gangs> {
		return await Gangs.create(values);
	}

	static async Update(
		id: number,
		values: Partial<InferAttributes<Gangs>>
	): Promise<[number]> {
		return await Gangs.update(values, {
			where: { id },
		});
	}

	static async Destroy(id: number): Promise<number> {
		return await Gangs.destroy({
			where: { id },
		});
	}

	static async FindAllWithActiveImport(): Promise<Gangs[]> {
		return await Gangs.findAll({
			where: {
				shipmentArrivesAt: {
					[Op.ne]: null,
				},
			},
		});
	}

	static async CountAllGangs(): Promise<number> {
		return await Gangs.count();
	}
}
