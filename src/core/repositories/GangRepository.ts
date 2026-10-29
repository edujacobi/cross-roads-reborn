import { Gangs } from "#core/database/Gangs";
import GangMembers from "#core/database/GangMembers";
import { Op, QueryTypes } from "sequelize";
import type { InferAttributes, InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";
import { sequelize } from "#core/database/Database";

export interface RecruitingGangEntry {
	id: number;
	name: string;
	acronym: string;
	description: string;
	level: number;
	image: string | null;
	color: number;
	baseId: number;
	recruitmentType: number;
	membersCount: number;
}

export interface RecruitingGangPage {
	entries: RecruitingGangEntry[];
	total: number;
}

export class GangRepository {
	static async FindById(
		id: number,
		attributes?: (keyof Gangs)[],
	): Promise<Gangs | null> {
		return await Gangs.findByPk(id, attributes ? { attributes } : undefined);
	}

	static async FindAllByIds(ids: number[]): Promise<Gangs[]> {
		return await Gangs.findAll({
			attributes: ["id", "name", "color", "acronym"],
			where: { id: { [Op.in]: ids } },
		});
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
					acronym: { [Op.like]: acronym },
				},
			},
		});
	}

	static async FindByUserId(userId: string): Promise<Gangs | null> {
		return await Gangs.findOne({
			include: [{
				model: GangMembers,
				where: { userId },
			}],
		});
	}

	static async Create(
		values: Optional<InferCreationAttributes<Gangs>, NullishPropertiesOf<InferCreationAttributes<Gangs>>>,
	): Promise<Gangs> {
		return await Gangs.create(values);
	}

	static async Update(
		id: number,
		values: Partial<InferAttributes<Gangs>>,
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

	static async FindRecruitingGangs(
		recruitmentType: number | undefined,
		search: string | undefined,
		sortBy: string | undefined,
		sortOrder: string | undefined,
		limit: number,
		offset: number,
	): Promise<RecruitingGangPage> {
		const searchTerm = search?.trim();
		const fromAndWhere = `FROM "gangs" AS gang
			LEFT JOIN (
				SELECT "gangId", COUNT(*) AS "membersCount"
				FROM "gangmembers"
				GROUP BY "gangId"
			) AS member_count ON member_count."gangId" = gang."id"
			WHERE ((:recruitmentType IS NULL AND gang."recruitmentType" > 0)
				OR gang."recruitmentType" = :recruitmentType)
				AND COALESCE(member_count."membersCount", 0)
					< (9 + gang."level" + CASE WHEN gang."baseId" = 0 THEN 0 ELSE 1 END)
				AND (:search IS NULL OR gang."name" LIKE :search ESCAPE '\\' OR gang."acronym" LIKE :search ESCAPE '\\')`;
		const replacements = {
			recruitmentType: recruitmentType ?? null,
			search: searchTerm ? `%${searchTerm.replace(/[\\%_]/g, "\\$&")}%` : null,
			limit,
			offset,
		};
		const sortColumns: Record<string, string> = {
			name: "gang.\"name\" COLLATE NOCASE",
			base: "gang.\"baseId\"",
			membersCount: "COALESCE(member_count.\"membersCount\", 0)",
			recruitmentType: "gang.\"recruitmentType\"",
		};
		const sortColumn = sortBy && Object.hasOwn(sortColumns, sortBy) ? sortColumns[sortBy] : undefined;
		const orderBy = sortColumn
			? `${sortColumn} ${sortOrder === "ASC" ? "ASC" : "DESC"}, gang."id" ASC`
			: "gang.\"level\" DESC, gang.\"experience\" DESC, gang.\"id\" ASC";
		const [entries, totalResult] = await Promise.all([
			sequelize.query<RecruitingGangEntry>(
				`SELECT gang."id", gang."name", gang."acronym", gang."description", gang."level",
					gang."image", gang."color", gang."baseId", gang."recruitmentType",
					COALESCE(member_count."membersCount", 0) AS "membersCount"
				${fromAndWhere}
				ORDER BY ${orderBy}
				LIMIT :limit OFFSET :offset`,
				{ type: QueryTypes.SELECT, replacements },
			),
			sequelize.query<{ total: number }>(
				`SELECT COUNT(*) AS "total" ${fromAndWhere}`,
				{ type: QueryTypes.SELECT, replacements },
			),
		]);

		return { entries, total: Number(totalResult[0]?.total ?? 0) };
	}
}