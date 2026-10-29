import { LotteryDraws } from "#core/database/LotteryDraws";
import { LotteryTickets } from "#core/database/LotteryTickets";
import type { InferAttributes, InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";
export declare class LotteryRepository {
    static FindDrawById(id: number): Promise<LotteryDraws | null>;
    static FindNextDraw(): Promise<LotteryDraws | null>;
    static FindLastWinnerDraw(): Promise<LotteryDraws | null>;
    static FindDrawByTime(drawTime: Date): Promise<LotteryDraws | null>;
    static FindPendingDraws(date: Date): Promise<LotteryDraws[]>;
    static CreateDraw(values: Optional<InferCreationAttributes<LotteryDraws>, NullishPropertiesOf<InferCreationAttributes<LotteryDraws>>>): Promise<LotteryDraws>;
    static UpdateDraw(id: number, values: Partial<InferAttributes<LotteryDraws>>): Promise<[number]>;
    static AddTicketToDraw(id: number, amount: number): Promise<void>;
    static DestroyAllDraws(): Promise<number>;
    static FindTicketById(id: number): Promise<LotteryTickets | null>;
    static FindTicket(userId: string, drawId: number): Promise<LotteryTickets | null>;
    static FindAllTicketsForDraw(drawId: number): Promise<LotteryTickets[]>;
    static CreateTicket(values: Optional<InferCreationAttributes<LotteryTickets>, NullishPropertiesOf<InferCreationAttributes<LotteryTickets>>>): Promise<LotteryTickets>;
    static UpdateTicket(id: number, values: Partial<InferAttributes<LotteryTickets>>): Promise<[number]>;
    static DestroyAllTickets(): Promise<number>;
}
