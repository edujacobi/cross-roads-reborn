import { AsyncLocalStorage } from "node:async_hooks";
import { Transaction } from "sequelize";
import { TimedActions } from "#core/database/TimedActions";
export type TimedActionKind = "scavenge" | "robbery";
export declare const actionTransaction: AsyncLocalStorage<Transaction>;
export declare class TimedActionRepository {
    static Start(userId: string, kind: TimedActionKind, referenceId: number, durationMs: number): Promise<`${string}-${string}-${string}-${string}-${string}`>;
    static Get(userId: string, kind: TimedActionKind): Promise<TimedActions | null>;
    static Run<T>(userId: string, kind: TimedActionKind, referenceId: number, resolve: () => Promise<T>, attemptId?: string): Promise<T>;
    static Decode<T>(json: string): T;
    static FindDue(): Promise<TimedActions[]>;
    static DiscardCancelled(id: string): Promise<boolean>;
    static AdoptLegacyActions(): Promise<void>;
}
