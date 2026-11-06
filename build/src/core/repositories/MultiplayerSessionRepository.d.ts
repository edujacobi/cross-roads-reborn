export type MultiplayerSessionKind = "russianRoulette" | "beatUp" | "userRobbery" | "investmentRobbery" | "gangHeist";
export type MultiplayerSessionStatus = "active" | "completed" | "aborted";
export interface MultiplayerSessionRecord {
    id: string;
    kind: MultiplayerSessionKind;
    ownerId: string;
    targetId: string | null;
    gangId: number | null;
    participantIds: string[];
    phase: string;
    status: MultiplayerSessionStatus;
    expiresAt: Date | null;
    result: unknown;
    createdAt: Date;
}
export interface NewMultiplayerSession {
    id: string;
    kind: MultiplayerSessionKind;
    ownerId: string;
    targetId?: string | null;
    gangId?: number | null;
    participantIds: string[];
    phase: string;
    expiresAt?: Date | null;
}
export declare class MultiplayerSessionRepository {
    static PruneFinished(olderThan: Date): Promise<void>;
    static ReleaseLocks(session: MultiplayerSessionRecord): Promise<void>;
    static Create(session: NewMultiplayerSession): Promise<void>;
    static Update(id: string, values: {
        participantIds?: string[];
        phase?: string;
        expiresAt?: Date | null;
        result?: unknown;
    }): Promise<void>;
    static Finish(id: string, status: Exclude<MultiplayerSessionStatus, "active">, result?: unknown): Promise<void>;
    static FindActive(): Promise<MultiplayerSessionRecord[]>;
}
