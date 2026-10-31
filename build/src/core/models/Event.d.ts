import type { Events } from "#core/database/Events";
export declare enum EventType {
    JOB_TIME_MULTIPLIER = 1,
    SCAVENGE_TIME_MULTIPLIER = 2,
    WANTED_TIME_MULTIPLIER = 3,
    HOSPITAL_TIME_MULTIPLIER = 4,
    PRISON_TIME_MULTIPLIER = 5,
    SCAVENGE_CHANCE_BONUS = 6,
    ROB_LOCATION_CHANCE_BONUS = 7,
    PRISON_ESCAPE_CHANCE_BONUS = 8
}
export declare class Event {
    static IsActive(event: Pick<Events, "periodStart" | "periodEnd">): boolean;
    /**
     * Creates a new event.
     *
     * @param eventType The type of the event to create.
     * @param value The value of the event, like a multiplier (1 is the default value).
     * @param periodStart The start of the event.
     * @param periodEnd The end of the event.
     * @returns True if the event was created successfully, false otherwise.
     */
    static Create(eventType: EventType, value: number, periodStart: Date, periodEnd: Date): Promise<boolean>;
    /**
     * Deletes an event by its Id.
     *
     * @param eventId The Id of the event to delete.
     * @returns True if the event was deleted successfully, false otherwise.
     */
    static Delete(eventId: number): Promise<boolean>;
    /**
     * Updates an event by its Id.
     *
     * @param eventId The Id of the event to update.
     * @param updatedData The updated event data.
     * @returns True if the event was updated successfully, false otherwise.
     */
    static Update(eventId: number, updatedData: Partial<Events>): Promise<boolean>;
    static GetById(eventId: number): Promise<Events | null>;
    static GetAll(): Promise<Events[]>;
    /**
     * Retrieves the active event value for a given event type.
     *
     * @param eventType The type of the event to retrieve.
     * @returns The value of the active event.
     */
    static GetActiveFromType(eventType: EventType): Promise<number>;
    /**
     * Retrieves the active event bonus value for a given event type (default 0).
     *
     * @param eventType The type of the event to retrieve.
     * @returns The value of the active event.
     */
    static GetActiveBonusFromType(eventType: EventType): Promise<number>;
    /**
     * Retrieves the upcoming events.
     *
     * @returns The upcoming events, or undefined if no events are found.
     */
    static GetUpcomingEvents(): Promise<Events[]>;
    static GetEventTypeText(eventType: EventType): "Hospital time multiplier" | "Jobs time multiplier" | "Prison escape chance bonus" | "Prison time multiplier" | "Rob location chance bonus" | "Scavenge chance bonus" | "Scavenge time multiplier" | "Unknown" | "Wanted time multiplier";
}
