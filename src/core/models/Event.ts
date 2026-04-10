import { Op } from "sequelize";
import { Events } from "#core/database/Events";
import { Log } from "#shared/log";

export enum EventType {
	JOB_TIME_MULTIPLIER = 1,
}

export class Event {
	/**
	 * Creates a new event.
	 *
	 * @param eventType The type of the event to create.
	 * @param value The value of the event, like a multiplier (1 is the default value).
	 * @param periodStart The start of the event.
	 * @param periodEnd The end of the event.
	 * @returns True if the event was created successfully, false otherwise.
	 */
	static async Create(eventType: EventType, value: number, periodStart: Date, periodEnd: Date): Promise<boolean> {
		try {
			await Events.create({
				type: eventType,
				value: value,
				periodStart: periodStart,
				periodEnd: periodEnd,
			});

			Log.Success(`New event if type ${eventType} created, with value ${value}, starting at ${periodStart} and ending at ${periodEnd}`);
			return true;
		}
		catch (err) {
			Log.Error("Error while creating event");
			return false;
		}
	}

	/**
	 * Deletes an event by its Id.
	 *
	 * @param eventId The Id of the event to delete.
	 * @returns True if the event was deleted successfully, false otherwise.
	 */
	static async Delete(eventId: number): Promise<boolean> {
		try {
			const result = await Events.destroy({
				where: { id: eventId },
			});

			if (result) {
				Log.Success(`Event with Id ${eventId} deleted successfully.`);
				return true;
			}
			else {
				Log.Warning(`Event with Id ${eventId} not found.`);
				return false;
			}
		}
		catch (err) {
			Log.Error(`Error while deleting event with Id ${eventId}`);
			return false;
		}
	}

	/**
	 * Updates an event by its Id.
	 *
	 * @param eventId The Id of the event to update.
	 * @param updatedData The updated event data.
	 * @returns True if the event was updated successfully, false otherwise.
	 */
	static async Update(eventId: number, updatedData: Partial<Events>): Promise<boolean> {
		try {
			const result = await Events.update(updatedData, {
				where: { id: eventId },
			});

			if (result[0] > 0) {
				Log.Success(`Event with Id ${eventId} updated successfully.`);
				return true;
			}
			else {
				Log.Warning(`Event with Id ${eventId} not found.`);
				return false;
			}
		}
		catch (err) {
			Log.Error(`Error while updating event with Id ${eventId}`);
			return false;
		}
	}

	/**
	 * Retrieves the active event value for a given event type.
	 *
	 * @param eventType The type of the event to retrieve.
	 * @returns The value of the active event.
	 */
	static async GetActiveFromType(eventType: EventType) {
		const currentDate = new Date();

		const event = await Events.findOne({
			where: {
				type: eventType,
				periodStart: { [Op.lte]: currentDate },
				periodEnd: { [Op.gte]: currentDate },
			},
		});

		if (!event) {
			return 1;
		}

		return event.value;
	}

	/**
	 * Retrieves the upcoming events.
	 *
	 * @returns The upcoming events, or undefined if no events are found.
	 */
	static async GetUpcomingEvents() {
		const currentDate = new Date();

		return await Events.findAll({
			where: {
				[Op.or]: {
					periodStart: { [Op.gte]: currentDate },
					periodEnd: { [Op.gte]: currentDate },
				},
			},
		});
	}

	static GetEventTypeText(eventType: EventType) {
		switch (eventType) {
		case EventType.JOB_TIME_MULTIPLIER:
			return "Jobs time multiplier";
		default:
			return "Unknown";
		}
	}
}