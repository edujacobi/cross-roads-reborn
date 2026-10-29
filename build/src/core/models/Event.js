"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = exports.EventType = void 0;
const EventRepository_1 = require("#core/repositories/EventRepository");
const log_1 = require("#shared/log");
var EventType;
(function (EventType) {
    EventType[EventType["JOB_TIME_MULTIPLIER"] = 1] = "JOB_TIME_MULTIPLIER";
    EventType[EventType["SCAVENGE_TIME_MULTIPLIER"] = 2] = "SCAVENGE_TIME_MULTIPLIER";
    EventType[EventType["WANTED_TIME_MULTIPLIER"] = 3] = "WANTED_TIME_MULTIPLIER";
    EventType[EventType["HOSPITAL_TIME_MULTIPLIER"] = 4] = "HOSPITAL_TIME_MULTIPLIER";
    EventType[EventType["PRISON_TIME_MULTIPLIER"] = 5] = "PRISON_TIME_MULTIPLIER";
    EventType[EventType["SCAVENGE_CHANCE_BONUS"] = 6] = "SCAVENGE_CHANCE_BONUS";
    EventType[EventType["ROB_LOCATION_CHANCE_BONUS"] = 7] = "ROB_LOCATION_CHANCE_BONUS";
    EventType[EventType["PRISON_ESCAPE_CHANCE_BONUS"] = 8] = "PRISON_ESCAPE_CHANCE_BONUS";
})(EventType || (exports.EventType = EventType = {}));
class Event {
    static IsActive(event) {
        const currentDate = new Date();
        return currentDate > event.periodStart && currentDate < event.periodEnd;
    }
    /**
     * Creates a new event.
     *
     * @param eventType The type of the event to create.
     * @param value The value of the event, like a multiplier (1 is the default value).
     * @param periodStart The start of the event.
     * @param periodEnd The end of the event.
     * @returns True if the event was created successfully, false otherwise.
     */
    static async Create(eventType, value, periodStart, periodEnd) {
        try {
            await EventRepository_1.EventRepository.Create({
                type: eventType,
                value: value,
                periodStart: periodStart,
                periodEnd: periodEnd,
            });
            log_1.Log.Success(`New event if type ${eventType} created, with value ${value}, starting at ${periodStart} and ending at ${periodEnd}`);
            return true;
        }
        catch (err) {
            log_1.Log.Error("Error while creating event");
            return false;
        }
    }
    /**
     * Deletes an event by its Id.
     *
     * @param eventId The Id of the event to delete.
     * @returns True if the event was deleted successfully, false otherwise.
     */
    static async Delete(eventId) {
        try {
            const result = await EventRepository_1.EventRepository.Destroy(eventId);
            if (result) {
                log_1.Log.Success(`Event with Id ${eventId} deleted successfully.`);
                return true;
            }
            else {
                log_1.Log.Warning(`Event with Id ${eventId} not found.`);
                return false;
            }
        }
        catch (err) {
            log_1.Log.Error(`Error while deleting event with Id ${eventId}`);
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
    static async Update(eventId, updatedData) {
        try {
            const result = await EventRepository_1.EventRepository.Update(eventId, updatedData);
            if (result[0] > 0) {
                log_1.Log.Success(`Event with Id ${eventId} updated successfully.`);
                return true;
            }
            else {
                log_1.Log.Warning(`Event with Id ${eventId} not found.`);
                return false;
            }
        }
        catch (err) {
            log_1.Log.Error(`Error while updating event with Id ${eventId}`);
            return false;
        }
    }
    static async GetById(eventId) {
        return await EventRepository_1.EventRepository.FindById(eventId);
    }
    static async GetAll() {
        return await EventRepository_1.EventRepository.FindAll();
    }
    /**
     * Retrieves the active event value for a given event type.
     *
     * @param eventType The type of the event to retrieve.
     * @returns The value of the active event.
     */
    static async GetActiveFromType(eventType) {
        const currentDate = new Date();
        const event = await EventRepository_1.EventRepository.FindActiveEvent(eventType, currentDate);
        if (!event) {
            return 1;
        }
        return event.value;
    }
    /**
     * Retrieves the active event bonus value for a given event type (default 0).
     *
     * @param eventType The type of the event to retrieve.
     * @returns The value of the active event.
     */
    static async GetActiveBonusFromType(eventType) {
        const currentDate = new Date();
        const event = await EventRepository_1.EventRepository.FindActiveEvent(eventType, currentDate);
        if (!event) {
            return 0;
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
        return await EventRepository_1.EventRepository.FindUpcomingEvents(currentDate);
    }
    static GetEventTypeText(eventType) {
        switch (eventType) {
            case EventType.JOB_TIME_MULTIPLIER:
                return "Jobs time multiplier";
            case EventType.SCAVENGE_TIME_MULTIPLIER:
                return "Scavenge time multiplier";
            case EventType.WANTED_TIME_MULTIPLIER:
                return "Wanted time multiplier";
            case EventType.HOSPITAL_TIME_MULTIPLIER:
                return "Hospital time multiplier";
            case EventType.PRISON_TIME_MULTIPLIER:
                return "Prison time multiplier";
            case EventType.SCAVENGE_CHANCE_BONUS:
                return "Scavenge chance bonus";
            case EventType.ROB_LOCATION_CHANCE_BONUS:
                return "Rob location chance bonus";
            case EventType.PRISON_ESCAPE_CHANCE_BONUS:
                return "Prison escape chance bonus";
            default:
                return "Unknown";
        }
    }
}
exports.Event = Event;
//# sourceMappingURL=Event.js.map