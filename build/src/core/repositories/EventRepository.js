"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRepository = void 0;
const Events_1 = require("#core/database/Events");
const sequelize_1 = require("sequelize");
class EventRepository {
    static async Create(values) {
        return await Events_1.Events.create(values);
    }
    static async Destroy(id) {
        return await Events_1.Events.destroy({
            where: { id },
        });
    }
    static async Update(id, values) {
        return await Events_1.Events.update(values, {
            where: { id },
        });
    }
    static async FindActiveEvent(type, date) {
        return await Events_1.Events.findOne({
            where: {
                type,
                periodStart: { [sequelize_1.Op.lte]: date },
                periodEnd: { [sequelize_1.Op.gte]: date },
            },
        });
    }
    static async FindById(id) {
        return await Events_1.Events.findByPk(id);
    }
    static async FindAll() {
        return await Events_1.Events.findAll({
            order: [["periodStart", "DESC"]],
        });
    }
    static async FindUpcomingEvents(date) {
        return await Events_1.Events.findAll({
            where: {
                [sequelize_1.Op.or]: {
                    periodStart: { [sequelize_1.Op.gte]: date },
                    periodEnd: { [sequelize_1.Op.gte]: date },
                },
            },
        });
    }
}
exports.EventRepository = EventRepository;
//# sourceMappingURL=EventRepository.js.map