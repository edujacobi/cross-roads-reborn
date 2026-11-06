import { GangJoinRequests } from "#core/database/GangJoinRequests";
import { GangJoinRequestStatus } from "#core/types/GangRecruitment";
import type { GangColorId } from "#core/types/GangColors";
export interface GangJoinRequestWithDetails {
    id: number;
    gangId: number;
    gangName: string;
    gangAcronym: string;
    gangImage?: string | null;
    gangColor?: GangColorId;
    userId: string;
    userName: string;
    userAvatarDecoration?: number;
    message: string | null;
    status: GangJoinRequestStatus;
    createdAt: Date;
}
export declare class GangJoinRequestsRepository {
    static FindActiveByUser(userId: string): Promise<GangJoinRequestWithDetails | null>;
    static FindHistoryByUser(userId: string, limit?: number): Promise<GangJoinRequestWithDetails[]>;
    static FindPendingByGang(gangId: number): Promise<GangJoinRequestWithDetails[]>;
    static FindById(id: number): Promise<GangJoinRequests | null>;
    static CreateRequest(gangId: number, userId: string, message?: string | null): Promise<GangJoinRequests | null>;
    static UpdateStatusIfCurrent(id: number, currentStatus: GangJoinRequestStatus, status: GangJoinRequestStatus): Promise<boolean>;
    static CancelUserPendingRequests(userId: string): Promise<number>;
}
