import { type InferAttributes } from "sequelize";
import { Seasons } from "#core/database/Seasons";
import { Users } from "#core/database/Users";
import Gangs from "#core/database/Gangs";
export interface ISeasonData {
    id: number;
    number: number;
    startDate: Date;
    endDate: Date;
    topData: string;
    howManyPlayers: number;
}
export declare class SeasonRepository {
    static FindLatest(): Promise<Seasons | null>;
    static FindByNumber(number: number): Promise<Seasons | null>;
    static FindAll(): Promise<Seasons[]>;
    static FindAllNumbers(): Promise<{
        number: number;
    }[]>;
    static Create(data: {
        number: number;
        startDate: Date;
        endDate: Date;
        topData: string;
        howManyPlayers: number;
    }): Promise<Seasons>;
    static UpdateById(id: number, data: Partial<InferAttributes<Seasons>>): Promise<[affectedCount: number]>;
    static DeleteByNumber(number: number): Promise<number>;
    /**
     * Gets the top rankings for end of season.
     */
    static GetEndSeasonRankingData(): Promise<[Users[], Users[], Users[], Users[], Users[], Users[], Users[], Users[], Users[], Users[], Users[], Users[], Users[], Gangs[]]>;
    /**
     * Gets general stats counts for end of season.
     */
    static GetEndSeasonStats(): Promise<[number, number, number, number, number, number, number, number, number, number, number]>;
    /**
     * Resets all progress and erases seasonal database tables within a transaction.
     */
    static ResetSeasonDatabase(): Promise<void>;
}
