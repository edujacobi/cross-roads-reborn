import { Event, EventType } from "#core/models/Event";
import type { Events } from "#core/database/Events";
import { AdminAuditActionId, AdminAuditSettingId } from "#core/types/AdminAuditLog";
import type { GraphQLContext } from "#api/types";
import { assertAdmin, assertCanWrite, recordAdminAction } from "./helpers";
import type { ResolverFn } from "./helpers";

export const eventResolvers: {
	Query: Record<string, ResolverFn>;
	Mutation: Record<string, ResolverFn>;
} = {
	Query: {
		events: async (_: unknown, __: unknown, context: GraphQLContext) => {
			assertAdmin(context);
			const events = await Event.GetAll();

			return events.map(event => ({
				id: event.id,
				type: event.type,
				value: event.value,
				periodStart: event.periodStart.toISOString(),
				periodEnd: event.periodEnd.toISOString(),
				isActive: Event.IsActive(event),
			}));
		},
	},

	Mutation: {
		createEvent: async (
			_: unknown,
			args: { type: number; value: number; periodStart: string; periodEnd: string },
			context: GraphQLContext,
		) => {
			const admin = assertCanWrite(context);
			const eventTypes = Object.values(EventType).filter((type): type is EventType => typeof type === "number");
			const periodStart = new Date(args.periodStart);
			const periodEnd = new Date(args.periodEnd);
			if (
				!eventTypes.includes(args.type)
				|| !Number.isFinite(args.value)
				|| !Number.isFinite(periodStart.getTime())
				|| !Number.isFinite(periodEnd.getTime())
				|| periodStart >= periodEnd
			) {
				return { success: false, message: "Invalid event data." };
			}

			const success = await Event.Create(args.type, args.value, periodStart, periodEnd);
			if (success) {
				await recordAdminAction(
					admin,
					AdminAuditActionId.CreateEvent,
					{ settingId: AdminAuditSettingId.Events },
					null,
					{ type: args.type, value: args.value, periodStart, periodEnd },
				);
			}
			return {
				success,
				message: success ? "Event created successfully." : "Failed to create event.",
			};
		},

		updateEvent: async (
			_: unknown,
			args: { id: number; value?: number | null; periodStart?: string | null; periodEnd?: string | null },
			context: GraphQLContext,
		) => {
			const admin = assertCanWrite(context);
			const event = await Event.GetById(args.id);
			if (!event) {
				return { success: false, message: "Event not found." };
			}

			const updatedData: Partial<Events> = {};
			if (args.value !== undefined && args.value !== null) {
				if (!Number.isFinite(args.value)) {
					return { success: false, message: "Invalid event value." };
				}
				updatedData.value = args.value;
			}

			const periodStart = args.periodStart !== undefined && args.periodStart !== null
				? new Date(args.periodStart)
				: event.periodStart;
			const periodEnd = args.periodEnd !== undefined && args.periodEnd !== null
				? new Date(args.periodEnd)
				: event.periodEnd;
			if (
				!Number.isFinite(periodStart.getTime())
				|| !Number.isFinite(periodEnd.getTime())
				|| periodStart >= periodEnd
			) {
				return { success: false, message: "Event start must be before its end." };
			}
			if (args.periodStart !== undefined && args.periodStart !== null) updatedData.periodStart = periodStart;
			if (args.periodEnd !== undefined && args.periodEnd !== null) updatedData.periodEnd = periodEnd;
			if (!Object.keys(updatedData).length) {
				return { success: false, message: "No event changes provided." };
			}

			const previousValue = {
				id: event.id,
				type: event.type,
				value: event.value,
				periodStart: event.periodStart,
				periodEnd: event.periodEnd,
			};
			const success = await Event.Update(args.id, updatedData);
			if (success) {
				await recordAdminAction(
					admin,
					AdminAuditActionId.UpdateEvent,
					{ settingId: AdminAuditSettingId.Events },
					previousValue,
					{ ...previousValue, ...updatedData },
				);
			}
			return {
				success,
				message: success ? "Event updated successfully." : "Failed to update event.",
			};
		},

		deleteEvent: async (_: unknown, args: { id: number }, context: GraphQLContext) => {
			const admin = assertCanWrite(context);
			const event = await Event.GetById(args.id);
			const success = await Event.Delete(args.id);
			if (success && event) {
				await recordAdminAction(
					admin,
					AdminAuditActionId.DeleteEvent,
					{ settingId: AdminAuditSettingId.Events },
					{
						id: event.id,
						type: event.type,
						value: event.value,
						periodStart: event.periodStart,
						periodEnd: event.periodEnd,
					},
					null,
				);
			}
			return {
				success,
				message: success ? "Event deleted successfully." : "Event not found or could not be deleted.",
			};
		},
	},
};

