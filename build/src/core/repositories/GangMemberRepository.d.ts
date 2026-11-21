import { GangMembers } from "#core/database/GangMembers";
export declare class GangMemberRepository {
    /**
     * Finds one gang membership matching the userId.
     */
    static FindByUserId(userId: string): Promise<GangMembers | null>;
    static FindAllByUserIds(userIds: string[]): Promise<GangMembers[]>;
    /**
     * Finds all members of a gang.
     */
    static FindAllByGang(gangId: number): Promise<GangMembers[]>;
    /**
     * Adds a user to a gang.
     */
    static Create(values: {
        gangId: number;
        userId: string;
        roleId: number;
        depositTime: Date;
        depositAmount?: number;
    }): Promise<GangMembers>;
    /**
     * Updates a gang member record's role.
     */
    static UpdateRole(userId: string, gangId: number, roleId: number): Promise<number>;
    /**
     * Updates a gang member record's deposit information.
     */
    static UpdateDeposit(userId: string, gangId: number, depositAmount: number, depositTime: Date): Promise<void>;
    /**
     * Removes a member from a gang.
     */
    static RemoveFromGang(userId: string, gangId: number): Promise<number>;
    /**
     * Count of all gang members.
     */
    static Count(): Promise<number>;
    /**
     * Removes all members of a gang.
     */
    static RemoveAllByGangId(gangId: number): Promise<number>;
    /**
     * Reassigns roles from an old role ID to a new role ID in a gang.
     */
    static ReassignRole(gangId: number, oldRoleId: number, newRoleId: number): Promise<void>;
}
