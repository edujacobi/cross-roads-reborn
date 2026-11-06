"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventResolvers = void 0;
const Event_1 = require("#core/models/Event");
const AdminAuditLog_1 = require("#core/types/AdminAuditLog");
const helpers_1 = require("./helpers");
function mapEvent(event, isActive = Event_1.Event.IsActive(event)) {
    return {
        id: event.id,
        type: event.type,
        value: event.value,
        periodStart: event.periodStart.toISOString(),
        periodEnd: event.periodEnd.toISOString(),
        isActive,
    };
}
exports.eventResolvers = {
    Query: {
        activeEvents: async (_, __, context) => {
            (0, helpers_1.assertAuthenticated)(context);
            const events = await Event_1.Event.GetAll();
            return events.filter(event => Event_1.Event.IsActive(event)).map(event => mapEvent(event, true));
        },
        events: async (_, __, context) => {
            (0, helpers_1.assertAdmin)(context);
            const events = await Event_1.Event.GetAll();
            return events.map(event => mapEvent(event));
        },
    },
    Mutation: {
        createEvent: async (_, args, context) => {
            const admin = (0, helpers_1.assertCanWrite)(context);
            const eventTypes = Object.values(Event_1.EventType).filter((type) => typeof type === "number");
            const periodStart = new Date(args.periodStart);
            const periodEnd = new Date(args.periodEnd);
            if (!eventTypes.includes(args.type)
                || !Number.isFinite(args.value)
                || !Number.isFinite(periodStart.getTime())
                || !Number.isFinite(periodEnd.getTime())
                || periodStart >= periodEnd) {
                return { success: false, message: "Dados do evento inválidos." };
            }
            const success = await Event_1.Event.Create(args.type, args.value, periodStart, periodEnd);
            if (success) {
                await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_1.AdminAuditActionId.CreateEvent, { settingId: AdminAuditLog_1.AdminAuditSettingId.Events }, null, { type: args.type, value: args.value, periodStart, periodEnd });
            }
            return {
                success,
                message: success ? "Evento criado com sucesso." : "Falha ao criar evento.",
            };
        },
        updateEvent: async (_, args, context) => {
            const admin = (0, helpers_1.assertCanWrite)(context);
            const event = await Event_1.Event.GetById(args.id);
            if (!event) {
                return { success: false, message: "Evento não encontrado." };
            }
            const updatedData = {};
            if (args.value !== undefined && args.value !== null) {
                if (!Number.isFinite(args.value)) {
                    return { success: false, message: "Valor do evento inválido." };
                }
                updatedData.value = args.value;
            }
            const periodStart = args.periodStart !== undefined && args.periodStart !== null
                ? new Date(args.periodStart)
                : event.periodStart;
            const periodEnd = args.periodEnd !== undefined && args.periodEnd !== null
                ? new Date(args.periodEnd)
                : event.periodEnd;
            if (!Number.isFinite(periodStart.getTime())
                || !Number.isFinite(periodEnd.getTime())
                || periodStart >= periodEnd) {
                return { success: false, message: "O início do evento deve ser anterior ao fim." };
            }
            if (args.periodStart !== undefined && args.periodStart !== null)
                updatedData.periodStart = periodStart;
            if (args.periodEnd !== undefined && args.periodEnd !== null)
                updatedData.periodEnd = periodEnd;
            if (!Object.keys(updatedData).length) {
                return { success: false, message: "Nenhuma alteração fornecida para o evento." };
            }
            const previousValue = {
                id: event.id,
                type: event.type,
                value: event.value,
                periodStart: event.periodStart,
                periodEnd: event.periodEnd,
            };
            const success = await Event_1.Event.Update(args.id, updatedData);
            if (success) {
                await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_1.AdminAuditActionId.UpdateEvent, { settingId: AdminAuditLog_1.AdminAuditSettingId.Events }, previousValue, { ...previousValue, ...updatedData });
            }
            return {
                success,
                message: success ? "Evento atualizado com sucesso." : "Falha ao atualizar evento.",
            };
        },
        deleteEvent: async (_, args, context) => {
            const admin = (0, helpers_1.assertCanWrite)(context);
            const event = await Event_1.Event.GetById(args.id);
            const success = await Event_1.Event.Delete(args.id);
            if (success && event) {
                await (0, helpers_1.recordAdminAction)(admin, AdminAuditLog_1.AdminAuditActionId.DeleteEvent, { settingId: AdminAuditLog_1.AdminAuditSettingId.Events }, {
                    id: event.id,
                    type: event.type,
                    value: event.value,
                    periodStart: event.periodStart,
                    periodEnd: event.periodEnd,
                }, null);
            }
            return {
                success,
                message: success ? "Evento excluído com sucesso." : "Evento não encontrado ou não pode ser excluído.",
            };
        },
    },
};
//# sourceMappingURL=events.js.map