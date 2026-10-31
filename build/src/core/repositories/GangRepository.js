"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GangRepository = void 0;
const Gangs_1 = require("#core/database/Gangs");
const GangMembers_1 = __importDefault(require("#core/database/GangMembers"));
const sequelize_1 = require("sequelize");
const Database_1 = require("#core/database/Database");
class GangRepository {
    static async FindById(id, attributes) {
        return await Gangs_1.Gangs.findByPk(id, attributes ? { attributes } : undefined);
    }
    static async FindAllByIds(ids) {
        return await Gangs_1.Gangs.findAll({
            attributes: ["id", "name", "color", "acronym"],
            where: { id: { [sequelize_1.Op.in]: ids } },
        });
    }
    static async FindTopGangs(limit, offset) {
        return await Gangs_1.Gangs.findAll({
            limit,
            offset,
            order: [["level", "DESC"], ["experience", "DESC"]],
            where: {
                level: {
                    [sequelize_1.Op.gt]: 0,
                },
            },
        });
    }
    static async FindByName(name) {
        return await Gangs_1.Gangs.findOne({
            where: {
                name: {
                    [sequelize_1.Op.like]: name,
                },
            },
        });
    }
    static async FindByAcronym(acronym) {
        return await Gangs_1.Gangs.findOne({
            where: {
                acronym: {
                    [sequelize_1.Op.like]: acronym,
                },
            },
        });
    }
    static async FindByNameOrAcronym(name, acronym) {
        return await Gangs_1.Gangs.findOne({
            where: {
                [sequelize_1.Op.or]: {
                    name: { [sequelize_1.Op.like]: name },
                    acronym: { [sequelize_1.Op.like]: acronym },
                },
            },
        });
    }
    static async FindByUserId(userId) {
        return await Gangs_1.Gangs.findOne({
            include: [{
                    model: GangMembers_1.default,
                    where: { userId },
                }],
        });
    }
    static async Create(values) {
        return await Gangs_1.Gangs.create(values);
    }
    static async Update(id, values) {
        return await Gangs_1.Gangs.update(values, {
            where: { id },
        });
    }
    static async Destroy(id) {
        return await Gangs_1.Gangs.destroy({
            where: { id },
        });
    }
    static async FindAllWithActiveImport() {
        return await Gangs_1.Gangs.findAll({
            where: {
                shipmentArrivesAt: {
                    [sequelize_1.Op.ne]: null,
                },
            },
        });
    }
    static async CountAllGangs() {
        return await Gangs_1.Gangs.count();
    }
    static async FindRecruitingGangs(recruitmentType, search, sortBy, sortOrder, limit, offset) {
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
        const sortColumns = {
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
            Database_1.sequelize.query(`SELECT gang."id", gang."name", gang."acronym", gang."description", gang."level",
					gang."image", gang."color", gang."baseId", gang."recruitmentType",
					COALESCE(member_count."membersCount", 0) AS "membersCount"
				${fromAndWhere}
				ORDER BY ${orderBy}
				LIMIT :limit OFFSET :offset`, { type: sequelize_1.QueryTypes.SELECT, replacements }),
            Database_1.sequelize.query(`SELECT COUNT(*) AS "total" ${fromAndWhere}`, { type: sequelize_1.QueryTypes.SELECT, replacements }),
        ]);
        return { entries, total: Number(totalResult[0]?.total ?? 0) };
    }
}
exports.GangRepository = GangRepository;
//# sourceMappingURL=GangRepository.js.map