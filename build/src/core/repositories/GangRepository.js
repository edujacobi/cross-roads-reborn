"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GangRepository = void 0;
const Gangs_1 = require("#core/database/Gangs");
const GangMembers_1 = __importDefault(require("#core/database/GangMembers"));
const sequelize_1 = require("sequelize");
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
}
exports.GangRepository = GangRepository;
//# sourceMappingURL=GangRepository.js.map