"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GangRoleRepository = void 0;
const GangRoles_1 = require("#core/database/GangRoles");
class GangRoleRepository {
    static async FindById(id) {
        return await GangRoles_1.GangRoles.findByPk(id);
    }
    static async FindAllByGangId(gangId) {
        return await GangRoles_1.GangRoles.findAll({
            where: { gangId },
        });
    }
    static async Create(values) {
        return await GangRoles_1.GangRoles.create(values);
    }
    static async Update(id, values) {
        return await GangRoles_1.GangRoles.update(values, {
            where: { id },
        });
    }
    static async Destroy(id) {
        return await GangRoles_1.GangRoles.destroy({
            where: { id },
        });
    }
    static async DestroyAllByGangId(gangId) {
        return await GangRoles_1.GangRoles.destroy({
            where: { gangId },
        });
    }
    static async DestroyAll() {
        return await GangRoles_1.GangRoles.destroy({
            where: {},
        });
    }
}
exports.GangRoleRepository = GangRoleRepository;
//# sourceMappingURL=GangRoleRepository.js.map