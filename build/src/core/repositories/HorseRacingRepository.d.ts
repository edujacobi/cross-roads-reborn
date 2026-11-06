import { HorseRaces } from "#core/database/HorseRaces";
import { HorseRaceBets } from "#core/database/HorseRaceBets";
import type { InferAttributes, InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";
export declare class HorseRacingRepository {
    static FindRaceById(id: number): Promise<HorseRaces | null>;
    static FindNextRace(): Promise<HorseRaces | null>;
    static FindPreviousRace(currentRaceId: number): Promise<HorseRaces | null>;
    static FindPendingRaces(date: Date): Promise<HorseRaces[]>;
    static CreateRace(values: Optional<InferCreationAttributes<HorseRaces>, NullishPropertiesOf<InferCreationAttributes<HorseRaces>>>): Promise<HorseRaces>;
    static UpdateRace(id: number, values: Partial<InferAttributes<HorseRaces>>): Promise<[number]>;
    static AddBetToRace(id: number, amount: number): Promise<void>;
    static DestroyAllRaces(): Promise<number>;
    static FindBetById(id: number): Promise<HorseRaceBets | null>;
    static FindBet(userId: string, raceId: number): Promise<HorseRaceBets | null>;
    static FindBetsForRace(raceId: number): Promise<HorseRaceBets[]>;
    static CreateBet(values: Optional<InferCreationAttributes<HorseRaceBets>, NullishPropertiesOf<InferCreationAttributes<HorseRaceBets>>>): Promise<HorseRaceBets>;
    static UpdateBet(id: number, values: Partial<InferAttributes<HorseRaceBets>>): Promise<[number]>;
    static DestroyAllBets(): Promise<number>;
}
